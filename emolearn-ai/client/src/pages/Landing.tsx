import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Hand, Brain, Heart, Sparkles, BarChart3, MessageSquare, BookOpen, ArrowRight, CheckCircle2, Film, FileText } from 'lucide-react'

const features = [
  { icon: Hand,         color: 'from-plum to-rose',     title: 'Ымдау тілі',       desc: 'MediaPipe арқылы нақты уақытта қимылдарды тану және жаттығу' },
  { icon: Brain,        color: 'from-rose to-amber-500', title: 'AI Репетитор',     desc: 'Сіздің эмоцияңызды сезіп, оқытуды автоматты бейімдейтін AI мұғалім' },
  { icon: Heart,        color: 'from-amber-500 to-rose', title: 'Биометрика',       desc: 'Жүрек соғуы мен зейінді веб-камера арқылы өлшейтін rPPG технологиясы' },
  { icon: BarChart3,    color: 'from-plum to-indigo-500',title: 'Аналитика',        desc: 'Оқу барысын, эмоция динамикасын нақты уақытта қадағалау' },
  { icon: MessageSquare,color: 'from-rose to-plum',      title: 'Тікелей сұхбат',  desc: 'Мұғалімдер мен оқушылар арасындағы нақты уақыт чаты' },
  { icon: Film,         color: 'from-indigo-500 to-rose',title: 'Бейне аудару',    desc: 'Ымдау тілі бейнелерін автоматты мәтінге аудару' },
  { icon: BookOpen,     color: 'from-plum to-rose',      title: 'Сөздік',           desc: '200+ қазақ ымдау тілі сөзі суреттері мен мысалдарымен' },
  { icon: FileText,     color: 'from-rose to-amber-500', title: 'Онлайн тесттер',  desc: 'Мұғалімдер тест құрады, оқушылар нәтижесін бірден көреді' },
  { icon: Sparkles,     color: 'from-amber-500 to-plum', title: 'GPT-4o негізі',   desc: 'Жетілдірілген тіл моделі арқылы жекелендірілген оқу жолы' },
]

const stats = [
  { value: '200+', label: 'Ымдау сөздер' },
  { value: 'AI',   label: 'GPT-4o негіз' },
  { value: '100%', label: 'Браузерде ML' },
  { value: '🇰🇿',   label: 'Қазақстан үшін' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FDF5F8] overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EDD8E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B2D5E] to-[#E8507A] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-base">F</span>
            </div>
            <span className="font-black text-xl text-[#6B2D5E]">FeelFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block px-4 py-2 text-sm font-bold text-[#6B2D5E] hover:bg-[#F2E8F0] rounded-xl transition-colors"
            >
              Кіру
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] rounded-xl hover:opacity-90 transition-opacity"
            >
              Тіркелу
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F2E8F0] text-[#6B2D5E] text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8507A] animate-pulse" />
            Қазақстан мектептеріне арналған
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#1C1C2E] leading-tight mb-6">
            Ымдау тілін{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6B2D5E] to-[#E8507A]">
              AI арқылы
            </span>
            <br />үйреніңіз
          </h1>

          <p className="text-base sm:text-lg text-[#7A6A78] max-w-2xl mx-auto mb-10 leading-relaxed">
            FeelFlow — биометрика, эмоция анализі және жасанды интеллект арқылы
            оқушыларға жекелендірілген оқыту тәжірибесін ұсынатын платформа.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-[#6B2D5E] to-[#E8507A] rounded-2xl shadow-lg shadow-[#6B2D5E]/20 hover:opacity-90 transition-all hover:-translate-y-0.5"
            >
              Тегін бастау <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-[#6B2D5E] bg-white border-2 border-[#EDD8E8] rounded-2xl hover:border-[#6B2D5E]/40 transition-all hover:-translate-y-0.5"
            >
              Кіру
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto"
        >
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#EDD8E8] p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-[#6B2D5E]">{s.value}</p>
              <p className="text-xs text-[#9C8A98] font-bold mt-1 uppercase">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-white border-y border-[#EDD8E8] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1C1C2E] mb-3">Платформа мүмкіндіктері</h2>
            <p className="text-[#7A6A78] text-base max-w-xl mx-auto">Заманауи технологиялармен толықтырылған толыққанды оқу жүйесі</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group p-5 rounded-2xl border border-[#EDD8E8] bg-[#FDF5F8] hover:border-[#6B2D5E]/30 hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-black text-[#1C1C2E] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#7A6A78] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1C1C2E] mb-3">Қалай жұмыс істейді?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Тіркеліңіз',         desc: 'Оқушы немесе мұғалім ретінде тіркеліп, платформаға кіріңіз.' },
            { step: '02', title: 'Камераны қосыңыз',   desc: 'Биометрика мен ымдау тілін тану веб-камера арқылы жұмыс істейді.' },
            { step: '03', title: 'Үйреніңіз және өсіңіз', desc: 'AI бейімдеу мен нақты уақыт аналитикасымен тез прогресс жасаңыз.' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="relative p-6 rounded-2xl bg-white border border-[#EDD8E8] shadow-sm"
            >
              <span className="text-5xl font-black text-[#EDD8E8] absolute top-4 right-5">{item.step}</span>
              <h3 className="font-black text-lg text-[#1C1C2E] mb-2 relative">{item.title}</h3>
              <p className="text-sm text-[#7A6A78] leading-relaxed relative">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#6B2D5E] to-[#E8507A] rounded-3xl p-8 sm:p-12 text-center text-white overflow-hidden relative"
        >
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute rounded-full border border-white"
                style={{ width: 100 + i * 80, height: 100 + i * 80, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            ))}
          </div>
          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-black mb-3">Бүгін бастаңыз — тегін!</h2>
            <p className="text-white/80 mb-8 text-base max-w-lg mx-auto">
              Тіркелу бір минут алады. Кредит карта талап етілмейді.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#6B2D5E] font-black rounded-2xl hover:bg-[#FDF5F8] transition-colors text-base"
              >
                Тіркелу <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-black rounded-2xl hover:bg-white/30 transition-colors border border-white/30 text-base"
              >
                Есептік жазба бар ма? Кіру
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-white/70">
              {['Тегін тіркелу', 'Камера қажет', 'Казахстан мектептеріне арналған'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-white/50" />{t}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#EDD8E8] py-8 text-center text-xs text-[#9C8A98]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6B2D5E] to-[#E8507A] flex items-center justify-center">
            <span className="text-white font-black text-xs">F</span>
          </div>
          <span className="font-black text-[#6B2D5E]">FeelFlow</span>
        </div>
        <p>© 2025 FeelFlow. Барлық құқықтар қорғалған.</p>
      </footer>
    </div>
  )
}
