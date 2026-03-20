import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Hand, BarChart3, BookOpen, User, GraduationCap,
  LogOut, MessageSquare, Sparkles, Film, FileText, MoreHorizontal, X
} from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { onTestNotification } from '../../lib/socket'
import { useState, useEffect } from 'react'

const studentItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Басты бет' },
  { to: '/sign-language',  icon: Hand,            label: 'Ымдау тілі' },
  { to: '/analytics',      icon: BarChart3,       label: 'Аналитика' },
  { to: '/dictionary',     icon: BookOpen,        label: 'Сөздік' },
  { to: '/live-chat',      icon: MessageSquare,   label: 'Сұхбат' },
  { to: '/tests',          icon: FileText,        label: 'Тесттер' },
  { to: '/video-translate',icon: Film,            label: 'Бейне' },
  { to: '/ai-tutor',       icon: Sparkles,        label: 'AI' },
  { to: '/profile',        icon: User,            label: 'Профиль' },
]

const teacherItems = [
  { to: '/teacher',          icon: GraduationCap,   label: 'Сыныбым' },
  { to: '/teacher/tests',    icon: LayoutDashboard, label: 'Тесттер' },
  { to: '/teacher/analytics',icon: BarChart3,       label: 'Аналитика' },
  { to: '/live-chat',        icon: MessageSquare,   label: 'Сұхбат' },
  { to: '/profile',          icon: User,            label: 'Профиль' },
]

// Primary items shown in mobile bottom bar (max 4 + More button)
const studentPrimary = ['/dashboard', '/sign-language', '/tests', '/ai-tutor']
const teacherPrimary = ['/teacher', '/teacher/tests', '/teacher/analytics', '/live-chat', '/profile']

export function Sidebar() {
  const { role, logout } = useUserStore()
  const navigate = useNavigate()
  const location = useLocation()
  const navItems = role === 'teacher' ? teacherItems : studentItems
  const [testBadge, setTestBadge] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (role !== 'student') return
    const cleanup = onTestNotification(() => setTestBadge(n => n + 1))
    return cleanup
  }, [role])

  useEffect(() => {
    if (location.pathname === '/tests') setTestBadge(0)
    setMobileMenuOpen(false)
  }, [location.pathname])

  const primaryPaths = role === 'teacher' ? teacherPrimary : studentPrimary
  const primaryItems = navItems.filter(item => primaryPaths.includes(item.to))
  const secondaryItems = navItems.filter(item => !primaryPaths.includes(item.to))

  return (
    <>
      {/* ── DESKTOP SIDEBAR (md+) ── */}
      <aside className="sidebar hidden md:flex w-[72px] hover:w-[220px] transition-all duration-300 flex-col items-center py-6 group overflow-hidden shrink-0 z-50">
        <div className="flex items-center gap-3 px-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plum to-rose flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="text-plum font-extrabold text-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            FeelFlow
          </span>
        </div>

        <nav className="flex flex-col gap-1 w-full px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ${
                  isActive ? 'nav-item-active font-bold text-plum' : 'text-text-secondary hover:bg-plum-pale hover:text-plum'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative shrink-0">
                    <item.icon size={22} className={isActive ? 'text-plum' : 'text-text-muted'} />
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
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-3 px-3 py-3 w-full text-danger hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut size={22} className="shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-bold">
              Шығу
            </span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border-soft"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-14">
          {primaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors relative ${
                  isActive ? 'text-plum' : 'text-text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={20} />
                    {item.to === '/tests' && testBadge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {testBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute top-0 inset-x-2 h-0.5 bg-plum rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* More button — only for student (9 items don't fit) */}
          {secondaryItems.length > 0 && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 text-text-muted"
            >
              <MoreHorizontal size={20} />
              <span className="text-[9px] font-bold">Көбірек</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── MOBILE SLIDE-UP SHEET ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-[60]"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed bottom-0 inset-x-0 z-[70] bg-white rounded-t-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="font-extrabold text-text-primary text-base">Мәзір</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center"
                >
                  <X size={16} className="text-text-muted" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1 px-3 py-3">
                {secondaryItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors ${
                        isActive ? 'bg-plum/10 text-plum' : 'text-text-secondary hover:bg-plum-pale'
                      }`
                    }
                  >
                    <item.icon size={22} />
                    <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
                  </NavLink>
                ))}
              </div>

              <div className="px-4 pb-4 pt-1 border-t border-border-soft mt-1">
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-danger hover:bg-red-50 transition-colors font-bold"
                >
                  <LogOut size={20} />
                  <span>Шығу</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
