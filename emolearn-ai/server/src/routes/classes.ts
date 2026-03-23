import { Router } from 'express'
import { db } from '../db/index.js'
import { classes, classStudents, users, alerts, emotionLogs } from '../db/schema.js'
import { eq, and, ilike, desc } from 'drizzle-orm'

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

// GET /api/classes/search-student?q=... (Teacher searches for a student to invite)
classesRouter.get('/search-student', async (req, res) => {
  try {
    const q = req.query.q as string
    if (!q || q.length < 2) return res.json({ students: [] })
    
    const results = await db.select({
      id: users.id,
      name: users.name,
      email: users.email
    })
    .from(users)
    .where(
      and(
        eq(users.role, 'student'),
        ilike(users.email, `%${q}%`) // Since we want precise or fuzzy email search
      )
    )
    .limit(5)
    
    res.json({ students: results })
  } catch (err) {
    res.status(500).json({ error: 'Failed to search students' })
  }
})

// POST /api/classes/invite (Teacher invites a student)
classesRouter.post('/invite', async (req, res) => {
  try {
    const { teacher_id, student_id, class_id, class_name, teacher_name } = req.body
    
    // Check if user is already in the class
    const existingMem = await db.select().from(classStudents).where(and(eq(classStudents.class_id, class_id), eq(classStudents.student_id, student_id)))
    if (existingMem.length > 0) {
      return res.status(400).json({ error: 'Студент бұл сыныпта бар (Student already in class)' })
    }

    // Insert an alert for the invite
    await db.insert(alerts).values({
      teacher_id,
      student_id,
      type: 'class_invite',
      message: JSON.stringify({ class_id, class_name, teacher_name }),
      is_read: false
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to send invite' })
  }
})

// GET /api/classes/invitations/:studentId (Student fetches their pending invites)
classesRouter.get('/invitations/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId
    const invites = await db.select().from(alerts).where(and(eq(alerts.student_id, studentId), eq(alerts.type, 'class_invite'), eq(alerts.is_read, false)))
    res.json({ invitations: invites })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invites' })
  }
})

// POST /api/classes/accept-invite (Student accepts an invite)
classesRouter.post('/accept-invite', async (req, res) => {
  try {
    const { alert_id, student_id, class_id } = req.body
    
    // Add to class
    await db.insert(classStudents).values({ class_id, student_id }).onConflictDoNothing()
    // Mark alert as read (or delete it, but marking read is fine)
    await db.update(alerts).set({ is_read: true }).where(eq(alerts.id, alert_id))
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept invite' })
  }
})

// POST /api/classes/decline-invite (Student declines an invite)
classesRouter.post('/decline-invite', async (req, res) => {
  try {
    const { alert_id } = req.body
    await db.update(alerts).set({ is_read: true }).where(eq(alerts.id, alert_id))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline invite' })
  }
})

// DELETE /api/classes/:classId/students/:studentId (Teacher removes a student)
classesRouter.delete('/:classId/students/:studentId', async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    await db.delete(classStudents)
      .where(and(eq(classStudents.class_id, classId), eq(classStudents.student_id, studentId)));
    
    // Optionally remove any pending alerts/invites too
    await db.delete(alerts).where(and(
      eq(alerts.student_id, studentId), 
      eq(alerts.type, 'class_invite'),
      ilike(alerts.message, `%${classId}%`)
    ));

    res.json({ success: true });
  } catch (err) {
    console.error('Remove student error:', err);
    res.status(500).json({ error: 'Failed to remove student' });
  }
})

// GET /api/classes/student/:studentId (Get class the student belongs to)
// MUST be before /:teacherId to avoid route collision
classesRouter.get('/student/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId
    
    const result = await db
      .select({
        id: classes.id,
        name: classes.name,
        invite_code: classes.invite_code,
        teacher_id: classes.teacher_id
      })
      .from(classStudents)
      .innerJoin(classes, eq(classStudents.class_id, classes.id))
      .where(eq(classStudents.student_id, studentId))
      .limit(1)

    if (result.length > 0) {
      res.json({ class: result[0] })
    } else {
      res.json({ class: null })
    }
  } catch (error) {
    console.error('Fetch student class error:', error)
    res.status(500).json({ error: 'Failed to fetch student class' })
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

    // For each student, fetch latest emotion log (to pre-populate "online" state)
    const ONLINE_WINDOW_MS = 60 * 60 * 1000 // 1 hour
    const studentsWithBio = await Promise.all(students.map(async (s) => {
      const [latest] = await db
        .select()
        .from(emotionLogs)
        .where(eq(emotionLogs.user_id, s.id))
        .orderBy(desc(emotionLogs.timestamp))
        .limit(1)

      if (!latest) return s
      const age = Date.now() - new Date(latest.timestamp!).getTime()
      if (age > ONLINE_WINDOW_MS) return s

      return {
        ...s,
        latestBio: {
          emotion: latest.emotion,
          bpm: latest.bpm,
          cognitive_load: latest.cognitive,
          timestamp: latest.timestamp,
        }
      }
    }))

    res.json({ students: studentsWithBio })
  } catch (error) {
    console.error('Fetch students error:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})
