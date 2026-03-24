import type { Landmark } from './gestureRecognizer'

/**
 * Normalizes up to 2 hands (42 landmarks) into a 126-dimensional shape vector.
 * If only 1 hand is visible, the other 21 points are set to 0.
 */
export function normalizeDualHandLandmarks(hands: Landmark[][]): number[] {
  const combined: Landmark[] = []
  
  // Fill Hand 1 or zeros
  const h1 = (hands && hands.length > 0 && hands[0]) ? hands[0] : Array(21).fill({x:0, y:0, z:0})
  // Fill Hand 2 or zeros
  const h2 = (hands && hands.length > 1 && hands[1]) ? hands[1] : Array(21).fill({x:0, y:0, z:0})
  
  combined.push(...h1, ...h2)

  // Origin is wrist of first active hand, else 0
  let origin = {x:0, y:0, z:0}
  if (hands && hands.length > 0 && hands[0]) origin = hands[0][0]
  else if (hands && hands.length > 1 && hands[1]) origin = hands[1][0]

  let maxDist = 0
  for (let i = 0; i < 42; i++) {
    if (combined[i].x === 0 && combined[i].y === 0 && combined[i].z === 0) continue
    const dist = Math.sqrt(
      Math.pow(combined[i].x - origin.x, 2) +
      Math.pow(combined[i].y - origin.y, 2) +
      Math.pow(combined[i].z - origin.z, 2)
    )
    if (dist > maxDist) maxDist = dist
  }
  if (maxDist === 0) maxDist = 1

  const vector: number[] = []
  for (let i = 0; i < 42; i++) {
    if (combined[i].x === 0 && combined[i].y === 0 && combined[i].z === 0) {
      vector.push(0, 0, 0)
    } else {
      vector.push((combined[i].x - origin.x) / maxDist)
      vector.push((combined[i].y - origin.y) / maxDist)
      vector.push((combined[i].z - origin.z) / maxDist)
    }
  }

  return vector
}

export function euclideanDistance(vecA: number[], vecB: number[]): number {
  let sum = 0
  for (let i = 0; i < vecA.length; i++) {
    sum += Math.pow(vecA[i] - vecB[i], 2)
  }
  return Math.sqrt(sum)
}

/**
 * Normalizes a sequence of frames into 128-dimensional vectors.
 * Adds Velocity (dx, dy) to capture motion trajectory.
 */
export function normalizeDualSequence(sequence: Landmark[][][]): number[][] {
  const result: number[][] = []
  const VELOCITY_WEIGHT = 3.5 // Balanced motion and shape

  for (let i = 0; i < sequence.length; i++) {
    const shapeVec = normalizeDualHandLandmarks(sequence[i])

    let dx = 0, dy = 0
    if (i > 0) {
      const currHands = sequence[i]
      const prevHands = sequence[i - 1]
      const currOrigin = (currHands && currHands.length > 0 && currHands[0]) ? currHands[0][0] : null
      const prevOrigin = (prevHands && prevHands.length > 0 && prevHands[0]) ? prevHands[0][0] : null
      
      if (currOrigin && prevOrigin) {
         dx = (currOrigin.x - prevOrigin.x) * VELOCITY_WEIGHT
         dy = (currOrigin.y - prevOrigin.y) * VELOCITY_WEIGHT
      }
    }
    
    shapeVec.push(dx, dy) // 126 shape + 2 motion = 128
    result.push(shapeVec)
  }
  return result
}

/**
 * Dynamic Time Warping (DTW) algorithm
 */
export function dtwDistance(seq1: number[][], seq2: number[][]): number {
  const n = seq1.length
  const m = seq2.length
  if (n === 0 || m === 0) return Infinity

  const matrix: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(Infinity))
  matrix[0][0] = 0

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = euclideanDistance(seq1[i - 1], seq2[j - 1])
      matrix[i][j] = cost + Math.min(
        matrix[i - 1][j],    // insertion
        matrix[i][j - 1],    // deletion
        matrix[i - 1][j - 1] // match
      )
    }
  }

  // Normalize by path length
  return matrix[n][m] / (n + m)
}

