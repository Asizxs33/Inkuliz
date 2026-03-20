import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Hand, BarChart3, BookOpen, User, GraduationCap, LogOut, MessageSquare, Sparkles, Film, FileText
} from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { onTestNotification } from '../../lib/socket'
import { useState, useEffect } from 'react'

const studentItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Басты бет' },
  { to: '/sign-language', icon: Hand, label: 'Ымдау тілі' },
  { to: '/analytics', icon: BarChart3, label: 'Аналитика' },
  { to: '/dictionary', icon: BookOpen, label: 'Сөздік' },
  { to: '/live-chat', icon: MessageSquare, label: 'Сұхбат' },
  { to: '/tests', icon: FileText, label: 'Тесттер' },
  { to: '/video-translate', icon: Film, label: 'Бейне аудару' },
  { to: '/ai-tutor', icon: Sparkles, label: 'AI Репетитор' },
  { to: '/profile', icon: User, label: 'Профиль' },
]

const teacherItems = [
  { to: '/teacher', icon: GraduationCap, label: 'Сыныбым' },
  { to: '/teacher/tests', icon: LayoutDashboard, label: 'Тесттер' },
  { to: '/teacher/analytics', icon: BarChart3, label: 'Аналитика' },
  { to: '/live-chat', icon: MessageSquare, label: 'Сұхбат' },
  { to: '/profile', icon: User, label: 'Профиль' },
]

export function Sidebar() {
  const { role, logout } = useUserStore()
  const navigate = useNavigate()
  const location = useLocation()
  const navItems = role === 'teacher' ? teacherItems : studentItems
  const [testBadge, setTestBadge] = useState(0)

  useEffect(() => {
    if (role !== 'student') return
    const cleanup = onTestNotification(() => {
      setTestBadge(n => n + 1)
    })
    return cleanup
  }, [role])

  // Clear badge when user navigates to /tests
  useEffect(() => {
    if (location.pathname === '/tests') setTestBadge(0)
  }, [location.pathname])

  return (
    <aside className="sidebar w-[72px] hover:w-[220px] transition-all duration-300 flex flex-col items-center py-6 group overflow-hidden shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plum to-rose flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">E</span>
        </div>
        <span className="text-plum font-extrabold text-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          EmoLearn AI
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 w-full px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'nav-item-active font-bold text-plum'
                  : 'text-text-secondary hover:bg-plum-pale hover:text-plum'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative shrink-0">
                  <item.icon
                    size={22}
                    className={isActive ? 'text-plum' : 'text-text-muted'}
                  />
                  {item.to === '/tests' && testBadge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {testBadge}
                    </span>
                  )}
                </div>
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-plum rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-3 w-full">
        <button 
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="flex items-center gap-3 px-3 py-3 w-full text-danger hover:bg-red-50 rounded-xl transition-all duration-200"
        >
          <LogOut size={22} className="shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-bold">
            Шығу
          </span>
        </button>
      </div>
    </aside>
  )
}
