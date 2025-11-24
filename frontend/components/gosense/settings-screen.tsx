"use client"

import { ChangeEvent, useState } from "react"
import {
  ChevronLeft,
  Bell,
  Mail,
  Volume2,
  Sun,
  Moon,
  Globe,
  DollarSign,
  RefreshCw,
  Shield,
  AlertTriangle,
  TrendingDown,
  Newspaper,
  BarChart3,
  Activity,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react"
import { Card, Input } from "./ui-components"
import { translate, type Language } from "../../lib/gosense-translations"
import type { Currency } from "../../lib/gosense-currency"

interface SettingsScreenProps {
  onNavigate: (screen: string) => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  onLogout: () => void
  language: Language
  setLanguage: (lang: Language) => void
  chartType: string
  setChartType: (type: string) => void
  currency: Currency
  setCurrency: (currency: Currency) => void
}

interface ToggleProps {
  active: boolean
  onChange: () => void
}

interface SettingRowProps {
  icon: typeof Bell
  label: string
  action: React.ReactNode
  onClick?: () => void
}

interface SettingSectionProps {
  title: string
  children: React.ReactNode
}

export const SettingsScreen = ({
  onNavigate,
  darkMode,
  setDarkMode,
  onLogout,
  language,
  setLanguage,
  chartType,
  setChartType,
  currency,
  setCurrency,
}: SettingsScreenProps) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("username") || "User"
    }
    return "User"
  })
  const [userEmail, setUserEmail] = useState("john.doe@company.com")

  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [riskAlerts, setRiskAlerts] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(false)
  const [newsAlerts, setNewsAlerts] = useState(true)
  const [dataPoints, setDataPoints] = useState("All")
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  const t = (key: string) => translate(language, key)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    e.persist() // Keep the event for better performance
    setter(e.target.value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitPasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      return
    }

    console.log("Password change requested", {
      currentPassword: "***",
      newPassword: "***",
    })

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setPasswordSuccess("Password changed successfully!")

    setTimeout(() => {
      setPasswordSuccess("")
      setShowChangePassword(false)
    }, 3000)
  }

  const SettingSection = ({ title, children }: SettingSectionProps) => (
    <div className="mb-6">
      <h3
        className={`text-xs font-semibold ${
          !darkMode ? "text-gray-600" : "text-gray-400"
        } uppercase tracking-wider mb-3 ml-1`}
      >
        {title}
      </h3>
      <Card
        className={`divide-y ${
          darkMode ? "divide-white/10" : "divide-gray-200"
        } overflow-hidden`}
      >
        {children}
      </Card>
    </div>
  )

  const SettingRow = ({ icon: Icon, label, action, onClick }: SettingRowProps) => (
    <div
      className={`flex items-center justify-between p-4 ${
        darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
      } transition-colors cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-8 h-8 rounded-full ${
            darkMode ? "bg-white/10" : "bg-gray-100"
          } flex items-center justify-center ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span
          className={`text-sm font-medium ${
            !darkMode ? "text-gray-800" : "text-gray-200"
          }`}
        >
          {label}
        </span>
      </div>
      <div>{action}</div>
    </div>
  )

  const Toggle = ({ active, onChange }: ToggleProps) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`w-11 h-6 rounded-full transition-colors relative ${
        active ? "bg-green-500" : "bg-white/20"
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
          active ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  )

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      } p-6`}
    >
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate("dashboard")}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft
              className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            />
          </button>
          <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {t("settings")}
          </h1>
        </header>

        {/* Account Section */}
        <SettingSection title={t("account")}>
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/50">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex-1">
                {isEditingProfile ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, setUserName)}
                      placeholder="Name"
                      className={`w-full text-sm py-2 px-3 rounded-md border ${
                        darkMode 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, setUserEmail)}
                      placeholder="Email"
                      className={`w-full text-sm py-2 px-3 rounded-md border ${
                        darkMode 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                ) : (
                  <>
                    <h4 className={`font-semibold ${!darkMode ? "text-gray-900" : "text-white"}`}>
                      {userName}
                    </h4>
                    <p className={`text-xs ${!darkMode ? "text-gray-600" : "text-gray-400"}`}>
                      {userEmail}
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1.5 rounded bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-200/50 dark:hover:bg-blue-500/30 transition-colors"
              >
                {isEditingProfile ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        </SettingSection>

        {/* Preferences Section */}
        <SettingSection title={t("preferences")}>
          <SettingRow
            icon={Bell}
            label={t("pushNotifications")}
            action={<Toggle active={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />}
          />
          <SettingRow
            icon={Mail}
            label={t("emailNotifications")}
            action={<Toggle active={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />}
          />
          <SettingRow
            icon={Volume2}
            label={t("soundEffects")}
            action={<Toggle active={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} />}
          />
          <SettingRow
            icon={darkMode ? Moon : Sun}
            label={t("darkMode")}
            action={<Toggle active={darkMode} onChange={() => setDarkMode(!darkMode)} />}
          />
          <SettingRow
            icon={RefreshCw}
            label={t("autoRefreshData")}
            action={<Toggle active={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />}
          />
        </SettingSection>

        {/* Alerts Section */}
        <SettingSection title={t("alerts")}>
          <SettingRow
            icon={AlertTriangle}
            label={t("riskAlerts")}
            action={<Toggle active={riskAlerts} onChange={() => setRiskAlerts(!riskAlerts)} />}
          />
          <SettingRow
            icon={TrendingDown}
            label={t("priceDropAlerts")}
            action={<Toggle active={priceAlerts} onChange={() => setPriceAlerts(!priceAlerts)} />}
          />
          <SettingRow
            icon={Newspaper}
            label={t("newsAlerts")}
            action={<Toggle active={newsAlerts} onChange={() => setNewsAlerts(!newsAlerts)} />}
          />
        </SettingSection>

        {/* Chart Preferences Section */}
        <SettingSection title={t("chartPreferences")}>
          <SettingRow
            icon={BarChart3}
            label={t("defaultChartType")}
            action={
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className={`${!darkMode ? "bg-gray-100 text-gray-900" : "bg-white/10 text-white"} border ${
                  darkMode ? "border-white/20" : "border-gray-300"
                } rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{ colorScheme: darkMode ? "dark" : "light" }}
              >
                <option value="Line">{t("lineChart")}</option>
                <option value="Bar">{t("barChart")}</option>
                <option value="Area">{t("areaChart")}</option>
                <option value="Candlestick">{t("candlestickChart")}</option>
                <option value="Scatter">{t("scatterChart")}</option>
                <option value="Pie">{t("pieChart")}</option>
                <option value="Radar">{t("radarChart")}</option>
                <option value="Composed">{t("composedChart")}</option>
              </select>
            }
          />
          <SettingRow
            icon={Activity}
            label={t("dataPointsDisplay")}
            action={
              <select
                value={dataPoints}
                onChange={(e) => setDataPoints(e.target.value)}
                className={`${!darkMode ? "bg-gray-100 text-gray-900" : "bg-white/10 text-white"} border ${
                  darkMode ? "border-white/20" : "border-gray-300"
                } rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{ colorScheme: darkMode ? "dark" : "light" }}
              >
                <option value="All">{t("showAll")}</option>
                <option value="Major">{t("majorOnly")}</option>
                <option value="Minimal">{t("minimal")}</option>
              </select>
            }
          />
        </SettingSection>

        {/* Display Section */}
        <SettingSection title={t("display")}>
          <SettingRow
            icon={Globe}
            label={t("language")}
            action={
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className={`${!darkMode ? "bg-gray-100 text-gray-900" : "bg-white/10 text-white"} border ${
                  darkMode ? "border-white/20" : "border-gray-300"
                } rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="English">English</option>
                <option value="Chinese">中文</option>
                <option value="Malay">Malay</option>
              </select>
            }
          />
          <SettingRow
            icon={DollarSign}
            label={t("currency")}
            action={
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className={`${!darkMode ? "bg-gray-100 text-gray-900" : "bg-white/10 text-white"} border ${
                  darkMode ? "border-white/20" : "border-gray-300"
                } rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="MYR">MYR (RM)</option>
              </select>
            }
          />
        </SettingSection>

        {/* Security Section */}
        <SettingSection title={t("security")}>
          {showChangePassword ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {t("changePassword")}
                </h4>
                <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passwordError && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg">{passwordError}</div>
              )}

              {passwordSuccess && (
                <div className="p-3 text-sm text-green-500 bg-green-500/10 rounded-lg">{passwordSuccess}</div>
              )}

              <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
                <div>
                  <label className={`block text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
                    Current Password
                  </label>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                    className={`w-full ${!darkMode ? "text-gray-900" : "text-white"}`}
                    style={{ color: !darkMode ? "#111827" : "#ffffff" }}
                  />
                </div>
                <div>
                  <label className={`block text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
                    New Password
                  </label>
                  <Input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    className={`w-full ${!darkMode ? "text-gray-900" : "text-white"}`}
                    style={{ color: !darkMode ? "#111827" : "#ffffff" }}
                  />
                </div>
                <div>
                  <label className={`block text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className={`w-full ${!darkMode ? "text-gray-900" : "text-white"}`}
                    style={{ color: !darkMode ? "#111827" : "#ffffff" }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    {t("save")}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <SettingRow
              icon={Shield}
              label={t("changePassword")}
              action={<ChevronRight className="w-4 h-4" />}
              onClick={() => setShowChangePassword(true)}
            />
          )}
        </SettingSection>

        {/* Logout */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </button>
        </div>
      </div>
    </div>
  )
}
