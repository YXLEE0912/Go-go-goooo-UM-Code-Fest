"use client"

import React, { useState, ChangeEvent, FormEvent } from "react"
import { Card } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { auth } from "../../lib/api"

export const LoginScreen = ({ onLogin, darkMode }: { onLogin: () => void; darkMode: boolean }) => {
  type TabType = "login" | "signup"
  const [activeTab, setActiveTab] = useState<TabType>("login")
  const [username, setUsername] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (activeTab === "signup") {
        if (!username || !email || !password) {
          throw new Error("Please fill in all fields")
        }
        await auth.signup(email, password, username)
        // After signup, automatically login
        await auth.login(email, password)
        if (typeof window !== 'undefined') {
          localStorage.setItem('username', username);
        }
        onLogin()
      } else {
        if (!email || !password) {
          throw new Error("Please fill in all fields")
        }
        await auth.login(email, password)
        onLogin()
      }
    } catch (err: any) {
      console.error("Auth error:", err)
      setError(err.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"} flex items-center justify-center p-4`}
    >
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          {/* ...existing code... */}
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
              onClick={() => {
                setActiveTab(tab as "login" | "signup")
                setError("")
              }}
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
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}
          {activeTab === "signup" && (
            <div>
              <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
                Username
              </label>
              <Input 
                type="text"
                placeholder="Enter username" 
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          <div>
            <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
              Email
            </label>
            <Input 
              type="email"
              placeholder="name@company.com" 
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
              Password
            </label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Processing..." : (activeTab === "login" ? "Login" : "Create Account")}
          </Button>
        </form>
      </Card>
    </div>
  )
}
