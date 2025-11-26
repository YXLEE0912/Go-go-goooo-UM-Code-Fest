"use client"

import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Bell, AlertCircle } from "lucide-react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { ChatModal } from "./chat-modal"
import { NotificationPanel } from "./notification-panel"
import { generateForecastData } from "../../lib/gosense-data"
import { auth } from "../../lib/api"
import { useState, useEffect, useMemo } from "react"

type AlertSignal = "no alert" | "normal alert" | "critical alert"

interface ForecastAlert {
  day: number
  price: number
  pctChange: number
  signal: AlertSignal
}

interface EnhancedPredictionData {
  day: string
  historical: number | null
  forecast: number | null
  changePercent: number
  displayPrice: number
  isHistorical: boolean
  alertSignal: AlertSignal
}

import type { PredictionData, Notification } from "../../lib/gosense-types"
import { translate, type Language } from "../../lib/gosense-translations"
import { formatPrice, type Currency } from "../../lib/gosense-currency"

interface PredictionScreenProps {
  onNavigate: (screen: string) => void
  predictionData: PredictionData
  darkMode: boolean
  language: Language
  chartType: string
  currency: Currency
  notifications: Notification[]
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
  showNotifications: boolean
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>
}

export const PredictionScreen = ({
  onNavigate,
  predictionData,
  darkMode,
  language,
  chartType,
  currency,
  notifications,
  setNotifications,
  showNotifications,
  setShowNotifications
}: PredictionScreenProps) => {
  const [forecastData, setForecastData] = useState<any[]>([])
  const [alerts, setAlerts] = useState<ForecastAlert[]>([])

  const deriveSignalFromChange = (pct: number): AlertSignal => {
    if (pct <= -7) return "critical alert"
    if (pct <= -5) return "normal alert"
    return "no alert"
  }

  const alertBadgeStyles: Record<AlertSignal, string> = {
    "critical alert": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    "normal alert": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
    "no alert": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
  }
  const [analysis, setAnalysis] = useState<string>("")
  const [recommendation, setRecommendation] = useState<string>("")
  const [strategicInsights, setStrategicInsights] = useState<any>(null)
  const [volatility, setVolatility] = useState<number | null>(null)
  const [rsi, setRsi] = useState<number | null>(null)
  const [support, setSupport] = useState<number | null>(null)
  const [resistance, setResistance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadForecast = async () => {
      setIsLoading(true)
      try {
        const days = 7 // Always show next 7 days prediction
        const response = await auth.predict(days)
        
        if (response.forecast && response.forecast.length > 0) {
           const alertsFromApi: ForecastAlert[] = (response.alerts ?? []).map((alert: any, idx: number) => ({
             day: alert?.day ?? idx + 1,
             price: typeof alert?.price === "number" ? alert.price : response.forecast[idx] ?? 0,
             pctChange: typeof alert?.pct_change === "number" ? alert.pct_change : alert?.pctChange ?? 0,
             signal: (alert?.signal ?? "no alert") as AlertSignal
           }))
           // Generate labels for the next 7 days
           const labels: string[] = []
           const today = new Date();
           for (let i = 1; i <= days; i++) {
             const nextDate = new Date(today);
             nextDate.setDate(today.getDate() + i);
             labels.push(nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
           }
           
           const forecastData = response.forecast.map((price: number, i: number) => ({
             day: labels[i] || `Day ${i+1}`,
             historical: null,
             forecast: Number(price.toFixed(2)),
             alert: alertsFromApi[i]
           }))
           
           setAlerts(alertsFromApi)
           setForecastData(forecastData)
           setAnalysis(response.analysis || "")
           setRecommendation(response.recommendation || "")
           setStrategicInsights(response.strategic_insights || null)
           setVolatility(response.volatility)
           setRsi(response.rsi)
           setSupport(response.support_level)
           setResistance(response.resistance_level)

           // Add critical alerts to notification panel
           alertsFromApi.forEach(alert => {
             if (alert.signal === "critical alert") {
               const message = `Critical Forecast Alert: Price expected to drop to ${formatPrice(alert.price, currency)} (Day ${alert.day})`
               
               // Check if we already have this notification locally to avoid spamming
               setNotifications(prev => {
                 if (prev.some(n => n.message === message)) return prev
                 
                 return [{
                   id: Date.now().toString() + Math.random(),
                   message: message,
                   time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                   read: false,
                 }, ...prev]
               })
             }
           })
        } else {
           // Fallback to generated data if API fails
           const generated = generateForecastData([], 'Week').filter(d => d.forecast !== null)
           const generatedWithAlerts = generated.map((item, idx, array) => {
             const prevValue = idx === 0 ? item.historical ?? item.forecast ?? 0 : array[idx - 1].forecast ?? array[idx - 1].historical ?? 0
             const currentValue = item.forecast ?? item.historical ?? 0
             const pctChange = prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0
             const alert: ForecastAlert = {
               day: idx + 1,
               price: currentValue,
               pctChange: Number(pctChange.toFixed(2)),
               signal: deriveSignalFromChange(pctChange)
             }
             return { ...item, alert }
           })
           setAlerts(generatedWithAlerts.map(item => item.alert))
           setForecastData(generatedWithAlerts)
           
           setStrategicInsights(null)
           setAnalysis("Market data unavailable.")
           setRecommendation("N/A")
        }
      } catch (e) {
        console.error("Prediction error:", e)
        // Fallback to generated forecast data
        const generated = generateForecastData([], 'Week').filter(d => d.forecast !== null)
        const generatedWithAlerts = generated.map((item, idx, array) => {
          const prevValue = idx === 0 ? item.historical ?? item.forecast ?? 0 : array[idx - 1].forecast ?? array[idx - 1].historical ?? 0
          const currentValue = item.forecast ?? item.historical ?? 0
          const pctChange = prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0
          const alert: ForecastAlert = {
            day: idx + 1,
            price: currentValue,
            pctChange: Number(pctChange.toFixed(2)),
            signal: deriveSignalFromChange(pctChange)
          }
          return { ...item, alert }
        })
        setAlerts(generatedWithAlerts.map(item => item.alert))
        setForecastData(generatedWithAlerts)
        
        setStrategicInsights(null)
        setAnalysis("Connection error.")
        setRecommendation("N/A")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadForecast()
  }, [predictionData])

  // Since we only show forecast data, use the first forecast as "current" price
  const firstForecastPrice = forecastData.length > 0 ? (forecastData[0]?.forecast ?? 160.00) : 160.00
  const lastForecastPrice = forecastData.length > 0 ? (forecastData[forecastData.length - 1]?.forecast ?? 170.00) : 170.00
  const predictedChange = lastForecastPrice - firstForecastPrice
  const predictedPercent = firstForecastPrice !== 0 ? ((predictedChange / firstForecastPrice) * 100).toFixed(2) : "0.00"

  // Calculate percentage changes for each data point with proper null checks
  const enhancedData: EnhancedPredictionData[] = forecastData.map((item: any, index, array) => {
    const currentValue = item.historical ?? item.forecast ?? 0
    const alertInfo: ForecastAlert | undefined = item.alert ?? alerts[index]

    if (index === 0) {
      const basePercent = alertInfo?.pctChange ?? 0
      const normalizedPercent = Number(Number.isFinite(basePercent) ? basePercent.toFixed(2) : 0)
      const percentValue = Number.isFinite(normalizedPercent) ? normalizedPercent : 0
      const signal = alertInfo?.signal ?? deriveSignalFromChange(percentValue)

      return {
        ...item,
        changePercent: percentValue,
        displayPrice: currentValue,
        isHistorical: item.historical !== null,
        alertSignal: signal
      }
    }

    const prevItem = array[index - 1]
    const prevValue = prevItem.historical ?? prevItem.forecast ?? 0

    let changePercent = alertInfo?.pctChange
    if (changePercent === undefined) {
      if (prevValue !== 0) {
        changePercent = ((currentValue - prevValue) / prevValue) * 100
      } else {
        changePercent = 0
      }
    }

    const normalizedPercent = Number(changePercent.toFixed(2))
    const signal = alertInfo?.signal ?? deriveSignalFromChange(normalizedPercent)

    return {
      ...item,
      changePercent: normalizedPercent,
      displayPrice: currentValue,
      isHistorical: item.historical !== null,
      alertSignal: signal
    }
  })

  const overallSignal: AlertSignal = useMemo(() => {
    if (alerts.some(alert => alert.signal === "critical alert")) {
      return "critical alert"
    }
    if (alerts.some(alert => alert.signal === "normal alert")) {
      return "normal alert"
    }
    if (alerts.length > 0) {
      return "no alert"
    }

    if (enhancedData.some(item => item.alertSignal === "critical alert")) {
      return "critical alert"
    }
    if (enhancedData.some(item => item.alertSignal === "normal alert")) {
      return "normal alert"
    }
    return "no alert"
  }, [alerts, enhancedData])

  const formatRowSignalLabel = (signal: AlertSignal) => {
    if (signal === "critical alert") return "Critical Alert"
    if (signal === "normal alert") return "Normal Alert"
    return "No Alert"
  }

  const formatSectionSignalLabel = (signal: AlertSignal) => {
    if (signal === "critical alert") return "Critical Alert"
    if (signal === "normal alert") return "Normal Alert"
    return "Stable"
  }

  const t = (key: string) => translate(language, key)

  const renderChart = () => {
    if (chartType === "Line") {
      return (
        <LineChart data={forecastData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={["dataMin - 5", "dataMax + 5"]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            tickFormatter={(val) => formatPrice(val, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="historical"
            stroke="#60A5FA"
            strokeWidth={3}
            dot={{ r: 4, fill: "#60A5FA" }}
            name={t("historicalData")}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10B981"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "#10B981" }}
            name={t("aiForecast")}
            connectNulls={false}
          />
        </LineChart>
      )
    }
    if (chartType === "Bar") {
      return (
        <BarChart data={forecastData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={["dataMin - 5", "dataMax + 5"]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            tickFormatter={(val) => formatPrice(val, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
          />
          <Legend />
          <Bar dataKey="historical" fill="#60A5FA" name={t("historicalData")} radius={[8, 8, 0, 0]} />
          <Bar dataKey="forecast" fill="#10B981" name={t("aiForecast")} radius={[8, 8, 0, 0]} />
        </BarChart>
      )
    }
    if (chartType === "Area") {
      return (
        <AreaChart data={forecastData}>
          <defs>
            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={["dataMin - 5", "dataMax + 5"]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            tickFormatter={(val) => formatPrice(val, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="historical"
            stroke="#60A5FA"
            strokeWidth={3}
            fill="url(#colorHistorical)"
            name={t("historicalData")}
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#10B981"
            strokeWidth={3}
            strokeDasharray="5 5"
            fill="url(#colorForecast)"
            name={t("aiForecast")}
            connectNulls={false}
          />
        </AreaChart>
      )
    }
    if (chartType === "Scatter") {
      return (
        <ScatterChart>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={["dataMin - 5", "dataMax + 5"]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            tickFormatter={(val) => formatPrice(val, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
            cursor={{ strokeDasharray: "3 3" }}
          />
          <Legend />
          <Scatter
            name={t("historicalData")}
            data={forecastData.filter((d) => d.historical !== null)}
            fill="#60A5FA"
            dataKey="historical"
          />
          <Scatter
            name={t("aiForecast")}
            data={forecastData.filter((d) => d.forecast !== null)}
            fill="#10B981"
            dataKey="forecast"
          />
        </ScatterChart>
      )
    }
    if (chartType === "Composed") {
      return (
        <ComposedChart data={forecastData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={["dataMin - 5", "dataMax + 5"]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
            tickFormatter={(val) => formatPrice(val, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
          />
          <Legend />
          <Bar
            dataKey="historical"
            fill="#60A5FA"
            name={t("historicalData")}
            fillOpacity={0.3}
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="forecast"
            fill="#10B981"
            name={t("aiForecast")}
            fillOpacity={0.3}
            radius={[8, 8, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="historical"
            stroke="#60A5FA"
            strokeWidth={3}
            dot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10B981"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            connectNulls={false}
          />
        </ComposedChart>
      )
    }
    // Default case for Candlestick, Pie, Radar
    return (
      <LineChart data={forecastData}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
        />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          domain={["dataMin - 5", "dataMax + 5"]}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#4B5563" }}
          tickFormatter={(val) => formatPrice(val, currency)}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            color: darkMode ? "white" : "black",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="historical"
          stroke="#60A5FA"
          strokeWidth={3}
          dot={{ r: 4 }}
          name={t("historicalData")}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="#10B981"
          strokeWidth={3}
          strokeDasharray="5 5"
          dot={{ r: 4 }}
          name={t("aiForecast")}
          connectNulls={false}
        />
      </LineChart>
    )
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"}`}
    >
      <div className="flex flex-col max-w-5xl mx-auto min-h-screen">
        <header
          className={`sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-white/10" : "border-gray-200"} backdrop-blur-md bg-opacity-80 ${darkMode ? "bg-gray-900/80" : "bg-white/80"}`}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("dashboard")}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
            </button>
            <div>
              <h1 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {t("predictionAndInsights")}
              </h1>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t("forecast")}</p>
            </div>
          </div>
          <NotificationPanel
            notifications={notifications}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            setNotifications={setNotifications}
            unreadCount={notifications.filter((n) => !n.read).length}
            darkMode={darkMode}
            language={language}
          />
        </header>

        <div className="flex-1 p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex justify-center items-center py-4">
                <p className={`text-sm font-medium animate-pulse ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  Data is on the way — please wait.
                </p>
              </div>
              <Card className={`p-6 ${darkMode ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-white"}`}>
                <div className="space-y-4">
                  <Skeleton className={`h-4 w-32 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <Skeleton className={`h-12 w-48 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-white/10" : "border-gray-200"}`}>
                    <div className="space-y-2">
                      <Skeleton className={`h-3 w-20 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                      <Skeleton className={`h-6 w-24 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className={`h-3 w-20 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                      <Skeleton className={`h-6 w-24 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <Skeleton className={`h-6 w-48 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <Skeleton className={`h-6 w-24 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
                <Skeleton className={`h-80 w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              </Card>
              <Card className={`p-6 ${darkMode ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-white"}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="space-y-2">
                    <Skeleton className={`h-6 w-48 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <Skeleton className={`h-4 w-64 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  </div>
                  <Skeleton className={`h-6 w-24 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
                <div className="space-y-4">
                  <Skeleton className={`h-24 w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className={`h-32 w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <Skeleton className={`h-32 w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <Card className={`p-6 ${darkMode ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-white"}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p
                    className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} uppercase tracking-wider mb-1`}
                  >
                    {t("predictedPrice")} ({predictionData?.timePeriod || t("week")})
                  </p>
                  <div className="flex items-baseline gap-3">
                    <h2 className={`text-4xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {formatPrice(lastForecastPrice, currency)}
                    </h2>
                    <span
                      className={`flex items-center text-sm font-semibold px-2 py-1 rounded-md ${
                        predictedChange >= 0 ? "text-green-400 bg-green-500/20" : "text-red-400 bg-red-500/20"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      {predictedChange >= 0 ? "+" : ""}
                      {formatPrice(predictedChange, currency).replace(/^[^0-9-]+/, "")} ({predictedPercent}%)
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`grid grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-white/10" : "border-gray-200"}`}
              >
                <div>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>{t("currentPrice")}</p>
                  <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {formatPrice(firstForecastPrice, currency)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>{t("expectedClose")}</p>
                  <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {formatPrice(lastForecastPrice, currency)}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {t("priceForecastComparison")}
                </h3>
                <span
                  className={`text-xs font-medium ${darkMode ? "text-gray-400 bg-white/10" : "text-gray-600 bg-gray-100"} backdrop-blur-sm px-2 py-1 rounded border ${darkMode ? "border-white/10" : "border-gray-200"}`}
                >
                  7-Day Forecast
                </span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Active Alerts Section */}
            {alerts.some(a => a.signal !== "no alert") && (
              <Card className={`p-6 border-l-4 ${
                overallSignal === "critical alert" ? "border-l-red-500" : "border-l-yellow-500"
              } ${darkMode ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-white"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full ${
                    overallSignal === "critical alert" 
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                      : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {t("activeAlerts")}
                  </h3>
                </div>
                <div className="space-y-3">
                  {alerts.filter(a => a.signal !== "no alert").map((alert, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
                      alert.signal === "critical alert"
                        ? "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30"
                        : "bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30"
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${
                          alert.signal === "critical alert" 
                            ? "text-red-800 dark:text-red-200" 
                            : "text-yellow-800 dark:text-yellow-200"
                        }`}>
                          {alert.signal === "critical alert" ? "Critical" : "Warning"}
                        </span>
                        <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          Day {alert.day}: {alert.pctChange > 0 ? "Surge" : "Drop"} of {Math.abs(alert.pctChange)}% expected
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {formatPrice(alert.price, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Optimization Strategy Card */}
            <Card className={`p-6 ${darkMode ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {t("optimizationStrategy")}
                  </h3>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
                    Actionable insights for executive decision-making
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  predictedChange > 0 
                    ? darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800"
                    : predictedChange < 0
                    ? darkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-800"
                    : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800"
                }`}>
                  {predictedChange > 0 ? t("growth") : predictedChange < 0 ? t("optimization") : t("stability")}
                </span>
              </div>

              {/* Error Message if Insights are missing */}
              {!strategicInsights && (
                  <div className={`mb-6 p-4 rounded-lg border border-dashed ${darkMode ? "border-red-500/30 bg-red-900/10" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-center gap-3">
                        <AlertCircle className={`w-5 h-5 ${darkMode ? "text-red-400" : "text-red-600"}`} />
                        <p className={`text-sm ${darkMode ? "text-red-200" : "text-red-800"}`}>
                            Unable to load detailed strategic insights. The AI model service may be unavailable.
                        </p>
                    </div>
                  </div>
              )}
              
              {/* Strategic Resource Allocation */}
              {strategicInsights?.allocation && (
                <div className="mb-6">
                  <h4 className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    1️⃣ Resource Allocation Optimization
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(strategicInsights.allocation).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{key}</span>
                          <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{value}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Capacity Planning */}
                {strategicInsights?.capacity_planning && (
                  <div className={`p-4 rounded-lg border ${darkMode ? "border-blue-500/30 bg-blue-900/10" : "border-blue-200 bg-blue-50"}`}>
                    <h4 className={`text-sm font-medium mb-2 ${darkMode ? "text-blue-200" : "text-blue-800"}`}>
                      2️⃣ Capacity Planning Optimization
                    </h4>
                    <p className={`text-sm ${darkMode ? "text-blue-100/80" : "text-blue-700/80"}`}>
                      {strategicInsights.capacity_planning}
                    </p>
                  </div>
                )}

                {/* Risk Mitigation */}
                {strategicInsights?.risk_mitigation && (
                  <div className={`p-4 rounded-lg border ${darkMode ? "border-yellow-500/30 bg-yellow-900/10" : "border-yellow-200 bg-yellow-50"}`}>
                    <h4 className={`text-sm font-medium mb-2 ${darkMode ? "text-yellow-200" : "text-yellow-800"}`}>
                      3️⃣ Risk Mitigation Optimization
                    </h4>
                    <p className={`text-sm ${darkMode ? "text-yellow-100/80" : "text-yellow-700/80"}`}>
                      {strategicInsights.risk_mitigation}
                    </p>
                  </div>
                )}
              </div>

              {/* Scenario Comparison */}
              {strategicInsights?.scenarios && (
                <div className="mb-6">
                  <h4 className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    4️⃣ Operational Scenario Comparison
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(strategicInsights.scenarios).map(([scenario, detail]: [string, any]) => (
                      <div key={scenario} className={`p-3 rounded border ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
                        <p className={`text-xs font-bold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>{scenario}</p>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`p-4 rounded-lg border ${darkMode ? "border-white/10 bg-purple-900/20" : "border-purple-100 bg-purple-50"}`}>
                <div className="flex gap-3">
                  <div className={`mt-1 p-1.5 rounded-full ${darkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium mb-1 ${darkMode ? "text-purple-100" : "text-purple-900"}`}>
                      {t("strategicRecommendation")}
                    </h4>
                    <p className={`text-sm ${darkMode ? "text-purple-200/80" : "text-purple-700/80"}`}>
                      {recommendation || t("defaultRecommendation")}
                    </p>
                    <p className={`text-xs mt-2 italic ${darkMode ? "text-purple-300/60" : "text-purple-600/60"}`}>
                      {analysis}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Technical Indicators Card */}
            <Card className={`p-6 ${darkMode ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {t("technicalIndicators")}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Volatility */}
                <div className={`p-4 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("volatility")}</p>
                    <div className={`w-2 h-2 rounded-full ${
                      (volatility || 0) > 0.3 ? "bg-red-500" : (volatility || 0) > 0.15 ? "bg-yellow-500" : "bg-green-500"
                    }`} />
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {volatility ? `${(volatility * 100).toFixed(1)}%` : "N/A"}
                  </p>
                  <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {t("volatilityDesc")}
                  </p>
                </div>

                {/* RSI */}
                <div className={`p-4 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("rsi")}</p>
                    <div className={`w-2 h-2 rounded-full ${
                      (rsi || 50) > 70 ? "bg-red-500" : (rsi || 50) < 30 ? "bg-green-500" : "bg-blue-500"
                    }`} />
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {rsi ? rsi.toFixed(1) : "N/A"}
                  </p>
                  <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {t("rsiDesc")}
                  </p>
                </div>

                {/* Support */}
                <div className={`p-4 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("supportLevel")}</p>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {support ? formatPrice(support, currency) : "N/A"}
                  </p>
                  <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {t("supportDesc")}
                  </p>
                </div>

                {/* Resistance */}
                <div className={`p-4 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("resistanceLevel")}</p>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {resistance ? formatPrice(resistance, currency) : "N/A"}
                  </p>
                  <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {t("resistanceDesc")}
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Price Change Table */}
            <div>
              <Card className="p-6">
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  7-Day Price Forecast
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium text-right">Price</th>
                        <th className="pb-2 font-medium text-right">Change %</th>
                        <th className="pb-2 font-medium text-right">Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                      {enhancedData.map((item, index) => {
                        const price = item.displayPrice ?? 0
                        const isHistorical = item.isHistorical
                        const change = item.changePercent || 0
                        const isPositive = change >= 0
                        
                        return (
                          <tr key={index} className={darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                            <td className="py-3 text-sm">
                              <div className="flex items-center">
                                {item.day}
                              </div>
                            </td>
                            <td className="py-3 text-sm text-right">
                              {formatPrice(price, currency)}
                            </td>
                            <td className="py-3 text-sm text-right">
                              {index > 0 && (
                                <span className={`${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                  {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-sm text-right">
                              {item.alertSignal !== "no alert" ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  item.alertSignal === "critical alert"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                                }`}>
                                  {item.alertSignal === "critical alert" ? "Critical" : "Warning"}
                                </span>
                              ) : (
                                <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                  None
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
          </motion.div>
          )}
        </div>

        <ChatModal />
      </div>
    </div>
  )
}
