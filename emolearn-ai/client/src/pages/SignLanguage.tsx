import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera as CameraIcon, CameraOff, Copy, Languages, Hand, BookOpen, HandMetal, Wifi, RotateCcw, CheckCircle2, SendHorizonal } from 'lucide-react'
import { recognizeGesture, GestureHistory, type Landmark, type GestureResult } from '../lib/gestureRecognizer'
import { rPPGProcessor } from '../lib/rppg'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'
import { joinLiveRoom, emitLiveChatMessage, onLiveChatMessage, emitWebRTCOffer, emitWebRTCAnswer, emitIceCandidate, onWebRTCEvent } from '../lib/socket'

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  isSignLanguage: boolean;
  timestamp: Date;
}

interface HandsResults {
  multiHandLandmarks?: Landmark[][]
}

const GESTURE_HISTORY = new GestureHistory(15)

const FINGER_COLORS = ['#E8507A', '#6B2D5E', '#F9C5D5', '#B05B8A', '#E8507A']
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

const KNOWN_WORDS = [
  { word: 'СӘЛЕМ', gesture: 'Ашық алақан' },
  { word: 'ЖАҚСЫ', gesture: 'Бас бармақ жоғары' },
  { word: 'РАХМЕТ', gesture: 'OK белгісі' },
  { word: 'МЕН', gesture: 'Сұқ саусақ' },
  { word: 'СІЗ', gesture: 'V белгісі' },
  { word: 'СҮЙЕМІН', gesture: 'ILY белгісі' },
  { word: 'СТОП', gesture: 'Жұдырық' },
  { word: 'ТЕЛЕФОН', gesture: 'Шака белгісі' },
]

