import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Hand, Brain, Heart, Sparkles, BarChart3, MessageSquare, BookOpen, ArrowRight, Film, FileText, Zap, Eye, Shield, ChevronDown } from 'lucide-react'
import icon from '../assets/icon.jpg'
import { useEffect, useRef, useState } from 'react'

// ── Animated counter (IntersectionObserver, counts up once) ───
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        let v = 0
        const step = Math.ceil(to / 50)
        const t = setInterval(() => {
          v = Math.min(v + step, to)
          setCount(v)
          if (v >= to) clearInterval(t)
        }, 24)
      }
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{count}{suffix}</span>
}

// ── Bento card (enter-once animation, CSS hover) ──────────────
function BentoCard({ icon: Icon, gradient, title, desc, className = '', delay = 0, big = false }: {
  icon: any; gradient: string; title: string; desc: string
  className?: string; delay?: number; big?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.45, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-3xl border border-[#EDD8E8] bg-white shadow-sm hover:shadow-lg hover:shadow-[#6B2D5E]/8 hover:-translate-y-1 transition-all duration-300 p-6 ${big ? 'sm:p-8' : ''} ${className}`}
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className="text-white" />
      </div>
      <h3 className={`font-black text-[#1C1C2E] mb-2 ${big ? 'text-xl' : 'text-base'}`}>{title}</h3>
      <p className={`text-[#7A6A78] leading-relaxed ${big ? 'text-sm' : 'text-xs'}`}>{desc}</p>
    </motion.div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: 'Оқушыларға', icon: BookOpen, points: ['Нақты уақытта ымдауды үйрену', 'AI репетитор сіздің эмоцияңызды сезеді', 'Жүрек соғуы мен зейін өлшенеді', '200+ сөздік және тесттер'] },
    { label: 'Мұғалімдерге', icon: Eye,     points: ['Бүкіл сыныпты нақты уақытта бақылау', 'Стресс/ұйқы алертын Telegram-ға алу', 'Онлайн тесттер жасау және нәтиже көру', 'Сынып аналитикасы мен эмоция картасы'] },
  ]

  return (
    <div className="min-h-screen bg-[#FDF5F8] overflow-x-hidden">

      {/* ── CSS-only background — no JS, GPU composited ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="landing-blob blob-1" />
        <div className="landing-blob blob-2" />
        <div className="landing-blob blob-3" />
      </div>

      {/* ── STICKY NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EDD8E8]/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img src={icon} alt="logo" className="w-9 h-9 rounded-xl object-cover shadow-md" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#E8507A] border-2 border-white animate-pulse" />
            </div>
            <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#6B2D5E] to-[#E8507A]">FeelFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="hidden sm:block px-4 py-2 text-sm font-bold text-[#6B2D5E] hover:bg-[#F2E8F0] rounded-xl transition-colors">
              Кіру
            </button>
            <button onClick={() => navigate('/register')} className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] hover:opacity-90 transition-opacity shadow-md">
              Тіркелу →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 sm:px-6 pt-12 pb-24 overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6B2D5E]/8 border border-[#6B2D5E]/15 text-[#6B2D5E] text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Sparkles size={12} className="text-[#E8507A]" />
            Биометрика + AI + Ымдау тілі
            <Sparkles size={12} className="text-[#E8507A]" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}
            className="text-5xl sm:text-6xl md:text-7xl font-black text-[#1C1C2E] leading-[1.05] mb-6"
          >
            Сіздің{' '}
            <span className="relative inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6B2D5E] via-[#E8507A] to-[#6B2D5E] bg-[length:200%] landing-shimmer">
                эмоцияңызды
              </span>
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.7, duration: 0.5, ease: 'easeOut' }}
                className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] rounded-full origin-left"
              />
            </span>
            <br />сезетін AI оқытушы
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg sm:text-xl text-[#7A6A78] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            FeelFlow веб-камера арқылы пульсіңізді, зейініңізді және эмоцияңызды өлшеп,
            оқытуды <strong className="text-[#6B2D5E]">нақты уақытта бейімдейтін</strong> платформа.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/register')}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 text-base font-black text-white rounded-2xl bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] shadow-xl shadow-[#6B2D5E]/25 hover:shadow-[#6B2D5E]/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              Тегін бастау
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-[#6B2D5E] bg-white border-2 border-[#EDD8E8] rounded-2xl hover:border-[#6B2D5E]/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              Аккаунтым бар
            </button>
          </motion.div>

          {/* Trust */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-6 text-xs text-[#9C8A98] flex items-center justify-center gap-3 flex-wrap"
          >
            <span className="flex items-center gap-1"><Shield size={12} />Деректер тек браузерде</span>
            <span className="w-1 h-1 rounded-full bg-[#EDD8E8]" />
            <span className="flex items-center gap-1"><Zap size={12} />Карта талап етілмейді</span>
            <span className="w-1 h-1 rounded-full bg-[#EDD8E8]" />
            <span>🇰🇿 Қазақстан мектептері үшін</span>
          </motion.p>
        </div>

        {/* Floating UI cards — CSS float animation, shown only on md+ */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          {/* BPM card */}
          <div className="absolute left-6 lg:left-16 top-[30%] css-float-1">
            <div className="bg-white rounded-2xl border border-[#EDD8E8] p-4 shadow-xl w-44">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center"><Heart size={14} className="text-[#E8507A]" /></div>
                <span className="text-xs font-bold text-[#7A6A78]">BPM</span>
              </div>
              <p className="text-3xl font-black text-[#1C1C2E]">74 <span className="text-sm text-[#E8507A] font-bold">♥</span></p>
              <div className="mt-2 h-1 bg-[#EDD8E8] rounded-full"><div className="h-full w-3/5 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] rounded-full" /></div>
              <p className="text-[10px] text-[#9C8A98] mt-1 font-bold">ҚАЛЫПТЫ</p>
            </div>
          </div>

          {/* Attention card */}
          <div className="absolute right-6 lg:right-16 top-[22%] css-float-2">
            <div className="bg-white rounded-2xl border border-[#EDD8E8] p-4 shadow-xl w-48">
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
          </div>

          {/* AI tip card */}
          <div className="absolute right-10 lg:right-28 bottom-24 css-float-3 hidden lg:block">
            <div className="bg-white rounded-2xl border border-[#EDD8E8] p-4 shadow-xl w-52">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#E8507A] animate-pulse" />
                <span className="text-[10px] font-black text-[#6B2D5E] uppercase">AI Кеңес</span>
              </div>
              <p className="text-xs text-[#1C1C2E] font-medium leading-relaxed">"Зейін деңгейіңіз жақсы! Күрделірек тапсырмаларға көшуге болады 🚀"</p>
            </div>
          </div>
        </div>

        {/* Scroll hint — CSS animation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#9C8A98] css-bounce">
          <span className="text-xs font-bold uppercase tracking-widest">Төмен қараңыз</span>
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="relative py-12 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: 60 + i * 55, height: 60 + i * 55, top: '50%', left: `${i * 15}%`, transform: 'translateY(-50%)' }} />
          ))}
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: 200, suffix: '+', label: 'Ымдау сөздер' },
            { value: 100, suffix: '%', label: 'Браузерде ML' },
            { value: 4,   suffix: 'о', label: 'GPT-4o негіз' },
            { value: 0,   suffix: '₸', label: 'Тегін тіркелу' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <p className="text-4xl font-black"><Counter to={s.value} suffix={s.suffix} /></p>
              <p className="text-sm text-white/70 font-bold mt-1 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BENTO FEATURES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-[#E8507A] mb-3 block">Мүмкіндіктер</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1C1C2E]">Бәрі бір жерде</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BentoCard big  delay={0}    icon={Hand}          gradient="from-[#6B2D5E] to-[#E8507A]"        title="Ымдау тілін тану"       desc="MediaPipe Hands 21 нүктесі арқылы нақты уақытта қимылдарды анықтайды. 15 кадрлық тегістеу — жоғары дәлдік." className="lg:col-span-2" />
          <BentoCard      delay={0.05} icon={Heart}          gradient="from-[#E8507A] to-amber-500"         title="rPPG пульс"              desc="Веб-камера арқылы жүрек соғуын физикалық датчиксіз өлшейді." />
          <BentoCard      delay={0.08} icon={Brain}          gradient="from-[#6B2D5E] to-indigo-500"        title="AI Репетитор"            desc="GPT-4o эмоцияңызды ескеріп, жауап береді." />
          <BentoCard big  delay={0.11} icon={BarChart3}      gradient="from-indigo-500 to-[#6B2D5E]"        title="Нақты уақыт аналитика"  desc="Пульс, зейін және эмоция хронологиясы. 28 күндік белсенділік картасы. Мұғалімге тікелей стрим." className="lg:col-span-2" />
          <BentoCard      delay={0.14} icon={Sparkles}       gradient="from-amber-500 to-[#E8507A]"         title="Бейімделу"               desc="Стресс анықталса жеңілдетеді, сабырлы кезде қиындатады." />
          <BentoCard      delay={0.17} icon={Film}           gradient="from-[#E8507A] to-[#6B2D5E]"        title="Бейне аудару"            desc="Ымдау тілі бейнесін мәтінге аударады." />
          <BentoCard      delay={0.2}  icon={MessageSquare}  gradient="from-[#6B2D5E] to-rose-400"         title="Тікелей сұхбат"         desc="Мұғалім мен сынып арасында нақты уақыт чат + WebRTC." />
          <BentoCard      delay={0.23} icon={FileText}       gradient="from-rose-400 to-amber-500"          title="Онлайн тесттер"         desc="Мұғалім тест жасайды, студент нәтижесін бірден көреді." />
          <BentoCard      delay={0.26} icon={BookOpen}       gradient="from-amber-500 to-[#6B2D5E]"         title="Сөздік"                 desc="200+ сөз, суреттер, санаттар, таңдаулылар." />
        </div>
      </section>

      {/* ── FOR WHO TABS ── */}
      <section className="bg-white border-y border-[#EDD8E8] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-black text-[#1C1C2E] mb-3">Кімдерге арналған?</h2>
          </motion.div>

          <div className="flex justify-center mb-10">
            <div className="flex bg-[#F2E8F0] rounded-2xl p-1.5 gap-1">
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-250 ${activeTab === i ? 'text-white shadow-md' : 'text-[#6B2D5E] hover:bg-white/60'}`}
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
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {tabs[activeTab].points.map((point, i) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 p-4 bg-[#FDF5F8] rounded-2xl border border-[#EDD8E8]"
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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-[#E8507A] mb-3 block">Қадамдар</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1C1C2E]">3 қадамда бастаңыз</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-0.5 bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] opacity-20" />
          {[
            { n: '01', icon: '📝', title: 'Тіркеліңіз',         desc: 'Оқушы немесе мұғалім ретінде 1 минутта тіркеліңіз. Ешқандай карта қажет емес.' },
            { n: '02', icon: '📷', title: 'Камераны қосыңыз',   desc: 'Биометрика мен ымдау тілін тану веб-камера арқылы — деректер тек браузерде.' },
            { n: '03', icon: '🚀', title: 'Үйреніп өсіңіз',    desc: 'AI бейімдеу мен нақты уақыт аналитикасымен тез прогресс жасаңыз.' },
          ].map((item, i) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="relative p-6 sm:p-8 rounded-3xl bg-white border border-[#EDD8E8] shadow-sm hover:shadow-lg hover:shadow-[#6B2D5E]/8 hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F2E8F0] flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-200">
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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[2rem] overflow-hidden p-10 sm:p-16 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B2D5E] via-[#8B3D7E] to-[#E8507A]" />
          {/* Static rings — no JS animation */}
          {[200, 350, 500].map((size, i) => (
            <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
              style={{ width: size, height: size }} />
          ))}
          <div className="relative">
            <div className="text-3xl mb-6">✨</div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Бүгін бастаңыз!</h2>
            <p className="text-white/75 text-base sm:text-lg mb-10 max-w-xl mx-auto">
              Тіркелу бір минут алады. Кредит карта талап етілмейді.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#6B2D5E] font-black rounded-2xl hover:bg-[#FDF5F8] hover:-translate-y-0.5 transition-all duration-200 text-base shadow-2xl">
                Тіркелу <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <button onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/15 text-white font-black rounded-2xl hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-200 border border-white/30 text-base">
                Кіру
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#EDD8E8] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6B2D5E] to-[#E8507A] flex items-center justify-center">
              <span className="text-white font-black text-xs">F</span>
            </div>
            <span className="font-black text-[#6B2D5E]">FeelFlow</span>
          </div>
          <p className="text-xs text-[#9C8A98]">© 2026 FeelFlow. Барлық құқықтар қорғалған. 🇰🇿</p>
          <div className="flex gap-4 text-xs text-[#9C8A98] font-bold">
            <button onClick={() => navigate('/login')} className="hover:text-[#6B2D5E] transition-colors">Кіру</button>
            <button onClick={() => navigate('/register')} className="hover:text-[#6B2D5E] transition-colors">Тіркелу</button>
          </div>
        </div>
      </footer>

      <style>{`
        /* Shimmer — GPU composited (background-position change) */
        .landing-shimmer {
          animation: landing-shimmer 3s linear infinite;
          background-size: 200%;
        }
        @keyframes landing-shimmer {
          0%   { background-position: 0% 50% }
          100% { background-position: 200% 50% }
        }

        /* Blobs — CSS only, will-change: transform for GPU layer */
        .landing-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          will-change: transform;
        }
        .blob-1 {
          width: 600px; height: 600px;
          background: #6B2D5E;
          opacity: 0.12;
          top: -200px; left: -200px;
          animation: blob-float1 12s ease-in-out infinite;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: #E8507A;
          opacity: 0.1;
          top: 30%; right: -100px;
          animation: blob-float2 15s ease-in-out infinite;
        }
        .blob-3 {
          width: 300px; height: 300px;
          background: #6B2D5E;
          opacity: 0.08;
          bottom: 20%; left: 10%;
          animation: blob-float3 10s ease-in-out infinite;
        }
        @keyframes blob-float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes blob-float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-20px, 25px) scale(1.08); }
        }
        @keyframes blob-float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(15px, -15px) scale(1.05); }
        }

        /* Float cards — CSS, transform only = GPU composited */
        .css-float-1 { animation: float-a 5s ease-in-out infinite; }
        .css-float-2 { animation: float-b 6s ease-in-out infinite; }
        .css-float-3 { animation: float-c 4.5s ease-in-out infinite; }
        @keyframes float-a { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes float-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(14px)} }
        @keyframes float-c { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }

        /* Scroll hint bounce */
        .css-bounce { animation: hint-bounce 2s ease-in-out infinite; }
        @keyframes hint-bounce { 0%,100%{transform:translate(-50%,0)} 50%{transform:translate(-50%,6px)} }
      `}</style>
    </div>
  )
}
