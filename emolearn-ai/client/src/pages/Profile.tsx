import { motion } from 'framer-motion'
import { Shield, Globe, Bell, CheckCircle, Lock, Mic, Camera, ChevronRight, Award, Zap, BookOpen, User, Calendar, Trophy, BarChart2, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useState } from 'react'

const bioHistory = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  attention: 30 + Math.sin(i * 0.5) * 20 + Math.random() * 15,
  pulse: 55 + Math.cos(i * 0.3) * 15 + Math.random() * 10,
}))

const streakDays = [
  { day: 'ДС', done: true }, { day: 'СС', done: true },
  { day: 'СР', done: true }, { day: 'БС', done: true },
  { day: 'ЖМ', done: false, current: true },
  { day: 'СН', done: false }, { day: 'ЖС', done: false },
]

const achievements = [
  { icon: Award, label: 'SIGN MASTER', locked: false },
  { icon: Zap, label: 'FOCUS KING', locked: false },
  { icon: BookOpen, label: 'RAPID LEARNER', locked: false },
  { icon: Award, label: '?', locked: true },
  { icon: Zap, label: '?', locked: true },
  { icon: BookOpen, label: '?', locked: true },
]

export default function Profile() {
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(true)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-[300px_1fr] gap-6">
        {/* Left Panel — Settings */}
        <div className="flex flex-col gap-5">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="card"
          >
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">БАПТАУЛАР</p>
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 p-3 rounded-xl bg-rose-pale text-rose font-bold text-sm hover:bg-soft-pink transition-colors">
                <Shield size={18} />
                Құпиялылық
                <ChevronRight size={16} className="ml-auto" />
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
                <button
                  onClick={() => setNotifEnabled(!notifEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifEnabled ? 'bg-plum' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Biometric Permissions */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">БИОМЕТРИЯЛЫҚ РҰҚСАТ</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-text-primary flex items-center gap-2"><Camera size={16} /> Камера (Қимылдар)</p>
                  <p className={`text-xs font-bold ${cameraEnabled ? 'text-success' : 'text-danger'}`}>{cameraEnabled ? 'БЕЛСЕНДІ' : 'ӨШІРУЛІ'}</p>
                </div>
                <button
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${cameraEnabled ? 'bg-plum' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cameraEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-text-primary flex items-center gap-2"><Mic size={16} /> Микрофон (Дыбыс)</p>
                  <p className={`text-xs font-bold ${micEnabled ? 'text-success' : 'text-danger'}`}>{micEnabled ? 'БЕЛСЕНДІ' : 'ӨШІРУЛІ'}</p>
                </div>
                <button
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${micEnabled ? 'bg-plum' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${micEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Skill Level */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card border-l-4 border-rose"
          >
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2"><Target size={16} className="inline text-rose mr-1" /> ДАҒДЫ ДЕҢГЕЙІ</p>
            <div className="flex items-center justify-between">
              <span className="bg-rose text-white text-xs font-bold px-3 py-1 rounded-full">SIGN MASTER</span>
              <span className="text-rose font-bold text-sm">#128 / 500</span>
            </div>
          </motion.div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-5">
          {/* Student Card */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card flex items-center gap-6"
          >
            <div className="w-28 h-28 rounded-2xl bg-bg-secondary flex items-center justify-center shrink-0">
              <User size={56} className="text-text-muted" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-text-primary">АСРОР Р.</h1>
                  <div className="flex gap-8 mt-2">
                    <div>
                      <p className="text-xs text-rose font-bold">ЖАЛПЫ УАҚЫТ</p>
                      <p className="text-2xl font-extrabold text-text-primary">42 <span className="text-sm text-text-muted font-medium">сағат</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-bold">АЯҚТАЛҒАН САБАҚ</p>
                      <p className="text-2xl font-extrabold text-text-primary">128</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted font-mono">MISSION CONTROL</p>
                  <p className="text-xs text-text-muted font-mono">ID: 4290485-TX</p>
                  <div className="mt-2">
                    <p className="text-xs text-text-muted">Progress Target: 85%</p>
                    <div className="w-40 h-2 bg-plum-pale rounded-full mt-1">
                      <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Streak + Achievements Row */}
          <div className="grid grid-cols-2 gap-5">
            {/* Weekly Streak */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest"><Calendar size={14} className="inline text-plum mr-1" /> АПТАЛЫҚ БЕЛСЕНДІЛІК</p>
                <span className="bg-rose text-white text-xs font-bold px-2 py-0.5 rounded-full">7 Day Streak</span>
              </div>
              <div className="flex justify-between">
                {streakDays.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      d.done ? 'bg-plum-pale' : d.current ? 'bg-rose text-white' : 'bg-bg-secondary'
                    }`}>
                      {d.done ? <CheckCircle size={20} className="text-plum" /> :
                       d.current ? <Zap size={20} /> :
                       <Lock size={16} className="text-text-muted" />}
                    </div>
                    <span className={`text-xs font-bold ${d.current ? 'text-rose' : 'text-text-muted'}`}>{d.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4"><Trophy size={14} className="inline text-rose mr-1" /> ЖЕТІСТІКТЕР</p>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((a, i) => (
                  <div key={i} className={`flex flex-col items-center p-3 rounded-xl ${a.locked ? 'opacity-40' : 'bg-rose-pale'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${a.locked ? 'bg-bg-secondary' : 'bg-white'}`}>
                      {a.locked ? <Lock size={16} className="text-text-muted" /> : <a.icon size={18} className="text-plum" />}
                    </div>
                    <span className="text-[10px] font-bold text-text-primary text-center">{a.label}</span>
                    {a.locked && <span className="text-[10px] text-text-muted">?</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 30-day Biometric History */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-text-primary flex items-center gap-2"><BarChart2 size={18} className="text-rose" /> БИОМЕТРИЯЛЫҚ ТАРИХ (30 КҮН)</h3>
                <p className="text-xs text-text-muted font-mono mt-1">Attention Score (%) vs Pulse (BPM)</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose" /> НАЗАР</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-soft-pink" /> ЖҮРЕК СОҒУЫ</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
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

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted py-2 border-t border-border-soft">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose" /> SYSTEM NOMINAL</span>
          <span>LATENCY: 24ms</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono">SESSION: 02:44:12</span>
          <span className="font-mono">NODE: KZ-ALA-04</span>
        </div>
      </div>
    </div>
  )
}
