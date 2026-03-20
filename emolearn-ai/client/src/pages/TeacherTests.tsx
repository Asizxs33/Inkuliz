import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { FileText, Plus, Sparkles, Trash2, Eye, RotateCcw, Clock, CheckCircle2, X, Users } from 'lucide-react'

const API = (path: string) => (import.meta.env.VITE_API_URL || '') + path

interface Question { question: string; options: string[]; correct: number }
interface TestResult { student_name: string; score: number; total: number; completed_at: string }
interface Test {
  id: string
  title: string
  questions: Question[]
  created_at: string
  status: 'open' | 'closed'
  results: TestResult[]
}

export default function TeacherTests() {
  const { id: teacherId } = useUserStore()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [viewTest, setViewTest] = useState<Test | null>(null)

  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([{ question: '', options: ['', '', '', ''], correct: 0 }])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiTopic, setAiTopic] = useState('')

  const fetchTests = async () => {
    if (!teacherId) return
    try {
      const res = await fetch(API(`/api/tests?teacher_id=${teacherId}`))
      const data = await res.json()
      setTests(data.tests || [])
    } catch (err) {
      console.error('Fetch tests error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTests() }, [teacherId])

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return
    setIsGenerating(true)
    try {
      const res = await fetch(API('/api/chat/message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Маған "${aiTopic}" тақырыбы бойынша 5 тест сұрағын JSON форматында жаса. Әр сұрақтың 4 нұсқасы мен дұрыс жауабы болсын. Форматы: [{"question":"...","options":["A","B","C","D"],"correct":0}] Тек JSON массивін қайтар, басқа мәтін жазба.`,
          userId: 'teacher-ai'
        })
      })
      const data = await res.json()
      const reply = data.response || data.reply || ''
      const jsonMatch = reply.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setQuestions(parsed.map((q: any) => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correct: q.correct ?? 0
        })))
        setTitle(aiTopic + ' — AI тесті')
      }
    } catch (err) {
      console.error('AI generation failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTest = async () => {
    if (!title.trim() || !teacherId) return
    const validQuestions = questions.filter(q => q.question.trim())
    if (!validQuestions.length) return
    setIsSaving(true)
    try {
      const res = await fetch(API('/api/tests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, title, questions: validQuestions })
      })
      const data = await res.json()
      if (data.test) {
        setTests(prev => [{ ...data.test, results: [] }, ...prev])
        setShowCreate(false)
        setTitle('')
        setQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }])
        setAiTopic('')
      }
    } catch (err) {
      console.error('Save test error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStatus = async (test: Test) => {
    const newStatus = test.status === 'open' ? 'closed' : 'open'
    try {
      await fetch(API(`/api/tests/${test.id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: newStatus } : t))
    } catch (err) {
      console.error('Toggle status error:', err)
    }
  }

  const deleteTest = async (testId: string) => {
    try {
      await fetch(API(`/api/tests/${testId}`), { method: 'DELETE' })
      setTests(prev => prev.filter(t => t.id !== testId))
      if (viewTest?.id === testId) setViewTest(null)
    } catch (err) {
      console.error('Delete test error:', err)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-3">
            <FileText size={28} className="text-plum" /> ТЕСТ БАСҚАРУ
          </h1>
          <p className="text-text-secondary mt-1">Тесттерді жасаңыз, AI арқылы генерациялаңыз</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-3 font-bold flex items-center gap-2">
          <Plus size={18} /> Жаңа тест
        </button>
      </div>

      {loading ? (
        <div className="card p-16 text-center">
          <div className="w-8 h-8 border-2 border-plum/40 border-t-plum rounded-full animate-spin mx-auto" />
        </div>
      ) : tests.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={48} className="text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-bold text-text-muted mb-2">Тесттер жоқ</h3>
          <p className="text-sm text-text-muted">Жоғарыдағы "Жаңа тест" батырмасын басыңыз</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map(test => (
            <motion.div key={test.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${test.status === 'open' ? 'bg-success/10' : 'bg-gray-100'}`}>
                <FileText size={24} className={test.status === 'open' ? 'text-success' : 'text-text-muted'} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary truncate">{test.title}</h3>
                <p className="text-xs text-text-muted flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(test.created_at).toLocaleDateString('ru-RU')}</span>
                  <span>{test.questions.length} сұрақ</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {test.results.length} жауап</span>
                  <span className={`font-bold ${test.status === 'open' ? 'text-success' : 'text-text-muted'}`}>
                    {test.status === 'open' ? '● Ашық' : '● Жабық'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewTest(test)} className="p-2 hover:bg-plum-pale rounded-lg transition-colors" title="Көру">
                  <Eye size={18} className="text-plum" />
                </button>
                <button onClick={() => toggleStatus(test)} className="p-2 hover:bg-plum-pale rounded-lg transition-colors" title={test.status === 'open' ? 'Жабу' : 'Ашу'}>
                  <RotateCcw size={18} className="text-text-muted" />
                </button>
                <button onClick={() => deleteTest(test.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Өшіру">
                  <Trash2 size={18} className="text-danger" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
              <button onClick={() => setShowCreate(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
              <h2 className="text-xl font-black text-text-primary mb-6 flex items-center gap-2"><Plus size={24} className="text-plum" /> Жаңа тест жасау</h2>

              <div className="bg-plum-pale rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-plum uppercase mb-2 flex items-center gap-2"><Sparkles size={14} /> AI АРҚЫЛЫ ГЕНЕРАЦИЯЛАУ</p>
                <div className="flex gap-2">
                  <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                    placeholder="Тақырыпты жазыңыз (мысалы: Қазақстан тарихы)"
                    className="flex-1 px-4 py-2 rounded-xl border border-border-soft focus:outline-none focus:border-plum text-sm" />
                  <button onClick={handleAIGenerate} disabled={isGenerating} className="btn-primary px-5 py-2 text-sm font-bold flex items-center gap-2">
                    {isGenerating ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Sparkles size={14} />}
                    Генерациялау
                  </button>
                </div>
              </div>

              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Тест тақырыбы" className="w-full px-4 py-3 rounded-xl border border-border-soft mb-4 font-bold focus:outline-none focus:border-plum" />

              {questions.map((q, qi) => (
                <div key={qi} className="bg-bg-secondary rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold text-text-muted mb-2">Сұрақ {qi + 1}</p>
                  <input type="text" value={q.question} placeholder="Сұрақ мәтіні"
                    onChange={e => { const u = [...questions]; u[qi].question = e.target.value; setQuestions(u) }}
                    className="w-full px-3 py-2 rounded-lg border border-border-soft mb-2 text-sm focus:outline-none focus:border-plum" />
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qi}`} checked={q.correct === oi} className="accent-plum"
                          onChange={() => { const u = [...questions]; u[qi].correct = oi; setQuestions(u) }} />
                        <input type="text" value={opt} placeholder={`Нұсқа ${String.fromCharCode(65 + oi)}`}
                          onChange={e => { const u = [...questions]; u[qi].options[oi] = e.target.value; setQuestions(u) }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border-soft text-sm focus:outline-none focus:border-plum" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={() => setQuestions([...questions, { question: '', options: ['', '', '', ''], correct: 0 }])}
                className="text-sm text-plum font-bold hover:underline mb-4">+ Сұрақ қосу</button>

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowCreate(false)} className="px-6 py-2.5 rounded-xl border border-border-soft font-bold text-sm">Бас тарту</button>
                <button onClick={handleSaveTest} disabled={isSaving} className="btn-primary px-8 py-2.5 font-bold text-sm flex items-center gap-2">
                  {isSaving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Сақтау
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Test Modal */}
      <AnimatePresence>
        {viewTest && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewTest(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
              <button onClick={() => setViewTest(null)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
              <h2 className="text-xl font-black text-text-primary mb-1">{viewTest.title}</h2>
              <p className="text-xs text-text-muted mb-4">{viewTest.questions.length} сұрақ • {viewTest.status === 'open' ? '● Ашық' : '● Жабық'}</p>

              {viewTest.questions.map((q, qi) => (
                <div key={qi} className="mb-4 bg-bg-secondary rounded-xl p-4">
                  <p className="text-sm font-bold text-text-primary mb-2">{qi + 1}. {q.question}</p>
                  <div className="grid grid-cols-1 gap-1">
                    {q.options.map((opt, oi) => (
                      <p key={oi} className={`text-sm px-3 py-1.5 rounded-lg ${oi === q.correct ? 'bg-success/10 text-success font-bold' : 'text-text-muted'}`}>
                        {String.fromCharCode(65 + oi)}) {opt}
                        {oi === q.correct && <CheckCircle2 size={14} className="inline ml-2" />}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {viewTest.results.length > 0 && (
                <>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-6 mb-3">Студенттердің нәтижелері</p>
                  <div className="flex flex-col gap-2">
                    {viewTest.results.map((r, i) => (
                      <div key={i} className="flex items-center justify-between bg-bg-secondary rounded-xl px-4 py-2">
                        <span className="text-sm font-bold text-text-primary">{r.student_name}</span>
                        <span className={`text-sm font-bold ${r.score / r.total >= 0.7 ? 'text-success' : 'text-danger'}`}>
                          {r.score}/{r.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
