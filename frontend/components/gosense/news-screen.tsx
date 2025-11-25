"use client"

import { NewsSection } from "./news-section"
import { motion } from "framer-motion"
import { translate, type Language } from "../../lib/gosense-translations"
import { NotificationPanel } from "./notification-panel"
import type { Notification } from "../../lib/gosense-types"

interface NewsScreenProps {
  darkMode: boolean
  language: Language
  notifications: Notification[]
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
  showNotifications: boolean
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>
}

export const NewsScreen = ({ 
  darkMode, 
  language,
  notifications,
  setNotifications,
  showNotifications,
  setShowNotifications
}: NewsScreenProps) => {
  const t = (key: string) => translate(language, key)

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      }`}
    >
      <div className="flex flex-col max-w-5xl mx-auto min-h-screen">
        <header
          className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white/80"
          } backdrop-blur-md`}
        >
          <div>
            <h1 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {t("marketNews")}
            </h1>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {t("marketNewsSubtitle")}
            </p>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <NewsSection darkMode={darkMode} language={language} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
