import { Router } from 'express'
import { db } from '../db/index.js'
import { gestureModels } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

export const gesturesRouter = Router()

// GET /api/gestures/all — load all trained sequences (shared across all users)
gesturesRouter.get('/all', async (_req, res) => {
  try {
    const rows = await db.select().from(gestureModels)
    res.json({ sequences: rows })
  } catch (error) {
    console.error('Load gestures error:', error)
    res.status(500).json({ error: 'Failed to load gestures' })
  }
})

// GET /api/gestures/:userId — load sequences for a specific user (kept for compat)
gesturesRouter.get('/:userId', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(gestureModels)
      .where(eq(gestureModels.user_id, req.params.userId))

    res.json({ sequences: rows })
  } catch (error) {
    console.error('Load gestures error:', error)
    res.status(500).json({ error: 'Failed to load gestures' })
  }
})

// POST /api/gestures — save a new training sequence
gesturesRouter.post('/', async (req, res) => {
  try {
    const { userId, wordKz, rawSequence } = req.body
    if (!userId || !wordKz || !rawSequence) {
      return res.status(400).json({ error: 'userId, wordKz and rawSequence required' })
    }

    const [row] = await db
      .insert(gestureModels)
      .values({ user_id: userId, word_kz: wordKz, raw_sequence: rawSequence })
      .returning()

    res.json({ sequence: row })
  } catch (error) {
    console.error('Save gesture error:', error)
    res.status(500).json({ error: 'Failed to save gesture' })
  }
})

// DELETE /api/gestures/:userId/:wordKz — clear all sequences for a word
gesturesRouter.delete('/:userId/:wordKz', async (req, res) => {
  try {
    await db
      .delete(gestureModels)
      .where(
        and(
          eq(gestureModels.user_id, req.params.userId),
          eq(gestureModels.word_kz, decodeURIComponent(req.params.wordKz))
        )
      )
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete gesture error:', error)
    res.status(500).json({ error: 'Failed to delete gesture' })
  }
})
