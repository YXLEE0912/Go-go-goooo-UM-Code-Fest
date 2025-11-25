"use client"

import { LayoutDashboard, LineChart, Newspaper, Settings, LogOut } from "lucide-react"
import { motion } from "framer-motion"

interface SidebarProps {
  currentScreen: string
  onNavigate: (screen: string) => void
  darkMode: boolean
}

export const Sidebar = ({ currentScreen, onNavigate, darkMode }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "prediction", label: "Prediction", icon: LineChart },
    { id: "news", label: "News", icon: Newspaper },
  ]

  return (
    <div
      className={`fixed left-0 top-0 h-screen w-64 border-r transition-colors duration-300 z-40 flex flex-col
      ${darkMode ? "bg-gray-900 border-white/10" : "bg-white border-gray-200"}`}
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-lg rotate-6 shadow-lg shadow-blue-600/30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/40">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <span className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>GoSense</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2 py-4">
        {menuItems.map((item) => {
          const isActive = currentScreen === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${
                  isActive
                    ? darkMode
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                      : "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : darkMode
                    ? "text-gray-400 hover:bg-white/5 hover:text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-2">
        <button
          onClick={() => onNavigate("settings")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
            ${
              currentScreen === "settings"
                ? darkMode
                  ? "bg-white/10 text-white"
                  : "bg-gray-100 text-gray-900"
                : darkMode
                ? "text-gray-400 hover:bg-white/5 hover:text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }
          `}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  )
}
