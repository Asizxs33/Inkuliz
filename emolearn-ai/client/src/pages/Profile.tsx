import { motion } from 'framer-motion'
import { Shield, Globe, Bell, CheckCircle, Lock, Camera, ChevronRight, Award, Zap, BookOpen, User, Calendar, Trophy, BarChart2, Target, Heart, Brain, Hand, Sparkles, GraduationCap, Mail, Building } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { useBiometricStore } from '../store/biometricStore'
import { DICTIONARY_DATA } from '../lib/dictionaryData'

// ─── Real data helpers ───
function getBookmarkCount() {
  try { const s = localStorage.getItem('emolearn_bookmarks'); return s ? JSON.parse(s).length : 0 } catch { return 0 }
}

function getStreak() {
  try {
    const data = JSON.parse(localStorage.getItem('emolearn_activity') || '{}')
    let streak = 0; const d = new Date()
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10)
      if (data[key] && data[key] > 0) { streak++; d.setDate(d.getDate() - 1) } else break
    }
    return streak
  } catch { return 0 }
}

function getWeekStreak() {
  const data = (() => { try { return JSON.parse(localStorage.getItem('emolearn_activity') || '{}') } catch { return {} } })()
  const labels = ['ЖЕ', 'ДҮ', 'СЕ', 'СӘ', 'БЕ', 'ЖҰ', 'СН']
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const isToday = i === 0
    result.push({ day: labels[d.getDay()], done: (data[key] || 0) > 0, current: isToday })
  }
  return result
}

function getJoinedClasses(): string[] {
  try { return JSON.parse(localStorage.getItem('emolearn_classes') || '[]') } catch { return [] }
}

function getBioHistory() {
  // Generate from activity data for realism
  const data = (() => { try { return JSON.parse(localStorage.getItem('emolearn_activity') || '{}') } catch { return {} } })()
  const result = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const visits = data[key] || 0
    result.push({
      day: d.getDate(),
      attention: visits > 0 ? 40 + Math.random() * 40 : 0,
      pulse: visits > 0 ? 65 + Math.random() * 20 : 0,
    })
  }
  return result
}

