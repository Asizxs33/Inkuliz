import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Hand, MessageSquare, Info } from 'lucide-react'
import { getSocket, joinLiveRoom, emitLiveChatMessage, onLiveChatMessage } from '../lib/socket'
import { useUserStore } from '../store/userStore'

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  isSignLanguage: boolean;
  timestamp: Date;
}

export default function LiveChat() {
  const { id: userId, name: userName } = useUserStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    joinLiveRoom()
    const cleanup = onLiveChatMessage((msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
    })
    return cleanup
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || !userId) return

    emitLiveChatMessage({
      userId,
      name: userName || 'Пайдаланушы',
      text: inputText,
      isSignLanguage: false,
      timestamp: new Date()
    })

    setInputText('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 p-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-plum to-rose rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 rotate-12">
          <MessageSquare size={160} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2">Live Сұхбат</h1>
          <p className="text-white/80 max-w-xl">
             Бұл жерде сіз ымдау тілінде сөйлейтін студенттермен нақты уақытта хат алмаса аласыз. 
             Ымдау тілінен аударылған хабарламалар <Hand size={14} className="inline mx-1" /> белгісімен көрсетіледі.
          </p>
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
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-text-muted">{isMe ? 'Сіз' : msg.name}</span>
                      <span className="text-[10px] text-text-muted opacity-60">
                         {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] shadow-sm ${
                      isMe 
                        ? 'bg-gradient-to-r from-plum to-rose text-white rounded-tr-sm' 
                        : 'bg-white text-text-primary rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.isSignLanguage && (
                      <div className="mt-1 flex items-center gap-1 px-1">
                        <Hand size={12} className="text-plum" />
                        <span className="text-[10px] text-plum font-medium uppercase tracking-tighter">Ыммен жіберілді</span>
                      </div>
                    )}
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
        <div className="w-80 flex flex-col gap-4 max-lg:hidden">
           <div className="card h-fit">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-plum/10 flex items-center justify-center text-plum font-bold">
                    <Info size={18} />
                 </div>
                 <h4 className="font-bold text-sm">Сұхбат нұсқаулары</h4>
              </div>
              <ul className="space-y-3 text-xs text-text-muted">
                 <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-plum mt-1 flex-shrink-0" />
                    <span>Ымдау тілінде сөйлейтін студенттердің хабарламалары автоматты түрде аударылып келеді.</span>
                 </li>
                 <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-plum mt-1 flex-shrink-0" />
                    <span>Сөйлесу кезінде қарапайым және қысқа сөйлемдерді қолданыңыз.</span>
                 </li>
                 <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-plum mt-1 flex-shrink-0" />
                    <span>Инклюзивті орта — бұл әрқайсымыз үшін маңызды.</span>
                 </li>
              </ul>
           </div>

           <div className="card h-fit flex flex-col items-center gap-4 py-8 text-center bg-plum-pale/50 border-plum/20 border-dashed">
              <Hand size={48} className="text-plum opacity-50" />
              <div>
                <p className="font-bold text-sm mb-1">Сөйлесе аласыз!</p>
                <p className="text-[10px] text-text-muted opacity-80">Біз барлығына тең мүмкіндіктер береміз.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
