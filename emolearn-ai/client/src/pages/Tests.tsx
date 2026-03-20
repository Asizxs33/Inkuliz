import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, CheckCircle2, XCircle, Clock, Trophy, ChevronRight, RotateCcw, Medal } from 'lucide-react'
import { useUserStore } from '../store/userStore'

const API = (path: string) => (import.meta.env.VITE_API_URL || '') + path

interface Question { question: string; options: string[]; correct: number }
interface Test { id: string; title: string; questions: Question[]; created_at: string; status: string }
interface MyResult { score: number; total: number; completed_at: string; answers: number[] }

type Screen = 'list' | 'quiz' | 'result'

export default function Tests() {
  const { id: studentId, name: studentName } = useUserStore()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [myResults, setMyResults] = useState<Record<string, MyResult>>({})

  const [screen, setScreen] = useState<Screen>('list')
  const [activeTest, setActiveTest] = useState<Test | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [current, setCurrent] = useState(0)
  const [result, setResult] = useState<{ score: number; total: number; answers: number[] } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ student_name: string; score: number; total: number }[]>([])

  const fetchTests = async () => {
    try {
      const res = await fetch(API('/api/tests?student=true'))
      const data = await res.json()
      const list: Test[] = data.tests || []
      setTests(list)

      // Check which ones the student already submitted
      if (studentId && list.length > 0) {
        const checks = await Promise.all(
          list.map(t =>
            fetch(API(`/api/tests/${t.id}/my-result?student_id=${studentId}`))
              .then(r => r.json())
              .then(d => ({ id: t.id, result: d.result }))
          )
        )
        const map: Record<string, MyResult> = {}
        checks.forEach(({ id, result }) => { if (result) map[id] = result })
        setMyResults(map)
      }
    } catch (err) {
      console.error('Fetch tests error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTests() }, [studentId])

  const startTest = (test: Test) => {
    setActiveTest(test)
    setAnswers(new Array(test.questions.length).fill(-1))
    setCurrent(0)
    setResult(null)
    setScreen('quiz')
  }

  const selectAnswer = (optionIdx: number) => {
    setAnswers(prev => {
      const updated = [...prev]
      updated[current] = optionIdx
      return updated
    })
  }

  const nextQuestion = () => {
    if (!activeTest) return
    if (current < activeTest.questions.length - 1) {
      setCurrent(c => c + 1)
    } else {
      submitTest()
    }
  }

  const submitTest = async () => {
    if (!activeTest || !studentId) return
    setSubmitting(true)
    try {
      const res = await fetch(API(`/api/tests/${activeTest.id}/submit`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, student_name: studentName, answers })
      })
      const data = await res.json()
      const r = { score: data.score, total: data.total, answers }
      setResult(r)
      setMyResults(prev => ({ ...prev, [activeTest.id]: { ...r, completed_at: new Date().toISOString() } }))

      // Fetch leaderboard
      const lbRes = await fetch(API(`/api/tests/${activeTest.id}/results`))
      const lbData = await lbRes.json()
      const sorted = (lbData.results || [])
        .sort((a: any, b: any) => b.score / b.total - a.score / a.total)
      setLeaderboard(sorted)

      setScreen('result')
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const percent = result ? Math.round((result.score / result.total) * 100) : 0

  if (screen === 'quiz' && activeTest) {
    const q = activeTest.questions[current]
    const chosen = answers[current]
    const progress = Math.round(((current + 1) / activeTest.questions.length) * 100)

    return (
      <div className="max-w-xl mx-auto flex flex-col gap-6 animate-fade-in">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-text-muted uppercase">{activeTest.title}</span>
            <span className="text-xs font-bold text-plum">{current + 1} / {activeTest.questions.length}</span>
          </div>
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-plum to-rose rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
            className="card flex flex-col gap-5">
            <p className="text-lg font-bold text-text-primary leading-snug">{current + 1}. {q.question}</p>
            <div className="flex flex-col gap-3">
              {q.options.map((opt, oi) => (
                <button key={oi} onClick={() => selectAnswer(oi)}
                  className={`text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    chosen === oi
                      ? 'border-plum bg-plum/10 text-plum font-bold'
                      : 'border-border-soft hover:border-plum/40 hover:bg-plum/5 text-text-primary'
                  }`}>
                  <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span> {opt}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          <button onClick={() => setScreen('list')} className="px-5 py-3 rounded-xl border border-border-soft font-bold text-sm text-text-muted hover:text-danger transition-colors">
            Тоқтату
          </button>
          <button onClick={nextQuestion} disabled={chosen === -1 || submitting}
            className="flex-1 btn-primary py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : current < activeTest.questions.length - 1
                ? <><span>Келесі</span><ChevronRight size={16} /></>
                : <><span>Аяқтау</span><CheckCircle2 size={16} /></>
            }
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'result' && result && activeTest) {
    const pass = percent >= 70
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-6 animate-fade-in">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card text-center py-10 flex flex-col items-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${pass ? 'bg-success/10' : 'bg-danger/10'}`}>
            {pass ? <Trophy size={40} className="text-success" /> : <RotateCcw size={40} className="text-danger" />}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-text-primary">{result.score}/{result.total}</h2>
            <p className={`text-lg font-bold mt-1 ${pass ? 'text-success' : 'text-danger'}`}>{percent}% — {pass ? 'Өтті ✓' : 'Өтпеді ✗'}</p>
          </div>
          <p className="text-text-muted text-sm">{activeTest.title}</p>
        </motion.div>

        {/* Answer review */}
        <div className="flex flex-col gap-3">
          {activeTest.questions.map((q, qi) => {
            const chosen = result.answers[qi]
            const correct = q.correct
            const isRight = chosen === correct
            return (
              <div key={qi} className="card">
                <p className="text-sm font-bold text-text-primary mb-3">{qi + 1}. {q.question}</p>
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt, oi) => {
                    let cls = 'text-text-muted'
                    if (oi === correct) cls = 'text-success font-bold'
                    else if (oi === chosen && !isRight) cls = 'text-danger'
                    return (
                      <div key={oi} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${oi === correct ? 'bg-success/10' : oi === chosen && !isRight ? 'bg-danger/10' : ''}`}>
                        {oi === correct ? <CheckCircle2 size={14} className="text-success shrink-0" /> : oi === chosen && !isRight ? <XCircle size={14} className="text-danger shrink-0" /> : <span className="w-3.5" />}
                        <span className={cls}>{String.fromCharCode(65 + oi)}. {opt}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="card">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Medal size={14} className="text-amber-500" /> Рейтинг
            </p>
            <div className="flex flex-col gap-2">
              {leaderboard.map((row, i) => {
                const isMe = row.student_name === studentName
                const pct = Math.round((row.score / row.total) * 100)
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                return (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${isMe ? 'bg-plum/10 border-2 border-plum/30' : 'bg-bg-secondary'}`}>
                    <span className="text-lg w-7 shrink-0">{medal}</span>
                    <span className={`flex-1 text-sm font-bold ${isMe ? 'text-plum' : 'text-text-primary'}`}>
                      {row.student_name} {isMe && '(сіз)'}
                    </span>
                    <span className={`text-sm font-bold ${pct >= 70 ? 'text-success' : 'text-danger'}`}>
                      {row.score}/{row.total} · {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button onClick={() => setScreen('list')} className="btn-primary py-3 font-bold text-sm">
          Тесттер тізіміне оралу
        </button>
      </div>
    )
  }

  // List screen
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-3">
          <FileText size={28} className="text-plum" /> ТЕСТТЕР
        </h1>
        <p className="text-text-secondary mt-1">Мұғалімдер жасаған тесттерге қатысыңыз</p>
      </div>

      {loading ? (
        <div className="card p-16 text-center">
          <div className="w-8 h-8 border-2 border-plum/40 border-t-plum rounded-full animate-spin mx-auto" />
        </div>
      ) : tests.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={48} className="text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-bold text-text-muted">Тесттер жоқ</h3>
          <p className="text-sm text-text-muted mt-1">Мұғалім тест жасағанда осы жерде пайда болады</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map(test => {
            const done = myResults[test.id]
            const pass = done && Math.round((done.score / done.total) * 100) >= 70
            return (
              <motion.div key={test.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${done ? (pass ? 'bg-success/10' : 'bg-danger/10') : 'bg-plum/10'}`}>
                  {done
                    ? pass ? <Trophy size={24} className="text-success" /> : <XCircle size={24} className="text-danger" />
                    : <FileText size={24} className="text-plum" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary truncate">{test.title}</h3>
                  <p className="text-xs text-text-muted flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(test.created_at).toLocaleDateString('ru-RU')}</span>
                    <span>{test.questions.length} сұрақ</span>
                    {done && (
                      <span className={`font-bold ${pass ? 'text-success' : 'text-danger'}`}>
                        {done.score}/{done.total} • {Math.round((done.score / done.total) * 100)}%
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => done ? null : startTest(test)}
                  disabled={!!done}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    done
                      ? 'bg-bg-secondary text-text-muted cursor-default'
                      : 'btn-primary hover:opacity-90'
                  }`}
                >
                  {done ? 'Өтілді' : 'Бастау'}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
