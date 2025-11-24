"use client"

import { Bell } from "lucide-react"
import { translate, type Language } from "../../lib/gosense-translations"
import type { Notification } from "../../lib/gosense-types"

interface NotificationPanelProps {
  notifications: Notification[]
  showNotifications: boolean
  setShowNotifications: (show: boolean) => void
  setNotifications: (fn: (prev: Notification[]) => Notification[]) => void
  unreadCount: number
  darkMode: boolean
  language: Language
}

export const NotificationPanel = ({
  notifications,
  showNotifications,
  setShowNotifications,
  setNotifications,
  unreadCount,
  darkMode,
  language,
}: NotificationPanelProps) => {
  const t = (key: string) => translate(language, key)

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <Bell className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-700"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{t("notifications")}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {t("markAllRead")}
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">{t("noNotifications")}</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? "bg-blue-500/10" : ""}`}
                  onClick={() =>
                    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${!notif.read ? "bg-blue-400" : "bg-gray-600"}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
