import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export const authRouter = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES = new Set(['student', 'teacher'])

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || typeof name !== 'string' || name.trim().length < 2)
      return res.status(400).json({ error: 'Аты кемінде 2 символ болуы керек' })
    if (!email || !EMAIL_RE.test(email))
      return res.status(400).json({ error: 'Email форматы дұрыс емес' })
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'Пароль кемінде 6 символ болуы керек' })

    const safeRole = VALID_ROLES.has(role) ? role : 'student'

    // Check if exists
    const existing = await db.select().from(users).where(eq(users.email, email))
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Такой email уже зарегистрирован' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [newUser] = await db.insert(users).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: safeRole,
    }).returning()

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = newUser
    res.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// PATCH /api/auth/profile
authRouter.patch('/profile', async (req, res) => {
  try {
    const { id, name, university, course } = req.body
    if (!id) return res.status(400).json({ error: 'id is required' })
    const [updated] = await db
      .update(users)
      .set({ name, university, course: course ? Number(course) : undefined })
      .where(eq(users.id, id))
      .returning()
    const { password: _, ...safe } = updated
    res.json({ user: safe })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'Email және пароль міндетті' })

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()))
    if (existing.length === 0) {
      return res.status(400).json({ error: 'Неверный email или пароль' })
    }

    const user = existing[0]
    const valid = await bcrypt.compare(password, user.password)
    
    if (!valid) {
      return res.status(400).json({ error: 'Неверный email или пароль' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user
    res.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})
