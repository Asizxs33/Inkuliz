import { Bell, Settings } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { useBiometricStore } from '../../store/biometricStore'

export function Navbar() {
  const { name } = useUserStore()
  const { isCameraEnabled } = useBiometricStore()
  
  const displayName = name || 'Оқушы'
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="h-16 bg-white border-b border-border-soft flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <h2 className="text-text-primary font-bold text-lg">EmoLearn AI</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-9 h-9 rounded-xl bg-plum-pale flex items-center justify-center hover:bg-soft-pink transition-colors">
          <Bell size={18} className="text-plum" />
        </button>
        <button className="w-9 h-9 rounded-xl bg-plum-pale flex items-center justify-center hover:bg-soft-pink transition-colors">
          <Settings size={18} className="text-plum" />
        </button>
        <div className="flex items-center gap-3 ml-2">
          <div className="text-right">
            <p className="text-sm font-bold text-text-primary">{displayName}</p>
            <p className={`text-xs font-medium ${isCameraEnabled ? 'text-success' : 'text-text-muted'}`}>
              STATUS: {isCameraEnabled ? 'ONLINE' : 'OFFLINE'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-plum-pale to-soft-pink flex items-center justify-center border-2 border-rose pulse-ring">
            <span className="text-plum font-bold text-sm">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
