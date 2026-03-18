import { create } from 'zustand'

interface Lesson {
  id: string
  title: string
  subject: string
  progress: number
  difficulty: number
}

interface LessonState {
  currentLesson: Lesson | null
  lessons: Lesson[]
  setCurrentLesson: (lesson: Lesson) => void
  updateProgress: (progress: number) => void
}

export const useLessonStore = create<LessonState>((set) => ({
  currentLesson: {
    id: '1',
    title: 'Python негіздері',
    subject: 'Информатика',
    progress: 47,
    difficulty: 5,
  },
  lessons: [],
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  updateProgress: (progress) =>
    set((state) => ({
      currentLesson: state.currentLesson
        ? { ...state.currentLesson, progress }
        : null,
    })),
}))
