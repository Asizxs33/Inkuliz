import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Brain, CheckCircle2, Trash2, Video } from 'lucide-react'
import { ML_CLASSIFIER } from '../lib/mlClassifier'
import { useBiometricStore } from '../store/biometricStore'
import { DICTIONARY_DATA } from '../lib/dictionaryData'
import type { Landmark } from '../lib/gestureRecognizer'

interface Props {
  onClose: () => void
}

export default function AITrainerModal({ onClose }: Props) {
  const [selectedWord, setSelectedWord] = useState(DICTIONARY_DATA[0].wordKz)
  const [isRecording, setIsRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [trainedCount, setTrainedCount] = useState(0)
  const [saveError, setSaveError] = useState(false)
  
  const { handLandmarks, isCameraEnabled } = useBiometricStore()
  const latestLandmarksRef = useRef<Landmark[][] | null>(null)

  useEffect(() => {
    if (handLandmarks && handLandmarks.length > 0) {
      latestLandmarksRef.current = handLandmarks
    } else {
      latestLandmarksRef.current = null
    }
  }, [handLandmarks])

  useEffect(() => {
    setTrainedCount(ML_CLASSIFIER.getCounts()[selectedWord] || 0)
  }, [selectedWord])

  const handleTrainStart = () => {
    if (!isCameraEnabled) return
    setIsRecording(true)
    setProgress(0)
    
    const sequence: Landmark[][][] = []
    let frames = 0
    const TARGET_FRAMES = 25 // 25 frames ~ 1.5 seconds at ~15fps
    
    const interval = setInterval(() => {
       if (latestLandmarksRef.current) {
         sequence.push(latestLandmarksRef.current)
       }
       frames++
       setProgress((frames / TARGET_FRAMES) * 100)
       
       if (frames >= TARGET_FRAMES) {
         clearInterval(interval)
         finishTraining(sequence)
       }
    }, 60)
  }

  const finishTraining = async (sequence: Landmark[][][]) => {
     setSaveError(false)
     try {
       await ML_CLASSIFIER.addSequenceExample(selectedWord, sequence)
       setTrainedCount(ML_CLASSIFIER.getCounts()[selectedWord] || 0)
     } catch {
       setSaveError(true)
     }
     setIsRecording(false)
     setProgress(0)
  }

  const handleClear = async () => {
    await ML_CLASSIFIER.clearExamples(selectedWord)
    setTrainedCount(0)
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0d0d1a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-plum/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(206,126,204,0.3)]">
            <Brain size={24} className="text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">DTW Модельді Үйрету</h2>
            <p className="text-xs text-white/60">Қозғалыс траекториясын сақтау</p>
          </div>
        </div>

        <div className="space-y-4">
           <div>
             <label className="text-xs font-bold text-white/50 uppercase mb-2 block">Сөзді таңдаңыз</label>
             <select 
               value={selectedWord}
               onChange={(e) => setSelectedWord(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-plum"
             >
               {DICTIONARY_DATA.map(w => (
                 <option key={w.id} value={w.wordKz} className="bg-[#0d0d1a]">{w.wordKz} {w.emoji}</option>
               ))}
             </select>
           </div>
           
           <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
              {isRecording && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-rose/20 transition-all duration-[60ms] ease-linear" 
                  style={{ width: `${progress}%` }} 
                />
              )}
              <div className="relative z-10">
                 <p className="text-sm font-bold text-white">Видео-тізбектер</p>
                 <p className="text-xs text-success">ML Model: Dynamic Time Warping</p>
              </div>
              <div className="text-3xl font-black text-plum relative z-10">{trainedCount}</div>
           </div>

           {!isCameraEnabled && (
              <p className="text-xs text-danger font-bold text-center bg-danger/10 py-2 rounded-lg">Камера қосылмаған!</p>
           )}
           {saveError && (
              <p className="text-xs text-danger font-bold text-center bg-danger/10 py-2 rounded-lg">Сервер қатесі: жест сақталмады</p>
           )}

           <div className="flex gap-2 pt-4">
             <button 
               onClick={handleClear}
               disabled={trainedCount === 0 || isRecording}
               title="Тазалау"
               className="px-4 py-4 rounded-xl border border-rose text-rose font-bold text-sm hover:bg-rose/10 disabled:opacity-30 disabled:border-white/10 disabled:text-white/30 transition-colors flex items-center gap-2"
             >
               <Trash2 size={18} />
             </button>
             <button
               onClick={handleTrainStart}
               disabled={!isCameraEnabled || isRecording}
               className={`relative overflow-hidden flex-1 py-4 rounded-xl font-bold text-sm text-white flex justify-center items-center gap-2 transition-all shadow-lg ${
                 isRecording ? 'bg-danger scale-95 shadow-danger/40' : 'bg-gradient-to-r from-plum to-rose hover:opacity-90 shadow-plum/40'
               } disabled:opacity-50`}
             >
                {isRecording ? (
                  <>
                    <Video size={18} className="animate-pulse" />
                    <span>Жазылуда ({Math.round(progress)}%)</span>
                  </>
                ) : <span>Қимылды Жазу (1.5 сек)</span>}
             </button>
           </div>
           <p className="text-[10px] text-center text-white/40 mt-2 leading-tight">
             <b>Нұсқау:</b> Батырманы басқан соң 1.5 секунд бойы камераға нағыз "Шай" немесе "Кітап" қимылын (қозғалыспен) жасап үлгеріңіз.
           </p>
        </div>
      </motion.div>
    </div>
  )
}
