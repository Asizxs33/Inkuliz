import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Hand, MessageSquare, Info, Users } from 'lucide-react'
import { joinClassChat, emitClassChatMessage, onClassChatMessage, onClassChatUserJoined } from '../lib/socket'
import { useUserStore } from '../store/userStore'

interface ChatMessage {
  id: string
  classId: string
  userId: string
  name: string
  text: string
  role: string
  timestamp: string
}

export default function LiveChat() {
  const { id: userId, name: userName, role } = useUserStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Class info
  const [classInfo, setClassInfo] = useState<any>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  // Load class info — try student endpoint first, then teacher
  useEffect(() => {
    if (!userId) return
    const fetchClass = async () => {
      try {
        // Try student class first
        const res1 = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/student/${userId}`)
        const data1 = await res1.json()
        if (data1.class) {
          setClassInfo(data1.class)
          return
        }
      } catch {}

      try {
        // Then try teacher classes
        const res2 = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/classes/${userId}`)
        const data2 = await res2.json()
        if (data2.classes?.length > 0) {
          setClassInfo(data2.classes[0])
        }
      } catch {}
    }
    fetchClass()
  }, [userId])

  // Join class chat room
  useEffect(() => {
    if (!classInfo?.id || !userId) return
    
    joinClassChat(classInfo.id, userId, userName || 'Пайдаланушы')
    
    const cleanupMsg = onClassChatMessage((msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
    })
    
    const cleanupJoin = onClassChatUserJoined((data: any) => {
      setOnlineUsers(prev => prev.includes(data.userName) ? prev : [...prev, data.userName])
    })
    
    return () => { cleanupMsg(); cleanupJoin() }
  }, [classInfo?.id, userId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || !userId || !classInfo?.id) return

    emitClassChatMessage({
      classId: classInfo.id,
      userId,
      name: userName || 'Пайдаланушы',
      text: inputText,
      role: role || 'student',
      timestamp: new Date().toISOString()
    })

    setInputText('')
  }

  if (!classInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="card max-w-md w-full p-8 text-center">
          <MessageSquare size={48} className="text-text-muted mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-extrabold text-text-primary mb-2">Сынып табылмады</h2>
          <p className="text-sm text-text-muted">Чатқа кіру үшін алдымен сыныпқа қосылуыңыз керек. Мұғалімнен шақыру кодын сұраңыз.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-plum to-rose rounded-2xl p-5 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 rotate-12">
          <MessageSquare size={120} />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">{classInfo.name} — Сынып чаты</h1>
            <p className="text-white/70 text-sm">
              Мұғалім мен оқушылар бір-бірімен нақты уақытта сөйлесе алады
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-bold">LIVE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-bg-secondary rounded-2xl shadow-xl border border-white/10 overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-16 h-16 rounded-full bg-plum-pale flex items-center justify-center text-plum mb-4">
                  <MessageSquare size={32} />
                </div>
                <h3 className="font-bold text-lg mb-1">Сөйлесуді бастаңыз</h3>
                <p className="text-sm">Төменде хабарлама жазып жіберіңіз</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.userId === userId
                const isTeacher = msg.role === 'teacher'
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id || idx}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className={`text-xs font-bold ${isTeacher ? 'text-plum' : 'text-text-muted'}`}>
                        {isMe ? 'Сіз' : msg.name}
                        {isTeacher && !isMe && ' 👨‍🏫'}
                      </span>
                      <span className="text-[10px] text-text-muted opacity-60">
                         {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] shadow-sm ${
                      isMe 
                        ? 'bg-gradient-to-r from-plum to-rose text-white rounded-tr-sm' 
                        : isTeacher
                          ? 'bg-plum-pale text-text-primary rounded-tl-sm border border-plum/20'
                          : 'bg-white text-text-primary rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </motion.div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-border-soft flex gap-2"
          >
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Хабарламаңызды жазыңыз..."
              className="flex-1 px-4 py-3 bg-bg-secondary rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-plum/30 transition-all text-sm"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 bg-plum text-white rounded-xl shadow-lg shadow-plum/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        {/* Sidebar info */}
        <div className="w-72 flex flex-col gap-4 max-lg:hidden">
           <div className="card h-fit">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-plum/10 flex items-center justify-center text-plum font-bold">
                    <Info size={18} />
                 </div>
                 <h4 className="font-bold text-sm">Чат туралы</h4>
              </div>
              <ul className="space-y-3 text-xs text-text-muted">
                 <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-plum mt-1 flex-shrink-0" />
                    <span>Бұл чатта тек <strong>{classInfo.name}</strong> сыныбындағы мұғалім мен оқушылар сөйлесе алады.</span>
                 </li>
                 <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-plum mt-1 flex-shrink-0" />
                    <span>Мұғалім хабарламалары айрықша фонмен (күлгін) белгіленеді.</span>
                 </li>
                 <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-plum mt-1 flex-shrink-0" />
                    <span>Хабарламалар нақты уақытта жеткізіледі.</span>
                 </li>
              </ul>
           </div>

           {onlineUsers.length > 0 && (
             <div className="card h-fit">
               <div className="flex items-center gap-2 mb-3">
                 <Users size={16} className="text-success" />
                 <h4 className="font-bold text-sm">Онлайн ({onlineUsers.length})</h4>
               </div>
               <div className="flex flex-wrap gap-2">
                 {onlineUsers.map(u => (
                   <span key={u} className="text-xs bg-success/10 text-success font-bold px-3 py-1 rounded-full">{u}</span>
                 ))}
               </div>
             </div>
           )}

           <div className="card h-fit bg-plum-pale/50 border-plum/20 border-dashed text-center py-6">
              <Hand size={36} className="text-plum opacity-50 mx-auto mb-2" />
              <p className="font-bold text-sm mb-1">Шақыру коды</p>
              <p className="text-lg font-black text-plum tracking-wider">{classInfo.invite_code || '—'}</p>
           </div>
        </div>
      </div>
    </div>
  )
}
