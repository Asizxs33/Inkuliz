import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Hand, MessageSquare, Info, Users, X, Sparkles, RotateCcw } from 'lucide-react'
import { joinClassChat, emitClassChatMessage, onClassChatMessage, onClassChatUserJoined } from '../lib/socket'
import { useUserStore } from '../store/userStore'
import { useBiometricStore } from '../store/biometricStore'
import { recognizeGesture, GestureHistory } from '../lib/gestureRecognizer'

const CHAT_GESTURE_HISTORY = new GestureHistory(15)

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
  const { handLandmarks } = useBiometricStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Sign language input mode
  const [signMode, setSignMode] = useState(false)
  const [currentGesture, setCurrentGesture] = useState('—')
  const [holdProgress, setHoldProgress] = useState(0)
  const [lastAdded, setLastAdded] = useState('')
  const [signWords, setSignWords] = useState<string[]>([])
  const [aiSentence, setAiSentence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Class info
  const [classInfo, setClassInfo] = useState<any>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  // Load class info based on user role
  useEffect(() => {
    if (!userId) return
    const fetchClass = async () => {
      const apiBase = import.meta.env.VITE_API_URL || ''
      
      if (role === 'teacher') {
        // Teacher: get their own classes
        try {
          const res = await fetch(`${apiBase}/api/classes/${userId}`)
          const data = await res.json()
          if (data.classes?.length > 0) {
            setClassInfo(data.classes[0])
            return
          }
        } catch {}
      } else {
        // Student: get the class they belong to
        try {
          const res = await fetch(`${apiBase}/api/classes/student/${userId}`)
          const data = await res.json()
          if (data.class) {
            setClassInfo(data.class)
            return
          }
        } catch {}
      }

      // Fallback: try the other endpoint
      try {
        const fallbackUrl = role === 'teacher' 
          ? `${apiBase}/api/classes/student/${userId}`
          : `${apiBase}/api/classes/${userId}`
        const res = await fetch(fallbackUrl)
        const data = await res.json()
        if (data.class) setClassInfo(data.class)
        else if (data.classes?.length > 0) setClassInfo(data.classes[0])
      } catch {}
    }
    fetchClass()
  }, [userId, role])

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

  // Process hand gestures when sign mode is active
  useEffect(() => {
    if (!signMode || !handLandmarks?.length) return
    const result = recognizeGesture(handLandmarks)
    const histResult = result.isMlMatch
      ? CHAT_GESTURE_HISTORY.forceUnlock(result.wordKz)
      : CHAT_GESTURE_HISTORY.push(result.wordKz)

    setCurrentGesture(result.wordKz && result.wordKz !== '—' ? result.wordKz : '—')
    setHoldProgress(histResult.progress)

    if (histResult.isUnlocked && histResult.word && histResult.word !== '...' && histResult.word !== '—') {
      const w = histResult.word!
      setLastAdded(w)
      setSignWords(prev => [...prev.slice(-9), w])
      setInputText(prev => prev ? `${prev} ${w}` : w)
      setTimeout(() => setLastAdded(''), 1500)
    }
  }, [handLandmarks, signMode])

  // AI sentence construction: fires 2s after last new sign word
  useEffect(() => {
    if (!signMode || signWords.length === 0) return
    const timer = setTimeout(async () => {
      setIsGenerating(true)
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/sign-language/sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words: signWords }),
          signal: AbortSignal.timeout(8000),
        })
        const data = await res.json()
        if (data.sentence) setAiSentence(data.sentence)
      } catch {
        // silently ignore
      } finally {
        setIsGenerating(false)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [signWords, signMode])

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || !userId || !classInfo?.id) return

    emitClassChatMessage({
      classId: classInfo.id,
      userId,
      name: userName || 'Пайдаланушы',
      text: signMode ? `🤟 ${inputText}` : inputText,
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
    <div className="flex flex-col h-[calc(100vh-14rem)] md:h-[calc(100vh-9rem)] lg:h-[calc(100vh-100px)] gap-6 animate-fade-in max-w-5xl mx-auto">
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

          {/* Sign Language Panel */}
          <AnimatePresence>
            {signMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border-soft bg-bg-secondary"
              >
                {/* Current gesture + progress */}
                <div className="px-4 pt-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-plum/10 border border-plum/20 flex items-center justify-center shrink-0">
                    <Hand size={16} className="text-plum" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black ${currentGesture !== '—' ? 'text-plum' : 'text-text-muted'}`}>
                        {currentGesture !== '—' ? currentGesture : 'Қолыңызды камераға көрсетіңіз...'}
                      </span>
                      <AnimatePresence>
                        {lastAdded && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="text-xs font-black text-success bg-success/10 px-2 py-0.5 rounded-full ml-2"
                          >+ {lastAdded}</motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    {currentGesture !== '—' && holdProgress > 0 && holdProgress < 100 && (
                      <div className="mt-1 h-1 bg-border-soft rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full transition-all" style={{ width: `${holdProgress}%` }} />
                      </div>
                    )}
                  </div>
                  {(signWords.length > 0) && (
                    <button
                      onClick={() => { setSignWords([]); setAiSentence(''); setInputText('') }}
                      className="text-xs text-danger font-bold flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw size={12} /> Тазалау
                    </button>
                  )}
                </div>

                {/* Detected words chips */}
                {signWords.length > 0 && (
                  <div className="px-4 pt-2 flex flex-wrap gap-1.5">
                    {signWords.map((w, i) => (
                      <span key={i} className="text-xs font-bold bg-plum/10 text-plum border border-plum/20 px-2.5 py-1 rounded-full">
                        {w}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI sentence suggestion */}
                {(isGenerating || aiSentence) && (
                  <div className="mx-4 mt-2 mb-1 rounded-xl border border-border-soft overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-rose/10 to-plum/5 border-b border-border-soft">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose to-plum flex items-center justify-center shrink-0">
                        <Sparkles size={10} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-plum uppercase tracking-wider">AI ұсынысы</span>
                    </div>
                    <div className="px-3 py-2 bg-bg-card flex items-center justify-between gap-3">
                      {isGenerating ? (
                        <div className="flex items-center gap-2 text-text-muted text-xs">
                          <div className="w-3 h-3 border-2 border-plum/30 border-t-plum rounded-full animate-spin" />
                          Сөйлем құрастырылуда...
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-text-primary font-medium leading-snug flex-1">{aiSentence}</p>
                          <button
                            onClick={() => { setInputText(aiSentence); setAiSentence('') }}
                            className="shrink-0 text-xs font-bold bg-gradient-to-r from-plum to-rose text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Қолдану
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="px-4 py-2">
                  <p className="text-[10px] text-text-muted">📷 Ымдау тілі + AI режимі. Жесті ұстаңыз → сөз қосылады → AI сөйлем құрастырады.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-bg-card border-t border-border-soft flex gap-2"
          >
            <button
              type="button"
              onClick={() => setSignMode(v => !v)}
              title="Ымдау тілімен жазу"
              className={`p-3 rounded-xl transition-all shrink-0 ${
                signMode
                  ? 'bg-plum text-white shadow-lg shadow-plum/30'
                  : 'bg-bg-secondary text-text-muted hover:text-plum hover:bg-plum/10'
              }`}
            >
              <Hand size={20} />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={signMode ? 'Ым арқылы сөздер қосылады...' : 'Хабарламаңызды жазыңыз...'}
              className="flex-1 px-4 py-3 bg-bg-secondary rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-plum/30 text-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 bg-plum text-white rounded-xl shadow-lg shadow-plum/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
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
