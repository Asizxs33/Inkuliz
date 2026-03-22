import { Router } from 'express'
import { db } from '../db/index.js'
import { tests, testResults } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { getIo } from '../io.js'

export const testsRouter = Router()

// GET /api/tests?teacher_id=  → все тесты учителя
// GET /api/tests?student=true → все открытые тесты для студента
testsRouter.get('/', async (req, res) => {
  try {
    const { teacher_id, student } = req.query

    if (teacher_id) {
      const rows = await db
        .select()
        .from(tests)
        .where(eq(tests.teacher_id, teacher_id as string))
        .orderBy(tests.created_at)

      // Attach results count to each test
      const withCounts = await Promise.all(
        rows.map(async (test) => {
          const results = await db
            .select()
            .from(testResults)
            .where(eq(testResults.test_id, test.id))
          return { ...test, results }
        })
      )
      return res.json({ tests: withCounts })
    }

    if (student) {
      const rows = await db
        .select()
        .from(tests)
        .where(eq(tests.status, 'open'))
        .orderBy(tests.created_at)
      return res.json({ tests: rows })
    }

    res.status(400).json({ error: 'teacher_id or student query param required' })
  } catch (error) {
    console.error('Get tests error:', error)
    res.status(500).json({ error: 'Failed to fetch tests' })
  }
})

// POST /api/tests — создать тест (учитель)
testsRouter.post('/', async (req, res) => {
  try {
    const { teacher_id, title, questions } = req.body
    if (!teacher_id || !title || !questions?.length) {
      return res.status(400).json({ error: 'teacher_id, title and questions are required' })
    }

    const [newTest] = await db
      .insert(tests)
      .values({ teacher_id, title, questions, status: 'open' })
      .returning()

    getIo()?.emit('test:new', { id: newTest.id, title: newTest.title })
    res.json({ test: newTest })
  } catch (error) {
    console.error('Create test error:', error)
    res.status(500).json({ error: 'Failed to create test' })
  }
})

// PATCH /api/tests/:id/status — открыть/закрыть тест
testsRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (status !== 'open' && status !== 'closed') {
      return res.status(400).json({ error: 'status must be open or closed' })
    }
    const [updated] = await db
      .update(tests)
      .set({ status })
      .where(eq(tests.id, req.params.id))
      .returning()
    if (status === 'open') {
      getIo()?.emit('test:new', { id: updated.id, title: updated.title })
    }
    res.json({ test: updated })
  } catch (error) {
    console.error('Update test status error:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// DELETE /api/tests/:id — удалить тест
testsRouter.delete('/:id', async (req, res) => {
  try {
    await db.delete(tests).where(eq(tests.id, req.params.id))
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete test error:', error)
    res.status(500).json({ error: 'Failed to delete test' })
  }
})

// POST /api/tests/:id/submit — студент сдаёт тест
testsRouter.post('/:id/submit', async (req, res) => {
  try {
    const { student_id, student_name, answers } = req.body
    if (!student_id || !answers) {
      return res.status(400).json({ error: 'student_id and answers are required' })
    }

    const [test] = await db.select().from(tests).where(eq(tests.id, req.params.id))
    if (!test) return res.status(404).json({ error: 'Test not found' })
    if (test.status === 'closed') return res.status(403).json({ error: 'Test is closed' })

    const questions = test.questions as { question: string; options: string[]; correct: number }[]
    let score = 0
    answers.forEach((ans: number, idx: number) => {
      if (questions[idx] && ans === questions[idx].correct) score++
    })

    const [result] = await db
      .insert(testResults)
      .values({
        test_id: test.id,
        student_id,
        student_name: student_name || 'Студент',
        answers,
        score,
        total: questions.length,
      })
      .returning()

    // Notify teacher in real-time
    getIo()?.to(`user:${test.teacher_id}`).emit('test:submitted', {
      studentName: student_name || 'Студент',
      testTitle: test.title,
      testId: test.id,
      score,
      total: questions.length,
    })

    res.json({ result, score, total: questions.length })
  } catch (error) {
    console.error('Submit test error:', error)
    res.status(500).json({ error: 'Failed to submit test' })
  }
})

// GET /api/tests/:id/results — результаты теста (для учителя)
testsRouter.get('/:id/results', async (req, res) => {
  try {
    const results = await db
      .select()
      .from(testResults)
      .where(eq(testResults.test_id, req.params.id))
      .orderBy(testResults.completed_at)
    res.json({ results })
  } catch (error) {
    console.error('Get results error:', error)
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

// GET /api/tests/:id/my-result?student_id= — проверить, сдал ли уже студент
testsRouter.get('/:id/my-result', async (req, res) => {
  try {
    const { student_id } = req.query
    if (!student_id) return res.status(400).json({ error: 'student_id required' })
    const rows = await db
      .select()
      .from(testResults)
      .where(and(eq(testResults.test_id, req.params.id), eq(testResults.student_id, student_id as string)))
    res.json({ result: rows[0] || null })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch result' })
  }
})
