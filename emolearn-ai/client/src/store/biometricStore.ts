import { create } from 'zustand'

interface BiometricState {
  bpm: number
  emotion: string
  emotionKz: string
  confidence: number
  cognitive: number
  stressLevel: number
  isCameraEnabled: boolean
  globalStream: MediaStream | null
  handLandmarks: any[] | null
  setBpm: (bpm: number) => void
  setEmotion: (emotion: string, confidence: number) => void
  setEmotionKz: (emotionKz: string) => void
  setCognitive: (cognitive: number) => void
  setStressLevel: (level: number) => void
  setIsCameraEnabled: (enabled: boolean) => void
  setGlobalStream: (stream: MediaStream | null) => void
  setHandLandmarks: (landmarks: any[] | null) => void
}

export const useBiometricStore = create<BiometricState>((set) => ({
  bpm: 76,
  emotion: 'ШОҒЫРЛАНҒАН',
  emotionKz: 'ШОҒЫРЛАНҒАН',
  confidence: 94.2,
  cognitive: 67,
  stressLevel: 3,
  isCameraEnabled: true,
  globalStream: null,
  handLandmarks: null,
  setBpm: (bpm) => set({ bpm }),
  setEmotion: (emotion, confidence) => set({ emotion, confidence }),
  setEmotionKz: (emotionKz) => set({ emotionKz }),
  setCognitive: (cognitive) => set({ cognitive }),
  setStressLevel: (stressLevel) => set({ stressLevel }),
  setIsCameraEnabled: (isCameraEnabled) => set({ isCameraEnabled }),
  setGlobalStream: (globalStream) => set({ globalStream }),
  setHandLandmarks: (handLandmarks) => set({ handLandmarks }),
}))
