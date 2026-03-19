import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, GraduationCap, Hash, Palette, Users, Play, Bookmark, Hand, Grid3X3, Languages, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { DICTIONARY_DATA, DICTIONARY_CATEGORIES, DictionaryWord } from '../lib/dictionaryData'

const difficultyTabs = ['Барлығы', 'ОҢАЙ', 'ОРТАША', 'ҚИЫН']

const getIcon = (name: string) => {
  const icons: any = { Home, GraduationCap, Hash, Palette, Users, Grid3X3 }
  return icons[name] || Grid3X3
}

const getAnimationProps = (anim?: string) => {
  switch (anim) {
    case 'wave': return { animate: { rotate: [0, 20, -15, 20, -15, 0] }, transition: { duration: 1.5, repeat: Infinity } }
    case 'bounce': return { animate: { y: [0, -15, 0] }, transition: { duration: 1, repeat: Infinity } }
    case 'pulse': return { animate: { scale: [1, 1.15, 1] }, transition: { duration: 1, repeat: Infinity } }
    case 'shake': return { animate: { x: [0, -10, 10, -10, 10, 0] }, transition: { duration: 0.5, repeat: Infinity } }
    default: return { animate: { scale: [0.9, 1] }, transition: { duration: 1 } }
  }
}

export default function Dictionary() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeDifficulty, setActiveDifficulty] = useState('Барлығы')
  
  // Word of the day
  const [wordOfTheDay, setWordOfTheDay] = useState(DICTIONARY_DATA[0])
  useEffect(() => {
    // Pick random WOTD on mount
    setWordOfTheDay(DICTIONARY_DATA[Math.floor(Math.random() * DICTIONARY_DATA.length)])
  }, [])
  
  // Translator states
  const [textInput, setTextInput] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSequence, setPlaybackSequence] = useState<DictionaryWord[]>([])
  const [playbackIndex, setPlaybackIndex] = useState(0)

  const handleTranslateToGesture = (overrideText?: string) => {
    const textToTranslate = overrideText || textInput
    if (!textToTranslate.trim()) return
    const ws = textToTranslate.toUpperCase().split(/\s+/)
    const sequence: DictionaryWord[] = []

    ws.forEach(w => {
      const found = DICTIONARY_DATA.find(kw => kw.wordKz.toUpperCase() === w || w.includes(kw.wordKz.toUpperCase()))
      if (found) {
        sequence.push(found)
      } else {
        sequence.push({ 
          id: Date.now().toString() + Math.random(), 
          wordKz: w, 
          gesture: 'БЕЛГІСІЗ', 
          transliteration: '', 
          category: 'unknown', 
          difficulty: 'ОҢАЙ', 
          color: '#9ca3af', 
          description: '', 
          emoji: '❓' 
        })
      }
    })

    if (sequence.length > 0) {
      if (overrideText) setTextInput(overrideText)
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

  const filteredWords = DICTIONARY_DATA.filter(w => {
    const matchesCategory = activeCategory === 'all' || w.category === activeCategory
    const matchesDifficulty = activeDifficulty === 'Барлығы' || w.difficulty === activeDifficulty
    const matchesSearch = w.wordKz.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.transliteration.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesDifficulty && matchesSearch
  })

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in h-full">
      {/* Sidebar (Categories) */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
        <h2 className="text-xl font-extrabold text-text-primary uppercase tracking-wider hidden lg:block">КАТЕГОРИЯЛАР</h2>
        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar justify-start">
          {DICTIONARY_CATEGORIES.map((cat) => {
            const Icon = getIcon(cat.iconName)
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all font-bold shrink-0 lg:shrink max-w-fit lg:max-w-full ${
                  activeCategory === cat.id 
                    ? 'bg-gradient-to-r from-plum to-rose text-white shadow-lg shadow-plum/20' 
                    : 'bg-bg-secondary text-text-muted hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Progress */}
        <div className="mt-auto pt-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary font-medium">Оқу барысы</span>
            <span className="text-rose font-bold">{Math.round((12 / DICTIONARY_DATA.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-plum-pale rounded-full">
            <div className="h-full bg-gradient-to-r from-plum to-rose rounded-full" style={{ width: `${Math.round((12 / DICTIONARY_DATA.length) * 100)}%` }} />
          </div>
          <p className="text-xs text-text-muted mt-1">12 сөз үйрендіңіз</p>
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
          {difficultyTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveDifficulty(tab)}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeDifficulty === tab
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
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={textInput}
              onChange={(e: any) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslateToGesture(textInput)}
              placeholder="Сөз енгізіңіз... (мысалы: Сәлем, Рахмет)"
              className="flex-1 px-4 py-3 rounded-xl border border-border-soft bg-white text-text-primary focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 text-sm"
              disabled={isPlaying}
            />
            <button
              onClick={() => handleTranslateToGesture(textInput)}
              disabled={!textInput.trim() || isPlaying}
              className="px-6 py-3 bg-gradient-to-r from-plum to-rose text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center min-w-[120px] w-full sm:w-auto"
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
                  <div className="w-32 h-32 rounded-3xl bg-white border-2 border-plum/20 shadow-xl flex items-center justify-center relative overflow-hidden">
                    {playbackSequence[playbackIndex].gesture !== 'БЕЛГІСІЗ' ? (
                      playbackSequence[playbackIndex].gifUrl ? (
                         <img src={playbackSequence[playbackIndex].gifUrl} alt="Gesture GIF" className="w-full h-full object-cover" />
                      ) : (
                        <motion.div 
                          animate={getAnimationProps(playbackSequence[playbackIndex].animation).animate}
                          transition={getAnimationProps(playbackSequence[playbackIndex].animation).transition}
                          className="text-6xl drop-shadow-md"
                        >
                          {playbackSequence[playbackIndex].emoji}
                        </motion.div>
                      )
                    ) : <span className="text-4xl font-bold text-text-muted">?</span>}
                  </div>
                  <p className="text-text-primary font-black text-2xl tracking-wide">{playbackSequence[playbackIndex].wordKz}</p>
                  <p className="text-plum font-bold text-sm bg-plum/10 border border-plum/20 px-5 py-2 rounded-full">{playbackSequence[playbackIndex].gesture}</p>
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
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-plum/10 to-rose/10 border-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Hand size={120} />
          </div>
          <p className="text-xs font-bold text-plum uppercase tracking-widest mb-4">КҮННІҢ СӨЗІ</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h1 className="text-5xl font-black text-text-primary mb-2">{wordOfTheDay.wordKz}</h1>
              <p className="text-text-muted mb-4 uppercase text-sm tracking-wide">{wordOfTheDay.transliteration}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="inline-block bg-rose-pale text-rose text-xs font-bold px-3 py-1 rounded-full">КҮН СӨЗІ</span>
                <span className="inline-block bg-white text-xs font-bold px-3 py-1 rounded-full shadow-sm" style={{ color: wordOfTheDay.color }}>{wordOfTheDay.difficulty}</span>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mt-4 mb-5">
                {wordOfTheDay.description}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => { handleTranslateToGesture(wordOfTheDay.wordKz); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="btn-primary px-6 py-3 flex items-center gap-2 font-bold"
                >
                  <Play size={16} />
                  Көру
                </button>
                <button className="px-6 py-3 border border-border-soft rounded-xl text-text-secondary font-bold text-sm hover:border-plum hover:text-plum transition-colors">
                  Сақтау
                </button>
              </div>
            </div>
            <div className="bg-[#B8D8D0] flex items-center justify-center p-10 min-h-[300px] rounded-xl">
              <Hand size={120} className="text-[#E8A88B]" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWords.length > 0 ? filteredWords.map((word, i) => (
              <motion.div
                key={word.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * Math.min(i, 10) }}
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
                  <h4 className="font-bold text-text-primary">{word.wordKz}</h4>
                  <p className="text-xs text-text-muted">{word.transliteration}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTranslateToGesture(word.wordKz); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="w-full mt-3 py-2 border border-rose text-rose rounded-lg text-sm font-bold hover:bg-rose hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={14} /> Көру
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-12 text-center text-text-muted">Ақпарат табылмады. Басқа сөз іздеп көріңіз.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
