import { Router } from 'express'
import { getAIResponse, adaptTask } from '../services/openaiService.js'

export const chatRouter = Router()

chatRouter.post('/', async (req, res) => {
  try {
    const { userId, message, context, history } = req.body
    const response = await getAIResponse(
      userId,
      message,
      context || { emotion: 'focused', bpm: 76, cognitive: 67 },
      history || []
    )
    res.json({ response })
  } catch (error) {
    console.error('Chat failed:', error);
    res.status(500).json({ 
      error: 'Chat failed', 
      fallback: 'AI қызметі қол жетімді емес.', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

chatRouter.post('/analyze', async (req, res) => {
  try {
    const { bpm, attentionLevel, recentErrors } = req.body
    
    const result = await adaptTask(`Analyze telemetry: BPM=${bpm}, Attention=${attentionLevel}`, 'neutral', bpm);
    
    res.json(result)
  } catch (err) {
    console.error('AI Analysis failed:', err)
    res.status(500).json({ 
      error: 'Analysis failed',
      details: err instanceof Error ? err.message : String(err)
    })
  }
})
