import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { onTestNotification } from '../lib/socket'
import { useUserStore } from '../store/userStore'

interface Toast { id: string; title: string }

export default function NotificationToast() {
  const { role } = useUserStore()
  const [toasts, setToasts] = useState<Toast[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (role !== 'student') return
    const cleanup = onTestNotification((data) => {
      const toast: Toast = { id: data.id, title: data.title }
      setToasts(prev => [...prev.slice(-2), toast]) // max 3 toasts
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 7000)
    })
    return cleanup
  }, [role])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            className="pointer-events-auto flex items-start gap-3 bg-white border border-plum/20 shadow-xl rounded-2xl p-4 w-80"
          >
            <div className="w-10 h-10 rounded-xl bg-plum flex items-center justify-center shrink-0">
              <FileText size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-plum uppercase tracking-wide">Жаңа тест жарияланды!</p>
              <p className="text-sm font-bold text-text-primary mt-0.5 truncate">{toast.title}</p>
              <button
                onClick={() => { navigate('/tests'); dismiss(toast.id) }}
                className="mt-2 text-xs font-bold text-plum hover:underline"
              >
                Тесттерге өту →
              </button>
            </div>
            <button onClick={() => dismiss(toast.id)} className="text-text-muted hover:text-text-primary shrink-0">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
