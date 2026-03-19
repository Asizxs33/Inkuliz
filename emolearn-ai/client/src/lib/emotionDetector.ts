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
  isEyesClosed: boolean
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

// Function to calculate Eye Aspect Ratio (EAR) to detect blinks/closed eyes
function calculateEAR(eye: any[]): number {
  if (!eye || eye.length < 6) return 1.0;
  // face-api.js eye landmarks: 0 (left corner), 1,2 (top), 3 (right corner), 4,5 (bottom)
  const vertical1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
  const vertical2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
  const horizontal = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export class EmotionDetector {
  private recentEmotions: string[] = []
  private readonly HISTORY_SIZE = 5

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
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
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
        .withFaceLandmarks()
        .withFaceExpressions()

      if (!result) return null

      // Check for closed eyes using EAR
      const leftEye = result.landmarks.getLeftEye()
      const rightEye = result.landmarks.getRightEye()
      const leftEAR = calculateEAR(leftEye)
      const rightEAR = calculateEAR(rightEye)
      const avgEAR = (leftEAR + rightEAR) / 2.0
      
      // Typical EAR threshold for closed eyes is ~0.25
      const isEyesClosed = avgEAR < 0.25

      const expressions = result.expressions
      const sorted = Object.entries(expressions).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )
      const [dominantEmotion, dominantScore] = sorted[0] as [string, number]

      // Push to history for smoothing
      this.recentEmotions.push(dominantEmotion)
      if (this.recentEmotions.length > this.HISTORY_SIZE) {
        this.recentEmotions.shift()
      }

      // Voting system: find the most frequent emotion in the recent history
      const votes: Record<string, number> = {}
      for (const e of this.recentEmotions) {
        votes[e] = (votes[e] || 0) + 1
      }
      
      let stableEmotion = dominantEmotion
      let maxVotes = 0
      for (const [e, count] of Object.entries(votes)) {
        if (count > maxVotes) {
          maxVotes = count
          stableEmotion = e
        }
      }

      const stressEmotions = ['angry', 'fearful', 'disgusted']
      const tiredEmotions = ['sad', 'neutral']

      let cognitive = 50
      if (stressEmotions.includes(stableEmotion)) cognitive = 85
      if (stableEmotion === 'happy') cognitive = 35
      if (tiredEmotions.includes(stableEmotion)) cognitive = 60

      return {
        emotion: stableEmotion,
        emotionKz: isEyesClosed ? 'ҰЙҚЫДА' : (emotionMap[stableEmotion] || 'БЕЛГІСІЗ'),
        confidence: Math.round(dominantScore * 100),
        cognitive,
        isEyesClosed
      }
    } catch (err) {
      console.debug('Emotion detection error:', err)
      return null
    }
  }
}
