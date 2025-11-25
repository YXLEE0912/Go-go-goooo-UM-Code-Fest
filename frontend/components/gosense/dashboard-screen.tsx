"use client"

import { useState, useEffect } from "react"
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
} from "recharts"
import { TrendingUp, Settings } from "lucide-react"
import { Card, Button } from "./ui-components"
import { NotificationPanel } from "./notification-panel"
import { generateHistoricalData, playNotificationSound } from "../../lib/gosense-data"
import { auth } from "../../lib/api"
import { translate, type Language } from "../../lib/gosense-translations"
import type { Notification } from "../../lib/gosense-types"
import { formatPrice, type Currency } from "../../lib/gosense-currency"

interface DashboardScreenProps {
  onNavigate: (screen: string, data?: any) => void
  darkMode: boolean
  language: Language
  chartType: string
  currency: Currency
  notifications: Notification[]
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
  showNotifications: boolean
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export const DashboardScreen = ({ 
  onNavigate, 
  darkMode, 
  language, 
  chartType, 
  currency,
  notifications,
  setNotifications,
  showNotifications,
  setShowNotifications
}: DashboardScreenProps) => {
  const [timeRange, setTimeRange] = useState("1W")
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [soundEnabled] = useState(true)

  const ranges = [
    { label: "1W", days: 7, period: "Range" },
    { label: "1M", days: 30, period: "Range" },
    { label: "3M", days: 90, period: "Range" },
    { label: "6M", days: 180, period: "Range" },
    { label: "1Y", days: 365, period: "Range" },
  ]

  const t = (key: string) => translate(language, key)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const selectedRange = ranges.find(r => r.label === timeRange) || ranges[0]
        // Pass period="Range" to bypass the specific Month/Week logic in backend and just use days
        const data = await auth.getHistory(selectedRange.days, "Range", 0, 2024)
        
        let formattedData: { day: string; price: number }[] = []
        
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
            formattedData = data.map((item: any) => {
                const date = new Date(item.date)
                let label = ""
                if (timeRange === "1W" || timeRange === "1M") {
                    label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                } else {
                    label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }
                return {
                    day: label,
                    price: item.price
                }
            })
        } else if (Array.isArray(data)) {
            // Fallback for old format
            const today = new Date()
            const sliceSize = Math.min(data.length, selectedRange.days)
            const labels: string[] = []
            
            for(let i=sliceSize-1; i>=0; i--) {
                const d = new Date(today)
                d.setDate(d.getDate() - i)
                if (timeRange === "1W" || timeRange === "1M") {
                    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                } else {
                    labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
                }
            }
            
            formattedData = data.slice(-sliceSize).map((price: number, i: number) => ({
                day: labels[i],
                price
            }))
        }
        setHistoricalData(formattedData)
      } catch (e) {
        console.error(e)
        setHistoricalData(generateHistoricalData("Week", 0, 2024))
      }
    }
    fetchData()
  }, [timeRange])

  const currentPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].price : 158.45
  const firstPrice = historicalData.length > 0 ? historicalData[0].price : 145.2
  const priceChange = currentPrice - firstPrice
  const percentChange = firstPrice !== 0 ? ((priceChange / firstPrice) * 100).toFixed(2) : "0.00"

  useEffect(() => {
    if (historicalData.length >= 2) {
      const lastPrice = historicalData[historicalData.length - 1].price
      const firstPrice = historicalData[0].price
      const priceChange = lastPrice - firstPrice
      const percentChange = (priceChange / firstPrice) * 100

      if (percentChange < -5) {
        const newNotification = {
          id: Date.now().toString(),
          message: `Risk Alert: Significant drop of ${Math.abs(percentChange).toFixed(2)}% detected in the last ${timeRange}.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false,
        }
        setNotifications((prev) => {
          if (prev.length === 0 || prev[0].message !== newNotification.message) {
            if (soundEnabled) playNotificationSound()
            return [newNotification, ...prev.slice(0, 9)]
          }
          return prev
        })
      }
    }
  }, [historicalData, soundEnabled, timeRange])

  const unreadCount = notifications.filter((n) => !n.read).length

  const renderChart = () => {
    if (chartType === "Line") {
      return (
        <LineChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            domain={["dataMin - 5", "dataMax + 5"]}
            tickFormatter={(value) => formatPrice(value, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
            cursor={{ stroke: "#3B82F6", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#3B82F6" }}
          />
        </LineChart>
      )
    }
    if (chartType === "Bar") {
      return (
        <BarChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            domain={["dataMin - 5", "dataMax + 5"]}
            tickFormatter={(value) => formatPrice(value, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
          />
          <Bar dataKey="price" fill="#3B82F6" radius={[8, 8, 0, 0]} />
        </BarChart>
      )
    }
    if (chartType === "Area") {
      return (
        <AreaChart data={historicalData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            domain={["dataMin - 5", "dataMax + 5"]}
            tickFormatter={(value) => formatPrice(value, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
            cursor={{ stroke: "#3B82F6", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3B82F6"
            strokeWidth={3}
            fill="url(#colorPrice)"
            fillOpacity={1}
          />
        </AreaChart>
      )
    }
    if (chartType === "Scatter") {
      return (
        <ScatterChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
          />
          <YAxis
            dataKey="price"
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            domain={["dataMin - 5", "dataMax + 5"]}
            tickFormatter={(value) => formatPrice(value, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
            cursor={{ strokeDasharray: "3 3" }}
          />
          <Scatter name="Price" dataKey="price" fill="#3B82F6" />
        </ScatterChart>
      )
    }
    if (chartType === "Composed") {
      return (
        <ComposedChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
            domain={["dataMin - 5", "dataMax + 5"]}
            tickFormatter={(value) => formatPrice(value, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "white" : "black",
            }}
          />
          <Bar dataKey="price" fill="#3B82F6" radius={[8, 8, 0, 0]} fillOpacity={0.3} />
          <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
        </ComposedChart>
      )
    }
    // Default case
    return (
      <LineChart data={historicalData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563", fontSize: 12 }}
          domain={["dataMin - 5", "dataMax + 5"]}
          tickFormatter={(value) => formatPrice(value, currency)}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: darkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            color: darkMode ? "white" : "black",
          }}
        />
        <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    )
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"} p-6`}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{t("analytics")}</h1>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t("dashboard")}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel
              notifications={notifications}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              setNotifications={setNotifications}
              unreadCount={unreadCount}
              darkMode={darkMode}
              language={language}
            />
          </div>
        </header>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
              {t("historicalView")}
            </h2>
            <div className="flex items-end gap-3">
              <span className={`text-4xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {formatPrice(currentPrice, currency)}
              </span>
              <span
                className={`font-medium mb-1 flex items-center text-sm px-2 py-0.5 rounded-full ${
                  priceChange >= 0 ? "text-green-400 bg-green-500/20" : "text-red-400 bg-red-500/20"
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {priceChange >= 0 ? "+" : ""}
                {formatPrice(priceChange, currency).replace(/^[^0-9-]+/, "")} ({percentChange}%)
              </span>
            </div>
            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-600"} mt-2`}>
              {timeRange === "1W" ? "Last 7 Days" : 
               timeRange === "1M" ? "Last 30 Days" : 
               timeRange === "3M" ? "Last 3 Months" : 
               timeRange === "6M" ? "Last 6 Months" : "Last Year"}
            </p>
          </div>

          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-white/5 rounded-lg w-fit">
            {ranges.map((range) => (
              <button
                key={range.label}
                onClick={() => setTimeRange(range.label)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeRange === range.label
                    ? `${darkMode ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "bg-white text-gray-900 shadow-sm"}`
                    : `${darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>

          <div className="mt-8">
            <Button
              className="w-full py-4 text-lg shadow-blue-500/25"
              onClick={() =>
                onNavigate("prediction", {
                  historicalData,
                  timePeriod: timeRange,
                })
              }
            >
              {t("predictFuture")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
