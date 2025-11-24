"use client"

import { useState } from "react"
import { Card, Input, Button } from "./ui-components"

export const LoginScreen = ({ onLogin, darkMode }: { onLogin: () => void; darkMode: boolean }) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"} flex items-center justify-center p-4`}
    >
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-2xl rotate-6 shadow-lg shadow-blue-600/20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/60">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <h1
            className={`text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent mb-1`}
          >
            GoSense
          </h1>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>
            Predictive insights for enterprise operations
          </p>
        </div>

        <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-xl mb-6 border border-white/10">
          {["login", "signup"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "login" | "signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? "bg-white/10 text-white shadow-sm"
                  : `${darkMode ? "text-gray-400" : "text-gray-600"} hover:text-gray-300`
              }`}
            >
              {tab === "signup" ? "Sign Up" : tab}
            </button>
          ))}
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onLogin()
          }}
        >
          <div>
            <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
              Email
            </label>
            <Input placeholder="name@company.com" defaultValue="zengyihan@gmail.com" />
          </div>
          <div>
            <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
              Password
            </label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full mt-2" onClick={onLogin}>
            {activeTab === "login" ? "Login" : "Create Account"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
