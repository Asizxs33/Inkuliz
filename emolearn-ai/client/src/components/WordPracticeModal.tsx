import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Hand, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { DictionaryWord } from '../lib/dictionaryData'
import { useBiometricStore } from '../store/biometricStore'
import { recognizeGesture, type GestureResult } from '../lib/gestureRecognizer'

interface Props {
  word: DictionaryWord
  onClose: () => void
}

const getAnimationProps = (anim?: string) => {
  switch (anim) {
    case 'wave': return { animate: { rotate: [0, 20, -15, 20, -15, 0] }, transition: { duration: 1.5, repeat: Infinity } }
    case 'bounce': return { animate: { y: [0, -15, 0] }, transition: { duration: 1, repeat: Infinity } }
    case 'pulse': return { animate: { scale: [1, 1.15, 1] }, transition: { duration: 1, repeat: Infinity } }
    case 'shake': return { animate: { x: [0, -10, 10, -10, 10, 0] }, transition: { duration: 0.5, repeat: Infinity } }
    default: return { animate: { scale: [0.9, 1] }, transition: { duration: 1 } }
  }
}

export default function WordPracticeModal({ word, onClose }: Props) {
  const { globalStream, isCameraEnabled, handLandmarks } = useBiometricStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [gestureResult, setGestureResult] = useState<GestureResult | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [successCount, setSuccessCount] = useState(0)

  useEffect(() => {
    if (videoRef.current && globalStream) {
      videoRef.current.srcObject = globalStream
      videoRef.current.play().catch(() => {})
    }
  }, [globalStream])

  // Check gesture match
  useEffect(() => {
    if (!handLandmarks || handLandmarks.length === 0 || result === 'correct') return
    const landmarks = handLandmarks[0]
    const recognized = recognizeGesture(landmarks)
    if (recognized) {
      setGestureResult(recognized)
      // Match by Kazakh word
      if (recognized.wordKz.toUpperCase() === word.wordKz.toUpperCase()) {
        setResult('correct')
        setSuccessCount(s => s + 1)
        setAttempts(a => a + 1)
      }
    }
  }, [handLandmarks, word, result])

  const handleTryAgain = () => {
    setResult('idle')
    setGestureResult(null)
  }

  const handleCheckManual = () => {
    if (!gestureResult) {
      setResult('wrong')
      setAttempts(a => a + 1)
      return
    }
    if (gestureResult.wordKz.toUpperCase() === word.wordKz.toUpperCase()) {
      setResult('correct')
      setSuccessCount(s => s + 1)
    } else {
      setResult('wrong')
    }
    setAttempts(a => a + 1)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-bg-primary rounded-3xl shadow-2xl max-w-4xl w-full p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10">
          <X size={16} className="text-text-muted" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{word.emoji}</span>
          <div>
            <h2 className="text-2xl font-black text-text-primary">{word.wordKz}</h2>
            <p className="text-sm text-text-muted">{word.transliteration}</p>
          </div>
          <span className="ml-auto inline-block text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: word.color }}>
            {word.difficulty}
          </span>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Demo */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold text-plum uppercase tracking-widest">ҮЛГІ ҚИМЫЛ</p>
            <div className="bg-bg-secondary rounded-2xl p-6 flex flex-col items-center gap-4 min-h-[250px] justify-center">
              {word.gifUrl ? (
                <img src={word.gifUrl} alt={word.wordKz} className="w-40 h-40 rounded-2xl object-cover shadow-lg" />
              ) : (
                <motion.div
                  animate={getAnimationProps(word.animation).animate}
                  transition={getAnimationProps(word.animation).transition}
                  className="text-8xl drop-shadow-lg"
                >
                  {word.emoji}
                </motion.div>
              )}
              <div className="text-center">
                <p className="text-plum font-bold text-sm bg-plum/10 border border-plum/20 px-5 py-2 rounded-full inline-block">
                  {word.gesture}
                </p>
              </div>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{word.description}</p>
          </div>

          {/* Right: Camera Practice */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold text-rose uppercase tracking-widest">КАМЕРАДА ҚАЙТАЛАҢЫЗ</p>
            <div className="bg-[#0d0d1a] rounded-2xl overflow-hidden relative min-h-[250px] flex items-center justify-center">
              {isCameraEnabled && globalStream ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                    autoPlay playsInline muted
                  />
                  {/* Gesture indicator */}
                  {gestureResult && (
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold">
                      Анықталған: {gestureResult.wordKz} ({Math.round(gestureResult.confidence * 100)}%)
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/50">
                  <Camera size={40} />
                  <p className="text-sm text-center">Камераңызды қосыңыз<br/>(жоғарғы панельден)</p>
                </div>
              )}

              {/* Result overlay */}
              <AnimatePresence>
                {result === 'correct' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-success/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
                  >
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                      <CheckCircle2 size={64} className="text-white" />
                    </motion.div>
                    <p className="text-white font-black text-2xl">ДҰРЫС! 🎉</p>
                    <p className="text-white/80 text-sm">Сіз "{word.wordKz}" қимылын дұрыс жасадыңыз!</p>
                  </motion.div>
                )}
                {result === 'wrong' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-danger/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
                  >
                    <XCircle size={64} className="text-white" />
                    <p className="text-white font-black text-2xl">ҚАЙТАЛАҢЫЗ</p>
                    <p className="text-white/80 text-sm">
                      {gestureResult ? `"${gestureResult.wordKz}" анықталды, бірақ "${word.wordKz}" керек` : 'Қимыл анықталмады'}
                    </p>
                    <button onClick={handleTryAgain} className="mt-2 px-6 py-2 bg-white text-danger rounded-full font-bold text-sm flex items-center gap-2">
                      <RotateCcw size={14} /> Қайталау
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {result === 'idle' && isCameraEnabled && (
                <button 
                  onClick={handleCheckManual}
                  className="flex-1 py-3 bg-gradient-to-r from-plum to-rose text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Тексеру
                </button>
              )}
              {result === 'correct' && (
                <button onClick={onClose} className="flex-1 py-3 bg-success text-white rounded-xl font-bold text-sm">
                  Жабу ✅
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-3 text-center">
              <div className="flex-1 bg-bg-secondary rounded-xl p-3">
                <p className="text-xl font-black text-plum">{attempts}</p>
                <p className="text-[10px] text-text-muted uppercase">Талпыныс</p>
              </div>
              <div className="flex-1 bg-bg-secondary rounded-xl p-3">
                <p className="text-xl font-black text-success">{successCount}</p>
                <p className="text-[10px] text-text-muted uppercase">Дұрыс</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