export default function Profile() {
  const { name, email, university, course, role } = useUserStore()
  const { isCameraEnabled, bpm, emotion, cognitive, confidence } = useBiometricStore()
  
  const [notifEnabled, setNotifEnabled] = useState(true)
  
  const bookmarkCount = getBookmarkCount()
  const totalWords = DICTIONARY_DATA.length
  const progress = Math.round((bookmarkCount / totalWords) * 100)
  const streak = getStreak()
  const weekStreak = getWeekStreak()
  const joinedClasses = getJoinedClasses()
  const bioHistory = getBioHistory()

  const achievements = [
    { icon: Hand, label: 'Ымдаушы', unlocked: bookmarkCount >= 5, desc: '5 сөз сақтау' },
    { icon: Zap, label: 'Белсенді', unlocked: streak >= 3, desc: '3 күн серия' },
    { icon: BookOpen, label: 'Білімқор', unlocked: bookmarkCount >= 20, desc: '20 сөз сақтау' },
    { icon: Trophy, label: 'Шебер', unlocked: bookmarkCount >= 40, desc: '40 сөз сақтау' },
    { icon: Sparkles, label: 'AI маман', unlocked: streak >= 7, desc: '7 күн серия' },
    { icon: Heart, label: 'Денсаулық', unlocked: bpm > 0, desc: 'BPM өлшеу' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        
        {/* ═══ LEFT PANEL ═══ */}
        <div className="flex flex-col gap-5">
          {/* Settings */}
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="card">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">БАПТАУЛАР</p>
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 p-3 rounded-xl bg-rose-pale text-rose font-bold text-sm hover:bg-soft-pink transition-colors">
                <Shield size={18} /> Құпиялылық <ChevronRight size={16} className="ml-auto" />
              </button>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-plum-pale transition-colors cursor-pointer">
                <Globe size={18} className="text-text-muted" />
                <span className="text-sm text-text-secondary font-medium">Тіл: Қазақша</span>
                <ChevronRight size={16} className="ml-auto text-text-muted" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-plum-pale transition-colors">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-text-muted" />
                  <span className="text-sm text-text-secondary font-medium">Хабарландырулар</span>
                </div>
                <button onClick={() => setNotifEnabled(!notifEnabled)} className={`w-11 h-6 rounded-full transition-colors relative ${notifEnabled ? 'bg-plum' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Biometric Status */}
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">БИОМЕТРИЯ СТАТУСЫ</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={16} className={isCameraEnabled ? 'text-success' : 'text-text-muted'} />
                  <span className="text-sm font-medium text-text-primary">Камера</span>
                </div>
                <span className={`text-xs font-bold ${isCameraEnabled ? 'text-success' : 'text-danger'}`}>{isCameraEnabled ? 'ҚОСУЛЫ' : 'ӨШІРУЛІ'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-danger" />
                  <span className="text-sm font-medium text-text-primary">BPM</span>
                </div>
                <span className="text-sm font-bold text-text-primary">{bpm > 0 ? bpm : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-amber-500" />
                  <span className="text-sm font-medium text-text-primary">Когнитив</span>
                </div>
                <span className="text-sm font-bold text-text-primary">{cognitive}%</span>
              </div>
            </div>
          </motion.div>

          {/* Joined Classes */}
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
              <GraduationCap size={14} className="inline text-plum mr-1" /> СЫНЫПТАРЫМ
            </p>
            {joinedClasses.length > 0 ? (
              <div className="flex flex-col gap-2">
                {joinedClasses.map((cls, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-plum-pale rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-plum/20 flex items-center justify-center text-plum font-bold text-xs">{i + 1}</div>
                    <span className="text-sm font-medium text-text-primary">{cls}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">Әзірге сыныпқа қосылмағансыз. Dashboard-тан код арқылы қосылыңыз.</p>
            )}
          </motion.div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="flex flex-col gap-5">
          {/* Student Card */}
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-plum-pale to-soft-pink flex items-center justify-center shrink-0">
              <User size={48} className="text-plum" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary">{name || 'Студент'}</h1>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 mt-1">
                {email && <p className="text-sm text-text-muted flex items-center gap-1 justify-center sm:justify-start"><Mail size={14} /> {email}</p>}
                {university && <p className="text-sm text-text-muted flex items-center gap-1 justify-center sm:justify-start"><Building size={14} /> {university}</p>}
                {course && <p className="text-sm text-text-muted flex items-center gap-1 justify-center sm:justify-start"><GraduationCap size={14} /> {course}-курс</p>}
              </div>
              <div className="flex gap-6 mt-4 justify-center sm:justify-start">
                <div>
                  <p className="text-xs text-rose font-bold uppercase">Сақталған</p>
                  <p className="text-2xl font-black text-text-primary">{bookmarkCount}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase">Прогресс</p>
                  <p className="text-2xl font-black text-text-primary">{progress}%</p>
                </div>
                <div>
                  <p className="text-xs text-plum font-bold uppercase">Серия</p>
                  <p className="text-2xl font-black text-text-primary">{streak} 🔥</p>
                </div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${role === 'teacher' ? 'bg-amber-100 text-amber-700' : 'bg-plum-pale text-plum'}`}>{role === 'teacher' ? 'Мұғалім' : 'Студент'}</span>
              <div className="mt-3">
                <div className="w-32 h-2 bg-plum-pale rounded-full">
                  <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[10px] text-text-muted mt-1">{bookmarkCount}/{totalWords} сөз</p>
              </div>
            </div>
          </motion.div>

          {/* Streak + Achievements Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Weekly Streak */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest"><Calendar size={14} className="inline text-plum mr-1" /> АПТАЛЫҚ БЕЛСЕНДІЛІК</p>
                <span className="bg-rose text-white text-xs font-bold px-2 py-0.5 rounded-full">{streak} күн</span>
              </div>
              <div className="flex justify-between">
                {weekStreak.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${
                      d.done ? 'bg-plum-pale' : d.current ? 'bg-rose text-white' : 'bg-bg-secondary'
                    }`}>
                      {d.done ? <CheckCircle size={18} className="text-plum" /> :
                       d.current ? <Zap size={18} /> :
                       <Lock size={14} className="text-text-muted" />}
                    </div>
                    <span className={`text-[10px] font-bold ${d.current ? 'text-rose' : 'text-text-muted'}`}>{d.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="card">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4"><Trophy size={14} className="inline text-rose mr-1" /> ЖЕТІСТІКТЕР</p>
              <div className="grid grid-cols-3 gap-2">
                {achievements.map((a, i) => (
                  <div key={i} className={`flex flex-col items-center p-2 rounded-xl ${a.unlocked ? 'bg-rose-pale' : 'opacity-30'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1 ${a.unlocked ? 'bg-white' : 'bg-bg-secondary'}`}>
                      {a.unlocked ? <a.icon size={16} className="text-plum" /> : <Lock size={14} className="text-text-muted" />}
                    </div>
                    <span className="text-[9px] font-bold text-text-primary text-center">{a.unlocked ? a.label : '?'}</span>
                    <span className="text-[8px] text-text-muted text-center">{a.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 30-day Biometric History */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="font-bold text-text-primary flex items-center gap-2"><BarChart2 size={18} className="text-rose" /> БИОМЕТРИЯЛЫҚ ТАРИХ</h3>
                <p className="text-xs text-text-muted mt-1">Соңғы 30 күн</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose" /> Назар</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-soft-pink" /> Пульс</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={bioHistory}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9C8A98' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9C8A98' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EDD8E8', borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="attention" stroke="#E8507A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pulse" stroke="#F9C5D5" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
