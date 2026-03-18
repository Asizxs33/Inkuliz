import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { Brain, Heart, AlertTriangle, Languages, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUserStore } from '../store/userStore'

const defaultEmotionData = [
  { time: '09:00', focused: 70, happy: 20, bored: 5, stressed: 5 },
  { time: '10:00', focused: 85, happy: 30, bored: 10, stressed: 5 },
  { time: '11:00', focused: 90, happy: 25, bored: 8, stressed: 3 },
  { time: '12:00', focused: 60, happy: 40, bored: 15, stressed: 10 },
  { time: '13:00', focused: 50, happy: 35, bored: 25, stressed: 15 },
  { time: '14:00', focused: 75, happy: 20, bored: 12, stressed: 8 },
]

const predictionData = [
  { week: '1', actual: 45, predicted: null },
  { week: '2', actual: 52, predicted: null },
  { week: '3', actual: 58, predicted: null },
  { week: '4', actual: 55, predicted: null },
  { week: '5', actual: 62, predicted: null },
  { week: '6', actual: 68, predicted: null },
  { week: '7', actual: null, predicted: 72 },
  { week: '8', actual: null, predicted: 78 },
  { week: '9', actual: null, predicted: 85 },
]

const heatmapWeeks = [
  [1,2,3,2,3,2,1],
  [2,3,4,3,2,2,1],
  [3,3,5,3,2,1,1],
  [2,3,2,1,1,1,0],
]

const heatColors: Record<number, string> = { 0: '#FDE8EE', 1: '#F9C5D5', 2: '#E8507A80', 3: '#E8507A', 4: '#6B2D5E80', 5: '#6B2D5E' }

const defaultKpis = [
  { label: 'КОНЦЕНТРАЦИЯ', value: '87%', change: '+5%', color: 'text-plum', icon: Brain, positive: true },
  { label: 'ЖҮРЕК СОҒУЫ', value: '74', change: '-2%', color: 'text-rose', icon: Heart, positive: true },
  { label: 'СТРЕСС ДЕҢГЕЙІ', value: '3', change: 'Тұрақты', color: 'text-warning', icon: AlertTriangle, positive: false },
  { label: 'АУДАРМАЛАР', value: '234', change: '+12%', color: 'text-plum', icon: Languages, positive: true },
]

