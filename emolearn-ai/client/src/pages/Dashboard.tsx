import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Brain, Zap, Send, ChevronLeft, ChevronRight, Lightbulb, MessageCircle, Settings, User, AlertTriangle, AlertCircle, CheckCircle2, SendHorizonal, Volume2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { useState, useEffect } from 'react'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'

const weeklyData = [
  { day: 'ДҮ', value: 65 }, { day: 'СЕ', value: 80 },
  { day: 'СӘ', value: 45 }, { day: 'БЕ', value: 90 },
  { day: 'ЖҰ', value: 70 }, { day: 'СЕ', value: 55 },
  { day: 'ЖЕ', value: 40 },
]



export default function Dashboard() {
  const [answer, setAnswer] = useState('')
  const [aiRecommendation, setAiRecommendation] = useState('Проводится анализ...')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success'|'error'|'info' } | null>(null)

  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const checkAnswer = () => {
    if (answer.trim() === '37') {
      showToast('Дұрыс! Сіз 15 XP алдыңыз.', 'success')
    } else if (answer.trim() === '') {
      showToast('Жауапты енгізіңіз.', 'error')
    } else {
      showToast('Қате. Қайта байқап көріңіз.', 'error')
    }
  }
  const { bpm, emotion, cognitive, setEmotion, setCognitive, confidence, isCameraEnabled } = useBiometricStore()

  // Real-time telemetry processing via ChatGPT API
  useEffect(() => {
    if (!isCameraEnabled) return

    let lastData = { bpm: 0, cognitive: 0 }

    const analyzeTelemetry = async () => {
      // Only send if data changed significantly (±3 units)
      if (Math.abs(bpm - lastData.bpm) < 3 && Math.abs(cognitive - lastData.cognitive) < 3) {
        return
      }
      
      lastData = { bpm, cognitive }
      setIsAnalyzing(true)
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/chat/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bpm,
            attentionLevel: cognitive,
            recentErrors: 0 
          })
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data.emotion) setEmotion(data.emotion, 95.5)
          if (data.cognitiveLoad) setCognitive(parseInt(data.cognitiveLoad))
          if (data.reason) setAiRecommendation(data.reason)
        }
      } catch (err) {
        console.error('Failed to analyze telemetry', err)
      } finally {
        setIsAnalyzing(false)
      }
    }

    // Initial check after 2s, then every 15s
    const timeout = setTimeout(analyzeTelemetry, 2000)
    const interval = setInterval(analyzeTelemetry, 15000)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [bpm, cognitive, setEmotion, setCognitive, isCameraEnabled])

  return (
    <div className="grid grid-cols-[280px_1fr_300px] gap-6 animate-fade-in">
      {/* LEFT PANEL */}
      <div className="flex flex-col gap-4">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card flex flex-col items-center py-6"
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-plum-pale to-soft-pink flex items-center justify-center pulse-ring border-3 border-rose">
              <div className="w-24 h-24 rounded-full bg-bg-secondary flex items-center justify-center">
                <User size={40} className="text-text-muted" />
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-rose rounded-full border-2 border-white" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-text-primary">{useUserStore(s => s.name)}</h3>
          <p className="text-sm text-rose">Студент</p>
        </motion.div>

        {/* Join Class */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="card border-plum/30 bg-plum-pale/30"
        >
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">СЫНЫПҚА ҚОСЫЛУ</p>
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('invite_code') as HTMLInputElement;
              const code = input.value;
              if (!code) return;
              try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/classes/join', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    student_id: useUserStore.getState().id, 
                    invite_code: code 
                  })
                })
                if (res.ok) {
                  alert('Сыныпқа сәтті қосылдыңыз!');
                  input.value = '';
                } else {
                  const err = await res.json();
                  alert(err.error || 'Қате пайда болды');
                }
              } catch (err) {
                alert('Серверге қосылу қатесі');
              }
            }}
            className="flex gap-2"
          >
            <input 
              name="invite_code"
              type="text" 
              placeholder="Кодты енгізіңіз (мысалы 5X9P)" 
              className="flex-1 px-3 py-2 rounded-lg border border-border-soft text-sm uppercase focus:outline-none focus:border-plum"
            />
            <button type="submit" className="bg-plum text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-plum/90 transition-colors">
              Кіру
            </button>
          </form>
        </motion.div>

        {/* Emotion Card */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">ЭМОЦИЯ (CHATGPT)</p>
          <h2 className="text-2xl font-extrabold text-text-primary capitalize">{emotion}</h2>
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-text-secondary">Сенімділік</span>
            <span className="text-sm font-bold text-rose">{confidence}%</span>
          </div>
          <div className="w-full h-1.5 bg-plum-pale rounded-full mt-2">
            <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full transition-all duration-500" style={{ width: `${confidence}%` }} />
          </div>
        </motion.div>

        {/* Heart Rate */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">ЖҮРЕК СОҒУЫ</p>
          <div className="flex items-end gap-2">
            {bpm === 0 ? (
              <span className="text-xl font-bold text-rose animate-pulse">Өлшенуде...</span>
            ) : (
              <>
                <span className="text-4xl font-extrabold text-text-primary">{bpm}</span>
                <span className="text-rose font-bold text-sm mb-1">BPM</span>
              </>
            )}
          </div>
          <svg className="w-full h-12 mt-2" viewBox="0 0 200 40">
            <polyline
              fill="none"
              stroke="#E8507A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,20 15,20 25,20 30,5 35,35 40,20 55,20 65,20 70,5 75,35 80,20 95,20 105,20 110,5 115,35 120,20 135,20 145,20 150,5 155,35 160,20 175,20 185,20 190,5 195,35 200,20"
              className="ecg-line"
            />
          </svg>
        </motion.div>

        {/* Cognitive Load */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">КОГНИТИВТІК ЖҮКТЕМЕ</p>
          <div className="flex justify-center">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F2E8F0" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#cogGrad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${cognitive * 2.64} ${100 * 2.64}`}
                />
                <defs>
                  <linearGradient id="cogGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6B2D5E" />
                    <stop offset="100%" stopColor="#E8507A" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-text-primary">{cognitive}%</span>
                <span className="text-xs text-text-muted">ОРТАША</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Recommendation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl p-5 bg-gradient-to-br from-plum to-rose text-white relative overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-soft-pink" />
            <span className="text-sm font-bold">AI КЕҢЕСІ (CHATGPT)</span>
            {isAnalyzing && <div className="ml-auto w-3 h-3 rounded-full bg-white animate-pulse" />}
          </div>
          <p className="text-sm opacity-90 leading-relaxed min-h-[40px]">
            {aiRecommendation}
          </p>
          <button 
            onClick={() => showToast('Күрделі деңгей жүктелуде...', 'info')}
            className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors"
          >
            Күрделі деңгейге өту
          </button>
        </motion.div>
      </div>

      {/* CENTER PANEL */}
      <div className="flex flex-col gap-5">
        {/* Lesson header */}
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Python негіздері</h1>
          <p className="text-text-secondary mt-1">3-бөлім: Айнымалылар мен есептеулер</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex-1 h-2 bg-plum-pale rounded-full">
              <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full transition-all" style={{ width: '47%' }} />
            </div>
            <span className="text-xs text-text-muted font-semibold">САБАҚ БАРЫСЫ</span>
            <span className="text-2xl font-extrabold text-text-primary">47%</span>
          </div>
        </div>

        {/* AI Adaptation banner */}
        <div className="bg-rose-pale border border-soft-pink rounded-xl px-5 py-4 flex items-start gap-3">
          <Zap size={20} className="text-rose mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-rose text-sm">AI адаптациясы: </span>
            <span className="text-text-primary text-sm">{aiRecommendation}</span>
          </div>
        </div>

        {/* Task card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <span className="bg-rose text-white text-xs font-bold px-3 py-1 rounded-full">ТАПСЫРМА №7</span>
            <div className="flex-1" />
            <button 
              onClick={() => showToast('Дыбыс қосылды', 'success')}
              className="text-text-muted hover:text-plum transition-colors"
            >
              <Volume2 size={18} />
            </button>
            <button 
              onClick={() => showToast('Тапсырма баптаулары', 'info')}
              className="text-text-muted hover:text-plum transition-colors"
            >
              <Settings size={18} />
            </button>
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-6">
            Кодтың орындалу нәтижесін анықтаңыз:
          </h2>

          {/* Code block */}
          <div className="bg-[#1E1E2E] rounded-xl p-5 font-mono text-sm">
            <div className="flex gap-4">
              <span className="text-text-muted select-none">1</span>
              <span><span className="text-[#82AAFF]">x</span> <span className="text-white">=</span> <span className="text-[#F78C6C]">15</span></span>
            </div>
            <div className="flex gap-4">
              <span className="text-text-muted select-none">2</span>
              <span><span className="text-[#82AAFF]">y</span> <span className="text-white">=</span> <span className="text-[#82AAFF]">x</span> <span className="text-white">*</span> <span className="text-[#F78C6C]">2</span> <span className="text-white">+</span> <span className="text-[#F78C6C]">7</span></span>
            </div>
            <div className="flex gap-4">
              <span className="text-text-muted select-none">3</span>
              <span><span className="text-[#82AAFF]">print</span><span className="text-white">(</span><span className="text-[#82AAFF]">y</span><span className="text-white">)</span></span>
            </div>
          </div>

          {/* Answer input */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-text-secondary mb-2">СІЗДІҢ ЖАУАБЫҢЫЗ:</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder="Мәнді енгізіңіз..."
                className="flex-1 px-4 py-3 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
              />
              <button 
                onClick={checkAnswer}
                className="btn-primary px-8 py-3 flex items-center gap-2 font-bold"
              >
                <Send size={16} />
                Жіберу
              </button>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border-soft">
            <div className="flex flex-col">
              <button 
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-rose font-bold text-sm hover:text-plum transition-colors"
              >
                <Lightbulb size={16} />
                КӨМЕК АЛУ (HINT)
              </button>
              {showHint && (
                <span className="text-xs text-text-secondary mt-1 animate-fade-in absolute translate-y-7 bg-white p-2 rounded-lg shadow-sm border border-border-soft z-10">
                  Кеңес: Алдымен көбейту (15 * 2) орындалады, сосын қосу.
                </span>
              )}
            </div>
            <div className="flex-1" />
            <button 
              onClick={() => showToast('Алдыңғы тапсырмаға өттіңіз', 'info')}
              className="px-5 py-2 border border-border-soft rounded-lg text-text-secondary font-semibold text-sm hover:border-plum hover:text-plum transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={14} />
              АРТҚА
            </button>
            <button 
              onClick={() => showToast('Бұл соңғы тапсырма', 'error')}
              className="px-5 py-2 border border-border-soft rounded-lg text-text-secondary font-semibold text-sm hover:border-plum hover:text-plum transition-colors flex items-center gap-2"
            >
              АЛҒА
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col gap-4">
        {/* Daily Goal */}
        <div className="card border-rose/20 bg-gradient-to-br from-white to-rose-pale/30">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">КҮНДЕЛІКТІ МАҚСАТ</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-text-primary">XP жинау</span>
            <span className="text-sm font-bold text-rose">120 / 200 XP</span>
          </div>
          <div className="w-full h-3 bg-plum-pale rounded-full border border-plum/10">
            <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full transition-all duration-1000 relative" style={{ width: '60%' }}>
              <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/30 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-3 font-medium">80 XP қалды. Тағы 3 тапсырманы орындаңыз!</p>
        </div>

        {/* Achievements */}
        <div className="card">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">ЖЕТІСТІКТЕРІҢ</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 bg-rose-pale rounded-xl border border-rose/10">
              <div className="w-10 h-10 shrink-0 rounded-full bg-rose/20 flex items-center justify-center">
                <Zap size={20} className="text-rose" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Жылдам жауап</p>
                <p className="text-xs text-text-muted">3 тапсырманы 5 минутта орындадыңыз</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-plum-pale rounded-xl border border-plum/10">
              <div className="w-10 h-10 shrink-0 rounded-full bg-plum/20 flex items-center justify-center">
                <Brain size={20} className="text-plum" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Үздік зейін</p>
                <p className="text-xs text-text-muted">Когнитивті жүктемені қалыпты ұстадыңыз</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="card">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">АПТАЛЫҚ БЕЛСЕНДІЛІК</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9C8A98' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #EDD8E8', borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8507A" />
                  <stop offset="100%" stopColor="#F9C5D5" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Toast Notification System */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 px-6 py-3 rounded-full shadow-lg font-bold text-white z-[9999] flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-success' : toast.type === 'error' ? 'bg-danger' : 'bg-plum'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
