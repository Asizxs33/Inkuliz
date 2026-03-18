/**
 * Emotion detection using face-api.js
 * Detects facial expressions from webcam video and maps to Kazakh labels
 */

// face-api.js loaded via CDN script tag
const faceapi = () => (window as any).faceapi

let modelsLoaded = false
let modelsLoading = false
const loadCallbacks: Array<() => void> = []

// Load face-api.js from CDN
function loadFaceApiScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).faceapi) return resolve()
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export interface EmotionResult {
  emotion: string
  emotionKz: string
  confidence: number
  cognitive: number
}

const emotionMap: Record<string, string> = {
  happy: 'ҚУАНЫШТЫ',
  sad: 'МҰҢДЫ',
  angry: 'АШУЛЫ',
  fearful: 'ҚОРЫҚҚАН',
  disgusted: 'ЖИІРКЕНГЕН',
  surprised: 'ТАҢҒАЛҒАН',
  neutral: 'ШОҒЫРЛАНҒАН',
}

export class EmotionDetector {
  async loadModels(): Promise<void> {
    if (modelsLoaded) return
    if (modelsLoading) {
      return new Promise((resolve) => {
        loadCallbacks.push(resolve)
      })
    }
    modelsLoading = true

    try {
      await loadFaceApiScript()
      const api = faceapi()
      if (!api) throw new Error('face-api.js not loaded')

      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        api.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ])
      modelsLoaded = true
      console.log('✅ Face-api.js models loaded')
      loadCallbacks.forEach((cb) => cb())
      loadCallbacks.length = 0
    } catch (err) {
      console.error('Failed to load face-api.js models:', err)
      modelsLoading = false
      throw err
    }
  }

  async detect(videoElement: HTMLVideoElement): Promise<EmotionResult | null> {
    if (!modelsLoaded) return null
    const api = faceapi()
    if (!api) return null

    try {
      const result = await api
        .detectSingleFace(videoElement, new api.TinyFaceDetectorOptions())
        .withFaceExpressions()

      if (!result) return null

      const expressions = result.expressions
      const sorted = Object.entries(expressions).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )
      const [dominantEmotion, dominantScore] = sorted[0] as [string, number]

      const stressEmotions = ['angry', 'fearful', 'disgusted']
      const tiredEmotions = ['sad', 'neutral']

      let cognitive = 50
      if (stressEmotions.includes(dominantEmotion)) cognitive = 85
      if (dominantEmotion === 'happy') cognitive = 35
      if (tiredEmotions.includes(dominantEmotion)) cognitive = 60

      return {
        emotion: dominantEmotion,
        emotionKz: emotionMap[dominantEmotion] || 'БЕЛГІСІЗ',
        confidence: Math.round(dominantScore * 100),
        cognitive,
      }
    } catch (err) {
      console.debug('Emotion detection error:', err)
      return null
    }
  }
}
