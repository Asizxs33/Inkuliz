import { useEffect, useRef, useState, useCallback } from 'react'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'
import { rPPGProcessor } from '../lib/rppg'
import { EmotionDetector } from '../lib/emotionDetector'
import { emitBiometricUpdate } from '../lib/socket'
import { Camera, RefreshCw, CameraOff, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Force Vite to bundle the audio properly so Vercel sets the correct MIME type
import alarmSound from '../assets/alarm_40s.m4a'

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

// EKG Line History Generator
class EKGVisualizer {
  private points: number[] = Array(50).fill(0)
  private time = 0
  
  update(bpm: number) {
    this.time += 0.1
    // Standard flatline if no BPM
    let val = 0
    if (bpm > 0) {
      // Simulate an EKG spike based on BPM (higher BPM = faster spikes)
      const beatFreq = bpm / 60
      const phase = (this.time * beatFreq * Math.PI * 2) % (Math.PI * 2)
      
      // Artificial PQRST wave simulation
      if (phase < 0.2) val = 10 * Math.sin(phase * 15) // P wave
      else if (phase > 0.4 && phase < 0.6) {
        // QRS complex
        const p2 = phase - 0.4
        if (p2 < 0.05) val = -20
        else if (p2 < 0.1) val = 80
        else if (p2 < 0.15) val = -30
        else val = 0
      }
      else if (phase > 0.7 && phase < 0.9) val = 15 * Math.sin((phase - 0.7) * 15) // T wave
    }
    
    this.points.push(val + (Math.random() * 4 - 2)) // Add tiny noise
    if (this.points.length > 50) this.points.shift()
    return this.points
  }
}

export default function GlobalBiometrics() {
  const videoRef = useRef<HTMLVideoElement>(createMutedVideo())
  const canvasRef = useRef<HTMLCanvasElement>(null) // For WOW effects
  const ekgRef = useRef<HTMLCanvasElement>(null) // For EKG
  const handsRef = useRef<any>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastProcessTimeRef = useRef<number>(0)
  const lastEmotionTimeRef = useRef<number>(0)
  const lastSocketEmitRef = useRef<number>(0)
  const rppgRef = useRef(new rPPGProcessor())
  const ekgGenRef = useRef(new EKGVisualizer())
  const emotionLoadedRef = useRef(false)

  // Particle System state
  const particlesRef = useRef<Array<{x: number, y: number, life: number, color: string}>>([])
  
  // Native HTML Audio Element Alarm (M4A for perfect Safari compatibility)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
  
  // Sleep Detection
  const [isSleeping, setIsSleeping] = useState(false)
  const sleepCounterRef = useRef<number>(0)
  
  // Store local copies for render loop safely
  const currentBpmRef = useRef<number>(0)
  const isStressRef = useRef<boolean>(false)

  // Load emotion models on mount
  useEffect(() => {
    if (emotionLoadedRef.current) return
    emotionLoadedRef.current = true
    emotionDetector.loadModels().catch(err => {
      console.warn('Emotion detection unavailable:', err)
      emotionLoadedRef.current = false
    })
  }, [])

  // Sound permission state: user must click a visible button ONCE to unlock audio on Safari
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Direct onClick handler for the visible "Enable Sound" button
  // This is the ONLY method Safari trusts: a VISIBLE button with a SYNCHRONOUS play() call
  const handleEnableSound = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.0001 // practically silent
      const p = audioRef.current.play()
      if (p !== undefined) {
        p.then(() => {
          setSoundEnabled(true)
        }).catch((e) => {
          console.error('Sound enable failed:', e)
        })
      }
    }
  }

  // Trigger alarm by toggling VOLUME (audio is already playing silently)
  useEffect(() => {
    if (!audioRef.current || !soundEnabled) return
    
    if (isSleeping) {
      try { audioRef.current.currentTime = 0 } catch(e) {}
      audioRef.current.volume = 1
    } else {
      audioRef.current.volume = 0.0001
    }
  }, [isSleeping, soundEnabled])

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
    
    streamRef.current?.getTracks().forEach(t => t.stop())
    cancelAnimationFrame(rafRef.current)
    setCurrentDeviceId(nextDevice.deviceId)
  }

  const toggleCamera = () => {
    if (isEnabled) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(rafRef.current)
      setIsActive(false)
    }
    setIsEnabled(!isEnabled)
  }

  const onResults = useCallback((results: any) => {
    if (results.multiHandLandmarks) {
      setHandLandmarks(results.multiHandLandmarks)
      
      // Spawn WOW Particles if hands detected
      results.multiHandLandmarks.forEach((hand: any) => {
        const indexTip = hand[8]
        if (indexTip) {
          particlesRef.current.push({
            x: indexTip.x,
            y: indexTip.y,
            life: 1.0,
            color: isStressRef.current ? '#E8507A' : '#A05891'
          })
        }
      })
    } else {
      setHandLandmarks(null)
    }
  }, [setHandLandmarks])

  const startLoop = useCallback(() => {
    const loop = async (time: number) => {
      if (!videoRef.current || !isEnabled) return
      
      const video = videoRef.current
      const hands = handsRef.current

      // Handle WOW Effects Animation (60FPS)
      if (canvasRef.current && video.videoWidth > 0) {
        const cvs = canvasRef.current
        const ctx = cvs.getContext('2d')
        if (ctx) {
          cvs.width = video.videoWidth
          cvs.height = video.videoHeight
          ctx.clearRect(0, 0, cvs.width, cvs.height)
          
          // Draw Neon Particles
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i]
            p.life -= 0.05
            if (p.life <= 0) {
              particlesRef.current.splice(i, 1)
              continue
            }
            
            const px = p.x * cvs.width
            const py = p.y * cvs.height
            ctx.beginPath()
            ctx.arc(px, py, 6 * p.life, 0, 2 * Math.PI)
            ctx.fillStyle = p.color
            ctx.shadowBlur = 15
            ctx.shadowColor = p.color
            ctx.globalAlpha = p.life
            ctx.fill()
            ctx.globalAlpha = 1.0
            ctx.shadowBlur = 0
          }
        }
      }

      // Handle EKG Animation
      if (ekgRef.current) {
        const cvs = ekgRef.current
        const ctx = cvs.getContext('2d')
        if (ctx) {
          cvs.width = cvs.clientWidth
          cvs.height = cvs.clientHeight
          
          const points = ekgGenRef.current.update(currentBpmRef.current)
          
          ctx.clearRect(0, 0, cvs.width, cvs.height)
          ctx.beginPath()
          const step = cvs.width / points.length
          for (let i = 0; i < points.length; i++) {
            const x = i * step
            const y = cvs.height / 2 - (points[i] * (cvs.height / 200)) // scale
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.strokeStyle = '#E8507A' // Rose color
          ctx.lineWidth = 2
          ctx.shadowBlur = 8
          ctx.shadowColor = '#E8507A'
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }

      // Biometrics logic (10fps max)
      if (video.readyState >= 2 && time - lastProcessTimeRef.current >= 100) {
        lastProcessTimeRef.current = time
        
        try {
          if (hands) await hands.send({ image: video })
          
          if (!processingCanvasRef.current) processingCanvasRef.current = document.createElement('canvas')
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
            if (bpmValue) {
              setBpm(bpmValue)
              currentBpmRef.current = bpmValue
            }
          }

          if (time - lastEmotionTimeRef.current >= 1000) {
            lastEmotionTimeRef.current = time
            const emotionResult = await emotionDetector.detect(video)
            if (emotionResult) {
              setEmotion(emotionResult.emotionKz, emotionResult.confidence)
              setEmotionKz(emotionResult.emotionKz)
              setCognitive(emotionResult.cognitive)
              isStressRef.current = ['АШУЛЫ', 'ҚОРЫҚҚАН', 'ЖИІРКЕНГЕН'].includes(emotionResult.emotionKz)
              
              // Sleep Detection Logic - Trigger Kairat Nurtas if sleepy/eyes closed for 4 seconds!
              if (
                emotionResult.isEyesClosed || 
                ['ҰЙҚЫДА', 'ШАРШАҒАН', 'ЗЕРІККЕН', 'БЕЙҚАМ', 'ЖАЛЫҚҚАН'].includes(emotionResult.emotionKz)
              ) {
                sleepCounterRef.current += 1
                if (sleepCounterRef.current >= 4 && !isSleeping) {
                   setIsSleeping(true)
                }
              } else {
                sleepCounterRef.current = 0
              }
            }
          }

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
            maxNumHands: 2, 
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
        if (currentDeviceId) setCurrentDeviceId('') 
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
    <>
      {/* GLOWING SCREEN BORDER FOR STRESS */}
      {isActive && isStressRef.current && (
        <div className="fixed inset-0 pointer-events-none z-[9998] border-[8px] border-rose/30 opacity-50 animate-pulse shadow-[inset_0_0_100px_rgba(232,80,122,0.3)] transition-all duration-1000" />
      )}

      {/* FLOATING SOUND ENABLE BUTTON - Safari requires a VISIBLE direct click to unlock audio */}
      {isActive && !soundEnabled && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleEnableSound}
          className="fixed bottom-20 left-4 z-[10000] bg-gradient-to-r from-purple-600 to-rose px-5 py-3 rounded-full text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 pointer-events-auto"
        >
          🔊 Дыбысты қосу
        </motion.button>
      )}

      {/* BREATHING CIRCLE OVERLAY if very high stress/pulse */}
      {isActive && isStressRef.current && currentBpmRef.current > 90 && (
         <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center animate-fade-in bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-rose/30">
            <div className="w-12 h-12 rounded-full border-4 border-rose/80 animate-[ping_4s_ease-in-out_infinite] absolute" />
            <div className="w-12 h-12 rounded-full border-[6px] border-rose flex items-center justify-center bg-rose/20 relative z-10">
               <Activity size={20} className="text-white" />
            </div>
            <p className="text-white font-bold mt-3 text-sm tracking-wide">Тыныс алыңыз</p>
            <p className="text-rose-100 text-xs opacity-80 mt-1">BPM: {currentBpmRef.current}</p>
         </div>
      )}

      <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
         <div className="flex flex-col items-end gap-2">
           <div className="flex gap-2">
              {isActive && devices.length > 1 && (
                <button 
                  onClick={switchCamera}
                  className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-plum hover:bg-plum-pale transition-colors border border-plum/20"
                >
                  <RefreshCw size={20} />
                </button>
              )}
              <button 
                onClick={toggleCamera}
                className={`pointer-events-auto w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors border ${
                  isEnabled ? 'bg-white text-rose border-rose/20' : 'bg-rose text-white border-transparent'
                }`}
              >
                {isEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
              </button>
           </div>

           {/* Camera Preview with WOW Effects */}
           {isActive && isEnabled && (
             <div className="w-48 h-36 rounded-2xl overflow-hidden border-2 shadow-2xl bg-black pointer-events-auto group relative transition-all duration-300 hover:scale-105 hover:w-64 hover:h-48 origin-bottom-right"
                  style={{ borderColor: isStressRef.current ? '#E8507A' : '#A05891' }}
             >
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
                
                {/* Wow Effects Canvas (Particles) */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ transform: currentDeviceId ? 'none' : 'scaleX(-1)' }}
                />

                {/* EKG Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                   <canvas
                     ref={ekgRef}
                     className="w-full h-full pointer-events-none opacity-80"
                   />
                </div>

                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${isStressRef.current ? 'bg-danger' : 'bg-success'}`} />
                   <span className="text-[9px] text-white font-bold uppercase tracking-widest">
                     {currentBpmRef.current > 0 ? `${currentBpmRef.current} BPM` : 'ӨЛШЕНУДЕ'}
                   </span>
                </div>
             </div>
           )}
         </div>
      </div>
      
      {/* WAKE UP ALARM (Kairat Nurtas) */}
      <AnimatePresence>
        {isSleeping && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 pulse-ring"
          >
           <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-[#1C1D2A]/90 p-12 rounded-3xl border border-rose/30 shadow-[0_0_100px_rgba(232,80,122,0.4)] text-center flex flex-col items-center gap-8 backdrop-blur-md relative z-50 pointer-events-auto"
          >
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-rose to-transparent animate-pulse" />
            
            <motion.h2 
              animate={{ 
                scale: [1, 1.1, 1],
                textShadow: ['0px 0px 0px rgba(232,80,122,0)', '0px 0px 30px rgba(232,80,122,0.8)', '0px 0px 0px rgba(232,80,122,0)']
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-7xl font-black text-rose"
            >
              ОЯН!
            </motion.h2>
            
            <p className="text-2xl text-white/80 max-w-md font-medium">
              Сіздің ұйықтап немесе сабаққа қарамай отырғаныңыз байқалды.
            </p>
            
            <button 
              onClick={() => {
                setIsSleeping(false)
                sleepCounterRef.current = 0
              }}
              className="bg-rose text-white text-xl font-black px-12 py-6 rounded-full shadow-[0_0_40px_rgba(232,80,122,0.6)] hover:scale-105 active:scale-95 transition-all"
            >
              МЕН ОЯНДЫМ!
            </button>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Physical DOM Audio Element imported magically via Vite assures Safari recognizes the unlock and sets correct MIME types */}
      <audio 
        ref={audioRef}
        src={alarmSound}
        preload="auto"
        loop
        className="hidden"
      />
    </>
  )
}