export interface MLTrainingSequence {
  wordKz: string;
  rawSequence: Landmark[][][]; // Preserved absolute raw tracking points
  sequence?: number[][]; // Cached normalized calculation
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || ''

export class GestureML {
  private examples: MLTrainingSequence[] = []
  private readonly STORAGE_KEY = 'emolearn_dtw_v3'
  private userId: string | null = null

  constructor() {
    this.loadFromLocalStorage()
  }

  // Call once after login so server sync works
  public setUserId(id: string) {
    if (this.userId === id) return
    this.userId = id
    this.syncFromServer()
  }

  private loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        const raw = JSON.parse(data)
        this.examples = raw.map((ex: any) => ({
          wordKz: ex.wordKz,
          rawSequence: ex.rawSequence,
          sequence: normalizeDualSequence(ex.rawSequence),
        }))
        console.log(`[ML] Loaded ${this.examples.length} examples from localStorage`)
      }
    } catch (e) {
      console.warn('[ML] localStorage load failed', e)
    }
  }

  private saveToLocalStorage() {
    try {
      const serialized = this.examples.map(ex => ({ wordKz: ex.wordKz, rawSequence: ex.rawSequence }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized))
    } catch (e) {
      console.warn('[ML] localStorage save failed', e)
    }
  }

  // Merge server sequences (server is source of truth)
  public async syncFromServer(overrideUserId?: string): Promise<{ uid: string | null; count: number; error: string | null }> {
    const uid = overrideUserId || this.userId
    if (!uid) return { uid: null, count: 0, error: 'no userId' }
    if (!this.userId) this.userId = uid
    try {
      const res = await fetch(`${API_BASE}/api/gestures/${uid}`)
      if (!res.ok) return { uid, count: 0, error: `HTTP ${res.status}` }
      const { sequences } = await res.json()
      if (!sequences?.length) return { uid, count: 0, error: null }

      const serverExamples: MLTrainingSequence[] = sequences.map((row: any) => ({
        wordKz: row.word_kz,
        rawSequence: row.raw_sequence,
        sequence: normalizeDualSequence(row.raw_sequence),
      }))

      this.examples = serverExamples
      this.saveToLocalStorage()
      console.log(`[ML] Synced ${serverExamples.length} examples from server`)
      return { uid, count: serverExamples.length, error: null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn('[ML] Server sync failed', e)
      return { uid, count: 0, error: msg }
    }
  }

  public async addSequenceExample(wordKz: string, rawSequence: Landmark[][][]) {
    const sequence = normalizeDualSequence(rawSequence)
    if (sequence.length < 5) return

    this.examples.push({ wordKz, rawSequence, sequence })
    this.saveToLocalStorage()

    // Save to server
    if (this.userId) {
      const res = await fetch(`${API_BASE}/api/gestures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, wordKz, rawSequence }),
      })
      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText)
        throw new Error(`Server save failed: ${res.status} ${err}`)
      }
    }
  }

  public async clearExamples(wordKz: string) {
    this.examples = this.examples.filter(e => e.wordKz !== wordKz)
    this.saveToLocalStorage()

    if (this.userId) {
      try {
        await fetch(`${API_BASE}/api/gestures/${this.userId}/${encodeURIComponent(wordKz)}`, {
          method: 'DELETE',
        })
      } catch (e) {
        console.warn('[ML] Server delete failed', e)
      }
    }
  }

  public getCounts(): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const ex of this.examples) {
      counts[ex.wordKz] = (counts[ex.wordKz] || 0) + 1
    }
    return counts
  }

  public predictSequence(rawSequence: Landmark[][][]): { wordKz: string; distance: number } | null {
    if (this.examples.length === 0 || rawSequence.length < 5) return null

    const liveSequence = normalizeDualSequence(rawSequence)
    if (liveSequence.length === 0) return null

    let bestMatch = ''
    let minDistance = Infinity

    for (const example of this.examples) {
      if (!example.sequence) continue
      const dist = dtwDistance(liveSequence, example.sequence)
      if (dist < minDistance) {
        minDistance = dist
        bestMatch = example.wordKz
      }
    }

    if (minDistance < 1.1) {
      return { wordKz: bestMatch, distance: minDistance }
    }
    return null
  }
}

export const ML_CLASSIFIER = new GestureML()
