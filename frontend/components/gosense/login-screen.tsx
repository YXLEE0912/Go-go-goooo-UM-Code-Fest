"use client"

import { useState, useEffect } from "react"
import { LoginScreen } from "./login-screen"
import { DashboardScreen } from "./dashboard-screen"
import { PredictionScreen } from "./prediction-screen"
import { SettingsScreen } from "./settings-screen"
import type { Language } from "../../lib/gosense-translations"
import type { PredictionData } from "../../lib/gosense-types"
import type { Currency } from "../../lib/gosense-currency"

export default function GoSenseApp() {
  const [currentScreen, setCurrentScreen] = useState("login")
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState<Language>("English")
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null)
  const [chartType, setChartType] = useState("Line")
  const [currency, setCurrency] = useState<Currency>("USD")

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light"
  }, [darkMode])

  const handleNavigate = (screen: string, data?: any) => {
    if (screen === "prediction" && data) {
      setPredictionData(data)
    }
    setCurrentScreen(screen)
  }

  const handleLogout = () => {
    setCurrentScreen("login")
  }

  return (
    <>
      {currentScreen === "login" && <LoginScreen onLogin={() => setCurrentScreen("dashboard")} darkMode={darkMode} />}
      {currentScreen === "dashboard" && (
        <DashboardScreen
          onNavigate={handleNavigate}
          darkMode={darkMode}
          language={language}
          chartType={chartType}
          currency={currency}
        />
      )}
      {currentScreen === "prediction" && predictionData && (
        <PredictionScreen
          onNavigate={handleNavigate}
          predictionData={predictionData}
          darkMode={darkMode}
          language={language}
          chartType={chartType}
          currency={currency}
        />
      )}
      {currentScreen === "settings" && (
        <SettingsScreen
          onNavigate={handleNavigate}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
          chartType={chartType}
          setChartType={setChartType}
          currency={currency}
          setCurrency={setCurrency}
        />
      )}
    </>
  )
}
