import { motion } from 'framer-motion'
import { Send, FileText, AlertTriangle, Heart, User, SendHorizonal, Activity, Plus, Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'
import { getSocket } from '../lib/socket'

const statusColors: Record<string, { border: string; text: string; bg: string }> = {
  focused: { border: 'border-plum', text: 'text-plum', bg: 'bg-plum-pale' },
  stressed: { border: 'border-danger', text: 'text-danger', bg: 'bg-red-50' },
  calm: { border: 'border-success', text: 'text-text-muted', bg: 'bg-green-50' },
  bored: { border: 'border-warning', text: 'text-warning', bg: 'bg-yellow-50' },
}

const emotionTimeline = [
  { label: 'Зейінді', time: '22 мин', color: '#10B981' },
  { label: 'Бейтарап', time: '12 мин', color: '#9C8A98' },
  { label: 'Мазасыз', time: '4 мин', color: '#E8507A' },
]

export default function Teacher() {
  const { name } = useUserStore()
  const teacherId = useUserStore(s => s.id)
  
  const [classes, setClasses] = useState<any[]>([])
  const [activeClass, setActiveClass] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  
  const [newClassName, setNewClassName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [difficulty, setDifficulty] = useState(6.5)

  // Fetch classes on mount
  useEffect(() => {
    if (!teacherId) return
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/${teacherId}`)
        const data = await res.json()
        if (data.classes?.length > 0) {
          setClasses(data.classes)
          setActiveClass(data.classes[0])
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err)
      }
    }
    fetchClasses()
  }, [teacherId])

  // Fetch students when active class changes
  useEffect(() => {
    if (!activeClass) return
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/${activeClass.id}/students`)
        const data = await res.json()
        const mapped = data.students.map((s: any) => ({
          ...s,
          emotion: 'ЗЕЙІНДІ',
          bpm: 76,
          status: 'focused'
        }))
        setStudents(mapped)
        if (mapped.length > 0) setSelectedStudent(mapped[0])
      } catch (err) {
        console.error('Failed to fetch students:', err)
      }
    }
    fetchStudents()
  }, [activeClass])

  // Listen to live biometric updates
  useEffect(() => {
    if (!activeClass) return
    const socket = getSocket()
    
    // Join a specific class room
    socket.emit('teacher:join', activeClass.id)

    const handleUpdate = (data: any) => {
      setStudents(prev => prev.map(s => {
        if (s.id === data.userId) {
          const status = data.bpm > 90 || data.emotion === 'ҚОРЫҚҚАН' || data.emotion === 'АШУЛЫ' 
            ? 'stressed' 
            : (data.emotion === 'ШОҒЫРЛАНҒАН' || data.emotion === 'ЗЕЙІНДІ' ? 'focused' : 'calm')
          
          if (selectedStudent?.id === data.userId) {
            setSelectedStudent({ ...s, bpm: data.bpm, emotion: data.emotionKz || data.emotion, status })
          }
          return { ...s, bpm: data.bpm, emotion: data.emotionKz || data.emotion, status }
        }
        return s
      }))
    }

    socket.on('student:biometric', handleUpdate)
    return () => {
      socket.off('student:biometric', handleUpdate)
    }
  }, [activeClass, selectedStudent?.id])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim() || isCreating) return
    setIsCreating(true)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/classes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, name: newClassName })
      })
      const data = await res.json()
      if (res.ok) {
        setClasses([...classes, data.class])
        setActiveClass(data.class)
        setNewClassName('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const copyInvite = () => {
    if (activeClass?.invite_code) {
      navigator.clipboard.writeText(activeClass.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return
    setIsSending(true)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `📣 Мұғалімнің хабарламасы (${activeClass?.name || ''}):\n\n${message}` })
      })
      if (res.ok) setMessage('')
    } catch (err) {
      console.error('Failed to send telegram message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const overallStress = students.length > 0 
    ? Math.round((students.filter(s => s.status === 'stressed').length / students.length) * 100) 
    : 0

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-plum-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-plum" />
          </div>
          <h2 className="text-2xl font-extrabold text-text-primary mb-2">Сынып жоқ</h2>
          <p className="text-sm text-text-muted mb-6">Оқушыларды бақылау үшін алдымен жаңа сынып жасаңыз.</p>
          
          <form onSubmit={handleCreateClass} className="flex flex-col gap-4">
            <input 
              type="text"
              required
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              placeholder="Сынып атауы (мысалы, 10-А)"
              className="px-4 py-3 rounded-xl border border-border-soft focus:outline-none focus:border-plum"
            />
            <button 
              type="submit" 
              disabled={isCreating}
              className="btn-primary py-3 font-bold flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {isCreating ? 'Құрылуда...' : 'Сыныпты құру'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-extrabold text-text-primary">{activeClass?.name}</h1>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-border-soft">
            <span className="text-sm font-bold text-text-muted">Код:</span>
            <span className="text-sm font-extrabold text-plum tracking-wider">{activeClass?.invite_code}</span>
            <button onClick={copyInvite} className="mt-0.5 text-text-muted hover:text-plum transition-colors">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="px-4 py-2 rounded-xl border border-border-soft bg-white text-sm font-bold focus:outline-none focus:border-plum"
            value={activeClass?.id || ''}
            onChange={(e) => setActiveClass(classes.find(c => c.id === e.target.value))}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <span className="text-rose font-bold text-sm bg-rose-pale px-4 py-2 rounded-full">LIVE MODE</span>
          <div className="flex items-center gap-2 bg-plum-pale px-4 py-2 rounded-full">
            <div className={`w-2 h-2 rounded-full ${overallStress > 30 ? 'bg-rose' : 'bg-success'}`} />
            <span className={`text-sm font-bold ${overallStress > 30 ? 'text-rose' : 'text-plum'}`}>
              СЫНЫП: {overallStress > 30 ? 'НАЗАР АУДАРУ ҚАЖЕТ' : 'ҚАЛЫПТЫ'}
            </span>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <p className="text-sm font-bold text-text-primary">{name}</p>
              <p className="text-xs text-text-muted">Мұғалім</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6">
        {/* Student Grid */}
        <div>
          {students.length === 0 ? (
            <div className="card p-12 text-center h-full flex flex-col items-center justify-center border-dashed border-2">
              <p className="text-text-muted font-medium mb-2">Бұл сыныпта әлі оқушылар жоқ</p>
              <p className="text-sm text-text-muted mt-2">
                Студенттерге кодты беріңіз: <strong className="text-plum">{activeClass?.invite_code}</strong>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              {students.map((student, i) => {
                const colors = statusColors[student.status] || statusColors.focused
                const isSelected = selectedStudent?.id === student.id
                return (
                  <motion.div
                    key={student.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setSelectedStudent(student)}
                    className={`card cursor-pointer text-center transition-all ${colors.border} border-2 ${
                      isSelected ? 'ring-2 ring-plum shadow-lg' : ''
                    } ${student.status === 'stressed' ? 'animate-pulse' : ''}`}
                  >
                    <h4 className="font-bold text-text-primary text-sm truncate px-1" title={student.name}>{student.name}</h4>
                    <span className={`text-xs font-bold ${colors.text} flex items-center justify-center gap-1 mt-1 truncate`}>
                      {student.status === 'stressed' && <Heart size={12} className="text-danger" />}
                      {student.status === 'focused' && <span className="text-success">●</span>}
                      {student.emotion}
                    </span>
                    <p className={`text-3xl font-extrabold mt-2 ${student.status === 'stressed' ? 'text-danger' : 'text-text-primary'}`}>
                      {student.bpm}
                    </p>
                    <p className={`text-xs ${student.status === 'stressed' ? 'text-danger font-bold' : 'text-text-muted'}`}>BPM
                      {student.status === 'stressed' && <Activity size={12} className="inline ml-1" />}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Bottom Controls */}
          {students.length > 0 && (
            <div className="flex items-center gap-4 mt-6">
              <div className="card flex items-center gap-3 py-3 px-4 w-fit">
                <span className="text-rose font-bold text-sm">ЖАЛПЫ СТРЕСС</span>
                <span className="text-rose font-extrabold">{overallStress}%</span>
                <div className="w-20 h-2 bg-plum-pale rounded-full">
                  <div className="h-full bg-rose rounded-full" style={{ width: `${overallStress}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="flex flex-col gap-4">
          {/* Selected Student */}
          {selectedStudent ? (
            <>
              <motion.div
                key={selectedStudent.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="card text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-plum-pale to-soft-pink flex items-center justify-center mx-auto mb-3">
                  <User size={36} className="text-plum" />
                </div>
                <h3 className="text-xl font-extrabold text-text-primary truncate px-2">{selectedStudent.name}</h3>
                <p className="text-sm text-text-muted">{activeClass?.name} • СТУДЕНТ</p>
              </motion.div>

              {/* Heart Rate Chart */}
              <div className="card">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  ЖҮРЕК СОҒУ ЖИІЛІГІ <Heart size={14} className="text-rose" />
                </p>
                <svg className="w-full h-20" viewBox="0 0 280 60">
                  <defs>
                    <linearGradient id="teacherHr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#E8507A" />
                      <stop offset="100%" stopColor="#6B2D5E" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#teacherHr)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points="0,40 20,35 40,30 50,15 55,50 60,25 80,30 100,28 110,10 115,55 120,30 140,25 160,20 170,8 175,48 180,22 200,28 220,30 230,15 235,50 240,25 260,30 280,35"
                  />
                </svg>
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>09:00</span>
                  <span>Қазір</span>
                </div>
                <div className="flex gap-6 mt-3">
                  <div>
                    <p className="text-xs text-text-muted">АҒЫМДАҒЫ</p>
                    <p className={`text-xl font-extrabold ${selectedStudent.status === 'stressed' ? 'text-rose' : 'text-text-primary'}`}>
                      {selectedStudent.bpm}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button className="btn-primary py-3 font-bold flex items-center justify-center gap-2">
                <AlertTriangle size={16} />
                Студентке ескерту жіберу
              </button>
              <button className="py-3 border border-border-soft rounded-xl text-text-secondary font-bold text-sm hover:border-plum hover:text-plum transition-colors flex items-center justify-center gap-2">
                <FileText size={16} />
                Толық есеп
              </button>
            </>
          ) : (
             <div className="card text-center py-12 text-text-muted h-full flex items-center justify-center">
               Оқушыны таңдаңыз
             </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border-soft mt-auto">
        <span className="text-rose text-xl"><SendHorizonal size={20} className="text-rose" /></span>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Сыныпқа хабарлама жіберу (Telegram)..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 text-sm"
        />
        <button 
          onClick={handleSendMessage}
          disabled={isSending || !message.trim()}
          className="btn-primary px-6 py-2.5 font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {isSending ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
          Жіберу
        </button>
        <div className="flex items-center gap-3 ml-4 border-l border-border-soft pl-4">
          <div>
            <p className="text-xs text-text-muted">САБАҚТЫҢ КҮРДЕЛІЛІГІ</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-plum">{difficulty.toFixed(1)}</span>
              <span className="text-xs text-text-muted">/ 10</span>
            </div>
          </div>
          <input
            type="range"
            min="1" max="10" step="0.5"
            value={difficulty}
            onChange={(e) => setDifficulty(parseFloat(e.target.value))}
            className="w-20 accent-plum"
          />
        </div>
      </div>
    </div>
  )
}
