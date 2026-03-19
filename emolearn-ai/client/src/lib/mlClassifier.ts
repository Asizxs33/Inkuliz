import type { Landmark } from './gestureRecognizer'

/**
 * Normalizes 21 landmarks into a 63-dimensional feature vector.
 */
export function normalizeLandmarks(landmarks: Landmark[]): number[] {
  if (!landmarks || landmarks.length !== 21) return []

  const wrist = landmarks[0]
  let maxDist = 0

  for (let i = 1; i < landmarks.length; i++) {
    const dist = Math.sqrt(
      Math.pow(landmarks[i].x - wrist.x, 2) +
      Math.pow(landmarks[i].y - wrist.y, 2) +
      Math.pow(landmarks[i].z - wrist.z, 2)
    )
    if (dist > maxDist) maxDist = dist
  }
  if (maxDist === 0) maxDist = 1

  const vector: number[] = []
  for (let i = 0; i < landmarks.length; i++) {
    vector.push((landmarks[i].x - wrist.x) / maxDist)
    vector.push((landmarks[i].y - wrist.y) / maxDist)
    vector.push((landmarks[i].z - wrist.z) / maxDist)
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
 * Normalizes a sequence of frames into vectors.
 * Adds Velocity (dx, dy) to capture motion trajectory.
 */
export function normalizeSequence(sequence: Landmark[][]): number[][] {
  const result: number[][] = []
  const VELOCITY_WEIGHT = 7.0 // Emphasize motion trajectory heavily

  for (let i = 0; i < sequence.length; i++) {
    const shapeVec = normalizeLandmarks(sequence[i])
    if (shapeVec.length === 0) continue

    let dx = 0, dy = 0
    if (i > 0) {
      dx = (sequence[i][0].x - sequence[i - 1][0].x) * VELOCITY_WEIGHT
      dy = (sequence[i][0].y - sequence[i - 1][0].y) * VELOCITY_WEIGHT
    }
    
    shapeVec.push(dx, dy) // 65-dimensional vector: 63 shape + 2 motion
    result.push(shapeVec)
  }
  return result
}

/**
 * Dynamic Time Warping (DTW) algorithm
 * Compares two time-series sequences of varying speeds.
 * Returns the minimum accumulated distance.
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
  sequence: number[][]; // Array of normalized vectors
}

export class GestureML {
  private examples: MLTrainingSequence[] = []
  private readonly STORAGE_KEY = 'emolearn_dtw_sequences'

  constructor() {
    this.load()
  }

  private load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        this.examples = JSON.parse(data)
        console.log(`[ML] Loaded ${this.examples.length} sequence examples.`)
      }
    } catch (e) {
      console.warn('[ML] Failed to load dataset', e)
    }
  }

  private save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.examples))
    } catch (e) {
      console.warn('[ML] Failed to save dataset', e)
    }
  }

  public addSequenceExample(wordKz: string, rawSequence: Landmark[][]) {
    const sequence = normalizeSequence(rawSequence)
    if (sequence.length < 5) return // Too short

    this.examples.push({ wordKz, sequence })
    this.save()
  }

  public clearExamples(wordKz: string) {
    this.examples = this.examples.filter(e => e.wordKz !== wordKz)
    this.save()
  }
  
  public getCounts(): Record<string, number> {
     const counts: Record<string, number> = {}
     for(const ex of this.examples) {
        counts[ex.wordKz] = (counts[ex.wordKz] || 0) + 1
     }
     return counts
  }

  public predictSequence(rawSequence: Landmark[][]): { wordKz: string, distance: number } | null {
    if (this.examples.length === 0 || rawSequence.length < 5) return null

    const liveSequence = normalizeSequence(rawSequence)
    if (liveSequence.length === 0) return null

    let bestMatch = ''
    let minDistance = Infinity

    for (const example of this.examples) {
      const dist = dtwDistance(liveSequence, example.sequence)
      if (dist < minDistance) {
        minDistance = dist
        bestMatch = example.wordKz
      }
    }

    // Euclidean DTW distance threshold: smaller is better.
    // 1.2 is a good threshold for 65-dim data where 63 dimensions are bounded by [-1, 1].
    if (minDistance < 1.3) {
      return {
        wordKz: bestMatch,
        distance: minDistance
      }
    }
    return null
  }
}

export const ML_CLASSIFIER = new GestureML()
