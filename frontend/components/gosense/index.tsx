"use client"

import { useState, useEffect } from "react"
import { LoginScreen } from "./login-screen"
import { DashboardScreen } from "./dashboard-screen"
import { PredictionScreen } from "./prediction-screen"
import { SettingsScreen } from "./settings-screen"
import { NewsScreen } from "./news-screen"
import { Sidebar } from "./sidebar"
import { ChatModal } from "./chat-modal"
import type { Language } from "../../lib/gosense-translations"
import type { PredictionData, Notification } from "../../lib/gosense-types"
import type { Currency } from "../../lib/gosense-currency"

export default function GoSenseApp() {
  const [currentScreen, setCurrentScreen] = useState("login")
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState<Language>("English")
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null)
  const [chartType, setChartType] = useState("Line")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light"
  }, [darkMode])

  const handleNavigate = (screen: string, data?: any) => {
    if (screen === "prediction") {
      if (data) {
        setPredictionData(data)
      } else if (!predictionData) {
        // Set default prediction data if navigating from sidebar
        setPredictionData({
          historicalData: [],
          timePeriod: "Week",
          selectedMonth: "January",
          selectedYear: "2024"
        })
      }
    }
    setCurrentScreen(screen)
  }

  const handleLogout = () => {
    setCurrentScreen("login")
  }

  return (
    <>
      {currentScreen === "login" ? (
        <LoginScreen onLogin={() => setCurrentScreen("dashboard")} darkMode={darkMode} />
      ) : (
        <div className="flex min-h-screen">
          <Sidebar currentScreen={currentScreen} onNavigate={handleNavigate} darkMode={darkMode} />
          <main className={`flex-1 ml-64 transition-all duration-300 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            {currentScreen === "dashboard" && (
              <DashboardScreen
                onNavigate={handleNavigate}
                darkMode={darkMode}
                language={language}
                chartType={chartType}
                currency={currency}
                notifications={notifications}
                setNotifications={setNotifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
              />
            )}
            {currentScreen === "prediction" && (
              <PredictionScreen
                onNavigate={handleNavigate}
                predictionData={predictionData || {
                  historicalData: [],
                  timePeriod: "Week",
                  selectedMonth: "January",
                  selectedYear: "2024"
                }}
                darkMode={darkMode}
                language={language}
                chartType={chartType}
                currency={currency}
                notifications={notifications}
                setNotifications={setNotifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
              />
            )}
            {currentScreen === "news" && (
              <NewsScreen 
                darkMode={darkMode} 
                language={language}
                notifications={notifications}
                setNotifications={setNotifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
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
                notifications={notifications}
                setNotifications={setNotifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
              />
            )}
          </main>
          <ChatModal />
        </div>
      )}
    </>
  )
}

