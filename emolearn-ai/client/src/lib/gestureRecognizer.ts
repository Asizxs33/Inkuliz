/**
 * Rule-based gesture recognizer for Kazakh sign language words.
 * Uses the 21 MediaPipe hand landmarks.
 *
 * Landmark indices (MediaPipe):
 *  0=WRIST, 1=THUMB_CMC, 2=THUMB_MCP, 3=THUMB_IP, 4=THUMB_TIP
 *  5=INDEX_MCP, 6=INDEX_PIP, 7=INDEX_DIP, 8=INDEX_TIP
 *  9=MIDDLE_MCP,10=MIDDLE_PIP,11=MIDDLE_DIP,12=MIDDLE_TIP
 * 13=RING_MCP, 14=RING_PIP, 15=RING_DIP, 16=RING_TIP
 * 17=PINKY_MCP, 18=PINKY_PIP, 19=PINKY_DIP, 20=PINKY_TIP
 */

export interface Landmark { x: number; y: number; z: number }
export interface GestureResult { word: string; wordKz: string; confidence: number }

// Returns true if a finger tip is extended (tip above pip, i.e., lower y)
function isFingerExtended(lm: Landmark[], tip: number, pip: number): boolean {
  return lm[tip].y < lm[pip].y
}

// Distance between two landmarks (normalized coords)
function dist(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// Angle at joint b between a-b-c in degrees
function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const dot = ab.x * cb.x + ab.y * cb.y
  const mag = Math.sqrt((ab.x ** 2 + ab.y ** 2) * (cb.x ** 2 + cb.y ** 2))
  return Math.acos(Math.min(1, dot / (mag + 1e-6))) * (180 / Math.PI)
}

export function recognizeGesture(lm: Landmark[]): GestureResult {
  if (!lm || lm.length < 21) return { word: '—', wordKz: '—', confidence: 0 }

  const thumb  = isFingerExtended(lm, 4, 2)
  const index  = isFingerExtended(lm, 8, 6)
  const middle = isFingerExtended(lm, 12, 10)
  const ring   = isFingerExtended(lm, 16, 14)
  const pinky  = isFingerExtended(lm, 20, 18)

  // Thumb up check (thumb tip above wrist, other fingers curled)
  const thumbUp = lm[4].y < lm[3].y && lm[4].y < lm[2].y &&
    !index && !middle && !ring && !pinky

  // Thumb-index pinch
  const pinchDist = dist(lm[4], lm[8])
  const isPinch = pinchDist < 0.06

  // Open palm — all 5 extended
  const openPalm = thumb && index && middle && ring && pinky

  // Peace / V — index + middle up, others curled
  const peaceSign = !thumb && index && middle && !ring && !pinky

  // Pointing — only index extended
  const pointing = !thumb && index && !middle && !ring && !pinky

  // Fist — all curled
  const fist = !index && !middle && !ring && !pinky

  // ILY — thumb, index, pinky extended
  const iLoveYou = thumb && index && !middle && !ring && pinky

  // OK sign — thumb-index pinch + others extended
  const okSign = isPinch && middle && ring && pinky

  // All fingers curled except pinky
  const pinkyOnly = !thumb && !index && !middle && !ring && pinky

  // Spread check — distance between index and pinky tips
  const spreadDist = dist(lm[8], lm[20])

  // RULES → Kazakh sign words
  if (openPalm && spreadDist > 0.3) {
    return { word: 'СӘЛЕМ', wordKz: 'Сәлем', confidence: 0.94 }
  }
  if (thumbUp) {
    return { word: 'ЖАҚСЫ', wordKz: 'Жақсы', confidence: 0.96 }
  }
  if (peaceSign) {
    return { word: 'СІЗ', wordKz: 'Сіз', confidence: 0.91 }
  }
  if (pointing) {
    return { word: 'МЕН', wordKz: 'Мен', confidence: 0.89 }
  }
  if (iLoveYou) {
    return { word: 'СҮЙЕМІН', wordKz: 'Сүйемін', confidence: 0.92 }
  }
  if (okSign) {
    return { word: 'РАХМЕТ', wordKz: 'Рахмет', confidence: 0.93 }
  }
  if (fist) {
    return { word: 'СТОП', wordKz: 'Стоп', confidence: 0.88 }
  }
  if (pinkyOnly) {
    return { word: 'КІШІ', wordKz: 'Кіші', confidence: 0.85 }
  }
  if (isPinch && !middle && !ring && !pinky) {
    return { word: 'КІШКЕНТАЙ', wordKz: 'Кішкентай', confidence: 0.87 }
  }
  if (thumb && !index && !middle && !ring && pinky) {
    return { word: 'ТЕЛЕФОН', wordKz: 'Телефон', confidence: 0.90 }
  }

  return { word: '...', wordKz: 'Аяқтауда', confidence: 0 }
}

export interface GestureHistoryResult {
  word: string;
  progress: number;
  isUnlocked: boolean;
}

export class GestureHistory {
  private currentWord: string = '...'
  private consecutiveFrames: number = 0
  private readonly requiredFrames: number
  private lastLockedWord: string = ''
  private cooldownFrames: number = 0

  constructor(requiredFrames = 10) { 
    this.requiredFrames = requiredFrames 
  }

  push(word: string): GestureHistoryResult {
    if (this.cooldownFrames > 0) {
      this.cooldownFrames--
      return { word: this.lastLockedWord, progress: 100, isUnlocked: false }
    }

    if (!word || word === '—' || word === '...' || word.includes('Аяқтауда')) {
      this.currentWord = '...'
      this.consecutiveFrames = 0
      return { word: '...', progress: 0, isUnlocked: false }
    }

    if (word === this.currentWord) {
      this.consecutiveFrames++
      if (this.consecutiveFrames >= this.requiredFrames) {
        if (this.currentWord !== this.lastLockedWord) {
          this.lastLockedWord = this.currentWord
          this.cooldownFrames = 30 // Approx 2-3 sec cooldown at 10-15FPS
          return { word: this.currentWord, progress: 100, isUnlocked: true }
        } else {
          return { word: this.currentWord, progress: 100, isUnlocked: false }
        }
      }
    } else {
      this.currentWord = word
      this.consecutiveFrames = 1
    }

    const progress = Math.min(100, (this.consecutiveFrames / this.requiredFrames) * 100)
    return { word: this.currentWord, progress, isUnlocked: false }
  }

  clear() {
    this.currentWord = '...'
    this.consecutiveFrames = 0
    this.lastLockedWord = ''
    this.cooldownFrames = 0
  }
}
