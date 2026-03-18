import { useEffect, useRef, useState, useCallback } from 'react'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'
import { rPPGProcessor } from '../lib/rppg'
import { EmotionDetector } from '../lib/emotionDetector'
import { emitBiometricUpdate } from '../lib/socket'
import { Camera, RefreshCw, CameraOff } from 'lucide-react'

// Singleton MediaPipe loader
let mpLoaded = false
let mpLoading = false
const mpCallbacks: Array<() => void> = []

function loadMediaPipe(): Promise<void> {
  return new Promise((resolve) => {
    if (mpLoaded) return resolve()
    mpCallbacks.push(resolve)
    if (mpLoading) return
    mpLoading = true
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      mpLoaded = true
      mpCallbacks.forEach((cb) => cb())
      mpCallbacks.length = 0
    }
    document.head.appendChild(script)
  })
}

// Singleton emotion detector
const emotionDetector = new EmotionDetector()

function createMutedVideo() {
  const v = document.createElement('video')
  v.muted = true
  v.playsInline = true
  return v
}

export default function GlobalBiometrics() {
  const videoRef = useRef<HTMLVideoElement>(createMutedVideo())
  const handsRef = useRef<any>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastProcessTimeRef = useRef<number>(0)
  const lastEmotionTimeRef = useRef<number>(0)
  const lastSocketEmitRef = useRef<number>(0)
  const rppgRef = useRef(new rPPGProcessor())
  const emotionLoadedRef = useRef(false)
  const setBpm = useBiometricStore(s => s.setBpm)
  const setEmotion = useBiometricStore(s => s.setEmotion)
  const setEmotionKz = useBiometricStore(s => s.setEmotionKz)
  const setCognitive = useBiometricStore(s => s.setCognitive)
  const isEnabled = useBiometricStore(s => s.isCameraEnabled)
  const setIsEnabled = useBiometricStore(s => s.setIsCameraEnabled)
  const setGlobalStream = useBiometricStore(s => s.setGlobalStream)
  const setHandLandmarks = useBiometricStore(s => s.setHandLandmarks)
  
  const [isActive, setIsActive] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('')
  const loadingRef = useRef(false)

  // Load emotion models on mount
  useEffect(() => {
    if (emotionLoadedRef.current) return
    emotionLoadedRef.current = true
    emotionDetector.loadModels().catch(err => {
      console.warn('Emotion detection unavailable:', err)
      emotionLoadedRef.current = false
    })
  }, [])

  const getDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput')
      setDevices(videoDevices)
      if (videoDevices.length > 0 && !currentDeviceId) {
        setCurrentDeviceId(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error('Error fetching devices:', err)
    }
  }, [currentDeviceId])

  const switchCamera = async () => {
    if (devices.length < 2 || !isEnabled) return
    const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId)
    const nextIndex = (currentIndex + 1) % devices.length
    const nextDevice = devices[nextIndex]
    
    // Stop current stream
    streamRef.current?.getTracks().forEach(t => t.stop())
    cancelAnimationFrame(rafRef.current)
    
    setCurrentDeviceId(nextDevice.deviceId)
  }

  const toggleCamera = () => {
    if (isEnabled) {
      // Stop
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(rafRef.current)
      setIsActive(false)
    }
    setIsEnabled(!isEnabled)
  }

  const onResults = useCallback((results: any) => {
    if (results.multiHandLandmarks) {
      setHandLandmarks(results.multiHandLandmarks)
    } else {
      setHandLandmarks(null)
    }
  }, [setHandLandmarks])

  const startLoop = useCallback(() => {
    const loop = async (time: number) => {
      if (!videoRef.current || !isEnabled) return
      
      const video = videoRef.current
      const hands = handsRef.current

      // Process at most 10 times per second to save resources (100ms)
      if (video.readyState >= 2 && time - lastProcessTimeRef.current >= 100) {
        lastProcessTimeRef.current = time
        
        try {
          if (hands) await hands.send({ image: video })
          
          // rPPG Processing - reuse canvas
          if (!processingCanvasRef.current) {
            processingCanvasRef.current = document.createElement('canvas')
          }
          const canvas = processingCanvasRef.current
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }
          
          const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
          if (ctx) {
            ctx.drawImage(video, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const bpmValue = rppgRef.current.processFrame(imageData)
            if (bpmValue) setBpm(bpmValue)
            else setBpm(0) // 0 indicates "Өлшенуде..."
          }

          // Emotion detection every 1 second
          if (time - lastEmotionTimeRef.current >= 1000) {
            lastEmotionTimeRef.current = time
            const emotionResult = await emotionDetector.detect(video)
            if (emotionResult) {
              setEmotion(emotionResult.emotionKz, emotionResult.confidence)
              setEmotionKz(emotionResult.emotionKz)
              setCognitive(emotionResult.cognitive)
            }
          }

          // Socket emission every 2 seconds
          if (time - lastSocketEmitRef.current >= 2000) {
            lastSocketEmitRef.current = time
            const store = useBiometricStore.getState()
            const userStore = useUserStore.getState()
            if (userStore.id) {
              emitBiometricUpdate({
                userId: userStore.id,
                emotion: store.emotion,
                emotionKz: store.emotionKz,
                bpm: store.bpm,
                cognitive: store.cognitive,
                confidence: store.confidence,
              })
            }
          }
        } catch (e) {
          console.debug('Loop error:', e)
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [setBpm, setEmotion, setEmotionKz, setCognitive, isEnabled])

  useEffect(() => {
    if (!isEnabled) return

    const startCamera = async () => {
      if (loadingRef.current) return
      loadingRef.current = true
      try {
        await loadMediaPipe()
        const HandsCls = (window as any).Hands
        
        await getDevices()

        const constraints: MediaStreamConstraints = {
          video: currentDeviceId ? { deviceId: { exact: currentDeviceId } } : { facingMode: 'user' },
          audio: true
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        
        // Check if still enabled/same device after await
        if (!isEnabled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream
        setGlobalStream(stream)
        videoRef.current.srcObject = stream
        
        try {
          await videoRef.current.play()
        } catch (e: any) {
          if (e.name !== 'AbortError') throw e
        }

        if (HandsCls && !handsRef.current) {
          const hands = new HandsCls({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
          })
          hands.setOptions({ 
            maxNumHands: 1, 
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7 
          })
          hands.onResults(onResults)
          await hands.initialize()
          handsRef.current = hands
        }

        setIsActive(true)
        startLoop()
      } catch (err) {
        console.error('Global camera error:', err)
        if (currentDeviceId) {
           setCurrentDeviceId('') 
        }
      } finally {
        loadingRef.current = false
      }
    }

    startCamera()
    return () => {
      cancelAnimationFrame(rafRef.current)
      setGlobalStream(null)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [onResults, startLoop, currentDeviceId, getDevices, isEnabled])

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
       {/* UI Controls */}
       <div className="flex flex-col items-end gap-2">
         <div className="flex gap-2">
            {isActive && devices.length > 1 && (
              <button 
                onClick={switchCamera}
                className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-plum hover:bg-plum-pale transition-colors border border-plum/20"
                title="Камераны ауыстыру"
              >
                <RefreshCw size={20} />
              </button>
            )}
            <button 
              onClick={toggleCamera}
              className={`pointer-events-auto w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors border ${
                isEnabled ? 'bg-white text-rose border-rose/20' : 'bg-rose text-white border-transparent'
              }`}
              title={isEnabled ? "Камераны өшіру" : "Камераны қосу"}
            >
              {isEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>
         </div>

         {/* Small preview if active */}
         {isActive && isEnabled && (
           <div className="w-32 h-24 rounded-lg overflow-hidden border-2 border-rose shadow-lg bg-black pointer-events-auto group relative">
              <video 
                ref={(el) => {
                  if (el && videoRef.current && el !== videoRef.current) {
                     el.srcObject = videoRef.current.srcObject
                     if (el.paused) el.play().catch(() => {})
                  }
                }}
                muted 
                playsInline 
                className="w-full h-full object-cover"
                style={{ transform: currentDeviceId ? 'none' : 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <div className="flex flex-col items-center gap-1">
                   <Camera size={14} className="text-white" />
                   <span className="text-[10px] text-white font-bold uppercase tracking-wider">Live AI</span>
                 </div>
              </div>
           </div>
         )}
       </div>
    </div>
  )
}

