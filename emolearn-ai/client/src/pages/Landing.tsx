import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Hand, Brain, Heart, Sparkles, BarChart3, MessageSquare, BookOpen, ArrowRight, Film, FileText, Zap, Eye, Shield, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// ── Animated counter ──────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        let start = 0
        const step = Math.ceil(to / 60)
        const t = setInterval(() => {
          start = Math.min(start + step, to)
          setCount(start)
          if (start >= to) clearInterval(t)
        }, 20)
      }
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{count}{suffix}</span>
}

// ── Floating blob ─────────────────────────────────────────────
function Blob({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// ── Bento feature card ────────────────────────────────────────
function BentoCard({
  icon: Icon, gradient, title, desc, className = '', delay = 0, big = false
}: {
  icon: any; gradient: string; title: string; desc: string
  className?: string; delay?: number; big?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`group relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-[#6B2D5E]/10 transition-all duration-300 p-6 ${big ? 'sm:p-8' : ''} ${className}`}
    >
      {/* glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`} />
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className="text-white" />
      </div>
      <h3 className={`font-black text-[#1C1C2E] mb-2 ${big ? 'text-xl' : 'text-base'}`}>{title}</h3>
      <p className={`text-[#7A6A78] leading-relaxed ${big ? 'text-sm' : 'text-xs'}`}>{desc}</p>
    </motion.div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, -80])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3])
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: 'Оқушыларға', icon: BookOpen, points: ['Нақты уақытта ымдауды үйрену', 'AI репетитор сіздің эмоцияңызды сезеді', 'Жүрек соғуы мен зейін өлшенеді', '200+ сөздік және тесттер'] },
    { label: 'Мұғалімдерге', icon: Eye,     points: ['Бүкіл сыныпты нақты уақытта бақылау', 'Стресс/ұйқы алертын Telegram-ға алу', 'Онлайн тесттер жасау және нәтиже көру', 'Сынып аналитикасы мен эмоция картасы'] },
  ]

  return (
    <div className="min-h-screen bg-[#FDF5F8] overflow-x-hidden font-['Nunito',sans-serif]">

      {/* ── BACKGROUND BLOBS ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <Blob className="w-[600px] h-[600px] bg-[#6B2D5E] top-[-200px] left-[-200px]" />
        <Blob className="w-[400px] h-[400px] bg-[#E8507A] top-[30%] right-[-100px]" />
        <Blob className="w-[300px] h-[300px] bg-[#6B2D5E] bottom-[20%] left-[10%]" />
      </div>

      {/* ── STICKY NAV ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#EDD8E8]/60 shadow-sm shadow-[#6B2D5E]/5"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B2D5E] to-[#E8507A] flex items-center justify-center shadow-lg shadow-[#6B2D5E]/30">
                <span className="text-white font-black text-base">F</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#E8507A] border-2 border-white animate-pulse" />
            </div>
            <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#6B2D5E] to-[#E8507A]">FeelFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="hidden sm:block px-4 py-2 text-sm font-bold text-[#6B2D5E] hover:bg-[#F2E8F0] rounded-xl transition-colors">
              Кіру
            </button>
            <button onClick={() => navigate('/register')} className="relative px-5 py-2 text-sm font-bold text-white rounded-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#E8507A] to-[#6B2D5E] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Тіркелу →</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 sm:px-6 pt-12 pb-24 overflow-hidden">

        {/* Radial glow behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-[#6B2D5E]/10 to-transparent pointer-events-none" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-4xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6B2D5E]/10 to-[#E8507A]/10 border border-[#6B2D5E]/20 text-[#6B2D5E] text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Sparkles size={12} className="text-[#E8507A]" />
            Биометрика + AI + Ымдау тілі
            <Sparkles size={12} className="text-[#E8507A]" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black text-[#1C1C2E] leading-[1.05] mb-6"
          >
            Сіздің{' '}
            <span className="relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6B2D5E] via-[#E8507A] to-[#6B2D5E] bg-[length:200%] animate-[shimmer_3s_linear_infinite]">эмоцияңызды</span>
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] rounded-full origin-left"
              />
            </span>
            <br />сезетін AI оқытушы
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg sm:text-xl text-[#7A6A78] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            FeelFlow веб-камера арқылы пульсіңізді, зейініңізді және эмоцияңызды өлшеп,
            оқытуды <strong className="text-[#6B2D5E]">нақты уақытта бейімдейтін</strong> платформа.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/register')}
              className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 text-base font-black text-white rounded-2xl overflow-hidden shadow-2xl shadow-[#6B2D5E]/30 hover:shadow-[#6B2D5E]/50 transition-shadow"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#E8507A] to-[#6B2D5E] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative">Тегін бастау</span>
              <ArrowRight size={18} className="relative group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-[#6B2D5E] bg-white/80 backdrop-blur-sm border-2 border-[#EDD8E8] rounded-2xl hover:border-[#6B2D5E]/50 hover:bg-white transition-all"
            >
              Аккаунтым бар
            </button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-6 text-xs text-[#9C8A98] flex items-center justify-center gap-3 flex-wrap"
          >
            <span className="flex items-center gap-1"><Shield size={12} />Деректер тек браузерде</span>
            <span className="w-1 h-1 rounded-full bg-[#EDD8E8]" />
            <span className="flex items-center gap-1"><Zap size={12} />Карта талап етілмейді</span>
            <span className="w-1 h-1 rounded-full bg-[#EDD8E8]" />
            <span>🇰🇿 Қазақстан мектептері үшін</span>
          </motion.p>
        </motion.div>

        {/* Floating UI mock cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
            className="absolute left-4 lg:left-12 top-1/3 hidden md:block"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#EDD8E8] p-4 shadow-xl w-44">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center"><Heart size={14} className="text-[#E8507A]" /></div>
                  <span className="text-xs font-bold text-[#7A6A78]">BPM</span>
                </div>
                <p className="text-3xl font-black text-[#1C1C2E]">74 <span className="text-sm text-[#E8507A] font-bold">♥</span></p>
                <div className="mt-2 h-1 bg-[#EDD8E8] rounded-full"><div className="h-full w-3/5 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] rounded-full" /></div>
                <p className="text-[10px] text-[#9C8A98] mt-1 font-bold">ҚАЛЫПТЫ</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.8 }}
            className="absolute right-4 lg:right-12 top-1/4 hidden md:block"
          >
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#EDD8E8] p-4 shadow-xl w-48">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center"><Brain size={14} className="text-[#6B2D5E]" /></div>
                  <span className="text-xs font-bold text-[#7A6A78]">Зейін</span>
                </div>
                <p className="text-3xl font-black text-[#1C1C2E]">87<span className="text-lg text-[#6B2D5E]">%</span></p>
                <div className="flex gap-1 mt-2">
                  {[80, 65, 90, 75, 87].map((v, i) => (
                    <div key={i} className="flex-1 bg-[#EDD8E8] rounded-sm overflow-hidden" style={{ height: 24 }}>
                      <div className="w-full bg-gradient-to-t from-[#6B2D5E] to-[#E8507A] rounded-sm" style={{ height: `${v}%`, marginTop: 'auto' }} />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#9C8A98] mt-1 font-bold">ШОҒЫРЛАНҒАН 🎯</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute right-8 lg:right-24 bottom-24 hidden lg:block"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}>
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#EDD8E8] p-4 shadow-xl w-52">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#E8507A] animate-pulse" />
                  <span className="text-[10px] font-black text-[#6B2D5E] uppercase">AI Кеңес</span>
                </div>
                <p className="text-xs text-[#1C1C2E] font-medium leading-relaxed">"Зейін деңгейіңіз жақсы! Күрделірек тапсырмаларға көшуге болады 🚀"</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#9C8A98]"
        >
          <span className="text-xs font-bold uppercase tracking-widest">Төмен қараңыз</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="relative z-10 py-12 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: 60 + i * 60, height: 60 + i * 60, top: '50%', left: `${i * 14}%`, transform: 'translateY(-50%)' }} />
          ))}
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: 200, suffix: '+', label: 'Ымдау сөздер' },
            { value: 100, suffix: '%', label: 'Браузерде ML' },
            { value: 4,   suffix: 'о',  label: 'GPT-4o негіз' },
            { value: 0,   suffix: '₸',  label: 'Тегін тіркелу' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <p className="text-4xl font-black"><Counter to={s.value} suffix={s.suffix} /></p>
              <p className="text-sm text-white/70 font-bold mt-1 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BENTO FEATURES ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-[#E8507A] mb-3 block">Мүмкіндіктер</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1C1C2E]">Бәрі бір жерде</h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BentoCard big delay={0}    icon={Hand}         gradient="from-[#6B2D5E] to-[#E8507A]"       title="Ымдау тілін тану"    desc="MediaPipe Hands 21 нүктесі арқылы нақты уақытта қимылдарды анықтайды. 15 кадрлық тегістеу — жоғары дәлдік." className="lg:col-span-2" />
          <BentoCard      delay={0.05} icon={Heart}        gradient="from-[#E8507A] to-amber-500"        title="rPPG пульс"          desc="Веб-камера арқылы жүрек соғуын физикалық датчиксіз өлшейді." />
          <BentoCard      delay={0.1}  icon={Brain}        gradient="from-[#6B2D5E] to-indigo-500]"      title="AI Репетитор"        desc="GPT-4o эмоцияңызды ескеріп, жауап береді." />
          <BentoCard big delay={0.15} icon={BarChart3}    gradient="from-indigo-500 to-[#6B2D5E]"       title="Нақты уақыт аналитика" desc="Пульс, зейін және эмоция хронологиясы. 28 күндік белсенділік картасы. Мұғалімге тікелей стрим." className="lg:col-span-2" />
          <BentoCard      delay={0.2}  icon={Sparkles}    gradient="from-amber-500 to-[#E8507A]"        title="Бейімделу"           desc="Стресс анықталса жеңілдетеді, сабырлы кезде қиындатады." />
          <BentoCard      delay={0.25} icon={Film}         gradient="from-[#E8507A] to-[#6B2D5E]"       title="Бейне аудару"        desc="Ымдау тілі бейнесін мәтінге аударады." />
          <BentoCard      delay={0.3}  icon={MessageSquare}gradient="from-[#6B2D5E] to-rose-400"        title="Тікелей сұхбат"     desc="Мұғалім мен сынып арасында нақты уақыт чат + WebRTC." />
          <BentoCard      delay={0.35} icon={FileText}     gradient="from-rose-400 to-amber-500"         title="Онлайн тесттер"     desc="Мұғалім тест жасайды, студент нәтижесін бірден көреді." />
          <BentoCard      delay={0.4}  icon={BookOpen}     gradient="from-amber-500 to-[#6B2D5E]"        title="Сөздік"             desc="200+ сөз, суреттер, санаттар, таңдаулылар." />
        </div>
      </section>

      {/* ── FOR WHO TABS ── */}
      <section className="relative z-10 bg-white/60 backdrop-blur-sm border-y border-[#EDD8E8]/60 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-black text-[#1C1C2E] mb-3">Кімдерге арналған?</h2>
          </motion.div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-10">
            <div className="flex bg-[#F2E8F0] rounded-2xl p-1.5 gap-1">
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === i ? 'text-white shadow-lg' : 'text-[#6B2D5E] hover:bg-white/50'}`}
                >
                  {activeTab === i && (
                    <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#6B2D5E] to-[#E8507A]" />
                  )}
                  <tab.icon size={16} className="relative" />
                  <span className="relative">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {tabs[activeTab].points.map((point, i) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#EDD8E8] shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6B2D5E] to-[#E8507A] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-black">{i + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-[#1C1C2E]">{point}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-[#E8507A] mb-3 block">Қадамдар</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1C1C2E]">3 қадамда бастаңыз</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* connector line */}
          <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-0.5 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] opacity-20" />

          {[
            { n: '01', icon: '📝', title: 'Тіркеліңіз',       desc: 'Оқушы немесе мұғалім ретінде 1 минутта тіркеліңіз. Ешқандай карта қажет емес.' },
            { n: '02', icon: '📷', title: 'Камераны қосыңыз', desc: 'Биометрика мен ымдау тілін тану веб-камера арқылы — деректер тек браузерде.' },
            { n: '03', icon: '🚀', title: 'Үйреніп өсіңіз',  desc: 'AI бейімдеу мен нақты уақыт аналитикасымен тез прогресс жасаңыз.' },
          ].map((item, i) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="relative p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-sm border border-[#EDD8E8] shadow-sm hover:shadow-lg hover:shadow-[#6B2D5E]/10 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F2E8F0] to-[#FDF5F8] flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="absolute top-5 right-5 text-5xl font-black text-[#EDD8E8] select-none">{item.n}</span>
              <h3 className="font-black text-lg text-[#1C1C2E] mb-2">{item.title}</h3>
              <p className="text-sm text-[#7A6A78] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[2rem] overflow-hidden p-10 sm:p-16 text-center"
        >
          {/* bg layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B2D5E] via-[#8B3D7E] to-[#E8507A]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-60" />
          {/* rings */}
          {[200, 350, 500].map((size, i) => (
            <motion.div key={i} animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.05, 0.1] }} transition={{ duration: 4 + i, repeat: Infinity, delay: i }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"
              style={{ width: size, height: size }} />
          ))}

          <div className="relative">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 text-2xl">
              ✨
            </motion.div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Бүгін бастаңыз!</h2>
            <p className="text-white/75 text-base sm:text-lg mb-10 max-w-xl mx-auto">
              Тіркелу бір минут алады. Кредит карта талап етілмейді.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#6B2D5E] font-black rounded-2xl hover:bg-[#FDF5F8] transition-all text-base shadow-2xl hover:-translate-y-0.5">
                Тіркелу <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/15 backdrop-blur-sm text-white font-black rounded-2xl hover:bg-white/25 transition-all border border-white/30 text-base">
                Кіру
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[#EDD8E8] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6B2D5E] to-[#E8507A] flex items-center justify-center">
              <span className="text-white font-black text-xs">F</span>
            </div>
            <span className="font-black text-[#6B2D5E]">FeelFlow</span>
          </div>
          <p className="text-xs text-[#9C8A98]">© 2025 FeelFlow. Барлық құқықтар қорғалған. 🇰🇿</p>
          <div className="flex gap-4 text-xs text-[#9C8A98] font-bold">
            <button onClick={() => navigate('/login')} className="hover:text-[#6B2D5E] transition-colors">Кіру</button>
            <button onClick={() => navigate('/register')} className="hover:text-[#6B2D5E] transition-colors">Тіркелу</button>
          </div>
        </div>
      </footer>

      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>
    </div>
  )
}
