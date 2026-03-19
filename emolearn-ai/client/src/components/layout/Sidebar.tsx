import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Hand, BarChart3, BookOpen, User, GraduationCap, LogOut, MessageSquare, Sparkles
} from 'lucide-react'
import { useUserStore } from '../../store/userStore'

const studentItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Басты бет' },
  { to: '/sign-language', icon: Hand, label: 'Ымдау тілі' },
  { to: '/analytics', icon: BarChart3, label: 'Аналитика' },
  { to: '/dictionary', icon: BookOpen, label: 'Сөздік' },
  { to: '/ai-tutor', icon: Sparkles, label: 'AI Репетитор' },
  { to: '/profile', icon: User, label: 'Профиль' },
]

const teacherItems = [
  { to: '/teacher', icon: GraduationCap, label: 'Сыныбым' },
  { to: '/live-chat', icon: MessageSquare, label: 'Сұхбат' },
  { to: '/profile', icon: User, label: 'Профиль' },
]

export function Sidebar() {
  const { role, logout } = useUserStore()
  const navigate = useNavigate()
  const navItems = role === 'teacher' ? teacherItems : studentItems

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
                <item.icon
                  size={22}
                  className={`shrink-0 ${isActive ? 'text-plum' : 'text-text-muted'}`}
                />
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
