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
export interface GestureResult { word: string; wordKz: string; confidence: number; isMlMatch?: boolean }

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

import { ML_CLASSIFIER } from './mlClassifier'

let sequenceBuffer: Landmark[][][] = []

export function recognizeGesture(hands: Landmark[][]): GestureResult {
  if (!hands || hands.length === 0 || !hands[0] || hands[0].length < 21) {
    if (sequenceBuffer.length > 0) sequenceBuffer = []
    return { word: '—', wordKz: '—', confidence: 0 }
  }

  // Update rolling buffer
  sequenceBuffer.push(hands)
  if (sequenceBuffer.length > 25) {
     sequenceBuffer.shift()
  }

  // 1. ML Classification (DTW Sequence Matching)
  if (sequenceBuffer.length >= 10) {
    const mlPrediction = ML_CLASSIFIER.predictSequence(sequenceBuffer)
    if (mlPrediction) {
      // Clear the buffer after a successful match to allow for a cooldown
      sequenceBuffer = []
      return {
        word: mlPrediction.wordKz.toUpperCase(),
        wordKz: mlPrediction.wordKz,
        // Confidence is synthesized from the distance. Threshold is 1.3, so lower distance -> higher conf
        confidence: Math.round((1.0 - (mlPrediction.distance / 2.0)) * 100) / 100,
        isMlMatch: true
      }
    }
  }

  // 2. Fallback to ultra-precise geometric rules
  const lm = hands[0]
  const thumb  = isFingerExtended(lm, 4, 3) // Relaxed thumb detection (pip instead of mcp)
  const index  = isFingerExtended(lm, 8, 6)
  const middle = isFingerExtended(lm, 12, 10)
  const ring   = isFingerExtended(lm, 16, 14)
  const pinky  = isFingerExtended(lm, 20, 18)

  // Thumb operations
  const thumbUpAngle = angle(lm[4], lm[3], lm[2])
  const thumbUpHeight = lm[4].y < lm[3].y && lm[4].y < lm[2].y
  const thumbUp = thumbUpHeight && thumbUpAngle > 150 && !index && !middle && !ring && !pinky

  // Thumb-index pinch (OK/Рахмет style)
  const pinchDist = dist(lm[4], lm[8])
  const isPinch = pinchDist < 0.04  // tighter pinch

  // Open palm — all 5 extended, but check spread
  const spreadDistIndexPinky = dist(lm[8], lm[20])
  const openPalm = thumb && index && middle && ring && pinky && spreadDistIndexPinky > 0.15

  // Peace / V — index + middle up widely, others curled tightly
  const peaceSpread = dist(lm[8], lm[12])
  const peaceSign = !thumb && index && middle && !ring && !pinky && peaceSpread > 0.05

  // Pointing (Мен) — ONLY index extended, thumb tightly tucked
  const pointing = index && !middle && !ring && !pinky && lm[4].x < lm[5].x

  // Fist / Stop — all curled tight
  const fistDist = dist(lm[8], lm[0])
  const fist = !index && !middle && !ring && !pinky && fistDist < 0.15

  // I Love You — thumb, index, pinky fully extended
  const iLoveYou = thumb && index && !middle && !ring && pinky

  // OK sign / Рахмет — firm pinch + other 3 fingers straight
  const okSign = isPinch && middle && ring && pinky

  // Pinky Only (Кіші)
  const pinkyOnly = !thumb && !index && !middle && !ring && pinky

  // Very specific pinched fist (Кішкентай)
  const pinchedFist = isPinch && !middle && !ring && !pinky

  // Phone shape (Телефон)
  const phoneShape = thumb && !index && !middle && !ring && pinky && dist(lm[4], lm[20]) > 0.15

  // RULES → Kazakh sign words
  if (openPalm) return { word: 'СӘЛЕМ', wordKz: 'Сәлем', confidence: 0.94 }
  if (thumbUp) return { word: 'ЖАҚСЫ', wordKz: 'Жақсы', confidence: 0.96 }
  if (peaceSign) return { word: 'СІЗ', wordKz: 'Сіз', confidence: 0.91 }
  if (iLoveYou) return { word: 'СҮЙЕМІН', wordKz: 'Сүйемін', confidence: 0.92 }
  if (okSign) return { word: 'РАХМЕТ', wordKz: 'Рахмет', confidence: 0.93 }
  if (pointing) return { word: 'МЕН', wordKz: 'Мен', confidence: 0.89 }
  if (fist) return { word: 'СТОП', wordKz: 'Стоп', confidence: 0.88 }
  if (pinkyOnly) return { word: 'КІШІ', wordKz: 'Кіші', confidence: 0.85 }
  if (pinchedFist) return { word: 'КІШКЕНТАЙ', wordKz: 'Кішкентай', confidence: 0.87 }
  if (phoneShape) return { word: 'ТЕЛЕФОН', wordKz: 'Телефон', confidence: 0.90 }

  return { word: '...', wordKz: 'Аяқтауда', confidence: 0 }
}

export interface GestureHistoryResult {
  word: string | null;
  progress: number;
  isUnlocked: boolean;
  isCooldown?: boolean;
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

  forceUnlock(word: string): GestureHistoryResult {
    this.currentWord = word
    this.lastLockedWord = word
    this.consecutiveFrames = this.requiredFrames
    this.cooldownFrames = 30 // ~2-3 seconds cooldown at 10-15fps
    return { word: word, progress: 100, isUnlocked: true, isCooldown: true }
  }

  push(word: string): GestureHistoryResult {
    if (this.cooldownFrames > 0) {
      this.cooldownFrames--
      return { word: this.lastLockedWord, progress: 100, isUnlocked: false, isCooldown: true }
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
