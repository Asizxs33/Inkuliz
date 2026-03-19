import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { Brain, Heart, AlertTriangle, Languages, TrendingUp, Lightbulb, BarChart3, Hand, Activity } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'
import { ML_CLASSIFIER } from '../lib/mlClassifier'

// ─── Helpers ────────────────────────────────────────────────
const TIMELINE_STORAGE_KEY = 'emolearn_emotion_timeline'
const SESSION_STORAGE_KEY = 'emolearn_session_log'

interface TimelinePoint {
  time: string
  bpm: number
  cognitive: number
  emotion: string
}

interface SessionLog {
  date: string      // YYYY-MM-DD
  gestures: number
  minutes: number
}

function loadTimeline(): TimelinePoint[] {
  try {
    const d = sessionStorage.getItem(TIMELINE_STORAGE_KEY)
    return d ? JSON.parse(d) : []
  } catch { return [] }
}

function saveTimeline(data: TimelinePoint[]) {
  sessionStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(data.slice(-30)))
}

function loadSessionLog(): SessionLog[] {
  try {
    const d = localStorage.getItem(SESSION_STORAGE_KEY)
    return d ? JSON.parse(d) : []
  } catch { return [] }
}

function recordSessionActivity() {
  const today = new Date().toISOString().split('T')[0]
  const log = loadSessionLog()
  const existing = log.find(s => s.date === today)
  if (existing) {
    existing.gestures += 1
    existing.minutes = Math.max(existing.minutes, 1)
  } else {
    log.push({ date: today, gestures: 1, minutes: 1 })
  }
  // Keep last 28 days only
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 28)
  const filtered = log.filter(s => new Date(s.date) >= cutoff)
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filtered))
}

// Heatmap color intensities
function getHeatColor(gestures: number): string {
  if (gestures === 0) return '#F2E8F0'
  if (gestures <= 3) return '#F9C5D5'
  if (gestures <= 8) return '#E8507A80'
  if (gestures <= 15) return '#E8507A'
  if (gestures <= 25) return '#6B2D5E80'
  return '#6B2D5E'
}

