import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Brain, Zap, BookOpen, Hand, Camera, Trophy, TrendingUp, Clock, Star, AlertCircle, CheckCircle2, User, Bookmark, Languages, Gamepad2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'
import { DICTIONARY_DATA } from '../lib/dictionaryData'
import { useNavigate } from 'react-router-dom'

// ─── Activity tracking via localStorage ───
function getActivityData() {
  try {
    const raw = localStorage.getItem('emolearn_activity')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function recordVisit() {
  const data = getActivityData()
  const today = new Date().toISOString().slice(0, 10)
  data[today] = (data[today] || 0) + 1
  localStorage.setItem('emolearn_activity', JSON.stringify(data))
}

function getWeeklyActivity() {
  const data = getActivityData()
  const days = ['ЖЕ', 'ДҮ', 'СЕ', 'СӘ', 'БЕ', 'ЖҰ', 'СЕ']
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ day: days[d.getDay()], value: data[key] || 0, date: key })
  }
  return result
}

function getBookmarkCount() {
  try {
    const saved = localStorage.getItem('emolearn_bookmarks')
    return saved ? JSON.parse(saved).length : 0
  } catch { return 0 }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Қайырлы түн 🌙'
  if (h < 12) return 'Қайырлы таң ☀️'
  if (h < 18) return 'Қайырлы күн 🌤️'
  return 'Қайырлы кеш 🌆'
}

