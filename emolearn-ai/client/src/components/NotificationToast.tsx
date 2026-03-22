import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, CheckCircle2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { onTestNotification, onTestSubmitted } from '../lib/socket'
import { useUserStore } from '../store/userStore'

interface Toast {
  id: string
  type: 'new_test' | 'submitted'
  title: string
  subtitle?: string
  score?: number
  total?: number
  testId?: string
}

export default function NotificationToast() {
  const { role } = useUserStore()
  const [toasts, setToasts] = useState<Toast[]>([])
  const navigate = useNavigate()

  const addToast = (toast: Toast) => {
    setToasts(prev => [...prev.slice(-2), toast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, 7000)
  }

  // Student: new test published
  useEffect(() => {
    if (role !== 'student') return
    return onTestNotification((data) => {
      addToast({ id: data.id, type: 'new_test', title: data.title })
    })
  }, [role])

  // Teacher: student submitted a test
  useEffect(() => {
    if (role !== 'teacher') return
    return onTestSubmitted((data) => {
      addToast({
        id: `${data.testId}_${Date.now()}`,
        type: 'submitted',
        title: data.studentName,
        subtitle: data.testTitle,
        score: data.score,
        total: data.total,
        testId: data.testId,
      })
    })
  }, [role])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const isSubmitted = toast.type === 'submitted'
          const pass = isSubmitted && toast.score !== undefined && toast.total ? (toast.score / toast.total) >= 0.7 : false
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              className="pointer-events-auto flex items-start gap-3 bg-white border border-plum/20 shadow-xl rounded-2xl p-4 w-80"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSubmitted ? (pass ? 'bg-success' : 'bg-rose') : 'bg-plum'}`}>
                {isSubmitted
                  ? <CheckCircle2 size={18} className="text-white" />
                  : <FileText size={18} className="text-white" />
                }
              </div>
              <div className="flex-1 min-w-0">
                {isSubmitted ? (
                  <>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wide">Тест тапсырылды</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5 truncate">{toast.title}</p>
                    <p className="text-xs text-text-muted truncate">{toast.subtitle}</p>
                    <p className={`text-xs font-bold mt-1 ${pass ? 'text-success' : 'text-rose'}`}>
                      {toast.score}/{toast.total} · {Math.round((toast.score! / toast.total!) * 100)}% — {pass ? 'Өтті ✓' : 'Өтпеді ✗'}
                    </p>
                    <button
                      onClick={() => { navigate('/teacher/tests'); dismiss(toast.id) }}
                      className="mt-1.5 text-xs font-bold text-plum hover:underline"
                    >
                      Нәтижелерге өту →
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-plum uppercase tracking-wide">Жаңа тест жарияланды!</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5 truncate">{toast.title}</p>
                    <button
                      onClick={() => { navigate('/tests'); dismiss(toast.id) }}
                      className="mt-2 text-xs font-bold text-plum hover:underline"
                    >
                      Тесттерге өту →
                    </button>
                  </>
                )}
              </div>
              <button onClick={() => dismiss(toast.id)} className="text-text-muted hover:text-text-primary shrink-0">
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
