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
import { translate, type Language } from "../../lib/gosense-translations"
import type { Notification } from "../../lib/gosense-types"
import { formatPrice, type Currency } from "../../lib/gosense-currency"

interface DashboardScreenProps {
  onNavigate: (screen: string, data?: any) => void
  darkMode: boolean
  language: Language
  chartType: string
  currency: Currency
}

export const DashboardScreen = ({ onNavigate, darkMode, language, chartType, currency }: DashboardScreenProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("Week")
  const [selectedMonth, setSelectedMonth] = useState("January")
  const [selectedYear, setSelectedYear] = useState("2024")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [soundEnabled] = useState(true)

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
  const years = [2023, 2024, 2025]

  const getPeriodLabel = () => {
    if (selectedPeriod === "Week") {
      return `${selectedMonth} Week`
    } else {
      return `${selectedYear}`
    }
  }

  const t = (key: string) => translate(language, key)

  const historicalData = generateHistoricalData(selectedPeriod, months.indexOf(selectedMonth), Number(selectedYear))
  const currentPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].price : 158.45
  const firstPrice = historicalData.length > 0 ? historicalData[0].price : 145.2
  const priceChange = currentPrice - firstPrice
  const percentChange = ((priceChange / firstPrice) * 100).toFixed(2)

  useEffect(() => {
    const historicalData = generateHistoricalData(selectedPeriod, months.indexOf(selectedMonth), Number(selectedYear))

    if (historicalData.length >= 2) {
      const lastPrice = historicalData[historicalData.length - 1].price
      const firstPrice = historicalData[0].price
      const priceChange = lastPrice - firstPrice
      const percentChange = (priceChange / firstPrice) * 100

      if (percentChange < -2) {
        const newNotification = {
          id: Date.now().toString(),
          message: `Risk Alert: NVIDIA stock dropped ${Math.abs(percentChange).toFixed(2)}% in selected period. High volatility detected.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false,
        }
        setNotifications((prev) => {
          if (prev.length === 0 || prev[0].message !== newNotification.message) {
            if (soundEnabled) {
              playNotificationSound()
            }
            return [newNotification, ...prev.slice(0, 9)]
          }
          return prev
        })
      } else if (Math.abs(percentChange) > 5) {
        const newNotification = {
          id: Date.now().toString(),
          message: `Alert: High volatility detected. Stock moved ${percentChange.toFixed(2)}% in ${selectedPeriod.toLowerCase()}.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false,
        }
        setNotifications((prev) => {
          if (prev.length === 0 || prev[0].message !== newNotification.message) {
            if (soundEnabled) {
              playNotificationSound()
            }
            return [newNotification, ...prev.slice(0, 9)]
          }
          return prev
        })
      }
    }
  }, [selectedPeriod, selectedMonth, selectedYear, soundEnabled])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"} p-6`}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-xl rotate-6 shadow-lg shadow-blue-600/30"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/40">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.9" />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{t("analytics")}</h1>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t("dashboard")}</p>
            </div>
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
            <button
              onClick={() => onNavigate("settings")}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Settings className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-700"}`} />
            </button>
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
            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-600"} mt-2`}>{getPeriodLabel()}</p>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedPeriod("Week")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedPeriod === "Week"
                  ? `${darkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white"}`
                  : `${darkMode ? "bg-white/10 text-gray-400" : "bg-gray-200 text-gray-600"} hover:bg-white/20 backdrop-blur-sm`
              }`}
            >
              {t("week")}
            </button>
            <button
              onClick={() => setSelectedPeriod("Month")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedPeriod === "Month"
                  ? `${darkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white"}`
                  : `${darkMode ? "bg-white/10 text-gray-400" : "bg-gray-200 text-gray-600"} hover:bg-white/20 backdrop-blur-sm`
              }`}
            >
              {t("month")}
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            {selectedPeriod === "Week" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`px-3 py-2 text-sm rounded-lg border ${darkMode ? "border-white/10 bg-white/5 text-white" : "border-gray-300 bg-white text-gray-900"} backdrop-blur-md focus:ring-2 focus:ring-blue-500/20 outline-none`}
              >
                {months.map((month) => (
                  <option key={month} value={month} className={darkMode ? "bg-gray-900" : "bg-white"}>
                    {month}
                  </option>
                ))}
              </select>
            )}

            {selectedPeriod === "Month" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`px-3 py-2 text-sm rounded-lg border ${darkMode ? "border-white/10 bg-white/5 text-white" : "border-gray-300 bg-white text-gray-900"} backdrop-blur-md focus:ring-2 focus:ring-blue-500/20 outline-none`}
              >
                {years.map((year) => (
                  <option key={year} value={year} className={darkMode ? "bg-gray-900" : "bg-white"}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "Line" && (
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
              )}
              {chartType === "Bar" && (
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
              )}
              {chartType === "Area" && (
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
              )}
              {chartType === "Scatter" && (
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
              )}
              {chartType === "Composed" && (
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
              )}
              {(chartType === "Candlestick" || chartType === "Pie" || chartType === "Radar") && (
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
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-8">
            <Button
              className="w-full py-4 text-lg shadow-blue-500/25"
              onClick={() =>
                onNavigate("prediction", {
                  historicalData,
                  timePeriod: selectedPeriod,
                  selectedMonth,
                  selectedYear,
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
