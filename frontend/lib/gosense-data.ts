import type { HistoricalDataPoint, ForecastDataPoint } from "./gosense-types"

export const generateHistoricalData = (period: string, month?: number, year?: number): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = []

  if (period === "Week") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    let basePrice = 146.2 + (month || 0) * 0.5
    for (let i = 0; i < days.length; i++) {
      const price = basePrice + Math.random() * 10
      data.push({ day: days[i], price: Number(price.toFixed(2)) })
      basePrice = price
    }
  } else if (period === "Month") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    let basePrice = 140 + (year || 2024) * 0.1
    for (let i = 0; i < 12; i++) {
      const price = basePrice + Math.random() * 15
      data.push({ day: months[i], price: Number(price.toFixed(2)) })
      basePrice = price
    }
  }

  return data
}

export const generateForecastData = (historicalData: HistoricalDataPoint[], period: string): ForecastDataPoint[] => {
  const forecast: ForecastDataPoint[] = [
    ...historicalData.map((d) => ({
      day: d.day,
      historical: d.price,
      forecast: null,
    })),
  ]

  const lastPrice = historicalData[historicalData.length - 1].price

  if (period === "Week") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for (let i = 0; i < 7; i++) {
      const predictedPrice = lastPrice + (i + 1) * 1.5 + Math.random() * 3
      forecast.push({
        day: days[i],
        historical: null,
        forecast: Number(predictedPrice.toFixed(2)),
      })
    }
  } else {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for (let i = 0; i < 12; i++) {
      const predictedPrice = lastPrice + (i + 1) * 2.5 + Math.random() * 5
      forecast.push({
        day: months[i],
        historical: null,
        forecast: Number(predictedPrice.toFixed(2)),
      })
    }
  }

  return forecast
}

export const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = 800
  oscillator.type = "sine"
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)
}
