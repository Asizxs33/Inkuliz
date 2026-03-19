import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Brain, CheckCircle2, Trash2 } from 'lucide-react'
import { ML_CLASSIFIER } from '../lib/mlClassifier'
import { useBiometricStore } from '../store/biometricStore'
import { DICTIONARY_DATA } from '../lib/dictionaryData'

interface Props {
  onClose: () => void
}

export default function AITrainerModal({ onClose }: Props) {
  const [selectedWord, setSelectedWord] = useState(DICTIONARY_DATA[0].wordKz)
  const [isRecording, setIsRecording] = useState(false)
  const [trainedCount, setTrainedCount] = useState(0)
  
  const { handLandmarks, isCameraEnabled } = useBiometricStore()

  useEffect(() => {
    setTrainedCount(ML_CLASSIFIER.getCounts()[selectedWord] || 0)
  }, [selectedWord])

  const handleTrain = () => {
    if (!handLandmarks || handLandmarks.length === 0) return
    setIsRecording(true)
    
    // Add example vector
    ML_CLASSIFIER.addExample(selectedWord, handLandmarks[0])
    setTrainedCount(prev => prev + 1)
    
    setTimeout(() => setIsRecording(false), 300)
  }

  const handleClear = () => {
    ML_CLASSIFIER.clearExamples(selectedWord)
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
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">AI Жаттықтыру</h2>
            <p className="text-xs text-white/60">Кездейсоқ қимылды нейрожеліге қосу</p>
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
           
           <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                 <p className="text-sm font-bold text-white">Үйретілген векторлар</p>
                 <p className="text-xs text-success">ML Model: Векторлық Косинус</p>
              </div>
              <div className="text-3xl font-black text-plum">{trainedCount}</div>
           </div>

           {!isCameraEnabled && (
              <p className="text-xs text-danger font-bold text-center bg-danger/10 py-2 rounded-lg">Камера қосылмаған!</p>
           )}
           {isCameraEnabled && !handLandmarks && (
              <p className="text-xs text-amber-500 font-bold text-center bg-amber-500/10 py-2 rounded-lg">Камераға қолыңызды көрсетіңіз!</p>
           )}

           <div className="flex gap-2 pt-4">
             <button 
               onClick={handleClear}
               disabled={trainedCount === 0}
               title="Тазалау"
               className="px-4 py-4 rounded-xl border border-rose text-rose font-bold text-sm hover:bg-rose/10 disabled:opacity-30 disabled:border-white/10 disabled:text-white/30 transition-colors flex items-center gap-2"
             >
               <Trash2 size={18} />
             </button>
             <button
               onClick={handleTrain}
               disabled={!isCameraEnabled || !handLandmarks || handLandmarks.length === 0}
               className={`flex-1 py-4 rounded-xl font-bold text-sm text-white flex justify-center items-center gap-2 transition-all shadow-lg ${
                 isRecording ? 'bg-success scale-95 shadow-success/40' : 'bg-gradient-to-r from-plum to-rose hover:opacity-90 shadow-plum/40'
               } disabled:opacity-50 disabled:grayscale`}
             >
                {isRecording ? <CheckCircle2 size={18} /> : <span>Нейрожеліге Сақтау (Train)</span>}
             </button>
           </div>
           <p className="text-[10px] text-center text-white/40 mt-2 leading-tight">
             <b>Лайфхак:</b> Қолыңызды басқаша бұрыштардан ұстап тұрып, батырманы 5-10 рет басыңыз. Сонда AI 100% дәл танитын болады.
           </p>
        </div>
      </motion.div>
    </div>
  )
}
