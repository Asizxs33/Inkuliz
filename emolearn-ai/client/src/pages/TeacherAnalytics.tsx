import { motion } from 'framer-motion'
import { BarChart3, Users, Heart, Brain, TrendingUp, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { getSocket } from '../lib/socket'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface StudentSnapshot {
  id: string
  name: string
  bpm: number
  emotion: string
  status: string
}

export default function TeacherAnalytics() {
  const teacherId = useUserStore(s => s.id)
  const [classes, setClasses] = useState<any[]>([])
  const [activeClass, setActiveClass] = useState<any>(null)
  const [students, setStudents] = useState<StudentSnapshot[]>([])

  // Live timeline snapshots
  const [timeline, setTimeline] = useState<{ time: string; avgBpm: number; stressPercent: number }[]>([])

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

  useEffect(() => {
    if (!activeClass) return
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/${activeClass.id}/students`)
        const data = await res.json()
        setStudents(data.students.map((s: any) => ({ ...s, bpm: 0, emotion: '—', status: 'calm' })))
      } catch (err) {
        console.error(err)
      }
    }
    fetchStudents()
  }, [activeClass])

  useEffect(() => {
    if (!activeClass) return
    const socket = getSocket()
    socket.emit('teacher:join', activeClass.id)

    const handleUpdate = (data: any) => {
      setStudents(prev => {
        const updated = prev.map(s => {
          if (s.id === data.userId) {
            const status = data.bpm > 90 || ['ҚОРЫҚҚАН', 'АШУЛЫ'].includes(data.emotion)
              ? 'stressed'
              : ['ШОҒЫРЛАНҒАН', 'ЗЕЙІНДІ'].includes(data.emotion) ? 'focused' : 'calm'
            return { ...s, bpm: data.bpm, emotion: data.emotionKz || data.emotion, status }
          }
          return s
        })
        
        // Take a snapshot for the timeline
        const onlineStudents = updated.filter(s => s.bpm > 0)
        if (onlineStudents.length > 0) {
          const now = new Date()
          const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
          const avgBpm = Math.round(onlineStudents.reduce((s, st) => s + st.bpm, 0) / onlineStudents.length)
          const stressPercent = Math.round((onlineStudents.filter(s => s.status === 'stressed').length / onlineStudents.length) * 100)
          
          setTimeline(prev => {
            const last = prev[prev.length - 1]
            if (last && last.time === timeStr) return prev
            return [...prev, { time: timeStr, avgBpm, stressPercent }].slice(-30)
          })
        }
        
        return updated
      })
    }

    socket.on('student:biometric', handleUpdate)
    return () => { socket.off('student:biometric', handleUpdate) }
  }, [activeClass])

  const onlineStudents = students.filter(s => s.bpm > 0)
  const avgBpm = onlineStudents.length > 0 ? Math.round(onlineStudents.reduce((s, st) => s + st.bpm, 0) / onlineStudents.length) : 0
  const stressPercent = onlineStudents.length > 0 ? Math.round((onlineStudents.filter(s => s.status === 'stressed').length / onlineStudents.length) * 100) : 0
  const focusPercent = onlineStudents.length > 0 ? Math.round((onlineStudents.filter(s => s.status === 'focused').length / onlineStudents.length) * 100) : 0

  // Emotion distribution
  const emotionCounts: Record<string, number> = {}
  onlineStudents.forEach(s => { emotionCounts[s.emotion] = (emotionCounts[s.emotion] || 0) + 1 })
  const emotionPieData = Object.entries(emotionCounts).map(([name, value]) => ({ name, value }))
  const PIE_COLORS = ['#E8507A', '#A05891', '#F59E0B', '#10B981', '#6366F1', '#EC4899']

  const kpis = [
    { label: 'ОНЛАЙН', value: `${onlineStudents.length}/${students.length}`, icon: Users, color: 'text-success' },
    { label: 'ОРТ. BPM', value: avgBpm > 0 ? `${avgBpm}` : '—', icon: Heart, color: 'text-rose' },
    { label: 'СТРЕСС', value: `${stressPercent}%`, icon: Activity, color: stressPercent > 30 ? 'text-danger' : 'text-success' },
    { label: 'ЗЕЙІН', value: `${focusPercent}%`, icon: Brain, color: 'text-plum' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-3">
            <BarChart3 size={28} className="text-rose" /> СЫНЫП АНАЛИТИКАСЫ
          </h1>
          <p className="text-text-secondary mt-1">Нақты уақыттағы сыныптық көрсеткіштер</p>
        </div>
        {classes.length > 1 && (
          <select
            className="px-4 py-2 rounded-xl border border-border-soft bg-white text-sm font-bold focus:outline-none focus:border-plum"
            value={activeClass?.id || ''}
            onChange={(e) => setActiveClass(classes.find((c: any) => c.id === e.target.value))}
          >
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="card text-center"
          >
            <kpi.icon size={24} className={`${kpi.color} mx-auto mb-2`} />
            <p className="text-3xl font-extrabold text-text-primary">{kpi.value}</p>
            <p className="text-xs font-bold text-text-muted uppercase mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Timeline Chart */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="card">
          <h3 className="font-bold text-text-primary mb-4">Сынып хронологиясы</h3>
          {timeline.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="bpmGradT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8507A" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#E8507A" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9C8A98' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EDD8E8', borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="avgBpm" stroke="#E8507A" strokeWidth={2} fill="url(#bpmGradT)" name="BPM орташа" />
                <Area type="monotone" dataKey="stressPercent" stroke="#F59E0B" strokeWidth={2} fill="none" name="Стресс %" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">
              <Activity size={20} className="mr-2 opacity-50" />
              Деректер жиналуда... Студенттер камераны қосқанда автоматты түрде толады
            </div>
          )}
        </motion.div>

        {/* Emotion Distribution */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="card flex flex-col items-center justify-center">
          <h3 className="font-bold text-text-primary mb-4">Эмоция таралуы</h3>
          {emotionPieData.length > 0 ? (
            <>
              <PieChart width={160} height={160}>
                <Pie data={emotionPieData} cx={75} cy={75} innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {emotionPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {emotionPieData.map((e, i) => (
                  <span key={e.name} className="text-[10px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {e.name} ({e.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-text-muted text-sm text-center">
              Деректер жиналуда...
            </div>
          )}
        </motion.div>
      </div>

      {/* Student Table */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="card">
        <h3 className="font-bold text-text-primary mb-4">Студенттер тізімі</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase border-b border-border-soft">
                <th className="py-3 px-2">Аты</th>
                <th className="py-3 px-2">Статус</th>
                <th className="py-3 px-2">BPM</th>
                <th className="py-3 px-2">Эмоция</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-border-soft/50 hover:bg-plum-pale/30 transition-colors">
                  <td className="py-3 px-2 font-bold">{s.name}</td>
                  <td className="py-3 px-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      s.bpm > 0 ? 'bg-success/10 text-success' : 'bg-gray-100 text-text-muted'
                    }`}>
                      {s.bpm > 0 ? 'Онлайн' : 'Офлайн'}
                    </span>
                  </td>
                  <td className={`py-3 px-2 font-bold ${s.status === 'stressed' ? 'text-danger' : ''}`}>
                    {s.bpm > 0 ? s.bpm : '—'}
                  </td>
                  <td className="py-3 px-2">{s.emotion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
