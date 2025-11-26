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
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Bell } from "lucide-react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { ChatModal } from "./chat-modal"
import { NotificationPanel } from "./notification-panel"
import { generateForecastData } from "../../lib/gosense-data"
import { auth } from "../../lib/api"
import { useState, useEffect } from "react"

interface EnhancedPredictionData {
  day: string
  historical: number | null
  forecast: number | null
  changePercent: number
  displayPrice: number
  isHistorical: boolean
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
  const [analysis, setAnalysis] = useState<string>("")
  const [recommendation, setRecommendation] = useState<string>("")
  const [volatility, setVolatility] = useState<number | null>(null)
  const [rsi, setRsi] = useState<number | null>(null)
  const [support, setSupport] = useState<number | null>(null)
  const [resistance, setResistance] = useState<number | null>(null)

  useEffect(() => {
    const loadForecast = async () => {
      try {
        const days = 7 // Always show next 7 days prediction
        const response = await auth.predict(days)
        
        if (response.forecast && response.forecast.length > 0) {
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
             forecast: Number(price.toFixed(2))
           }))
           
           setForecastData(forecastData)
           setAnalysis(response.analysis || "")
           setRecommendation(response.recommendation || "")
           setVolatility(response.volatility)
           setRsi(response.rsi)
           setSupport(response.support_level)
           setResistance(response.resistance_level)
        } else {
           // Fallback to generated data if API fails
           const generated = generateForecastData([], 'Week').filter(d => d.forecast !== null)
           setForecastData(generated)
        }
      } catch (e) {
        console.error("Prediction error:", e)
        // Fallback to generated forecast data
        const generated = generateForecastData([], 'Week').filter(d => d.forecast !== null)
        setForecastData(generated)
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
  const enhancedData: EnhancedPredictionData[] = forecastData.map((item, index, array) => {
    // Safely get current value with fallback
    const currentValue = item.historical ?? item.forecast ?? 0
    
    // For the first item, return with 0% change
    if (index === 0) {
      return {
        ...item,
        changePercent: 0,
        displayPrice: currentValue,
        isHistorical: item.historical !== null
      }
    }
    
    // For subsequent items, calculate percentage change
    const prevItem = array[index - 1]
    const prevValue = prevItem.historical ?? prevItem.forecast ?? 0
    
    // Calculate percentage change, handle division by zero
    let changePercent = 0
    if (prevValue !== 0) {
      changePercent = ((currentValue - prevValue) / prevValue) * 100
    }
    
    return { 
      ...item, 
      changePercent: Number(changePercent.toFixed(2)),
      displayPrice: currentValue,
      isHistorical: item.historical !== null
    }
  })

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
                  {predictedChange > 0 ? t("buy") : predictedChange < 0 ? t("sell") : t("hold")}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>{t("tradingSignal")}</p>
                  <p className={`font-semibold ${
                    predictedChange > 0 ? "text-green-500" : predictedChange < 0 ? "text-red-500" : darkMode ? "text-white" : "text-gray-900"
                  }`}>
                    {predictedChange > 2 ? t("strongBuy") : predictedChange > 0 ? t("buy") : predictedChange < -2 ? t("strongSell") : predictedChange < 0 ? t("sell") : t("hold")}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>{t("riskLevel")}</p>
                  <p className={`font-semibold ${
                    Math.abs(Number(predictedPercent)) > 5 ? "text-red-500" : Math.abs(Number(predictedPercent)) > 2 ? "text-yellow-500" : "text-green-500"
                  }`}>
                    {Math.abs(Number(predictedPercent)) > 5 ? t("highRisk") : Math.abs(Number(predictedPercent)) > 2 ? t("mediumRisk") : t("lowRisk")}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>{t("confidenceScore")}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>85%</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${darkMode ? "border-white/10 bg-blue-900/20" : "border-blue-100 bg-blue-50"}`}>
                <div className="flex gap-3 mb-4">
                  <div className={`mt-1 p-1.5 rounded-full ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium mb-1 ${darkMode ? "text-blue-100" : "text-blue-900"}`}>
                      {t("marketAnalysis")}
                    </h4>
                    <p className={`text-sm ${darkMode ? "text-blue-200/80" : "text-blue-700/80"}`}>
                      {analysis || (predictedChange > 0 ? t("strategyDescription") : predictedChange < 0 ? t("strategyDescriptionBearish") : t("strategyDescriptionNeutral"))}
                    </p>
                  </div>
                </div>
                
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
            <Card className={`p-6 ${darkMode ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {t("priceChangeTable")}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      <th className="pb-2 font-medium">{t("date")}</th>
                      <th className="pb-2 font-medium text-right">{t("price")}</th>
                      <th className="pb-2 font-medium text-right">{t("change")}</th>
                      <th className="pb-2 font-medium text-right">{t("%Change")}</th>
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
                            {index > 0 && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                isPositive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                {isPositive ? '+' : ''}{change.toFixed(2)}%
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
          </motion.div>
        </div>

        <ChatModal />
      </div>
    </div>
  )
}
