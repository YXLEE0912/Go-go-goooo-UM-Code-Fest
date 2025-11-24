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
import { NewsSection } from "./news-section"
import { generateForecastData } from "../../lib/gosense-data"
interface EnhancedPredictionData {
  day: string
  historical: number | null
  forecast: number | null
  changePercent: number
  displayPrice: number
  isHistorical: boolean
}

import type { PredictionData } from "../../lib/gosense-types"
import { translate, type Language } from "../../lib/gosense-translations"
import { formatPrice, type Currency } from "../../lib/gosense-currency"

interface PredictionScreenProps {
  onNavigate: (screen: string) => void
  predictionData: PredictionData
  darkMode: boolean
  language: Language
  chartType: string
  currency: Currency
}

export const PredictionScreen = ({
  onNavigate,
  predictionData,
  darkMode,
  language,
  chartType,
  currency,
}: PredictionScreenProps) => {
  const forecastData = predictionData?.historicalData
    ? generateForecastData(predictionData.historicalData, predictionData.timePeriod)
    : []

  // Safely get the last historical and forecast prices with fallbacks
  const lastHistoricalPrice = forecastData.find((d) => d.historical !== null)?.historical ?? 158.45
  const lastForecastPrice = forecastData[forecastData.length - 1]?.forecast ?? 170.25
  const predictedChange = lastForecastPrice - lastHistoricalPrice
  const predictedPercent = ((predictedChange / lastHistoricalPrice) * 100).toFixed(2)

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

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"}`}
    >
      <div className="h-screen flex flex-col max-w-5xl mx-auto">
        <header
          className={`flex items-center gap-4 px-6 py-4 border-b ${darkMode ? "border-white/10" : "border-gray-200"} backdrop-blur-md`}
        >
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
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>{t("lastClose")}</p>
                  <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {formatPrice(lastHistoricalPrice, currency)}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {t("priceForecastComparison")}
                </h3>
                <span
                  className={`text-xs font-medium ${darkMode ? "text-gray-400 bg-white/10" : "text-gray-600 bg-gray-100"} backdrop-blur-sm px-2 py-1 rounded border ${darkMode ? "border-white/10" : "border-gray-200"}`}
                >
                  {t("historicalVsForecast")}
                </span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "Line" && (
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
                  )}
                  {chartType === "Bar" && (
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
                  )}
                  {chartType === "Area" && (
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
                  )}
                  {chartType === "Scatter" && (
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
                  )}
                  {chartType === "Composed" && (
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
                  )}
                  {(chartType === "Candlestick" || chartType === "Pie" || chartType === "Radar") && (
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
                  )}
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* News Section */}
            <NewsSection darkMode={darkMode} />
            
            {/* Price Change Table */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {predictionData.timePeriod === 'week' ? 'Daily' : 'Monthly'} Price Changes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium text-right">Price</th>
                        <th className="pb-2 font-medium text-right">Change</th>
                        <th className="pb-2 font-medium text-right">% Change</th>
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
                                {!isHistorical && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    Forecast
                                  </span>
                                )}
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
          </div>
          </motion.div>
        </div>

        <ChatModal />
      </div>
    </div>
  )
}
