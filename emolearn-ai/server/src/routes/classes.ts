import { Router } from 'express'
import { db } from '../db/index.js'
import { classes, classStudents, users } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

export const classesRouter = Router()

// Helper to generate a random 6-character invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// POST /api/classes/create (Teacher only)
classesRouter.post('/create', async (req, res) => {
  try {
    const { teacher_id, name } = req.body
    
    // Create class
    const [newClass] = await db.insert(classes).values({
      teacher_id,
      name,
      invite_code: generateInviteCode()
    }).returning()

    res.json({ class: newClass })
  } catch (error) {
    console.error('Create class error:', error)
    res.status(500).json({ error: 'Failed to create class' })
  }
})

// POST /api/classes/join (Student only)
classesRouter.post('/join', async (req, res) => {
  try {
    const { student_id, invite_code } = req.body

    // Find class
    const [targetClass] = await db.select().from(classes).where(eq(classes.invite_code, invite_code))
    
    if (!targetClass) {
      return res.status(404).json({ error: 'Class not found' })
    }

    // Add student
    await db.insert(classStudents).values({
      class_id: targetClass.id,
      student_id
    })

    res.json({ success: true, class: targetClass })
  } catch (error) {
    if ((error as any).code === '23505') { // Unique violation PG
       return res.status(400).json({ error: 'Already joined this class' })
    }
    console.error('Join class error:', error)
    res.status(500).json({ error: 'Failed to join class' })
  }
})

// GET /api/classes/:teacherId (Teacher Dashboard)
classesRouter.get('/:teacherId', async (req, res) => {
  try {
    const myClasses = await db.select().from(classes).where(eq(classes.teacher_id, req.params.teacherId))
    res.json({ classes: myClasses })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' })
  }
})

// GET /api/classes/:classId/students (Teacher Dashboard)
classesRouter.get('/:classId/students', async (req, res) => {
  try {
    const classId = req.params.classId
    
    // Get all students in this class
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        joined_at: classStudents.joined_at
      })
      .from(classStudents)
      .innerJoin(users, eq(classStudents.student_id, users.id))
      .where(eq(classStudents.class_id, classId))

    res.json({ students })
  } catch (error) {
    console.error('Fetch students error:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})
