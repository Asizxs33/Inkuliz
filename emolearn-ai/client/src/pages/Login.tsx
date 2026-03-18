import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, ArrowRight } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const setUser = useUserStore((s) => s.setUser)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Қате пайда болды')
      
      localStorage.setItem('emolearn_token', data.token)
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        isLoggedIn: true,
        token: data.token
      })
      
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-border-soft"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-plum to-rose rounded-2xl flex items-center justify-center shadow-lg shadow-plum/20 mb-4">
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary">EmoLearn AI</h1>
          <p className="text-sm text-text-muted mt-1">Оқу платформасына қош келдіңіз</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-danger rounded-xl text-sm font-bold border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Email</label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-soft bg-bg-primary text-text-primary focus:outline-none focus:border-plum focus:ring-2 focus:ring-plum/20 transition-all font-medium"
              placeholder="Мекен-жайыңызды енгізіңіз"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Құпиясөз</label>
            <input 
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-soft bg-bg-primary text-text-primary focus:outline-none focus:border-plum focus:ring-2 focus:ring-plum/20 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 btn-primary py-3.5 font-bold flex items-center justify-center gap-2 text-lg shadow-lg shadow-plum/25 hover:shadow-plum/40 w-full"
          >
            {loading ? 'Жүктелуде...' : 'Кіру'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-text-muted">
          Аккаунтыңыз жоқ па?{' '}
          <button onClick={() => navigate('/register')} className="text-plum font-bold hover:underline">
            Тіркелу
          </button>
        </p>
      </motion.div>
    </div>
  )
}
