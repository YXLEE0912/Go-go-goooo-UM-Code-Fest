"use client"

import { useState } from "react"
import { Card, Input, Button } from "./ui-components"
import { auth } from "../../lib/api"

export const LoginScreen = ({ onLogin, darkMode }: { onLogin: () => void; darkMode: boolean }) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState<"request" | "confirm">("request")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (showRecovery) {
        if (recoveryStep === "request") {
          await auth.request2FARecovery(email)
          setRecoveryStep("confirm")
          setError("Recovery code sent to your email.")
        } else {
          await auth.confirm2FARecovery(email, recoveryCode)
          setShowRecovery(false)
          setShowTwoFactorInput(false)
          setRecoveryStep("request")
          setRecoveryCode("")
          setError("2FA disabled. Please login with your password.")
          // Reset to login state
          setActiveTab("login")
        }
      } else if (activeTab === "signup") {
        // Sign up
        await auth.signup(email, password)
        // After signup, automatically login
        await auth.login(email, password)
        onLogin()
      } else {
        // Login
        await auth.login(email, password, twoFactorCode)
        onLogin()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      if (errorMessage.includes("Two-factor authentication code required")) {
        setShowTwoFactorInput(true)
      } else {
        setError(errorMessage)
      }
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
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {!showTwoFactorInput && !showRecovery ? (
            <>
              <div>
                <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          ) : showRecovery ? (
            <>
              <div className="mb-4">
                <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {recoveryStep === "request" ? "Recover Account" : "Enter Recovery Code"}
                </h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {recoveryStep === "request" 
                    ? "Enter your email address to receive a recovery code." 
                    : `Enter the 6-digit code sent to ${email}.`}
                </p>
              </div>
              
              {recoveryStep === "request" ? (
                <div>
                  <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
                    Recovery Code
                  </label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={recoveryCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecoveryCode(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setShowRecovery(false)
                  setRecoveryStep("request")
                  setError("")
                }}
                className={`text-xs mt-2 ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
              >
                Back to Login
              </button>
            </>
          ) : (
            <div>
              <label className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1 ml-1`}>
                Two-Factor Authentication Code
              </label>
              <Input
                type="text"
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFactorCode(e.target.value)}
                required
                autoFocus
                maxLength={6}
              />
              <div className="flex justify-between items-center mt-2">
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  Enter the 6-digit code from your authenticator app.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery(true)
                    setError("")
                  }}
                  className={`text-xs ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                >
                  Lost authenticator?
                </button>
              </div>
            </div>
          )}

          <Button className="w-full mt-2" disabled={loading}>
            {loading ? "Loading..." : (
              showRecovery 
                ? (recoveryStep === "request" ? "Send Recovery Code" : "Disable 2FA")
                : (showTwoFactorInput ? "Verify" : (activeTab === "login" ? "Login" : "Create Account"))
            )}
          </Button>
        </form>
      </Card>
    </div>
  )
}
