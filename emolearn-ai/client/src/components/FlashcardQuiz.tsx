import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, RotateCcw, Zap, CheckCircle2, XCircle } from 'lucide-react'
import { DICTIONARY_DATA, DictionaryWord } from '../lib/dictionaryData'

interface Props {
  onClose: () => void
}

const TOTAL_QUESTIONS = 10

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function generateQuestion(allWords: DictionaryWord[], usedIds: Set<string>) {
  const available = allWords.filter(w => !usedIds.has(w.id))
  if (available.length === 0) return null
  
  const correct = available[Math.floor(Math.random() * available.length)]
  const others = allWords.filter(w => w.id !== correct.id)
  const wrongOptions = shuffle(others).slice(0, 3)
  const options = shuffle([correct, ...wrongOptions])
  
  return { correct, options }
}

export default function FlashcardQuiz({ onClose }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set())
  const [currentQ, setCurrentQ] = useState<ReturnType<typeof generateQuestion>>(null)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  const nextQuestion = useCallback(() => {
    const q = generateQuestion(DICTIONARY_DATA, usedIds)
    setCurrentQ(q)
    setSelected(null)
  }, [usedIds])

  useEffect(() => {
    nextQuestion()
  }, []) // eslint-disable-line

  const handleSelect = (wordId: string) => {
    if (selected) return
    setSelected(wordId)
    
    const isCorrect = wordId === currentQ?.correct.id
    if (isCorrect) {
      setScore(s => s + 1)
      setStreak(s => {
        const next = s + 1
        setBestStreak(b => Math.max(b, next))
        return next
      })
    } else {
      setStreak(0)
    }

    setTimeout(() => {
      if (questionIndex + 1 >= TOTAL_QUESTIONS) {
        setIsFinished(true)
      } else {
        setUsedIds(prev => {
          const next = new Set(prev)
          next.add(currentQ!.correct.id)
          return next
        })
        setQuestionIndex(i => i + 1)
        const q = generateQuestion(DICTIONARY_DATA, new Set([...usedIds, currentQ!.correct.id]))
        setCurrentQ(q)
        setSelected(null)
      }
    }, 1200)
  }

  const handleRestart = () => {
    setQuestionIndex(0)
    setScore(0)
    setSelected(null)
    setIsFinished(false)
    setUsedIds(new Set())
    setStreak(0)
    setBestStreak(0)
    const q = generateQuestion(DICTIONARY_DATA, new Set())
    setCurrentQ(q)
  }

  const getScoreMessage = () => {
    const pct = (score / TOTAL_QUESTIONS) * 100
    if (pct === 100) return { text: 'Керемет! Сіз дарынсыз! 🏆', color: 'text-success' }
    if (pct >= 80) return { text: 'Өте жақсы! 🌟', color: 'text-plum' }
    if (pct >= 50) return { text: 'Жаман емес, жаттығуды жалғастырыңыз! 💪', color: 'text-rose' }
    return { text: 'Тағы жаттығу керек! 📚', color: 'text-danger' }
  }

  if (!currentQ && !isFinished) return null

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-bg-primary rounded-3xl shadow-2xl max-w-lg w-full p-6 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
          <X size={16} className="text-text-muted" />
        </button>

        {isFinished ? (
          /* ═══ Results Screen ═══ */
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-5 py-6">
            <Trophy size={64} className="text-rose" />
            <h2 className="text-3xl font-black text-text-primary">Нәтиже</h2>
            <div className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-plum to-rose">
              {score}/{TOTAL_QUESTIONS}
            </div>
            <p className={`text-lg font-bold ${getScoreMessage().color}`}>{getScoreMessage().text}</p>
            
            <div className="flex gap-4 text-center">
              <div className="bg-bg-secondary rounded-xl p-4 min-w-[80px]">
                <p className="text-xl font-black text-plum">{bestStreak}</p>
                <p className="text-[10px] text-text-muted uppercase">Ең ұзын серия</p>
              </div>
              <div className="bg-bg-secondary rounded-xl p-4 min-w-[80px]">
                <p className="text-xl font-black text-success">{Math.round((score / TOTAL_QUESTIONS) * 100)}%</p>
                <p className="text-[10px] text-text-muted uppercase">Дәлдік</p>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button onClick={handleRestart} className="flex-1 py-3 border border-plum text-plum rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-plum/10">
                <RotateCcw size={16} /> Қайталау
              </button>
              <button onClick={onClose} className="flex-1 py-3 bg-gradient-to-r from-plum to-rose text-white rounded-xl font-bold text-sm">
                Жабу
              </button>
            </div>
          </motion.div>
        ) : (
          /* ═══ Question Screen ═══ */
          <>
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-rose" />
                <span className="text-sm font-bold text-text-primary">Викторина</span>
              </div>
              <span className="text-xs font-bold text-text-muted">{questionIndex + 1} / {TOTAL_QUESTIONS}</span>
            </div>
            <div className="h-1.5 bg-bg-secondary rounded-full mb-6">
              <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full transition-all duration-300" style={{ width: `${((questionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }} />
            </div>

            {streak > 1 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mb-3">
                <span className="text-xs font-bold text-rose bg-rose/10 px-3 py-1 rounded-full">🔥 {streak} рет қатарынан!</span>
              </motion.div>
            )}

            {/* Emoji question */}
            <AnimatePresence mode="wait">
              <motion.div key={questionIndex} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="flex flex-col items-center gap-4 mb-6">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Бұл қандай сөз?</p>
                <div className="w-28 h-28 rounded-3xl bg-bg-secondary border-2 border-plum/20 flex items-center justify-center shadow-lg">
                  <span className="text-6xl">{currentQ!.correct.emoji}</span>
                </div>
                <p className="text-plum font-bold text-sm bg-plum/10 px-4 py-1.5 rounded-full">{currentQ!.correct.gesture}</p>
              </motion.div>
            </AnimatePresence>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {currentQ!.options.map((opt) => {
                const isCorrectAnswer = opt.id === currentQ!.correct.id
                const isSelected = selected === opt.id
                let btnClass = 'border border-border-soft bg-white text-text-primary hover:border-plum hover:bg-plum/5'
                
                if (selected) {
                  if (isCorrectAnswer) {
                    btnClass = 'border-2 border-success bg-success/10 text-success'
                  } else if (isSelected && !isCorrectAnswer) {
                    btnClass = 'border-2 border-danger bg-danger/10 text-danger'
                  } else {
                    btnClass = 'border border-border-soft bg-white/50 text-text-muted opacity-50'
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={!!selected}
                    className={`p-4 rounded-xl font-bold text-sm transition-all ${btnClass} flex items-center justify-center gap-2`}
                  >
                    {selected && isCorrectAnswer && <CheckCircle2 size={16} />}
                    {selected && isSelected && !isCorrectAnswer && <XCircle size={16} />}
                    {opt.wordKz}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
