export interface PredictionResult {
  action: 'simplify' | 'maintain' | 'increase'
  reason: string
  notification: string | null
}

export function predictAction(emotion: string, bpm: number, cognitive: number): PredictionResult {
  if (bpm > 90 || emotion === 'stressed') {
    return {
      action: 'simplify',
      reason: 'Жүктеме жоғары болғандықтан, жүйе тапсырманы жеңілдетті.',
      notification: `⚠️ Стресс: ${bpm} BPM`,
    }
  }

  if (cognitive > 80 && (emotion === 'focused' || emotion === 'happy')) {
    return {
      action: 'increase',
      reason: 'Зейініңіз жоғары. Қазір күрделі тақырыптарды меңгеруге ең қолайлы уақыт.',
      notification: null,
    }
  }

  return {
    action: 'maintain',
    reason: 'Қазіргі деңгей сәйкес.',
    notification: null,
  }
}
