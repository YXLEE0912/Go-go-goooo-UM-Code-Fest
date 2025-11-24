"use client"

import { useState } from "react"
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
  const [userName, setUserName] = useState("John Doe")
  const [userEmail, setUserEmail] = useState("john.doe@company.com")
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [riskAlerts, setRiskAlerts] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(false)
  const [newsAlerts, setNewsAlerts] = useState(true)
  const [dataPoints, setDataPoints] = useState("All")

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

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"} p-6`}
    >
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate("dashboard")}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
          </button>
          <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{t("settings")}</h1>
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
                    <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{userName}</h4>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{userEmail}</p>
                  </>
                )}
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
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
                <option value="Line" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("lineChart")}
                </option>
                <option value="Bar" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("barChart")}
                </option>
                <option value="Area" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("areaChart")}
                </option>
                <option value="Candlestick" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("candlestickChart")}
                </option>
                <option value="Scatter" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("scatterChart")}
                </option>
                <option value="Pie" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("pieChart")}
                </option>
                <option value="Radar" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("radarChart")}
                </option>
                <option value="Composed" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
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
                <option value="All" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("showAll")}
                </option>
                <option value="Major" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {t("majorOnly")}
                </option>
                <option value="Minimal" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
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
                <option value="English" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  English
                </option>
                <option value="Chinese" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  中文
                </option>
                <option value="Spanish" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  Español
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
                <option value="USD" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  USD ($)
                </option>
                <option value="EUR" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  EUR (€)
                </option>
                <option value="GBP" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  GBP (£)
                </option>
                <option value="JPY" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  JPY (¥)
                </option>
                <option value="MYR" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
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
            onClick={() => alert("Password change coming soon!")}
          />
          <SettingRow
            icon={Shield}
            label={t("twoFactorAuth")}
            action={<ChevronRight className="w-5 h-5 text-gray-400" />}
            onClick={() => alert("2FA setup coming soon!")}
          />
        </SettingSection>

        <div className="mt-8">
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
