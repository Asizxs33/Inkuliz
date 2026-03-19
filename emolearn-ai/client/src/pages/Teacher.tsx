import { motion, AnimatePresence } from 'framer-motion'
import { Send, FileText, AlertTriangle, Heart, User, SendHorizonal, Activity, Plus, Copy, Check, X, TrendingUp, Brain, UserMinus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'
import { getSocket, sendNotification } from '../lib/socket'

const statusColors: Record<string, { border: string; text: string; bg: string }> = {
  focused: { border: 'border-plum', text: 'text-plum', bg: 'bg-plum-pale' },
  stressed: { border: 'border-danger', text: 'text-danger', bg: 'bg-red-50' },
  calm: { border: 'border-success', text: 'text-text-muted', bg: 'bg-green-50' },
  bored: { border: 'border-warning', text: 'text-warning', bg: 'bg-yellow-50' },
}

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

  // Live BPM history for selected student
  const [bpmHistory, setBpmHistory] = useState<{time: string, bpm: number}[]>([])
  
  // Report modal
  const [showReport, setShowReport] = useState(false)

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearchStudent = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return
    setIsSearching(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/search-student?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.students || [])
    } finally { setIsSearching(false) }
  }

  const handleInviteStudent = async (student: any) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          student_id: student.id,
          class_id: activeClass.id,
          class_name: activeClass.name,
          teacher_name: name
        })
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        // Send real-time socket notification to the student
        sendNotification(
          student.id,
          'info',
          `Мұғалім ${name} сізді "${activeClass.name}" сыныбына шақырды. Баптаулардан қабылдаңыз!`,
          'EmoLearn AI Систем'
        )
        alert('Шақыру жіберілді!')
        setShowInviteModal(false)
        setSearchQuery('')
        setSearchResults([])
      }
    } catch {
      alert('Қате кетті')
    }
  }

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
          emotion: '—',
          bpm: 0,
          status: 'calm',
          online: false,
          emotionHistory: [] as string[],
          bpmHistory: [] as number[]
        }))
        setStudents(mapped)
        if (mapped.length > 0) setSelectedStudent(mapped[0])
      } catch (err) {
        console.error('Failed to fetch students:', err)
      }
    }
    fetchStudents()
  }, [activeClass])

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Студентті сыныптан шығаруға сенімдісіз бе?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/${activeClass.id}/students/${studentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        if (selectedStudent?.id === studentId) setSelectedStudent(null);
      }
    } catch {
      alert('Қате кетті');
    }
  }

  // Listen to live biometric updates
  useEffect(() => {
    if (!activeClass) return
    const socket = getSocket()
    
    socket.emit('teacher:join', activeClass.id)

    const handleUpdate = (data: any) => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`

      setStudents(prev => prev.map(s => {
        if (s.id === data.userId) {
          const status = data.bpm > 90 || data.emotion === 'ҚОРЫҚҚАН' || data.emotion === 'АШУЛЫ' 
            ? 'stressed' 
            : (data.emotion === 'ШОҒЫРЛАНҒАН' || data.emotion === 'ЗЕЙІНДІ' ? 'focused' : 'calm')
          
          const updated = { 
            ...s, 
            bpm: data.bpm, 
            emotion: data.emotionKz || data.emotion, 
            status,
            online: true,
            emotionHistory: [...(s.emotionHistory || []), data.emotionKz || data.emotion].slice(-20),
            bpmHistory: [...(s.bpmHistory || []), data.bpm].slice(-20)
          }

          if (selectedStudent?.id === data.userId) {
            setSelectedStudent(updated)
            setBpmHistory(prev => [...prev, { time: timeStr, bpm: data.bpm }].slice(-30))
          }
          return updated
        }
        return s
      }))
    }

    socket.on('student:biometric', handleUpdate)
    return () => {
      socket.off('student:biometric', handleUpdate)
    }
  }, [activeClass, selectedStudent?.id])

  // Reset BPM history when selecting a new student
  useEffect(() => {
    if (selectedStudent) {
      setBpmHistory(
        (selectedStudent.bpmHistory || []).map((bpm: number, i: number) => ({
          time: `${i}`,
          bpm
        }))
      )
    }
  }, [selectedStudent?.id])

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
  
  const onlineCount = students.filter(s => s.online).length
  const avgBpm = students.filter(s => s.bpm > 0).length > 0 
    ? Math.round(students.filter(s => s.bpm > 0).reduce((sum, s) => sum + s.bpm, 0) / students.filter(s => s.bpm > 0).length)
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
      <div className="flex items-center justify-between flex-wrap gap-3">
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
        <div className="flex items-center gap-4 flex-wrap">
          <select 
            className="px-4 py-2 rounded-xl border border-border-soft bg-white text-sm font-bold focus:outline-none focus:border-plum"
            value={activeClass?.id || ''}
            onChange={(e) => setActiveClass(classes.find(c => c.id === e.target.value))}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <span className="text-rose font-bold text-sm bg-rose-pale px-4 py-2 rounded-full">LIVE MODE</span>

          {/* Invite Student Button */}
          <button 
            onClick={() => setShowInviteModal(true)}
            className="btn-primary px-4 py-2 text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} /> Студент шақыру
          </button>


          {/* Live Stats */}
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="bg-success/10 text-success px-3 py-1.5 rounded-full">{onlineCount} онлайн</span>
            {avgBpm > 0 && <span className="bg-rose-pale text-rose px-3 py-1.5 rounded-full">♥ {avgBpm} BPM</span>}
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${overallStress > 30 ? 'bg-red-50' : 'bg-plum-pale'}`}>
            <div className={`w-2 h-2 rounded-full ${overallStress > 30 ? 'bg-rose animate-pulse' : 'bg-success'}`} />
            <span className={`text-sm font-bold ${overallStress > 30 ? 'text-rose' : 'text-plum'}`}>
              {overallStress > 30 ? 'НАЗАР АУДАРУ ҚАЖЕТ' : 'ҚАЛЫПТЫ'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {students.map((student, i) => {
                const colors = statusColors[student.status] || statusColors.calm
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
                    {/* Online indicator */}
                    <div className="flex justify-end mb-1">
                      <div className={`w-2 h-2 rounded-full ${student.online ? 'bg-success' : 'bg-gray-300'}`} />
                    </div>
                    <h4 className="font-bold text-text-primary text-sm truncate px-1" title={student.name}>{student.name}</h4>
                    <span className={`text-xs font-bold ${colors.text} flex items-center justify-center gap-1 mt-1 truncate`}>
                      {student.status === 'stressed' && <Heart size={12} className="text-danger" />}
                      {student.status === 'focused' && <span className="text-success">●</span>}
                      {student.emotion}
                    </span>
                    <p className={`text-3xl font-extrabold mt-2 ${student.status === 'stressed' ? 'text-danger' : student.bpm > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                      {student.bpm > 0 ? student.bpm : '—'}
                    </p>
                    <p className={`text-xs ${student.status === 'stressed' ? 'text-danger font-bold' : 'text-text-muted'}`}>
                      {student.bpm > 0 ? 'BPM' : 'Офлайн'}
                      {student.status === 'stressed' && <Activity size={12} className="inline ml-1" />}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Bottom Controls */}
          {students.length > 0 && (
            <div className="flex items-center gap-4 mt-6 flex-wrap">
              <div className="card flex items-center gap-3 py-3 px-4 w-fit">
                <span className="text-rose font-bold text-sm">ЖАЛПЫ СТРЕСС</span>
                <span className="text-rose font-extrabold">{overallStress}%</span>
                <div className="w-20 h-2 bg-plum-pale rounded-full">
                  <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${overallStress}%` }} />
                </div>
              </div>
              <div className="card flex items-center gap-3 py-3 px-4 w-fit">
                <span className="text-plum font-bold text-sm">ОНЛАЙН</span>
                <span className="text-plum font-extrabold">{onlineCount}/{students.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="flex flex-col gap-4">
          {selectedStudent ? (
            <>
              <motion.div
                key={selectedStudent.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="card text-center"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="w-8" /> {/* Spacer */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-2 ${selectedStudent.online ? 'bg-success' : 'bg-gray-300'}`} title={selectedStudent.online ? 'ОНЛАЙН' : 'ОФЛАЙН'} />
                  <button 
                    onClick={() => handleRemoveStudent(selectedStudent.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
                    title="Сыныптан шығару"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-plum-pale to-soft-pink flex items-center justify-center mx-auto mb-3">
                  <User size={36} className="text-plum" />
                </div>
                <h3 className="text-xl font-extrabold text-text-primary truncate px-2">{selectedStudent.name}</h3>
                <p className="text-sm text-text-muted">{activeClass?.name} • {selectedStudent.online ? 'ОНЛАЙН' : 'ОФЛАЙН'}</p>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-xs text-text-muted">ЭМОЦИЯ</p>
                    <p className="text-sm font-bold text-plum">{selectedStudent.emotion}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted">BPM</p>
                    <p className={`text-sm font-bold ${selectedStudent.status === 'stressed' ? 'text-danger' : 'text-text-primary'}`}>
                      {selectedStudent.bpm > 0 ? selectedStudent.bpm : '—'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Live BPM Chart */}
              <div className="card">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  ЖҮРЕК СОҒУ ЖИІЛІГІ <Heart size={14} className="text-rose" />
                </p>
                {bpmHistory.length > 1 ? (
                  <svg className="w-full h-20" viewBox={`0 0 ${Math.max(280, bpmHistory.length * 10)} 60`} preserveAspectRatio="none">
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
                      points={bpmHistory.map((p, i) => {
                        const x = (i / (bpmHistory.length - 1)) * 280
                        const y = 55 - ((p.bpm - 50) / 80) * 50 // Scale BPM 50-130 to 5-55
                        return `${x},${Math.max(5, Math.min(55, y))}`
                      }).join(' ')}
                    />
                  </svg>
                ) : (
                  <div className="h-20 flex items-center justify-center text-xs text-text-muted">
                    <Activity size={16} className="mr-2 opacity-50" />
                    Деректер жиналуда...
                  </div>
                )}
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>{bpmHistory[0]?.time || '—'}</span>
                  <span>Қазір</span>
                </div>
                <div className="flex gap-6 mt-3">
                  <div>
                    <p className="text-xs text-text-muted">АҒЫМДАҒЫ</p>
                    <p className={`text-xl font-extrabold ${selectedStudent.status === 'stressed' ? 'text-rose' : 'text-text-primary'}`}>
                      {selectedStudent.bpm > 0 ? selectedStudent.bpm : '—'}
                    </p>
                  </div>
                  {bpmHistory.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted">ОРТАША</p>
                      <p className="text-xl font-extrabold text-text-primary">
                        {Math.round(bpmHistory.reduce((s, p) => s + p.bpm, 0) / bpmHistory.length)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <button 
                onClick={() => setShowReport(true)}
                className="py-3 border border-border-soft rounded-xl text-text-secondary font-bold text-sm hover:border-plum hover:text-plum transition-colors flex items-center justify-center gap-2"
              >
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
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border-soft mt-auto flex-wrap">
        <span className="text-rose text-xl"><SendHorizonal size={20} className="text-rose" /></span>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Сыныпқа хабарлама жіберу (Telegram)..."
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 text-sm"
        />
        <button 
          onClick={handleSendMessage}
          disabled={isSending || !message.trim()}
          className="btn-primary px-6 py-2.5 font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {isSending ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
          Жіберу
        </button>
        <div className="flex items-center gap-3 border-l border-border-soft pl-4">
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

      {/* Student Report Modal */}
      <AnimatePresence>
        {showReport && selectedStudent && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReport(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl"
            >
              <button onClick={() => setShowReport(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-plum-pale flex items-center justify-center">
                  <FileText size={24} className="text-plum" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-text-primary">{selectedStudent.name}</h2>
                  <p className="text-xs text-text-muted">Оқушы есебі • {activeClass?.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* BPM Stats */}
                <div className="bg-rose-pale rounded-xl p-4">
                  <p className="text-xs font-bold text-rose uppercase mb-2">Жүрек соғу жиілігі</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-2xl font-black text-text-primary">{selectedStudent.bpm > 0 ? selectedStudent.bpm : '—'}</p>
                      <p className="text-xs text-text-muted">Ағымдағы BPM</p>
                    </div>
                    {bpmHistory.length > 0 && (
                      <>
                        <div>
                          <p className="text-2xl font-black text-text-primary">{Math.round(bpmHistory.reduce((s, p) => s + p.bpm, 0) / bpmHistory.length)}</p>
                          <p className="text-xs text-text-muted">Орташа BPM</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-text-primary">{Math.max(...bpmHistory.map(p => p.bpm))}</p>
                          <p className="text-xs text-text-muted">Максимум</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Emotion Stats */}
                <div className="bg-plum-pale rounded-xl p-4">
                  <p className="text-xs font-bold text-plum uppercase mb-2">Эмоция тарихы</p>
                  {selectedStudent.emotionHistory?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const counts: Record<string, number> = {}
                        selectedStudent.emotionHistory.forEach((e: string) => { counts[e] = (counts[e] || 0) + 1 })
                        return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => (
                          <span key={emotion} className="text-xs font-bold bg-white/60 px-3 py-1.5 rounded-full">
                            {emotion} ({count})
                          </span>
                        ))
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">Деректер жиналуда...</p>
                  )}
                </div>

                {/* Status */}
                <div className="bg-bg-secondary rounded-xl p-4 flex items-center gap-3">
                  <Brain size={20} className="text-plum" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {selectedStudent.status === 'stressed' ? '⚠️ Студент стресс жағдайда' 
                        : selectedStudent.status === 'focused' ? '✅ Студент зейінді' 
                        : '😌 Студент тыныш күйде'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {bpmHistory.length} деректер нүктесі жиналды
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Student Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
            >
              <button onClick={() => setShowInviteModal(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>
              <h2 className="text-xl font-black text-text-primary mb-2">Оқушыны шақыру</h2>
              <p className="text-sm text-text-muted mb-4">{activeClass?.name} сыныбына оқушының поштасын жазып іздеңіз</p>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchStudent()}
                  placeholder="Оқушының поштасы немесе аты..."
                  className="flex-1 px-4 py-2 border border-border-soft rounded-xl text-sm focus:outline-none focus:border-plum"
                />
                <button 
                  onClick={handleSearchStudent}
                  disabled={isSearching}
                  className="bg-plum text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  Іздеу
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <p className="text-center text-sm text-text-muted py-4">Оқушы табылмады</p>
                )}
                {searchResults.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 border border-border-soft rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-plum-pale flex items-center justify-center text-plum font-bold text-xs">
                        {student.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary leading-tight">{student.name}</p>
                        <p className="text-[10px] text-text-muted leading-tight">{student.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleInviteStudent(student)}
                      className="text-xs bg-plum-pale text-plum font-bold px-3 py-1.5 rounded-lg hover:bg-plum hover:text-white transition-colors"
                    >
                      Шақыру
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
