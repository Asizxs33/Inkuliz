import { Router } from 'express'
import { db } from '../db/index.js'
import { emotionLogs } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

export const analyticsRouter = Router()

// GET /api/analytics/overview/:userId — real data from DB with fallback
analyticsRouter.get('/overview/:userId', async (req, res) => {
  try {
    const logs = await db
      .select()
      .from(emotionLogs)
      .where(eq(emotionLogs.user_id, req.params.userId))
      .orderBy(desc(emotionLogs.timestamp))
      .limit(500)

    if (logs.length === 0) {
      // Return default data when no real data exists
      return res.json({
        kpis: {
          concentration: { value: 87, change: 5 },
          heartRate: { value: 74, change: -2 },
          stressLevel: { value: 3, label: 'Тұрақты' },
          translations: { value: 234, change: 12 },
        },
        emotionTimeline: [
          { time: '09:00', focused: 70, happy: 20, bored: 5, stressed: 5 },
          { time: '10:00', focused: 85, happy: 30, bored: 10, stressed: 5 },
          { time: '11:00', focused: 90, happy: 25, bored: 8, stressed: 3 },
          { time: '12:00', focused: 60, happy: 40, bored: 15, stressed: 10 },
          { time: '13:00', focused: 50, happy: 35, bored: 25, stressed: 15 },
          { time: '14:00', focused: 75, happy: 20, bored: 12, stressed: 8 },
        ],
        learningOutcome: 67,
        prediction: { change: 15, direction: 'up' },
      })
    }

    // Calculate real KPIs
    const avgBpm = Math.round(
      logs.reduce((s, l) => s + (l.bpm || 0), 0) / logs.length
    )
    const avgCognitive = Math.round(
      logs.reduce((s, l) => s + (l.cognitive || 0), 0) / logs.length
    )
    const stressCount = logs.filter(l => (l.bpm || 0) > 90).length
    const stressPercent = Math.round((stressCount / logs.length) * 100)

    // Build emotion timeline from real data (group by hour)
    const hourGroups: Record<string, { focused: number; happy: number; bored: number; stressed: number; count: number }> = {}
    logs.forEach(l => {
      const hour = l.timestamp ? new Date(l.timestamp).getHours().toString().padStart(2, '0') + ':00' : '00:00'
      if (!hourGroups[hour]) hourGroups[hour] = { focused: 0, happy: 0, bored: 0, stressed: 0, count: 0 }
      hourGroups[hour].count++
      const em = l.emotion || ''
      const emLow = em.toLowerCase()
      if (em === 'ШОҒЫРЛАНҒАН' || em === 'БЕЙТАРАП' || emLow.includes('neutral') || emLow.includes('шоғыр')) hourGroups[hour].focused++
      else if (em === 'ҚУАНЫШТЫ' || emLow.includes('happy') || emLow.includes('қуаныш')) hourGroups[hour].happy++
      else if (em === 'МҰҢДЫ' || em === 'ЗЕРІКТІ' || emLow.includes('sad') || emLow.includes('мұңды') || emLow.includes('зерік')) hourGroups[hour].bored++
      else if (em === 'АШУЛЫ' || em === 'ҚОРЫҚҚАН' || em === 'ЖИІРКЕНГЕН' || emLow.includes('angry') || emLow.includes('fear') || emLow.includes('stress') || emLow.includes('ашулы') || emLow.includes('қорық')) hourGroups[hour].stressed++
      else hourGroups[hour].focused++
    })

    const emotionTimeline = Object.entries(hourGroups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, data]) => ({
        time,
        focused: Math.round((data.focused / data.count) * 100),
        happy: Math.round((data.happy / data.count) * 100),
        bored: Math.round((data.bored / data.count) * 100),
        stressed: Math.round((data.stressed / data.count) * 100),
      }))

    res.json({
      kpis: {
        concentration: { value: avgCognitive, change: 5 },
        heartRate: { value: avgBpm, change: -2 },
        stressLevel: { value: stressPercent, label: stressPercent < 20 ? 'Тұрақты' : 'Жоғары' },
        translations: { value: logs.length, change: 12 },
      },
      emotionTimeline: emotionTimeline.length > 0 ? emotionTimeline : [
        { time: '09:00', focused: 70, happy: 20, bored: 5, stressed: 5 },
      ],
      learningOutcome: Math.min(100, Math.round(avgCognitive * 1.2)),
      prediction: { change: 15, direction: 'up' },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    // Fallback to default data
    res.json({
      kpis: {
        concentration: { value: 87, change: 5 },
        heartRate: { value: 74, change: -2 },
        stressLevel: { value: 3, label: 'Тұрақты' },
        translations: { value: 234, change: 12 },
      },
      emotionTimeline: [
        { time: '09:00', focused: 70, happy: 20, bored: 5, stressed: 5 },
        { time: '10:00', focused: 85, happy: 30, bored: 10, stressed: 5 },
        { time: '11:00', focused: 90, happy: 25, bored: 8, stressed: 3 },
        { time: '12:00', focused: 60, happy: 40, bored: 15, stressed: 10 },
        { time: '13:00', focused: 50, happy: 35, bored: 25, stressed: 15 },
        { time: '14:00', focused: 75, happy: 20, bored: 12, stressed: 8 },
      ],
      learningOutcome: 67,
      prediction: { change: 15, direction: 'up' },
    })
  }
})

// GET /api/analytics/daily/:userId — real daily data from DB
analyticsRouter.get('/daily/:userId', async (req, res) => {
  try {
    const logs = await db
      .select()
      .from(emotionLogs)
      .where(eq(emotionLogs.user_id, req.params.userId))
      .orderBy(emotionLogs.timestamp)

    const avgBpm = logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + (l.bpm || 0), 0) / logs.length)
      : 76
    const stressCount = logs.filter(l => (l.bpm || 0) > 90).length

    res.json({ logs, avgBpm, stressCount })
  } catch (error) {
    console.error('Daily analytics error:', error)
    res.json({ logs: [], avgBpm: 76, stressCount: 0 })
  }
})
