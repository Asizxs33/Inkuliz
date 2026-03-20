import TelegramBot from 'node-telegram-bot-api'

let bot: TelegramBot | null = null

export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || token === 'your-telegram-token') {
    console.log('⚠️ Telegram bot token not configured, skipping initialization')
    return
  }

  bot = new TelegramBot(token, { polling: false })
  console.log('✅ Telegram bot initialized')
}

export async function sendTelegramAlert(message: string) {
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!bot) {
    console.warn('⚠️ Telegram bot not initialized — check TELEGRAM_BOT_TOKEN in .env')
    return
  }
  if (!chatId) {
    console.warn('⚠️ TELEGRAM_CHAT_ID not set in .env')
    return
  }

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    console.log('✅ Telegram alert sent')
  } catch (error: any) {
    console.error('❌ Telegram send error:', error?.message || error)
  }
}

export async function sendStressAlert(data: {
  studentName: string
  bpm: number
  emotion: string
  className: string
}) {
  const msg = `🚨 *СТРЕСС ЕСКЕРТУІ*

👤 Оқушы: *${data.studentName}*
🏫 Сынып: ${data.className}
💓 Пульс: *${data.bpm} BPM*
😰 Эмоция: ${data.emotion}
⏰ Уақыт: ${new Date().toLocaleTimeString('kk-KZ')}

⚡️ Тапсырма автоматты жеңілдетілді`

  await sendTelegramAlert(msg)
}

export async function sendDailyReport(data: {
  className: string
  avgBpm: number
  avgStress: number
  completedLessons: number
  topStudent: string
}) {
  const msg = `📊 *КҮНДІК ЕСЕП — ${data.className}*

💓 Орт. пульс: ${data.avgBpm} BPM
😰 Орт. стресс: ${data.avgStress}%
📚 Аяқталған сабақ: ${data.completedLessons}
🏆 Үздік оқушы: ${data.topStudent}

📅 ${new Date().toLocaleDateString('kk-KZ')}`

  await sendTelegramAlert(msg)
}