export default function SignLanguage() {
  const {
    emotion, bpm, confidence: storeConfidence,
    globalStream, isCameraEnabled, handLandmarks
  } = useBiometricStore()

  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSequence, setPlaybackSequence] = useState<{ word: string, gesture: string }[]>([])
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [gestureResult, setGestureResult] = useState<GestureResult>({ word: '—', wordKz: '—', confidence: 0 })
  const [handDetected, setHandDetected] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [generatedSentence, setGeneratedSentence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [fps, setFps] = useState(0)
  const [holdingProgress, setHoldingProgress] = useState(0)

  // Live Chat State
  const { id: userId, name: userName } = useUserStore()
  const [isInLiveRoom, setIsInLiveRoom] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Sync video with global stream
  useEffect(() => {
    if (videoRef.current && globalStream) {
      videoRef.current.srcObject = globalStream
      videoRef.current.play().catch(() => { })
    }
  }, [globalStream])

  // Drawing and Recognition Effect
  useEffect(() => {
    if (!canvasRef.current || !isCameraEnabled) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    if (handLandmarks && handLandmarks.length > 0) {
      setHandDetected(true)
      const landmarks = handLandmarks[0]

      // Draw landmarks
      ctx.save()
      ctx.translate(canvasRef.current.width, 0)
      ctx.scale(-1, 1) // Flip for mirror video

      // Draw Connections
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      CONNECTIONS.forEach(([i, j]) => {
        const start = landmarks[i]
        const end = landmarks[j]
        ctx.beginPath()
        ctx.moveTo(start.x * 640, start.y * 480)
        ctx.lineTo(end.x * 640, end.y * 480)
        ctx.stroke()
      })

      // Draw Points
      landmarks.forEach((pt: any, i: number) => {
        const fingerIdx = Math.floor((i - 1) / 4)
        ctx.fillStyle = i === 0 ? '#E8507A' : (FINGER_COLORS[fingerIdx] || '#E8507A')
        ctx.beginPath()
        ctx.arc(pt.x * 640, pt.y * 480, 4, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()

      // Gesture Recognition
      const result = recognizeGesture(landmarks)
      if (result) {
        setGestureResult(result)
        const histResult = GESTURE_HISTORY.push(result.wordKz)
        setHoldingProgress(histResult.progress)
        
        if (histResult.isUnlocked && histResult.word && histResult.word !== '...') {
          setHistory(prev => {
            if (prev[prev.length - 1] === histResult.word) return prev
            return [...prev.slice(-9), histResult.word]
          })
        }
      }
    } else {
      setHandDetected(false)
      GESTURE_HISTORY.clear()
      setHoldingProgress(0)
    }
  }, [handLandmarks, isCameraEnabled])

  // Placeholder for local FPS (could be synced from Global with a store value)
  useEffect(() => {
    if (isCameraEnabled) setFps(10)
    else setFps(0)
  }, [isCameraEnabled])

  useEffect(() => {
    if (history.length === 0) {
      setGeneratedSentence('')
      return
    }

    const timer = setTimeout(async () => {
      setIsGenerating(true)
      try {
        const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/sign-language/sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words: history })
        })
        const data = await response.json()
        if (data.sentence) {
          setGeneratedSentence(data.sentence)
          
          // Auto-send to live chat if connected
          if (isInLiveRoom && userId) {
            emitLiveChatMessage({
              userId,
              name: userName || 'Студент',
              text: data.sentence,
              isSignLanguage: true,
              timestamp: new Date()
            })
          }
        }
      } catch (error) {
        console.error('Failed to generate sentence', error)
      } finally {
        setIsGenerating(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [history, isInLiveRoom, userId, userName])

  // Chat Effects
  useEffect(() => {
    if (isInLiveRoom) {
      const cleanup = onLiveChatMessage((msg: ChatMessage) => {
        setChatMessages(prev => [...prev, msg])
      })
      return cleanup
    }
  }, [isInLiveRoom])

  // WebRTC Logic
  useEffect(() => {
    if (!isInLiveRoom) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    if (globalStream) {
      globalStream.getTracks().forEach(track => pc.addTrack(track, globalStream));
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitIceCandidate(event.candidate);
      }
    };

    const cleanupUserJoined = onWebRTCEvent('user-joined', async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emitWebRTCOffer(offer);
      } catch (e) {
        console.error('Error creating offer', e);
      }
    });

    const cleanupOffer = onWebRTCEvent('offer', async ({ offer }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emitWebRTCAnswer(answer);
      } catch (e) {
        console.error('Error handling offer', e);
      }
    });

    const cleanupAnswer = onWebRTCEvent('answer', async ({ answer }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) {
        console.error('Error handling answer', e);
      }
    });

    const cleanupIce = onWebRTCEvent('ice-candidate', async ({ candidate }) => {
      try {
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error('Error handling ice candidate', e);
      }
    });

    return () => {
      pc.close();
      cleanupUserJoined();
      cleanupOffer();
      cleanupAnswer();
      cleanupIce();
    };
  }, [isInLiveRoom, globalStream]);

  const handleSendManualChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !userId) return;
    
    emitLiveChatMessage({
      userId,
      name: userName || 'Студент',
      text: chatInput,
      isSignLanguage: false,
      timestamp: new Date()
    });
    setChatInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleJoinChat = () => {
    joinLiveRoom()
    setIsInLiveRoom(true)
  }

  const copyText = () => {
    navigator.clipboard.writeText(history.join(' '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTranslateToGesture = () => {
    if (!textInput.trim()) return
    const words = textInput.toUpperCase().split(/\s+/)
    const sequence: { word: string, gesture: string }[] = []

    words.forEach(w => {
      const found = KNOWN_WORDS.find(kw => kw.word === w || w.includes(kw.word))
      if (found) {
        sequence.push(found)
      } else {
        sequence.push({ word: w, gesture: 'БЕЛГІСІЗ' })
      }
    })

    if (sequence.length > 0) {
      setPlaybackSequence(sequence)
      setPlaybackIndex(0)
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    if (!isPlaying) return
    if (playbackIndex >= playbackSequence.length) {
      setTimeout(() => setIsPlaying(false), 1500)
      return
    }
    const timer = setTimeout(() => {
      setPlaybackIndex(Math.min(playbackIndex + 1, playbackSequence.length))
    }, 1200)

    return () => clearTimeout(timer)
  }, [isPlaying, playbackIndex, playbackSequence])

  const confidence = Math.round(gestureResult.confidence * 100)

  return (
    <div className={`grid gap-6 animate-fade-in ${isInLiveRoom ? 'grid-cols-[1fr_320px_350px]' : 'grid-cols-[1fr_380px]'}`}>
      {/* ── LEFT PANEL ── */}
      <div className="flex flex-col gap-4">

        {/* Camera + canvas overlay */}
        <div className="relative rounded-2xl overflow-hidden bg-[#0d0d1a] aspect-video">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            autoPlay playsInline muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            width={640} height={480}
          />

          {/* Inactive overlay */}
          {!isCameraEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0d0d1a]">
              <div className="w-24 h-24 rounded-full bg-plum/20 flex items-center justify-center">
                <CameraIcon size={40} className="text-plum" />
              </div>
              <p className="text-white/60 text-sm">Нақты уақыттағы қимыл тануды бастау үшін камераны қосыңыз</p>
            </div>
          )}

          {/* Active HUD */}
          {isCameraEnabled && (
            <>
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-danger/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> ТІКЕЛЕЙ ЭФИР
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold">
                <Wifi size={12} className="text-rose" /> {fps} FPS
              </div>
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm transition-all ${handDetected ? 'bg-success/80 text-white' : 'bg-white/20 text-white/60'
                }`}>
                <Hand size={12} /> {handDetected ? 'ҚОЛ АНЫҚТАЛДЫ' : 'ҚОЛ КҮТУ...'}
              </div>

              {/* Confidence bar */}
              {confidence > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between text-white text-xs mb-1">
                    <span className="font-bold text-base">{gestureResult.wordKz}</span>
                    <span className="font-mono">СЕНІМДІЛІК: {confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-plum to-rose transition-all duration-300"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => useBiometricStore.getState().setIsCameraEnabled(false)}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-danger/80 backdrop-blur-sm text-white flex items-center justify-center hover:bg-danger transition-colors"
                title="Камераны өшіру"
              >
                <CameraOff size={16} />
              </button>
            </>
          )}
        </div>

        {/* Recognized word */}
        <motion.div className="card text-center py-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
          <div 
            className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-success to-emerald-400 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${holdingProgress}%`, opacity: holdingProgress > 0 ? 1 : 0 }}
          />
          <p className="text-xs font-bold uppercase tracking-widest mb-3 transition-colors"
             style={{ color: holdingProgress > 0 && holdingProgress < 100 ? '#F43F5E' : '#9ca3af' }}>
             {holdingProgress > 0 && holdingProgress < 100 ? 'АНЫҚТАЛУДА...' : 'ТАНЫЛҒАН ҚИМЫЛ'}
          </p>
          <AnimatePresence mode="wait">
            <motion.h1
              key={gestureResult.word}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: holdingProgress === 100 ? 1.05 : 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`text-6xl font-extrabold bg-clip-text text-transparent leading-tight transition-all duration-300 ${
                 holdingProgress === 100 ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-plum to-rose'
              }`}
            >
              {gestureResult.word}
            </motion.h1>
          </AnimatePresence>
          {gestureResult.confidence > 0 && (
            <p className="text-text-muted text-sm mt-3 bg-bg-secondary px-4 py-1 rounded-full">{gestureResult.wordKz}</p>
          )}
        </motion.div>

        {/* History log */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HandMetal size={16} className="text-rose" />
              <span className="text-xs font-bold text-text-muted uppercase">АУДАРМА ТАРИХЫ</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setHistory([]); GESTURE_HISTORY.clear() }} className="text-text-muted hover:text-plum transition-colors"><RotateCcw size={14} /></button>
              <button onClick={copyText} className="text-text-muted hover:text-plum transition-colors">
                {copied ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div className="min-h-[60px] flex flex-wrap gap-2 items-start">
            <AnimatePresence>
              {history.length === 0 && <p className="text-text-muted text-sm italic">Қимыл жасаңыз...</p>}
              {history.map((word: string, i: number) => (
                <motion.span
                  key={`${word}-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-3 py-1 bg-plum-pale rounded-full text-plum font-bold text-sm"
                >
                  {word}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Generated Sentence */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="card border-2 border-plum/30 bg-plum/5 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-plum flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">AI</span>
                </div>
                <span className="text-xs font-bold text-plum uppercase">Мағыналы Сөйлем</span>
              </div>
              {isGenerating ? (
                <div className="flex items-center gap-3 text-text-muted py-2">
                  <div className="w-4 h-4 border-2 border-plum/40 border-t-plum rounded-full animate-spin" />
                  <span className="italic text-sm">Сөйлем құрастырылуда...</span>
                </div>
              ) : (
                <p className="text-lg font-bold text-text-primary px-1">
                  {generatedSentence || (
                    <span className="text-text-muted italic text-sm">Күтіңіз...</span>
                  )}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-col gap-4">
        {/* Text → Gesture */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Languages size={16} className="text-rose" />
            <span className="text-xs font-bold text-text-muted uppercase">МӘТІННЕН ҚИМЫЛҒА</span>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={textInput}
              onChange={(e: any) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslateToGesture()}
              placeholder="Сөз енгізіңіз..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 text-sm"
              disabled={isPlaying}
            />
            <button
              onClick={handleTranslateToGesture}
              disabled={!textInput.trim() || isPlaying}
              className="px-4 py-2.5 bg-gradient-to-r from-plum to-rose text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center min-w-[50px]"
            >
              {isPlaying ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Languages size={16} />}
            </button>
          </div>
          <div className="bg-bg-secondary rounded-xl p-6 flex flex-col items-center gap-3 min-h-[140px] justify-center relative overflow-hidden">
            {isPlaying && playbackIndex < playbackSequence.length ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={playbackIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-plum flex items-center justify-center text-white shadow-lg shadow-plum/30">
                    {playbackSequence[playbackIndex].gesture !== 'БЕЛГІСІЗ' ? <Hand size={32} /> : <span className="text-2xl font-bold">?</span>}
                  </div>
                  <p className="text-text-primary font-bold text-lg">{playbackSequence[playbackIndex].word}</p>
                  <p className="text-plum font-medium text-xs bg-white px-3 py-1 rounded-full">{playbackSequence[playbackIndex].gesture}</p>
                </motion.div>
              </AnimatePresence>
            ) : isPlaying && playbackIndex >= playbackSequence.length ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                <CheckCircle2 size={32} className="text-success mb-2" />
                <p className="text-text-primary font-bold text-sm">Аударма аяқталды</p>
              </motion.div>
            ) : (
              textInput
                ? <><div className="w-14 h-14 rounded-2xl bg-plum-pale flex items-center justify-center"><Hand size={28} className="text-plum" /></div>
                  <p className="text-plum font-bold text-sm text-center">"{textInput}" → Қимыл</p></>
                : <p className="text-text-muted text-sm text-center">Аудару үшін сөз енгізіңіз</p>
            )}

            {isPlaying && (
              <div className="absolute bottom-0 left-0 h-1 bg-plum-pale w-full">
                <div
                  className="h-full bg-plum transition-all duration-300"
                  style={{ width: `${(playbackIndex / Math.max(1, playbackSequence.length)) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Gesture guide — highlights current detection */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-plum" />
            <span className="text-xs font-bold text-text-muted uppercase">ҚИМЫЛ НҰСҚАУЛЫҒЫ</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {KNOWN_WORDS.map((item) => {
              const active = gestureResult.word === item.word
              return (
                <div
                  key={item.word}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-plum text-white' : 'bg-bg-secondary hover:bg-plum-pale'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-white/20' : 'bg-white'}`}>
                      <Hand size={16} className={active ? 'text-white' : 'text-plum'} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${active ? 'text-white' : 'text-text-primary'}`}>{item.word}</p>
                      <p className={`text-xs ${active ? 'text-white/70' : 'text-text-muted'}`}>{item.gesture}</p>
                    </div>
                  </div>
                  {active && <CheckCircle2 size={16} className="text-white" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Session stats */}
        <div className="card">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">СЕАНС СТАТИСТИКАСЫ</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-bg-secondary rounded-xl">
              <p className="text-2xl font-extrabold text-plum">{history.length}</p>
              <p className="text-xs text-text-muted">ТАНЫЛҒАН</p>
            </div>
            <div className="text-center p-3 bg-bg-secondary rounded-xl">
              <p className="text-2xl font-extrabold text-rose">{confidence}%</p>
              <p className="text-xs text-text-muted">СЕНІМДІЛІК</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE CHAT PANEL ── */}
      {isInLiveRoom && (
        <div className="flex flex-col gap-4 border-l border-white/5 pl-6 h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
               <span className="text-sm font-bold text-white uppercase tracking-wider">Live Сұхбат</span>
             </div>
             <span className="text-xs text-text-muted">{chatMessages.length} хабарлама</span>
          </div>
          
          {/* Remote Video Wrapper */}
          <div className="w-full aspect-video bg-[#0d0d1a] rounded-2xl overflow-hidden border border-white/10 relative shrink-0 shadow-lg">
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay playsInline
            />
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Сұхбаттасушы
            </div>
          </div>
          
          <div className="flex-1 bg-bg-secondary/50 rounded-2xl p-4 overflow-y-auto flex flex-col gap-4 border border-white/5">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-center">
                 <Languages size={32} className="mb-2" />
                 <p className="text-sm text-text-muted">Ымдау тілінде сөйлесуді бастаңыз...</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMe = msg.userId === userId
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-text-muted mb-1 px-1">{msg.name}</span>
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] ${
                      isMe 
                        ? 'bg-gradient-to-r from-plum to-rose text-white rounded-tr-sm' 
                        : 'bg-white/10 text-text-primary rounded-tl-sm'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      {msg.isSignLanguage && <Hand size={10} className="text-plum" />}
                      <span className="text-[10px] text-text-muted">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendManualChat} className="flex gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Хабарлама жазу..."
              className="flex-1 px-4 py-3 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-plum text-sm"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-11 h-11 bg-plum text-white rounded-xl flex items-center justify-center hover:bg-plum/90 disabled:opacity-50 transition-colors"
            >
              <SendHorizonal size={18} />
            </button>
          </form>

          <div className="bg-plum/10 border border-plum/20 rounded-xl p-3 text-center shrink-0">
            <p className="text-[10px] text-plum font-medium">Сіздің ымдау арқылы құралған сөйлемдеріңіз чатқа автоматты түрде жіберіледі.</p>
          </div>
        </div>
      )}
      
      {!isInLiveRoom && (
        <div className="fixed bottom-6 right-6">
          <button 
            onClick={handleJoinChat}
            className="px-6 py-3 bg-white text-plum rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Live Чатқа қосылу
          </button>
        </div>
      )}

    </div>
  )
}
