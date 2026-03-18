import { Router } from 'express'
import { sendTelegramAlert } from '../services/telegramService.js'

export const telegramRouter = Router()

telegramRouter.post('/send', async (req, res) => {
  try {
    const { message, chatId } = req.body
    await sendTelegramAlert(message)
    res.json({ success: true, message: 'Хабарлама жіберілді!' })
  } catch (error) {
    console.error('Telegram request error:', error)
    res.status(500).json({ error: 'Telegram send failed' })
  }
})

telegramRouter.get('/status', async (_req, res) => {
  res.json({ connected: !!process.env.TELEGRAM_BOT_TOKEN, botName: 'EmoLearn Bot' })
})
