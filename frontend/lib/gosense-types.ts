export interface HistoricalDataPoint {
  day: string
  price: number
}

export interface ForecastDataPoint {
  day: string
  historical: number | null
  forecast: number | null
}

export interface Notification {
  id: string
  message: string
  time: string
  read: boolean
}

export interface Message {
  type: "ai" | "user"
  content: string
}

export interface PredictionData {
  historicalData: HistoricalDataPoint[]
  timePeriod: string
  selectedMonth: string
  selectedYear: string
}