function getStreak() {
  const data = getActivityData()
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10)
    if (data[key] && data[key] > 0) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { bpm, emotion, cognitive, confidence, isCameraEnabled, setEmotion, setCognitive } = useBiometricStore()
  const userName = useUserStore(s => s.name)
  const userId = useUserStore(s => s.id)

  const [toast, setToast] = useState<{ message: string, type: 'success'|'error'|'info' } | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState('Камераны қосыңыз, AI сізді талдайды...')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [weeklyData, setWeeklyData] = useState(getWeeklyActivity())

  const bookmarkCount = getBookmarkCount()
  const totalWords = DICTIONARY_DATA.length
  const progress = Math.round((bookmarkCount / totalWords) * 100)
  const streak = getStreak()

  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Record visit on mount
  useEffect(() => {
    recordVisit()
    setWeeklyData(getWeeklyActivity())
  }, [])

  // AI telemetry analysis
  useEffect(() => {
    if (!isCameraEnabled) return
    let lastData = { bpm: 0, cognitive: 0 }
    const analyzeTelemetry = async () => {
      if (Math.abs(bpm - lastData.bpm) < 3 && Math.abs(cognitive - lastData.cognitive) < 3) return
      lastData = { bpm, cognitive }
      setIsAnalyzing(true)
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/chat/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bpm, attentionLevel: cognitive, recentErrors: 0 })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.emotion) setEmotion(data.emotion, 95.5)
          if (data.cognitiveLoad) setCognitive(parseInt(data.cognitiveLoad))
          if (data.reason) setAiRecommendation(data.reason)
        }
      } catch (err) {
        console.error('Failed to analyze telemetry', err)
      } finally { setIsAnalyzing(false) }
    }
    const timeout = setTimeout(analyzeTelemetry, 2000)
    const interval = setInterval(analyzeTelemetry, 15000)
    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [bpm, cognitive, setEmotion, setCognitive, isCameraEnabled])

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto">

      {/* ═══ GREETING ═══ */}
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary">
          {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-plum to-rose">{userName || 'Студент'}</span>!
        </h1>
        <p className="text-text-muted mt-1 text-sm">Бүгін де білім алуды жалғастырыңыз</p>
      </motion.div>

      {/* ═══ QUICK STATS ROW ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Сөздік', value: `${bookmarkCount}/${totalWords}`, icon: BookOpen, color: 'text-plum', bg: 'bg-plum/10' },
          { label: 'Серия', value: `${streak} күн 🔥`, icon: TrendingUp, color: 'text-rose', bg: 'bg-rose/10' },
          { label: 'BPM', value: bpm > 0 ? `${bpm}` : '—', icon: Heart, color: 'text-danger', bg: 'bg-danger/10' },
          { label: 'Зейін', value: `${cognitive}%`, icon: Brain, color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 * i }}
            className="card flex items-center gap-3 py-4"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">{stat.label}</p>
              <p className="text-lg font-black text-text-primary">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ MAIN GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Quick Actions */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">ЖЫЛДАМ ӘРЕКЕТТЕР</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/sign-language')}
                className="card hover:shadow-lg transition-all group flex items-center gap-4 py-5 border-2 border-transparent hover:border-plum/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-plum to-rose flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Hand size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-text-primary text-sm">Ымдау тілі</p>
                  <p className="text-xs text-text-muted">Камерамен жаттығу</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/dictionary')}
                className="card hover:shadow-lg transition-all group flex items-center gap-4 py-5 border-2 border-transparent hover:border-rose/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose to-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Languages size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-text-primary text-sm">Сөздік</p>
                  <p className="text-xs text-text-muted">{totalWords} сөз, {bookmarkCount} сақталған</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/ai-tutor')}
                className="card hover:shadow-lg transition-all group flex items-center gap-4 py-5 border-2 border-transparent hover:border-amber-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Gamepad2 size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-text-primary text-sm">AI Репетитор</p>
                  <p className="text-xs text-text-muted">Эмоция-сезгіш AI мұғалім</p>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Dictionary Progress */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            className="card bg-gradient-to-br from-plum/5 to-rose/5 border-none"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bookmark size={16} className="text-plum" />
                <span className="text-xs font-bold text-text-muted uppercase">Сөздік прогресс</span>
              </div>
              <span className="text-sm font-black text-plum">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-plum-pale rounded-full">
              <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-3 text-xs text-text-muted">
              <span>{bookmarkCount} сөз сақталған</span>
              <span>{totalWords - bookmarkCount} сөз қалды</span>
            </div>
            {/* Category breakdown */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
              {['basic', 'family', 'school', 'numbers', 'colors', 'emotions', 'food'].map(cat => {
                const catWords = DICTIONARY_DATA.filter(w => w.category === cat)
                const catName = cat === 'basic' ? 'Негізгі' : cat === 'family' ? 'Отбасы' : cat === 'school' ? 'Мектеп' : cat === 'numbers' ? 'Сандар' : cat === 'colors' ? 'Түстер' : cat === 'emotions' ? 'Сезімдер' : 'Тағам'
                return (
                  <div key={cat} className="bg-white rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-text-primary">{catWords.length}</p>
                    <p className="text-[10px] text-text-muted uppercase">{catName}</p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* AI Recommendation */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-xl p-5 bg-gradient-to-br from-plum to-rose text-white relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-soft-pink" />
              <span className="text-sm font-bold">AI КЕҢЕСІ</span>
              {isAnalyzing && <div className="ml-auto w-3 h-3 rounded-full bg-white animate-pulse" />}
            </div>
            <p className="text-sm opacity-90 leading-relaxed min-h-[40px]">{aiRecommendation}</p>
            {!isCameraEnabled && (
              <p className="text-xs opacity-60 mt-2">💡 AI толық жұмыс істеу үшін камераны қосыңыз</p>
            )}
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Profile Card */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="card flex flex-col items-center py-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-plum-pale to-soft-pink flex items-center justify-center pulse-ring border-2 border-rose">
                <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center">
                  <User size={32} className="text-text-muted" />
                </div>
              </div>
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${isCameraEnabled ? 'bg-success' : 'bg-text-muted'}`} />
            </div>
            <h3 className="mt-3 text-base font-bold text-text-primary">{userName || 'Студент'}</h3>
            <p className="text-xs text-rose font-medium">Студент</p>
            <div className="flex gap-4 mt-4 text-center">
              <div>
                <p className="text-lg font-black text-plum">{streak}</p>
                <p className="text-[10px] text-text-muted uppercase">Серия</p>
              </div>
              <div className="w-px bg-border-soft" />
              <div>
                <p className="text-lg font-black text-rose">{bookmarkCount}</p>
                <p className="text-[10px] text-text-muted uppercase">Сақталған</p>
              </div>
              <div className="w-px bg-border-soft" />
              <div>
                <p className="text-lg font-black text-amber-600">{progress}%</p>
                <p className="text-[10px] text-text-muted uppercase">Прогресс</p>
              </div>
            </div>
          </motion.div>

          {/* Biometrics Panel */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            className="card"
          >
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">БИОМЕТРИКА</p>
            {/* Emotion */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Эмоция</span>
              <span className="text-sm font-bold text-text-primary capitalize">{emotion}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Сенімділік</span>
              <span className="text-sm font-bold text-rose">{confidence}%</span>
            </div>
            <div className="w-full h-1.5 bg-plum-pale rounded-full mb-4">
              <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full transition-all" style={{ width: `${confidence}%` }} />
            </div>
            {/* Heart Rate */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Жүрек соғуы</span>
              {bpm > 0 ? (
                <span className="text-sm font-bold text-text-primary">{bpm} <span className="text-rose text-xs">BPM</span></span>
              ) : (
                <span className="text-xs font-bold text-rose animate-pulse">Өлшенуде...</span>
              )}
            </div>
            <svg className="w-full h-10 mt-1" viewBox="0 0 200 40">
              <polyline fill="none" stroke="#E8507A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="0,20 15,20 25,20 30,5 35,35 40,20 55,20 65,20 70,5 75,35 80,20 95,20 105,20 110,5 115,35 120,20 135,20 145,20 150,5 155,35 160,20 175,20 185,20 190,5 195,35 200,20"
                className="ecg-line"
              />
            </svg>
            {/* Cognitive Load */}
            <div className="flex items-center justify-between mt-4 mb-1">
              <span className="text-sm text-text-secondary">Когнитивтік жүктеме</span>
              <span className="text-sm font-bold text-text-primary">{cognitive}%</span>
            </div>
            <div className="w-full h-1.5 bg-plum-pale rounded-full">
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all" style={{ width: `${cognitive}%` }} />
            </div>
          </motion.div>

          {/* Weekly Activity */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="card"
          >
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">АПТАЛЫҚ БЕЛСЕНДІЛІК</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9C8A98' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #EDD8E8', borderRadius: 10, fontSize: 12 }}
                  formatter={(value: any) => [`${value} кіру`, 'Белсенділік']}
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
            {weeklyData.every(d => d.value === 0) && (
              <p className="text-xs text-text-muted text-center mt-2">Бұл аптада белсенділік жоқ. Оқуды бастаңыз!</p>
            )}
          </motion.div>

          {/* Join Class */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            className="card border-plum/20 bg-plum-pale/20"
          >
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">СЫНЫПҚА ҚОСЫЛУ</p>
            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                const input = e.currentTarget.elements.namedItem('invite_code') as HTMLInputElement
                const code = input.value
                if (!code) return
                try {
                  const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/classes/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ student_id: userId, invite_code: code })
                  })
                  if (res.ok) { showToast('Сыныпқа сәтті қосылдыңыз!', 'success'); input.value = '' }
                  else { const err = await res.json(); showToast(err.error || 'Қате пайда болды', 'error') }
                } catch { showToast('Серверге қосылу қатесі', 'error') }
              }}
              className="flex gap-2"
            >
              <input name="invite_code" type="text" placeholder="Кодты енгізіңіз" className="flex-1 px-3 py-2 rounded-lg border border-border-soft text-sm uppercase focus:outline-none focus:border-plum" />
              <button type="submit" className="bg-plum text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-plum/90 transition-colors">Кіру</button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Toast */}
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
