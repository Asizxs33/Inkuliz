import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileVideo, Copy, RotateCcw, Loader2, CheckCircle2, Film } from 'lucide-react'
import { recognizeGesture, resetSequenceBuffer, GestureHistory, type Landmark } from '../lib/gestureRecognizer'

function loadMediaPipe(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).Hands) return resolve()
    const existing = document.querySelector('script[src*="mediapipe/hands"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

type Status = 'idle' | 'loading' | 'processing' | 'done' | 'error'

export default function VideoTranslate() {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [words, setWords] = useState<string[]>([])
  const [sentence, setSentence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fileName, setFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef(false)

  const generateSentence = useCallback(async (detectedWords: string[]) => {
    if (detectedWords.length === 0) return
    setIsGenerating(true)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/sign-language/sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: detectedWords }),
      })
      const data = await res.json()
      if (data.sentence) setSentence(data.sentence)
    } catch {
      // sentence generation is optional — skip silently
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const processVideo = useCallback(async (file: File) => {
    abortRef.current = false
    resetSequenceBuffer()
    setStatus('loading')
    setProgress(0)
    setWords([])
    setSentence('')
    setErrorMsg('')

    try {
      await loadMediaPipe()
      const HandsCls = (window as any).Hands

      const hands = new HandsCls({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      })
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      })

      const gestureHistory = new GestureHistory(8)
      const detectedWords: string[] = []
      let pendingLandmarks: Landmark[][] | null = null

      hands.onResults((results: any) => {
        pendingLandmarks = results.multiHandLandmarks?.length > 0
          ? results.multiHandLandmarks
          : null
      })

      await hands.initialize()

      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.src = url
      video.muted = true
      video.playsInline = true

      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res()
        video.onerror = () => rej(new Error('Видео файлды оқу қатесі'))
      })

      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')!

      const duration = video.duration
      const step = 0.1 // 10 кадр/сек

      setStatus('processing')

      for (let t = 0; t < duration; t += step) {
        if (abortRef.current) break

        video.currentTime = t
        await new Promise<void>((res) => {
          video.onseeked = () => res()
        })

        ctx.drawImage(video, 0, 0, 640, 480)
        pendingLandmarks = null
        await hands.send({ image: canvas })

        if (pendingLandmarks) {
          const result = recognizeGesture(pendingLandmarks)
          const histResult = result.isMlMatch
            ? gestureHistory.forceUnlock(result.wordKz)
            : gestureHistory.push(result.wordKz)

          if (histResult.isUnlocked && histResult.word && histResult.word !== '...') {
            if (detectedWords[detectedWords.length - 1] !== histResult.word) {
              detectedWords.push(histResult.word)
              setWords([...detectedWords])
            }
          }
        }

        setProgress(Math.min(99, Math.round((t / duration) * 100)))
      }

      URL.revokeObjectURL(url)
      hands.close()

      setProgress(100)
      setStatus('done')

      if (detectedWords.length > 0) {
        generateSentence(detectedWords)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Қате орын алды')
      setStatus('error')
    }
  }, [generateSentence])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Тек бейне файлдар қолдарылады')
      setStatus('error')
      return
    }
    setFileName(file.name)
    processVideo(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleReset = () => {
    abortRef.current = true
    setStatus('idle')
    setProgress(0)
    setWords([])
    setSentence('')
    setFileName('')
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const copyResult = () => {
    const text = sentence || words.join(' ')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">Бейнені аудару</h1>
        <p className="text-text-muted text-sm mt-1">Ымдау тілі бейнесін жүктеп, мәтінге аударыңыз</p>
      </div>

      {/* Upload zone */}
      {status === 'idle' && (
        <motion.label
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          htmlFor="video-upload"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-4 p-6 lg:p-12 rounded-2xl border-2 border-dashed border-plum/30 bg-plum/5 cursor-pointer hover:border-plum/60 hover:bg-plum/10 transition-all"
        >
          <div className="w-16 h-16 rounded-2xl bg-plum/10 flex items-center justify-center">
            <Upload size={28} className="text-plum" />
          </div>
          <div className="text-center">
            <p className="font-bold text-text-primary">Бейне файлды жүктеу</p>
            <p className="text-text-muted text-sm mt-1">немесе осы жерге сүйреп тастаңыз</p>
            <p className="text-text-muted text-xs mt-2">MP4, MOV, WebM · макс. 200 МБ</p>
          </div>
          <input
            ref={inputRef}
            id="video-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </motion.label>
      )}

      {/* Loading / Processing */}
      {(status === 'loading' || status === 'processing') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum/10 flex items-center justify-center shrink-0">
              <FileVideo size={20} className="text-plum" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary text-sm truncate">{fileName}</p>
              <p className="text-text-muted text-xs mt-0.5">
                {status === 'loading' ? 'MediaPipe жүктелуде...' : `Кадрлар талданып жатыр — ${progress}%`}
              </p>
            </div>
            <Loader2 size={18} className="text-plum animate-spin shrink-0" />
          </div>

          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-plum to-rose rounded-full"
              animate={{ width: `${status === 'loading' ? 5 : progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {words.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {words.map((w, i) => (
                <span key={i} className="px-3 py-1 bg-plum-pale rounded-full text-plum font-bold text-sm">
                  {w}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Error */}
      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card border border-danger/30 bg-danger/5 flex items-center justify-between gap-4"
        >
          <p className="text-danger text-sm font-medium">{errorMsg}</p>
          <button onClick={handleReset} className="text-text-muted hover:text-plum transition-colors shrink-0">
            <RotateCcw size={16} />
          </button>
        </motion.div>
      )}

      {/* Done */}
      <AnimatePresence>
        {status === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {/* File info bar */}
            <div className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <Film size={18} className="text-success" />
                </div>
                <div>
                  <p className="font-bold text-text-primary text-sm truncate max-w-xs">{fileName}</p>
                  <p className="text-text-muted text-xs">{words.length} сөз анықталды</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                <button onClick={handleReset} className="text-text-muted hover:text-plum transition-colors">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Detected words */}
            {words.length > 0 ? (
              <div className="card">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Анықталған сөздер</p>
                <div className="flex flex-wrap gap-2">
                  {words.map((w, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-3 py-1.5 bg-plum-pale rounded-full text-plum font-bold text-sm"
                    >
                      {w}
                    </motion.span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center py-8 text-text-muted">
                <p className="text-sm">Бейнеде ымдау жесттері табылмады</p>
                <p className="text-xs mt-1">Жесттер анық және жақсы жарықтандырылған болуы керек</p>
              </div>
            )}

            {/* AI Sentence */}
            {words.length > 0 && (
              <div className="card border-2 border-plum/30 bg-plum/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-plum flex items-center justify-center">
                      <span className="text-white font-bold text-[10px]">AI</span>
                    </div>
                    <span className="text-xs font-bold text-plum uppercase">Мағыналы Сөйлем</span>
                  </div>
                  <button
                    onClick={copyResult}
                    className="text-text-muted hover:text-plum transition-colors"
                    title="Көшіру"
                  >
                    {copied ? <CheckCircle2 size={16} className="text-success" /> : <Copy size={16} />}
                  </button>
                </div>

                {isGenerating ? (
                  <div className="flex items-center gap-3 text-text-muted py-2">
                    <Loader2 size={16} className="animate-spin text-plum" />
                    <span className="italic text-sm">Сөйлем құрастырылуда...</span>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-text-primary">
                    {sentence || words.join(' ')}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
