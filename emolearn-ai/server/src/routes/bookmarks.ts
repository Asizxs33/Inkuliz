import { Router } from 'express'
import { db } from '../db/index.js'
import { bookmarks } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

export const bookmarksRouter = Router()

// GET /api/bookmarks/:userId — get all bookmarked word IDs
bookmarksRouter.get('/:userId', async (req, res) => {
  try {
    const rows = await db
      .select({ word_id: bookmarks.word_id })
      .from(bookmarks)
      .where(eq(bookmarks.user_id, req.params.userId))

    res.json({ wordIds: rows.map(r => r.word_id) })
  } catch (error) {
    console.error('Load bookmarks error:', error)
    res.status(500).json({ error: 'Failed to load bookmarks' })
  }
})

// POST /api/bookmarks — add a bookmark
bookmarksRouter.post('/', async (req, res) => {
  try {
    const { userId, wordId } = req.body
    if (!userId || !wordId) {
      return res.status(400).json({ error: 'userId and wordId required' })
    }

    // Upsert: ignore if already exists
    await db
      .insert(bookmarks)
      .values({ user_id: userId, word_id: wordId })
      .onConflictDoNothing()

    res.json({ ok: true })
  } catch (error) {
    console.error('Save bookmark error:', error)
    res.status(500).json({ error: 'Failed to save bookmark' })
  }
})

// DELETE /api/bookmarks/:userId/:wordId — remove a bookmark
bookmarksRouter.delete('/:userId/:wordId', async (req, res) => {
  try {
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.user_id, req.params.userId),
          eq(bookmarks.word_id, decodeURIComponent(req.params.wordId))
        )
      )
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete bookmark error:', error)
    res.status(500).json({ error: 'Failed to delete bookmark' })
  }
})
