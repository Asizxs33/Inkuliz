import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, GraduationCap, Hash, Palette, Users, Play, Bookmark, Hand, Grid3X3, Languages, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const categories = [
  { icon: Home, label: 'Негізгі', active: true },
  { icon: GraduationCap, label: 'Мектеп', active: false },
  { icon: Hash, label: 'Сандар', active: false },
  { icon: Palette, label: 'Түстер', active: false },
  { icon: Users, label: 'Отбасы', active: false },
]

const filterTabs = ['Барлығы', 'Сәлем', 'Сан', 'Күн']

const words = [
  { word_kz: 'Сәлем', transliteration: 'Salem (Сәлем)', difficulty: 'ОҢАЙ', color: '#10B981' },
  { word_kz: 'Ана', transliteration: 'Ana (Ана)', difficulty: 'ОРТАША', color: '#F59E0B' },
  { word_kz: 'Кітап', transliteration: 'Kitap (Кітап)', difficulty: 'ОҢАЙ', color: '#10B981' },
  { word_kz: 'Бір', transliteration: 'Bir (Бір)', difficulty: 'ҚИЫН', color: '#EF4444' },
]

const KNOWN_WORDS = [
  { word: 'СӘЛЕМ', gesture: 'Ашық алақан' },
  { word: 'ЖАҚСЫ', gesture: 'Бас бармақ жоғары' },
  { word: 'РАХМЕТ', gesture: 'OK белгісі' },
  { word: 'МЕН', gesture: 'Сұқ саусақ' },
  { word: 'СІЗ', gesture: 'V белгісі' },
  { word: 'СҮЙЕМІН', gesture: 'ILY белгісі' },
  { word: 'СТОП', gesture: 'Жұдырық' },
  { word: 'ТЕЛЕФОН', gesture: 'Шака белгісі' },
]

