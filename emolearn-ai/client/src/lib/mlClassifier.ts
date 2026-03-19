import type { Landmark } from './gestureRecognizer'

/**
 * Normalizes a set of 21 3D landmarks into a 63-dimensional feature vector.
 * - Centers all points relative to the wrist (landmark 0)
 * - Scales all points so the maximum distance from wrist is 1.0
 * This makes the embedding scale and translation invariant.
 */
export function normalizeLandmarks(landmarks: Landmark[]): number[] {
  if (!landmarks || landmarks.length !== 21) return []

  const wrist = landmarks[0]
  let maxDist = 0

  // First pass: find max distance from wrist
  for (let i = 1; i < landmarks.length; i++) {
    const dist = Math.sqrt(
      Math.pow(landmarks[i].x - wrist.x, 2) +
      Math.pow(landmarks[i].y - wrist.y, 2) +
      Math.pow(landmarks[i].z - wrist.z, 2)
    )
    if (dist > maxDist) maxDist = dist
  }

  // Prevent division by zero
  if (maxDist === 0) maxDist = 1

  // Second pass: normalize
  const vector: number[] = []
  for (let i = 0; i < landmarks.length; i++) {
    vector.push((landmarks[i].x - wrist.x) / maxDist)
    vector.push((landmarks[i].y - wrist.y) / maxDist)
    vector.push((landmarks[i].z - wrist.z) / maxDist)
  }

  return vector
}

/**
 * Calculates Cosine Similarity between two vectors.
 * Returns a value between -1 and 1. (1 means identical direction)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export interface MLPrediction {
  wordKz: string;
  confidence: number;
}

export interface MLTrainingExample {
  wordKz: string;
  vector: number[];
}

/**
 * Instant K-Nearest Neighbors Classifier specialized for relative landmarks.
 * Stores embeddings in LocalStorage to persist custom trained words.
 */
export class GestureKNN {
  private examples: MLTrainingExample[] = []
  private readonly STORAGE_KEY = 'emolearn_ml_gestures'

  constructor() {
    this.load()
  }

  private load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        this.examples = JSON.parse(data)
        console.log(`[ML] Loaded ${this.examples.length} training examples.`)
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

  /**
   * Adds a new training anchor for a word.
   */
  public addExample(wordKz: string, landmarks: Landmark[]) {
    const vector = normalizeLandmarks(landmarks)
    if (vector.length === 0) return

    this.examples.push({ wordKz, vector })
    this.save()
  }

  /**
   * Clears training data for a specific word.
   */
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

  /**
   * Predicts the closest word using Cosine Similarity.
   * Only returns a match if similarity > 0.90 (90%)
   */
  public predict(landmarks: Landmark[]): MLPrediction | null {
    if (this.examples.length === 0) return null

    const vector = normalizeLandmarks(landmarks)
    if (vector.length === 0) return null

    let bestMatch = ''
    let highestSimilarity = -1

    for (const example of this.examples) {
      const sim = cosineSimilarity(vector, example.vector)
      if (sim > highestSimilarity) {
        highestSimilarity = sim
        bestMatch = example.wordKz
      }
    }

    // Strict threshold for WOW effect (prevents false positives)
    // Cosine similarity of 0.90 is roughly a 25-degree cone.
    // 0.96+ is highly similar.
    if (highestSimilarity > 0.92) {
      return {
        wordKz: bestMatch,
        confidence: highestSimilarity
      }
    }

    return null
  }
}

// Global Singleton for the App
export const ML_CLASSIFIER = new GestureKNN()