// ─── Component ──────────────────────────────────────────────
export default function Analytics() {
  const { name } = useUserStore()
  const { bpm, emotionKz, cognitive, confidence, isCameraEnabled } = useBiometricStore()

  const [timeline, setTimeline] = useState<TimelinePoint[]>(loadTimeline())
  const [sessionLog] = useState<SessionLog[]>(loadSessionLog())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Snapshot emotion timeline every 10 seconds
  useEffect(() => {
    if (!isCameraEnabled) return

    const snapshot = () => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      const store = useBiometricStore.getState()

      const point: TimelinePoint = {
        time: timeStr,
        bpm: store.bpm,
        cognitive: store.cognitive,
        emotion: store.emotionKz
      }

      setTimeline(prev => {
        const updated = [...prev, point].slice(-30)
        saveTimeline(updated)
        return updated
      })

      recordSessionActivity()
    }

    // Take first snapshot immediately
    snapshot()
    intervalRef.current = setInterval(snapshot, 10000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isCameraEnabled])

  // ─── Derived Data ───────────────────────────────────────
  const avgBpm = timeline.length > 0 ? Math.round(timeline.reduce((s, p) => s + p.bpm, 0) / timeline.length) : bpm
  const avgCognitive = timeline.length > 0 ? Math.round(timeline.reduce((s, p) => s + p.cognitive, 0) / timeline.length) : cognitive

  // Emotion distribution from timeline
  const emotionCounts: Record<string, number> = {}
  timeline.forEach(p => { emotionCounts[p.emotion] = (emotionCounts[p.emotion] || 0) + 1 })
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || emotionKz

  // ML trained gesture count
  const mlCounts = ML_CLASSIFIER.getCounts()
  const totalMlExamples = Object.values(mlCounts).reduce((s, c) => s + c, 0)
  const mlWords = Object.keys(mlCounts).length

  // Session heatmap (last 28 days)
  const heatmapData: number[] = []
  const today = new Date()
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const session = sessionLog.find(s => s.date === dateStr)
    heatmapData.push(session ? session.gestures : 0)
  }

  // Total gestures from bookmarks
  const bookmarkCount = (() => {
    try {
      const saved = localStorage.getItem('emolearn_bookmarks')
      return saved ? JSON.parse(saved).length : 0
    } catch { return 0 }
  })()

  // Stress indicator
  const isStressed = ['АШУЛЫ', 'ҚОРЫҚҚАН', 'ЖИІРКЕНГЕН'].includes(emotionKz)
  const stressLabel = isStressed ? 'Жоғары' : bpm > 90 ? 'Орташа' : 'Тұрақты'

  // KPIs
  const kpis = [
    { label: 'ЗЕЙІНДІЛІК', value: `${cognitive}%`, sub: `Орт: ${avgCognitive}%`, color: 'text-plum', icon: Brain },
    { label: 'ЖҮРЕК СОҒУЫ', value: `${bpm}`, sub: `Орт: ${avgBpm} BPM`, color: 'text-rose', icon: Heart },
    { label: 'СТРЕСС', value: stressLabel, sub: emotionKz, color: isStressed ? 'text-danger' : 'text-success', icon: AlertTriangle },
    { label: 'ML МОДЕЛЬ', value: `${mlWords} сөз`, sub: `${totalMlExamples} мысал`, color: 'text-plum', icon: Hand },
  ]

  // Emotion pie data
  const emotionPieData = Object.entries(emotionCounts).map(([emotion, count]) => ({
    name: emotion,
    value: count
  }))
  const PIE_COLORS = ['#E8507A', '#A05891', '#F59E0B', '#10B981', '#6366F1', '#EC4899']

  // BPM chart from timeline
  const bpmChartData = timeline.map(p => ({ time: p.time, bpm: p.bpm, cognitive: p.cognitive }))

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-3">
          <BarChart3 size={28} className="text-rose" /> НАҚТЫ УАҚЫТ АНАЛИТИКАСЫ
        </h1>
        <p className="text-text-secondary mt-1">
          {isCameraEnabled 
            ? `${name || 'Оқушы'}, сіздің биометрлік деректеріңіз тікелей қадағаланып жатыр`
            : 'Камераны қосыңыз — нақты деректер автоматты түрде жиналады'}
        </p>
      </div>

      {/* Live Status Banner */}
      {isCameraEnabled && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20"
        >
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm font-bold text-success">ТІКЕЛЕЙ ЭФИР</span>
          <span className="text-xs text-text-muted ml-auto">{timeline.length} деректер нүктесі жиналды</span>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>
            <span className="text-xs text-text-muted mt-1">{kpi.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* BPM & Cognitive Timeline */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">Биометрлік хронология</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose" /> BPM</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-plum" /> ЗЕЙІН</span>
            </div>
          </div>
          {bpmChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={bpmChartData}>
                <defs>
                  <linearGradient id="bpmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8507A" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#E8507A" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="cogGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A05891" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#A05891" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9C8A98' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EDD8E8', borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="bpm" stroke="#E8507A" strokeWidth={2} fill="url(#bpmGrad)" name="BPM" />
                <Area type="monotone" dataKey="cognitive" stroke="#A05891" strokeWidth={2} fill="url(#cogGrad)" name="Зейінділік %" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">
              <Activity size={20} className="mr-2 opacity-50" />
              Деректер жиналуда... Камераны қосыңыз
            </div>
          )}
        </motion.div>

        {/* Emotion Distribution Pie */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card flex flex-col items-center justify-center"
        >
          <h3 className="font-bold text-text-primary mb-4">Эмоция таралуы</h3>
          {emotionPieData.length > 0 ? (
            <>
              <div className="relative w-40 h-40">
                <PieChart width={160} height={160}>
                  <Pie
                    data={emotionPieData}
                    cx={75} cy={75}
                    innerRadius={50} outerRadius={70}
                    dataKey="value"
                    stroke="none"
                  >
                    {emotionPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-text-primary">{dominantEmotion}</span>
                  <span className="text-[10px] text-rose font-bold">БАСЫМ</span>
                </div>
              </div>
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
              Эмоция деректері<br/>жиналуда...
            </div>
          )}
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Activity Heatmap */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="font-bold text-text-primary mb-4">Белсенділік картасы (28 күн)</h3>
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['ДУ','СЕ','СӘ','БЕ','ЖУ','СЕ','ЖЕ'].map(d => (
              <span key={d} className="text-center text-xs text-text-muted">{d}</span>
            ))}
            {heatmapData.map((v, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg transition-colors"
                style={{ backgroundColor: getHeatColor(v) }}
                title={`${v} қимыл`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-2">
            <span>БЕЛСЕНДІ ЕМЕС</span>
            <div className="flex gap-1">
              {[0,3,8,15,25].map(v => (
                <div key={v} className="w-4 h-3 rounded-sm" style={{ backgroundColor: getHeatColor(v) }} />
              ))}
            </div>
            <span>БЕЛСЕНДІ</span>
          </div>
        </motion.div>

        {/* AI Summary & Insights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">AI Түсініктемелер</h3>
            <span className="text-xs font-bold text-rose bg-rose-pale px-3 py-1 rounded-full">НАҚТЫ ДЕРЕКТЕР</span>
          </div>
          <div className="flex flex-col gap-3">
            {/* BPM Insight */}
            <div className="flex items-center gap-3 p-3 bg-rose-pale rounded-xl">
              <Heart size={16} className="text-rose shrink-0" />
              <div>
                <p className="text-sm font-bold text-text-primary">
                  {bpm > 100 ? 'ЖОҒАРЫ ПУЛЬС' : bpm > 80 ? 'ҚАЛЫПТЫ ПУЛЬС' : 'САБЫРЛЫ КҮЙ'}
                </p>
                <p className="text-xs text-text-muted">
                  Қазіргі пульсіңіз: {bpm} BPM{bpm > 100 ? '. Тыныш алыңыз, стресс деңгейін төмендетіңіз' : bpm > 80 ? '. Белсенді жұмыс істеп жатырсыз' : '. Концентрацияға қолайлы жағдай'}
                </p>
              </div>
            </div>

            {/* Emotion Insight */}
            <div className="flex items-center gap-3 p-3 bg-plum-pale rounded-xl">
              <Brain size={16} className="text-plum shrink-0" />
              <div>
                <p className="text-sm font-bold text-text-primary">Эмоция: {emotionKz}</p>
                <p className="text-xs text-text-muted">
                  Сенімділік: {Math.round(confidence)}%
                  {isStressed ? '. Кішкене демалыс жасауды ұсынамыз 🧘' : '. Оқуға қолайлы жағдайдасыз ✨'}
                </p>
              </div>
            </div>
            
            {/* ML Model Insight */}
            <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl">
              <Lightbulb size={16} className="text-warning shrink-0" />
              <div>
                <p className="text-sm font-bold text-text-primary">ML Модель</p>
                <p className="text-xs text-text-muted">
                  {totalMlExamples > 0
                    ? `${mlWords} сөз үйретілді, ${totalMlExamples} видео-тізбек сақталған. DTW алгоритмімен жұмыс істейді.`
                    : 'Модель бос. Ымдау Тілі бетінен "AI Модельді Үйрету" арқылы жаңа сөздер қосыңыз.'}
                </p>
              </div>
            </div>

            {/* Bookmarks Insight */}
            <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl">
              <TrendingUp size={16} className="text-success shrink-0" />
              <div>
                <p className="text-sm font-bold text-text-primary">Оқу прогресі</p>
                <p className="text-xs text-text-muted">
                  {bookmarkCount > 0 
                    ? `${bookmarkCount} сөз таңдаулыларға қосылған. Сөздікте белгіленген сөздеріңізді қайталаңыз!`
                    : 'Сөздіктен сөздерді таңдаулыларға қосып, оларды жаттығыңыз!'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted py-4 border-t border-border-soft">
        <span>© 2025 EMOLEARN AI ANALYTICS. НАҚТЫ ДЕРЕКТЕР НЕГІЗІНДЕ.</span>
        <span>{timeline.length} деректер нүктесі жиналды</span>
      </div>
    </div>
  )
}