export default function Analytics() {
  const { id: userId } = useUserStore()
  const [kpis, setKpis] = useState(defaultKpis)
  const [emotionData, setEmotionData] = useState(defaultEmotionData)
  const [learningOutcome, setLearningOutcome] = useState(67)

  useEffect(() => {
    if (!userId) return

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/analytics/overview/${userId}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.kpis) {
          setKpis([
            { label: 'КОНЦЕНТРАЦИЯ', value: `${data.kpis.concentration.value}%`, change: `+${data.kpis.concentration.change}%`, color: 'text-plum', icon: Brain, positive: true },
            { label: 'ЖҮРЕК СОҒУЫ', value: `${data.kpis.heartRate.value}`, change: `${data.kpis.heartRate.change}%`, color: 'text-rose', icon: Heart, positive: true },
            { label: 'СТРЕСС ДЕҢГЕЙІ', value: `${data.kpis.stressLevel.value}`, change: data.kpis.stressLevel.label, color: 'text-warning', icon: AlertTriangle, positive: false },
            { label: 'АУДАРМАЛАР', value: `${data.kpis.translations.value}`, change: `+${data.kpis.translations.change}%`, color: 'text-plum', icon: Languages, positive: true },
          ])
        }

        if (data.emotionTimeline?.length > 0) {
          setEmotionData(data.emotionTimeline)
        }

        if (data.learningOutcome) {
          setLearningOutcome(data.learningOutcome)
        }
      } catch (err) {
        console.debug('Analytics fetch error, using defaults:', err)
      }
    }

    fetchAnalytics()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-3">
          <BarChart3 size={28} className="text-rose" /> ҮЛГЕРІМ АНАЛИТИКАСЫ
        </h1>
        <p className="text-text-secondary mt-1">Нақты уақыттағы оқу көрсеткіштері мен нейро-анализ</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-muted uppercase">{kpi.label}</span>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-text-primary">{kpi.value}</span>
              <span className={`text-sm font-bold ${kpi.positive ? 'text-success' : 'text-text-muted'}`}>{kpi.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-[1fr_340px] gap-6">
        {/* Emotion Timeline */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">Эмоция хронологиясы</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-plum" /> ЗЕЙІНДІ</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose" /> ҚУАНЫШТЫ</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> АБДЫРАҒАН</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" /> СТРЕСС</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={emotionData}>
              <defs>
                <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8507A" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#E8507A" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9C8A98' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EDD8E8', borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="focused" stroke="#E8507A" strokeWidth={2.5} fill="url(#focusGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Learning Outcomes Donut */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card flex flex-col items-center justify-center"
        >
          <h3 className="font-bold text-text-primary mb-4">Оқу нәтижелері</h3>
          <div className="relative w-40 h-40">
            <PieChart width={160} height={160}>
              <Pie
                data={[{ value: learningOutcome }, { value: 100 - learningOutcome }]}
                cx={75} cy={75}
                innerRadius={55} outerRadius={70}
                startAngle={90} endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#E8507A" />
                <Cell fill="#F2E8F0" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-text-primary">{learningOutcome}%</span>
              <span className="text-xs text-rose font-bold">МЕҢГЕРІЛГЕН</span>
            </div>
          </div>
          <p className="text-sm text-text-muted text-center mt-3">
            Сіздің деңгейіңіз топтық орташа деңгейден 12%-ға жоғары
          </p>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* BPM Heatmap Calendar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="font-bold text-text-primary mb-4">Жүрек соғу жиілігінің картасы</h3>
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['ДУ','СЕ','СӘ','БЕ','ЖУ','СЕ','ЖЕ'].map(d => (
              <span key={d} className="text-center text-xs text-text-muted">{d}</span>
            ))}
            {heatmapWeeks.flat().map((v, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg"
                style={{ backgroundColor: heatColors[v] }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-2">
            <span>ТӨМЕН</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(v => (
                <div key={v} className="w-4 h-3 rounded-sm" style={{ backgroundColor: heatColors[v] }} />
              ))}
            </div>
            <span>ЖОҒАРЫ</span>
          </div>
        </motion.div>

        {/* AI Predictions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">AI Болжамдары</h3>
            <span className="text-xs font-bold text-rose bg-rose-pale px-3 py-1 rounded-full">БОЛАШАҚ ТРЕНД</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={predictionData}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9C8A98' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EDD8E8', borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="actual" stroke="#9C8A98" strokeWidth={2} dot={{ r: 3, fill: '#9C8A98' }} connectNulls={false} />
              <Line type="monotone" dataKey="predicted" stroke="#E8507A" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 4, fill: '#E8507A' }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-3 p-3 bg-rose-pale rounded-xl">
              <TrendingUp size={16} className="text-rose" />
              <div>
                <p className="text-sm font-bold text-text-primary">БОЛЖАЛДЫСЫМ: +15%</p>
                <p className="text-xs text-text-muted">Қазіргі қарқынмен 2 аптада деңгейіңіз артады</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-plum-pale rounded-xl">
              <Lightbulb size={16} className="text-plum" />
              <div>
                <p className="text-sm font-bold text-text-primary">КЕҢЕС</p>
                <p className="text-xs text-text-muted">Келесі сабақта стресс деңгейін төмендетуге тырысыңыз</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted py-4 border-t border-border-soft">
        <span>© 2024 EMOLEARN AI ANALYTICS. БАРЛЫҚ ҚҰҚЫҚТАР ҚОРҒАЛҒАН.</span>
        <div className="flex gap-6">
          <span className="hover:text-plum cursor-pointer transition-colors">ҚҰПИЯЛЫЛЫҚ САЯСАТЫ</span>
          <span className="hover:text-plum cursor-pointer transition-colors">КӨМЕК ОРТАЛЫҒЫ</span>
        </div>
      </div>
    </div>
  )
}
