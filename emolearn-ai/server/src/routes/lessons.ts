import { Router } from 'express'

export const lessonsRouter = Router()

lessonsRouter.get('/', async (_req, res) => {
  res.json({
    lessons: [
      { id: '1', title: 'Python негіздері', subject: 'Информатика', difficulty: 5, progress: 47 },
      { id: '2', title: 'Алгебра негіздері', subject: 'Математика', difficulty: 6, progress: 32 },
      { id: '3', title: 'Физика заңдары', subject: 'Физика', difficulty: 7, progress: 15 },
    ]
  })
})

lessonsRouter.get('/:id', async (req, res) => {
  res.json({
    lesson: {
      id: req.params.id,
      title: 'Python негіздері',
      subject: 'Информатика',
      content: 'Берілген кодтың нәтижесін анықтаңыз',
      difficulty: 5,
      language: 'kz',
    }
  })
})

lessonsRouter.post('/:id/submit', async (req, res) => {
  const { answer } = req.body
  res.json({ correct: answer === '37', feedback: 'Жүрегің жақсы!' })
})
