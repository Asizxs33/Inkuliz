import { Router } from 'express'
import { db } from '../db/index.js'
import { assignments, classStudents, tests } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export const assignmentsRouter = Router()

// POST /api/assignments — teacher creates assignment
assignmentsRouter.post('/', async (req, res) => {
  try {
    const { testId, teacherId, classId, deadline } = req.body
    if (!testId || !teacherId || !classId || !deadline) {
      return res.status(400).json({ error: 'testId, teacherId, classId, deadline required' })
    }
    const [row] = await db
      .insert(assignments)
      .values({ test_id: testId, teacher_id: teacherId, class_id: classId, deadline: new Date(deadline) })
      .returning()
    res.json({ assignment: row })
  } catch (error) {
    console.error('Create assignment error:', error)
    res.status(500).json({ error: 'Failed to create assignment' })
  }
})

// GET /api/assignments/student/:userId — get assignments for a student via their class
assignmentsRouter.get('/student/:userId', async (req, res) => {
  try {
    const rows = await db
      .select({ assignment: assignments, test: { id: tests.id, title: tests.title, questions: tests.questions, status: tests.status } })
      .from(assignments)
      .innerJoin(classStudents, eq(assignments.class_id, classStudents.class_id))
      .innerJoin(tests, eq(assignments.test_id, tests.id))
      .where(eq(classStudents.student_id, req.params.userId))
    res.json({ assignments: rows })
  } catch (error) {
    console.error('Get student assignments error:', error)
    res.status(500).json({ error: 'Failed to get assignments' })
  }
})

// GET /api/assignments/teacher/:teacherId — get all assignments by teacher
assignmentsRouter.get('/teacher/:teacherId', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(assignments)
      .where(eq(assignments.teacher_id, req.params.teacherId))
    res.json({ assignments: rows })
  } catch (error) {
    console.error('Get teacher assignments error:', error)
    res.status(500).json({ error: 'Failed to get assignments' })
  }
})

// DELETE /api/assignments/:id
assignmentsRouter.delete('/:id', async (req, res) => {
  try {
    await db.delete(assignments).where(eq(assignments.id, req.params.id))
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assignment' })
  }
})