export default function Dictionary() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Барлығы')
  
  // Translator states
  const [textInput, setTextInput] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSequence, setPlaybackSequence] = useState<{ word: string, gesture: string }[]>([])
  const [playbackIndex, setPlaybackIndex] = useState(0)

  const handleTranslateToGesture = () => {
    if (!textInput.trim()) return
    const ws = textInput.toUpperCase().split(/\s+/)
    const sequence: { word: string, gesture: string }[] = []

    ws.forEach(w => {
      const found = KNOWN_WORDS.find(kw => kw.word === w || w.includes(kw.word))
      if (found) {
        sequence.push(found)
      } else {
        sequence.push({ word: w, gesture: 'БЕЛГІСІЗ' })
      }
    })

    if (sequence.length > 0) {
      setPlaybackSequence(sequence)
      setPlaybackIndex(0)
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    if (!isPlaying) return
    if (playbackIndex >= playbackSequence.length) {
      setTimeout(() => setIsPlaying(false), 1500)
      return
    }
    const timer = setTimeout(() => {
      setPlaybackIndex(Math.min(playbackIndex + 1, playbackSequence.length))
    }, 1200)

    return () => clearTimeout(timer)
  }, [isPlaying, playbackIndex, playbackSequence])

  return (
    <div className="flex gap-6 animate-fade-in h-full">
      {/* Left Sidebar */}
      <div className="w-[200px] shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-plum flex items-center justify-center">
            <Hand size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">EmoLearn AI</h3>
            <p className="text-xs text-rose font-medium">SIGN LANGUAGE</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {categories.map((cat) => (
            <button
              key={cat.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                cat.active
                  ? 'bg-gradient-to-r from-plum to-rose text-white'
                  : 'text-text-secondary hover:bg-plum-pale hover:text-plum'
              }`}
            >
              <cat.icon size={18} />
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Progress */}
        <div className="mt-auto pt-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary font-medium">Оқу барысы</span>
            <span className="text-rose font-bold">47%</span>
          </div>
          <div className="w-full h-2 bg-plum-pale rounded-full">
            <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full" style={{ width: '47%' }} />
          </div>
          <p className="text-xs text-text-muted mt-1">47 сөз үйрендіңіз</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Сөз іздеу..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 text-sm"
            />
          </div>
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                activeFilter === tab
                  ? 'bg-rose text-white'
                  : 'border border-border-soft text-text-secondary hover:border-plum hover:text-plum'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Text → Gesture Translator */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Languages size={18} className="text-rose" />
            <span className="text-sm font-bold text-text-muted uppercase">МӘТІННЕН ҚИМЫЛҒА</span>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={textInput}
              onChange={(e: any) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslateToGesture()}
              placeholder="Сөз енгізіңіз... (мысалы: Сәлем, Рахмет)"
              className="flex-1 px-4 py-3 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 text-sm"
              disabled={isPlaying}
            />
            <button
              onClick={handleTranslateToGesture}
              disabled={!textInput.trim() || isPlaying}
              className="px-6 py-3 bg-gradient-to-r from-plum to-rose text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {isPlaying ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Аудару'}
            </button>
          </div>
          
          <div className="bg-bg-secondary rounded-xl p-6 flex flex-col items-center gap-3 min-h-[160px] justify-center relative overflow-hidden">
            {isPlaying && playbackIndex < playbackSequence.length ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={playbackIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-20 h-20 rounded-2xl bg-plum flex items-center justify-center text-white shadow-lg shadow-plum/30">
                    {playbackSequence[playbackIndex].gesture !== 'БЕЛГІСІЗ' ? <Hand size={40} /> : <span className="text-3xl font-bold">?</span>}
                  </div>
                  <p className="text-text-primary font-bold text-xl">{playbackSequence[playbackIndex].word}</p>
                  <p className="text-plum font-medium text-sm bg-white px-4 py-1.5 rounded-full">{playbackSequence[playbackIndex].gesture}</p>
                </motion.div>
              </AnimatePresence>
            ) : isPlaying && playbackIndex >= playbackSequence.length ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                <CheckCircle2 size={40} className="text-success mb-2" />
                <p className="text-text-primary font-bold text-base">Аударма аяқталды</p>
              </motion.div>
            ) : (
              textInput
                ? <><div className="w-16 h-16 rounded-2xl bg-plum-pale flex items-center justify-center"><Hand size={32} className="text-plum" /></div>
                  <p className="text-plum font-bold text-sm text-center">"{textInput}" → Қимылын көру</p></>
                : <p className="text-text-muted text-sm text-center">Біздің AI аудармашымызға сөз немесе сөйлем жазыңыз, біз оны қимылмен көрсетеміз!</p>
            )}

            {isPlaying && (
              <div className="absolute bottom-0 left-0 h-1.5 bg-plum-pale w-full">
                <div
                  className="h-full bg-plum transition-all duration-300"
                  style={{ width: `${(playbackIndex / Math.max(1, playbackSequence.length)) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Featured Word */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-[1fr_1fr] gap-0 rounded-xl overflow-hidden card p-0"
        >
          {/* Hand image placeholder */}
          <div className="bg-[#B8D8D0] flex items-center justify-center p-10 min-h-[300px]">
            <Hand size={120} className="text-[#E8A88B]" />
          </div>
          {/* Word info */}
          <div className="p-8 flex flex-col justify-center">
            <span className="inline-block bg-rose-pale text-rose text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">КҮН СӨЗІ</span>
            <h2 className="text-3xl font-extrabold text-text-primary mb-2">RAKHMET (Рақмет)</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-5">
              Күнделікті қолданылатын ең маңызды ым-ишара. Ризашылық білдіру үшін қолданылады.
            </p>
            <div className="flex gap-3">
              <button className="btn-primary px-6 py-3 flex items-center gap-2 font-bold">
                <Play size={16} />
                Көру
              </button>
              <button className="px-6 py-3 border border-border-soft rounded-xl text-text-secondary font-bold text-sm hover:border-plum hover:text-plum transition-colors">
                Сақтау
              </button>
            </div>
          </div>
        </motion.div>

        {/* Word Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Grid3X3 size={20} className="text-rose" /> Жаңа сөздер
            </h3>
            <span className="text-sm font-bold text-rose cursor-pointer hover:text-plum transition-colors">Барлығын көру</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {words.map((word, i) => (
              <motion.div
                key={word.word_kz}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ y: -4 }}
                className="card cursor-pointer hover:shadow-lg transition-all p-0 overflow-hidden"
              >
                <div className="relative">
                  <div className="bg-bg-secondary h-40 flex items-center justify-center">
                    <Hand size={48} className="text-plum" />
                  </div>
                  <span
                    className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: word.color }}
                  >
                    {word.difficulty}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-text-primary">{word.word_kz}</h4>
                  <p className="text-xs text-text-muted">{word.transliteration}</p>
                  <button className="w-full mt-3 py-2 border border-rose text-rose rounded-lg text-sm font-bold hover:bg-rose hover:text-white transition-colors">
                    Үйрену
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
