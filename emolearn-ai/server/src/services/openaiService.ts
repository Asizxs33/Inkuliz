import OpenAI from 'openai'

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'ваша-нейросеть-ключ') {
       throw new Error('OPENAI_API_KEY is missing in .env');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function getAIResponse(
  userId: string,
  message: string,
  context: { emotion: string; bpm: number; cognitive: number },
  history: Array<{ role: string; content: string }> = []
) {
  const system = `
    Сен EmoLearn AI — Қазақстан студенттеріне арналған
    ақылды оқыту көмекшісісің.

    Студенттің қазіргі жағдайы:
    - Эмоция: ${context.emotion}
    - Пульс: ${context.bpm} BPM
    - Когнитивтік жүктеме: ${context.cognitive}%

    Міндетті ережелер:
    1. Тек қазақ тілінде жауап бер
    2. Пульс > 90 болса: өте қысқа, жайлап түсіндір
    3. Стресс / fearful болса: алдымен қолдау көрсет
    4. Шоғырланған болса: толық, мысалдармен түсіндір
    5. Ымдау тілі туралы сұраса: MediaPipe технологиясы 
       қолданылатынын айт
    6. Математика/физика сұрақта: қадамдап шеш
    7. Жауап 4 сөйлемнен аспасын
  `

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: system },
    ...history.slice(-10).map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: message },
  ]

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 400,
      temperature: 0.7,
    })
    return response.choices[0].message.content
  } catch (err) {
    console.error('OpenAI getAIResponse error:', err)
    return 'Кешіріңіз, AI уақытша қол жетімсіз. Кейінірек қайталаңыз.'
  }
}

export async function adaptTask(telemetryDetails: string, emotion: string, bpm: number) {
  const prompt = `
    Студент жағдайы: эмоция=${emotion}, пульс=${bpm}
    Мәліметтер: ${telemetryDetails}
    
    Бейімдеу стратегиясы:
    - BPM > 90 немесе stressed → жеңілдет
    - BPM < 70 немесе happy/neutral → қиындат
    - Қалыпты → өзгертпе
    
    Тек JSON қайтар:
    {
      "emotion": "СТРЕСС" | "ШОҒЫРЛАНҒАН" | "ІШПЫСАРЛЫҚ" | "ҚАЛЫПТЫ",
      "action": "simplify" | "maintain" | "increase",
      "reason": "AI осы шешімді не үшін қабылдағаны туралы қысқаша түсініктеме (қазақша)",
      "cognitiveLoad": "1-ден 100-ге дейінгі пайыздық көрсеткіш"
    }
  `

  try {
    const r = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    return JSON.parse(r.choices[0].message.content!)
  } catch (err) {
    console.error('OpenAI adaptTask error:', err)
    return { emotion: 'ҚАЛЫПТЫ', action: 'maintain', reason: 'AI қол жетімсіз', cognitiveLoad: '50' }
  }
}

export async function generateSentenceFromWords(words: string[]) {
  const prompt = `
    Сен қазақ тілі маманысың.
    Берілген ымдау тілінде көрсетілген жеке сөздердің тізбегінен грамматикалық дұрыс, толық мағыналы, табиғи сөйлем құрастыр. 
    Тек қана дайын сөйлемді қайтар, басқа ештеңе жазба.
    Егер мағынасы мүлдем түсініксіз болса, сол күйінде ұсыныс жаса.
    
    Сөздер: ${words.join(', ')}
  `

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.6,
    })
    return response.choices[0].message.content?.trim() || ''
  } catch (err) {
    console.error('OpenAI generateSentence error:', err)
    return words.join(' ')
  }
}
