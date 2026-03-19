import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { FileText, Plus, Sparkles, Trash2, Eye, RotateCcw, Clock, Users, CheckCircle2, X, ChevronDown } from 'lucide-react'

interface Test {
  id: string
  title: string
  questions: { question: string; options: string[]; correct: number }[]
  createdAt: string
  status: 'open' | 'closed'
  results: { studentName: string; score: number; total: number }[]
}

const TESTS_KEY = 'emolearn_teacher_tests'

function loadTests(): Test[] {
  try {
    const d = localStorage.getItem(TESTS_KEY)
    return d ? JSON.parse(d) : []
  } catch { return [] }
}

function saveTests(tests: Test[]) {
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests))
}

export default function TeacherTests() {
  const { name } = useUserStore()
  const [tests, setTests] = useState<Test[]>(loadTests())
  const [showCreate, setShowCreate] = useState(false)

  // Create test form
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correct: number }[]>([
    { question: '', options: ['', '', '', ''], correct: 0 }
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiTopic, setAiTopic] = useState('')

  // View test
  const [viewTest, setViewTest] = useState<Test | null>(null)

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct: 0 }])
  }

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return
    setIsGenerating(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Маған "${aiTopic}" тақырыбы бойынша 5 тест сұрағын JSON форматында жаса. Әр сұрақтың 4 нұсқасы мен дұрыс жауабы болсын. Форматы: [{"question":"...","options":["A","B","C","D"],"correct":0}] Тек JSON массивін қайтар, басқа мәтін жазба.`,
          userId: 'teacher-ai'
        })
      })
      const data = await res.json()
      const reply = data.response || data.reply || ''
      // Try to parse JSON from AI response
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

  const handleSaveTest = () => {
    if (!title.trim() || questions.every(q => !q.question.trim())) return
    const newTest: Test = {
      id: Date.now().toString(),
      title,
      questions: questions.filter(q => q.question.trim()),
      createdAt: new Date().toISOString(),
      status: 'open',
      results: []
    }
    const updated = [newTest, ...tests]
    setTests(updated)
    saveTests(updated)
    setShowCreate(false)
    setTitle('')
    setQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }])
  }

  const toggleTestStatus = (testId: string) => {
    const updated = tests.map(t => t.id === testId ? { ...t, status: t.status === 'open' ? 'closed' as const : 'open' as const } : t)
    setTests(updated)
    saveTests(updated)
  }

  const deleteTest = (testId: string) => {
    const updated = tests.filter(t => t.id !== testId)
    setTests(updated)
    saveTests(updated)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
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

      {/* Test List */}
      {tests.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={48} className="text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-bold text-text-muted mb-2">Тесттер жоқ</h3>
          <p className="text-sm text-text-muted">Жоғарыдағы "Жаңа тест" батырмасын басып, бірінші тестіңізді жасаңыз</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map(test => (
            <motion.div
              key={test.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="card flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${test.status === 'open' ? 'bg-success/10' : 'bg-gray-100'}`}>
                <FileText size={24} className={test.status === 'open' ? 'text-success' : 'text-text-muted'} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary truncate">{test.title}</h3>
                <p className="text-xs text-text-muted flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(test.createdAt).toLocaleDateString('kk-KZ')}</span>
                  <span>{test.questions.length} сұрақ</span>
                  <span className={`font-bold ${test.status === 'open' ? 'text-success' : 'text-text-muted'}`}>
                    {test.status === 'open' ? '● Ашық' : '● Жабық'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewTest(test)} className="p-2 hover:bg-plum-pale rounded-lg transition-colors" title="Көру">
                  <Eye size={18} className="text-plum" />
                </button>
                <button onClick={() => toggleTestStatus(test.id)} className="p-2 hover:bg-plum-pale rounded-lg transition-colors" title={test.status === 'open' ? 'Жабу' : 'Ашу'}>
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

      {/* Create Test Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <button onClick={() => setShowCreate(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>

              <h2 className="text-xl font-black text-text-primary mb-6 flex items-center gap-2">
                <Plus size={24} className="text-plum" /> Жаңа тест жасау
              </h2>

              {/* AI Generate */}
              <div className="bg-plum-pale rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-plum uppercase mb-2 flex items-center gap-2">
                  <Sparkles size={14} /> AI АРҚЫЛЫ ГЕНЕРАЦИЯЛАУ
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="Тақырыпты жазыңыз (мысалы: Қазақстан тарихы)"
                    className="flex-1 px-4 py-2 rounded-xl border border-border-soft focus:outline-none focus:border-plum text-sm"
                  />
                  <button onClick={handleAIGenerate} disabled={isGenerating} className="btn-primary px-5 py-2 text-sm font-bold flex items-center gap-2">
                    {isGenerating ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Sparkles size={14} />}
                    Генерациялау
                  </button>
                </div>
              </div>

              {/* Manual */}
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Тест тақырыбы"
                className="w-full px-4 py-3 rounded-xl border border-border-soft mb-4 font-bold focus:outline-none focus:border-plum"
              />

              {questions.map((q, qi) => (
                <div key={qi} className="bg-bg-secondary rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold text-text-muted mb-2">Сұрақ {qi + 1}</p>
                  <input
                    type="text"
                    value={q.question}
                    onChange={e => {
                      const updated = [...questions]
                      updated[qi].question = e.target.value
                      setQuestions(updated)
                    }}
                    placeholder="Сұрақ мәтіні"
                    className="w-full px-3 py-2 rounded-lg border border-border-soft mb-2 text-sm focus:outline-none focus:border-plum"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correct === oi}
                          onChange={() => {
                            const updated = [...questions]
                            updated[qi].correct = oi
                            setQuestions(updated)
                          }}
                          className="accent-plum"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const updated = [...questions]
                            updated[qi].options[oi] = e.target.value
                            setQuestions(updated)
                          }}
                          placeholder={`Нұсқа ${String.fromCharCode(65 + oi)}`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border-soft text-sm focus:outline-none focus:border-plum"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={addQuestion} className="text-sm text-plum font-bold hover:underline mb-4">
                + Сұрақ қосу
              </button>

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowCreate(false)} className="px-6 py-2.5 rounded-xl border border-border-soft font-bold text-sm">
                  Бас тарту
                </button>
                <button onClick={handleSaveTest} className="btn-primary px-8 py-2.5 font-bold text-sm">
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <button onClick={() => setViewTest(null)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>
              <h2 className="text-xl font-black text-text-primary mb-1">{viewTest.title}</h2>
              <p className="text-xs text-text-muted mb-6">{viewTest.questions.length} сұрақ • {viewTest.status === 'open' ? '● Ашық' : '● Жабық'}</p>

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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
