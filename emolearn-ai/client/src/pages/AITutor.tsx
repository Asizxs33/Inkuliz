import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Brain, Heart, Zap, Camera, CameraOff, Trash2, Sparkles, Activity, Eye, AlertTriangle, Coffee, TrendingUp, Loader2 } from 'lucide-react'
import { useBiometricStore } from '../store/biometricStore'
import { useUserStore } from '../store/userStore'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  emotion?: string
  bpm?: number
  cognitive?: number
  timestamp: Date
}

const SUBJECTS = [
  { label: '📐 Математика', prompt: 'Математика бойынша сұрақ:' },
  { label: '🧪 Физика', prompt: 'Физика бойынша сұрақ:' },
  { label: '🧬 Биология', prompt: 'Биология бойынша сұрақ:' },
  { label: '📖 Тарих', prompt: 'Тарих бойынша сұрақ:' },
  { label: '💻 Информатика', prompt: 'Информатика бойынша сұрақ:' },
  { label: '🌍 География', prompt: 'География бойынша сұрақ:' },
]

const QUICK_PROMPTS = [
  'Квадрат теңдеуді қалай шешемін?',
  'Ньютонның 2-заңын түсіндір',
  'Фотосинтез дегеніміз не?',
  'Python-да цикл қалай жазады?',
]

function getEmotionEmoji(emotion: string) {
  const lower = emotion?.toLowerCase() || ''
  if (lower.includes('stress') || lower.includes('стресс')) return '😰'
  if (lower.includes('happy') || lower.includes('қуаныш')) return '😊'
  if (lower.includes('neutral') || lower.includes('қалыпты')) return '😐'
  if (lower.includes('focused') || lower.includes('шоғырлан')) return '🎯'
  if (lower.includes('fear') || lower.includes('қорқ')) return '😨'
  if (lower.includes('sad') || lower.includes('ренж')) return '😢'
  if (lower.includes('angry') || lower.includes('ашу')) return '😠'
  if (lower.includes('surprise') || lower.includes('таңд')) return '😮'
  return '🤔'
}

function getEmotionColor(emotion: string) {
  const lower = emotion?.toLowerCase() || ''
  if (lower.includes('stress') || lower.includes('fear')) return 'text-danger'
  if (lower.includes('happy') || lower.includes('focused')) return 'text-success'
  return 'text-amber-500'
}

function getBpmStatus(bpm: number) {
  if (bpm === 0) return { label: 'Өлшенуде', color: 'text-text-muted' }
  if (bpm > 100) return { label: 'Жоғары — демалыңыз', color: 'text-danger' }
  if (bpm > 85) return { label: 'Сәл жоғары', color: 'text-amber-500' }
  return { label: 'Қалыпты', color: 'text-success' }
}

function getSessionStats(messages: Message[]) {
  const userMsgs = messages.filter(m => m.role === 'user')
  const aiMsgs = messages.filter(m => m.role === 'assistant')
  const emotions = aiMsgs.map(m => m.emotion).filter(Boolean)
  const stressCount = emotions.filter(e => e?.toLowerCase().includes('stress') || e?.toLowerCase().includes('fear')).length
  return {
    questions: userMsgs.length,
    answers: aiMsgs.length,
    stressDetected: stressCount,
  }
}

