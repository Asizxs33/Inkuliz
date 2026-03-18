import { Router } from 'express'

export const signLanguageRouter = Router()

signLanguageRouter.get('/words', async (_req, res) => {
  res.json({
    words: [
      { id: '1', word_kz: 'Сәлем', word_ru: 'Привет', category: 'негізгі', difficulty: 'easy' },
      { id: '2', word_kz: 'Рахмет', word_ru: 'Спасибо', category: 'негізгі', difficulty: 'easy' },
      { id: '3', word_kz: 'Мұғалім', word_ru: 'Учитель', category: 'мектеп', difficulty: 'medium' },
      { id: '4', word_kz: 'Қош бол', word_ru: 'До свидания', category: 'негізгі', difficulty: 'easy' },
      { id: '5', word_kz: 'Ана', word_ru: 'Мама', category: 'отбасы', difficulty: 'easy' },
      { id: '6', word_kz: 'Кітап', word_ru: 'Книга', category: 'мектеп', difficulty: 'medium' },
      { id: '7', word_kz: 'Бір', word_ru: 'Один', category: 'сандар', difficulty: 'hard' },
    ]
  })
})

signLanguageRouter.get('/words/:id', async (req, res) => {
  res.json({
    word: { id: req.params.id, word_kz: 'Сәлем', word_ru: 'Привет', category: 'негізгі', difficulty: 'easy' }
  })
})

signLanguageRouter.post('/sentence', async (req, res) => {
  try {
    const { words } = req.body
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'Words array is required' })
    }

    if (words.length === 0) {
      return res.json({ sentence: '' })
    }

    const { generateSentenceFromWords } = await import('../services/openaiService')
    const sentence = await generateSentenceFromWords(words)
    
    res.json({ sentence })
  } catch (error) {
    console.error('Error generating sentence:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})
