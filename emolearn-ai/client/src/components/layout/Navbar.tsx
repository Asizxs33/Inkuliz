import { Bell, Settings, X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { useBiometricStore } from '../../store/biometricStore'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { onNotification } from '../../lib/socket'

interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'alert' | string
  message: string | React.ReactNode
  from: string
  time: string
  read: boolean
  isInvite?: boolean
  inviteData?: any
}

export function Navbar() {
  const { name, id: userId, role } = useUserStore()
  const { isCameraEnabled } = useBiometricStore()
  const navigate = useNavigate()
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const displayName = name || 'Пайдаланушы'
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!userId) return
    const cleanup = onNotification((data: any) => {
      // Only process if it's for me or a broadcast (empty targetUserId)
      if (data.targetUserId && data.targetUserId !== userId) return
      
      const parsedMessage = data.type === 'class_invite' ? JSON.parse(data.message) : null
      
      const newItem: NotificationItem = {
        id: data.id || Date.now().toString(),
        type: data.type || 'info',
        message: data.type === 'class_invite' 
          ? `Сізді "${parsedMessage?.class_name}" сыныбына шақырды.`
          : data.message,
        from: parsedMessage?.teacher_name || data.from || 'Жүйе',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        isInvite: data.type === 'class_invite',
        inviteData: { alert_id: data.id, class_id: parsedMessage?.class_id, ...parsedMessage }
      }
      setNotifications(prev => [newItem, ...prev])
    })
    return cleanup
  }, [userId])

  // Fetch initial exact notifications (like pending invites)
  useEffect(() => {
    if (!userId || role === 'teacher') return
    const fetchInvites = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/invitations/${userId}`)
        const data = await res.json()
        if (data.invitations) {
          const loaded = data.invitations.map((inv: any) => {
            const parsed = JSON.parse(inv.message)
            return {
              id: inv.id,
              type: 'class_invite',
              message: `Сізді "${parsed.class_name}" сыныбына шақырды.`,
              from: parsed.teacher_name || 'Мұғалім',
              time: new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
              isInvite: true,
              inviteData: { alert_id: inv.id, class_id: parsed.class_id, ...parsed }
            }
          })
          setNotifications(prev => [...loaded, ...prev])
        }
      } catch (err) { console.error(err) }
    }
    fetchInvites()
  }, [userId, role])

  // Optional: Add some mock notifications just to show it works, if list is empty
  useEffect(() => {
    if (notifications.length === 0) {
      setNotifications([
        {
          id: '1',
          type: 'info',
          message: 'Жүйеге қош келдіңіз!',
          from: 'FeelFlow',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false
        }
      ])
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle2 size={16} className="text-success" />
      case 'alert': return <AlertCircle size={16} className="text-danger" />
      default: return <Info size={16} className="text-plum" />
    }
  }

  return (
    <header className="h-14 md:h-16 bg-white border-b border-border-soft flex items-center justify-between px-3 md:px-6 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <h2 className="text-text-primary font-bold text-base md:text-lg">FeelFlow</h2>
      </div>
      <div className="flex items-center gap-2 md:gap-4">

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-plum-pale flex items-center justify-center hover:bg-soft-pink transition-colors relative"
            title="Хабарландырулар"
          >
            <Bell size={18} className="text-plum" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl border border-border-soft overflow-hidden"
              >
                <div className="p-4 border-b border-border-soft flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-text-primary flex items-center gap-2">
                    <Bell size={16} className="text-plum" /> Хабарландырулар
                  </h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[10px] font-bold text-plum hover:underline">
                      Бәрін оқылды ету
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-text-muted flex flex-col items-center">
                      <Bell size={32} className="opacity-20 mb-2" />
                      <p className="text-sm font-medium">Жаңа хабарландырулар жоқ</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-4 border-b border-border-soft last:border-0 hover:bg-plum-pale/30 transition-colors flex gap-3 ${notif.read ? 'opacity-70' : 'bg-plum-pale/10'}`}
                          onClick={() => {
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
                          }}
                        >
                          <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.type === 'alert' ? 'bg-danger/10' : notif.type === 'success' ? 'bg-success/10' : 'bg-plum/10'}`}>
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-text-muted mb-0.5 flex justify-between">
                              <span>{notif.from}</span>
                              <span className="font-normal opacity-70">{notif.time}</span>
                            </p>
                            <p className="text-sm text-text-primary font-medium leading-tight mb-2">
                              {notif.message}
                            </p>
                            {notif.isInvite && !notif.read && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/accept-invite`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ alert_id: notif.inviteData.alert_id, student_id: userId, class_id: notif.inviteData.class_id })
                                      })
                                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true, message: 'Шақыру қабылданды ✅' } : n))
                                      window.location.reload()
                                    } catch {}
                                  }}
                                  className="btn-primary text-[10px] px-3 py-1 font-bold"
                                >
                                  Қабылдау
                                </button>
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/decline-invite`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ alert_id: notif.inviteData.alert_id })
                                      })
                                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true, message: 'Шақырудан бас тартылды ❌' } : n))
                                    } catch {}
                                  }}
                                  className="bg-gray-100 text-text-muted hover:bg-gray-200 text-[10px] px-3 py-1 font-bold rounded-lg transition-colors"
                                >
                                  Бас тарту
                                </button>
                              </div>
                            )}
                          </div>
                          {!notif.read && <div className="w-2 h-2 rounded-full bg-plum mt-3 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings — hidden on mobile (accessible via Profile in bottom nav) */}
        <button
          onClick={() => navigate('/profile')}
          className="hidden md:flex w-10 h-10 rounded-xl bg-plum-pale items-center justify-center hover:bg-soft-pink transition-colors group"
          title="Баптаулар (Профиль)"
        >
          <Settings size={18} className="text-plum group-hover:rotate-45 transition-transform duration-300" />
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Name + status — hidden on mobile */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-text-primary">{displayName}</p>
            {role === 'student' ? (
              <p className={`text-xs font-bold ${isCameraEnabled ? 'text-success' : 'text-text-muted'}`}>
                {isCameraEnabled ? '● ОНЛАЙН' : '○ ОФЛАЙН'}
              </p>
            ) : (
              <p className="text-xs font-bold text-plum">👨‍🏫 МҰҒАЛІМ</p>
            )}
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-plum-pale to-soft-pink flex items-center justify-center border-2 border-rose pulse-ring shrink-0"
          >
            <span className="text-plum font-bold text-sm">{initials}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
