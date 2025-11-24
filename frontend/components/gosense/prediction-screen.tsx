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
import { ChevronLeft, ArrowUpRight } from "lucide-react"
import { Card } from "./ui-components"
import { ChatModal } from "./chat-modal"
import { generateForecastData } from "../../lib/gosense-data"
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

  const lastHistoricalPrice = forecastData.find((d) => d.historical !== null)?.historical || 158.45
  const lastForecastPrice = forecastData[forecastData.length - 1]?.forecast || 170.25
  const predictedChange = lastForecastPrice - lastHistoricalPrice
  const predictedPercent = ((predictedChange / lastHistoricalPrice) * 100).toFixed(2)

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

            <Card className="p-6">
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
          </motion.div>
        </div>

        <ChatModal />
      </div>
    </div>
  )
}