export default function AITutor() {
  const { bpm, emotion, cognitive, confidence, isCameraEnabled } = useBiometricStore()
  const userName = useUserStore(s => s.name)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msgText = text || input
    if (!msgText.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msgText,
      emotion,
      bpm,
      cognitive,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setSessionStarted(true)

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: useUserStore.getState().id || 'anon',
          message: msgText,
          context: { emotion, bpm, cognitive },
          history
        })
      })

      const data = await res.json()
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.fallback || 'Қызмет уақытша қол жетімді емес.',
        emotion,
        bpm,
        cognitive,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Серверге қосылу қатесі. Интернет байланысын тексеріңіз.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionStarted(false)
  }

  const stats = getSessionStats(messages)
  const bpmStatus = getBpmStatus(bpm)

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in h-full max-w-7xl mx-auto">
      
      {/* ═══ MAIN CHAT ═══ */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
              <Sparkles size={24} className="text-rose" /> AI Репетитор
            </h1>
            <p className="text-xs text-text-muted mt-1">Эмоцияңызды сезіп, сізге бейімделетін ақылды мұғалім</p>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="text-text-muted hover:text-danger transition-colors p-2" title="Чатты тазалау">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Emotion-Awareness Banner */}
        {isCameraEnabled && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="flex items-center gap-3 bg-gradient-to-r from-plum/10 to-rose/10 rounded-xl px-4 py-3"
          >
            <Eye size={16} className="text-plum shrink-0" />
            <p className="text-xs text-text-secondary">
              <span className="font-bold text-plum">AI сіздің эмоцияңызды бақылап тұр:</span> {getEmotionEmoji(emotion)} {emotion} • {bpm} BPM • Зейін {cognitive}%
              {cognitive > 80 && <span className="text-danger ml-1">⚠️ Жүктеме жоғары</span>}
            </p>
          </motion.div>
        )}

        {!isCameraEnabled && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              <span className="font-bold">Камера өшірулі.</span> AI толық жұмыс істеу үшін камераны қосыңыз — эмоцияңызға бейімделеді!
            </p>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 bg-bg-secondary rounded-2xl p-4 overflow-y-auto flex flex-col gap-4 min-h-[400px] max-h-[calc(100vh-350px)]">
          {!sessionStarted ? (
            /* ═══ Welcome Screen ═══ */
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-plum to-rose flex items-center justify-center shadow-lg"
              >
                <Sparkles size={36} className="text-white" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-xl font-black text-text-primary mb-1">Сәлем, {userName || 'Студент'}! 👋</h2>
                <p className="text-sm text-text-muted max-w-md">Мен — эмоцияңызды сезетін AI репетитор. Кез-келген пән бойынша сұрақ қойыңыз, мен сіздің күйіңізге қарай жауап беремін.</p>
              </div>

              {/* Subject chips */}
              <div className="flex flex-wrap gap-2 justify-center">
                {SUBJECTS.map(s => (
                  <button key={s.label} onClick={() => setInput(s.prompt + ' ')}
                    className="px-4 py-2 bg-white rounded-full text-sm font-bold text-text-secondary hover:bg-plum/10 hover:text-plum transition-all border border-border-soft"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Quick prompts */}
              <div className="w-full max-w-lg">
                <p className="text-xs text-text-muted text-center mb-2 uppercase font-bold tracking-widest">Жылдам сұрақтар</p>
                <div className="flex flex-col gap-2">
                  {QUICK_PROMPTS.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      className="w-full text-left px-4 py-3 bg-white rounded-xl text-sm text-text-primary hover:bg-plum/5 hover:border-plum/30 border border-border-soft transition-all flex items-center gap-3"
                    >
                      <Zap size={14} className="text-rose shrink-0" /> {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ═══ Chat Messages ═══ */
            <>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Emotion tag on AI response */}
                  {msg.role === 'assistant' && msg.emotion && (
                    <div className="flex items-center gap-1 mb-1 ml-1">
                      <span className="text-[10px] text-text-muted">AI анықтады:</span>
                      <span className={`text-[10px] font-bold ${getEmotionColor(msg.emotion || '')}`}>
                        {getEmotionEmoji(msg.emotion || '')} {msg.emotion}
                      </span>
                      {msg.bpm && msg.bpm > 0 && (
                        <span className="text-[10px] text-text-muted">• {msg.bpm} BPM</span>
                      )}
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-plum to-rose text-white rounded-tr-sm'
                      : 'bg-white text-text-primary rounded-tl-sm shadow-sm border border-border-soft'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 px-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-border-soft flex items-center gap-2">
                    <Loader2 size={16} className="text-plum animate-spin" />
                    <span className="text-sm text-text-muted">
                      {isCameraEnabled ? `${getEmotionEmoji(emotion)} Эмоция ескерілуде...` : 'Ойланып жатырмын...'}
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Кез-келген пән бойынша сұрақ жазыңыз..."
            className="flex-1 px-5 py-3.5 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-plum focus:ring-2 focus:ring-plum/20 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3.5 bg-gradient-to-r from-plum to-rose text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} /> Жіберу
          </button>
        </form>
      </div>

      {/* ═══ RIGHT PANEL — Live Biometrics ═══ */}
      <div className="hidden lg:flex w-[300px] shrink-0 flex-col gap-4">
        
        {/* Emotion Status */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="card bg-gradient-to-br from-plum/5 to-rose/5 border-none"
        >
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">НАҚТЫ УАҚЫТ ЭМОЦИЯ</p>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{getEmotionEmoji(emotion)}</div>
            <div>
              <p className={`text-lg font-black capitalize ${getEmotionColor(emotion)}`}>{emotion || 'Анықталмаған'}</p>
              <p className="text-xs text-text-muted">Сенімділік: {confidence}%</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-plum-pale rounded-full mt-3">
            <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full transition-all" style={{ width: `${confidence}%` }} />
          </div>
        </motion.div>

        {/* Heart Rate */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">ЖҮРЕК СОҒУЫ</p>
            <Heart size={14} className="text-danger" />
          </div>
          <div className="flex items-end gap-2">
            {bpm > 0 ? (
              <>
                <span className="text-3xl font-black text-text-primary">{bpm}</span>
                <span className="text-rose font-bold text-xs mb-1">BPM</span>
              </>
            ) : (
              <span className="text-sm font-bold text-rose animate-pulse">Өлшенуде...</span>
            )}
          </div>
          <p className={`text-xs font-medium mt-1 ${bpmStatus.color}`}>{bpmStatus.label}</p>
          <svg className="w-full h-8 mt-2" viewBox="0 0 200 30">
            <polyline fill="none" stroke="#E8507A" strokeWidth="2" strokeLinecap="round"
              points="0,15 20,15 30,5 35,25 40,15 60,15 70,5 75,25 80,15 100,15 110,5 115,25 120,15 140,15 150,5 155,25 160,15 180,15 190,5 195,25 200,15"
              className="ecg-line"
            />
          </svg>
        </motion.div>

        {/* Cognitive Load */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">КОГНИТИВТІК ЖҮКТЕМЕ</p>
            <Brain size={14} className="text-amber-500" />
          </div>
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F2E8F0" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#cogGradTutor)" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={`${cognitive * 2.64} ${100 * 2.64}`}
                />
                <defs>
                  <linearGradient id="cogGradTutor" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-text-primary">{cognitive}%</span>
              </div>
            </div>
          </div>
          {cognitive > 80 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-danger font-bold text-center mt-2 flex items-center justify-center gap-1"
            >
              <Coffee size={12} /> Демал алыңыз!
            </motion.p>
          )}
        </motion.div>

        {/* Session Stats */}
        {sessionStarted && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            className="card"
          >
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">СЕАНС СТАТИСТИКАСЫ</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-bg-secondary rounded-xl p-2">
                <p className="text-lg font-black text-plum">{stats.questions}</p>
                <p className="text-[9px] text-text-muted uppercase">Сұрақ</p>
              </div>
              <div className="bg-bg-secondary rounded-xl p-2">
                <p className="text-lg font-black text-rose">{stats.answers}</p>
                <p className="text-[9px] text-text-muted uppercase">Жауап</p>
              </div>
              <div className="bg-bg-secondary rounded-xl p-2">
                <p className="text-lg font-black text-danger">{stats.stressDetected}</p>
                <p className="text-[9px] text-text-muted uppercase">Стресс</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* How it works */}
        <div className="card bg-plum/5 border-none">
          <p className="text-xs font-bold text-plum uppercase tracking-widest mb-2">Қалай жұмыс істейді?</p>
          <div className="flex flex-col gap-2 text-xs text-text-secondary">
            <div className="flex items-start gap-2">
              <Camera size={12} className="text-plum mt-0.5 shrink-0" />
              <span>Камера сіздің <b>эмоцияңызды</b> анықтайды</span>
            </div>
            <div className="flex items-start gap-2">
              <Activity size={12} className="text-rose mt-0.5 shrink-0" />
              <span>AI сіздің <b>стресс деңгейіңізді</b> бағалайды</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles size={12} className="text-amber-500 mt-0.5 shrink-0" />
              <span>Жауапты сіздің <b>күйіңізге</b> бейімдейді</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
