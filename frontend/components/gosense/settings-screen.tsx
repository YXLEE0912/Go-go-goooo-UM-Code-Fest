"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Card, Input } from "./ui-components"
import { translate, type Language } from "../../lib/gosense-translations"
import type { Currency } from "../../lib/gosense-currency"
import { auth } from "../../lib/api"
import { NotificationPanel } from "./notification-panel"
import type { Notification } from "../../lib/gosense-types"

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
  notifications: Notification[]
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
  showNotifications: boolean
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>
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
  notifications,
  setNotifications,
  showNotifications,
  setShowNotifications
}: SettingsScreenProps) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userName, setUserName] = useState("John Doe")
  const [userEmail, setUserEmail] = useState("john.doe@company.com")
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [riskAlerts, setRiskAlerts] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [newsAlerts, setNewsAlerts] = useState(true)
  const [dataPoints, setDataPoints] = useState("All")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFASecret, setTwoFASecret] = useState("")
  const [twoFAUrl, setTwoFAUrl] = useState("")
  const [twoFACode, setTwoFACode] = useState("")
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)

  useEffect(() => {
    loadSettings()
    loadUserProfile()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await auth.getUserSettings()
      setDarkMode(settings.darkMode)
      setLanguage(settings.language as Language)
      setCurrency(settings.currency as Currency)
      setChartType(settings.chartType)
      setDataPoints(settings.dataPoints)
      setPushNotifications(settings.pushNotifications)
      setEmailNotifications(settings.emailNotifications)
      setSoundEnabled(settings.soundEnabled)
      setAutoRefresh(settings.autoRefresh)
      setRiskAlerts(settings.riskAlerts)
      setPriceAlerts(settings.priceAlerts)
      setNewsAlerts(settings.newsAlerts)
      
      // Check if 2FA is enabled (you might need to add this to the settings response or user profile)
      // For now, we'll assume it's part of the user profile or settings
      // setIs2FAEnabled(settings.two_factor_enabled || false) 
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const user = await auth.getCurrentUser()
      setUserName(user.name || "User")
      setUserEmail(user.email)
      setIs2FAEnabled(user.two_factor_enabled || false)
    } catch (error) {
      console.error("Failed to load profile:", error)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match")
      return
    }
    try {
      await auth.updatePassword({ old_password: oldPassword, new_password: newPassword })
      alert("Password updated successfully")
      setShowPasswordModal(false)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      alert(error.message || "Failed to update password")
    }
  }

  const handleSetup2FA = async () => {
    try {
      const data = await auth.setup2FA()
      setTwoFASecret(data.secret)
      setTwoFAUrl(data.otpauth_url)
      setShow2FAModal(true)
    } catch (error: any) {
      alert(error.message || "Failed to setup 2FA")
    }
  }

  const handleEnable2FA = async () => {
    try {
      await auth.enable2FA({ code: twoFACode, secret: twoFASecret })
      alert("2FA enabled successfully")
      setIs2FAEnabled(true)
      setShow2FAModal(false)
      setTwoFACode("")
    } catch (error: any) {
      alert(error.message || "Failed to enable 2FA")
    }
  }

  const handleDisable2FA = async () => {
    if (confirm("Are you sure you want to disable 2FA?")) {
      try {
        await auth.disable2FA()
        alert("2FA disabled successfully")
        setIs2FAEnabled(false)
      } catch (error: any) {
        alert(error.message || "Failed to disable 2FA")
      }
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const settings = {
        darkMode,
        language,
        currency,
        chartType,
        dataPoints,
        pushNotifications,
        emailNotifications,
        soundEnabled,
        autoRefresh,
        riskAlerts,
        priceAlerts,
        newsAlerts,
      }
      await auth.updateUserSettings(settings)
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async () => {
    try {
      await auth.updateUserProfile({ name: userName, email: userEmail })
      setIsEditingProfile(false)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Failed to update profile:", error)
      alert("Failed to update profile")
    }
  }

  const t = (key: string) => translate(language, key)

  const SettingSection = ({ title, children }: any) => (
    <div className="mb-6">
      <h3
        className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"} uppercase tracking-wider mb-3 ml-1`}
      >
        {title}
      </h3>
      <Card className="divide-y divide-white/10 overflow-hidden">{children}</Card>
    </div>
  )

  const SettingRow = ({ icon: Icon, label, action, onClick }: any) => (
    <div
      className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{label}</span>
      </div>
      <div>{action}</div>
    </div>
  )

  const Toggle = ({ active, onChange }: any) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`w-11 h-6 rounded-full transition-colors relative ${active ? "bg-green-500" : "bg-white/20"}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${active ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  )

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"} p-6`}
    >
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("dashboard")}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
            </button>
            <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{t("settings")}</h1>
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
                    <Input
                      value={userName}
                      onChange={(e: any) => setUserName(e.target.value)}
                      placeholder="Name"
                      className="text-sm py-2"
                    />
                    <Input
                      value={userEmail}
                      onChange={(e: any) => setUserEmail(e.target.value)}
                      placeholder="Email"
                      className="text-sm py-2"
                    />
                  </div>
                ) : (
                  <>
                    <h4 className={`font-semibold ${darkMode ? "text-gray-900" : "text-gray-900"}`}>{userName}</h4>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{userEmail}</p>
                  </>
                )}
              </div>
              <button
                onClick={isEditingProfile ? saveProfile : () => setIsEditingProfile(true)}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded bg-blue-500/20 border border-blue-500/30"
              >
                {isEditingProfile ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        </SettingSection>

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

        <SettingSection title={t("chartPreferences")}>
          <SettingRow
            icon={BarChart3}
            label={t("defaultChartType")}
            action={
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className={`${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"} border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{ colorScheme: darkMode ? "dark" : "light" }}
              >
                <option value="Line" className={darkMode ? "bg-gray-800 text-gray-900" : "bg-white text-gray-900"}>
                  {t("lineChart")}
                </option>
                <option value="Bar" className={darkMode ? "bg-gray-800 text-gray-900" : "bg-white text-gray-900"}>
                  {t("barChart")}
                </option>
                <option value="Area" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  {t("areaChart")}
                </option>
                <option value="Candlestick" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  {t("candlestickChart")}
                </option>
                <option value="Composed" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  {t("composedChart")}
                </option>
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
                className={`${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"} border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{ colorScheme: darkMode ? "dark" : "light" }}
              >
                <option value="All" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  {t("showAll")}
                </option>
                <option value="Major" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  {t("majorOnly")}
                </option>
                <option value="Minimal" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  {t("minimal")}
                </option>
              </select>
            }
          />
        </SettingSection>

        <SettingSection title={t("display")}>
          <SettingRow
            icon={Globe}
            label={t("language")}
            action={
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className={`${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"} border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{ colorScheme: darkMode ? "dark" : "light" }}
              >
                <option value="English" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  English
                </option>
                <option value="Chinese" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  中文
                </option>
                <option value="Malay" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  Bahasa Melayu
                </option>
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
                className={`${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"} border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{ colorScheme: darkMode ? "dark" : "light" }}
              >
                <option value="USD" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  USD ($)
                </option>
                <option value="EUR" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  EUR (€)
                </option>
                <option value="GBP" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  GBP (£)
                </option>
                <option value="JPY" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  JPY (¥)
                </option>
                <option value="MYR" className={darkMode ? "bg-white text-gray-900" : "bg-white text-gray-900"}>
                  MYR (RM)
                </option>
              </select>
            }
          />
        </SettingSection>

        <SettingSection title={t("security")}>
          <SettingRow
            icon={Shield}
            label={t("changePassword")}
            action={<ChevronRight className="w-5 h-5 text-gray-400" />}
            onClick={() => setShowPasswordModal(true)}
          />
          <SettingRow
            icon={Shield}
            label={is2FAEnabled ? "Disable 2FA" : t("twoFactorAuth")}
            action={
              <div className="flex items-center gap-2">
                <span className={`text-xs ${is2FAEnabled ? "text-green-500" : "text-gray-400"}`}>
                  {is2FAEnabled ? "Enabled" : "Disabled"}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            }
            onClick={is2FAEnabled ? handleDisable2FA : handleSetup2FA}
          />
        </SettingSection>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 bg-gray-900 border-gray-800">
              <h3 className="text-lg font-bold text-white">Change Password</h3>
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={(e: any) => setOldPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e: any) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e: any) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* 2FA Modal */}
        {show2FAModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 bg-gray-900 border-gray-800">
              <h3 className="text-lg font-bold text-white">Setup Two-Factor Authentication</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg flex justify-center">
                  {/* In a real app, use a QR code library here. For now, we'll just show the secret */}
                  <div className="text-center">
                    <p className="text-black font-mono text-sm break-all mb-2">{twoFASecret}</p>
                    <p className="text-xs text-gray-500">Enter this secret in your authenticator app</p>
                  </div>
                </div>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={twoFACode}
                  onChange={(e: any) => setTwoFACode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnable2FA}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                >
                  Enable 2FA
                </button>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-4 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-md border border-blue-500/30 text-blue-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          <button
            onClick={onLogout}
            className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md border border-red-500/30 text-red-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            {t("logOut")}
          </button>
        </div>
      </div>
    </div>
  )
}
