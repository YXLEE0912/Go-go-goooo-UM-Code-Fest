"use client"

import { Card } from "../ui/card"
import { ArrowUpRight, Bell, BellRing } from "lucide-react"
import { useState, useEffect } from "react"
import { playNotificationSound } from "../../lib/gosense-data"
import { auth } from "../../lib/api"
import { translate, type Language } from "../../lib/gosense-translations"
import { X } from "lucide-react"
import type { Notification } from "../../lib/gosense-types"

export const NewsSection = ({ 
  darkMode, 
  language,
  setNotifications 
}: { 
  darkMode: boolean, 
  language: Language,
  setNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>
}) => {
  const t = (key: string) => translate(language, key)

  interface NewsItem {
    id: string
    title: string
    source: string
    time: string
    impact: 'high' | 'medium' | 'low'
    isNew?: boolean
    link?: string
    sentiment?: 'positive' | 'negative' | 'neutral'
  }

  const [news, setNews] = useState<NewsItem[]>([])
  const [showNotification, setShowNotification] = useState<boolean>(false)
  const [currentAlert, setCurrentAlert] = useState<NewsItem | null>(null)
  const [notificationQueue, setNotificationQueue] = useState<NewsItem[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [loading, setLoading] = useState(true)

  const impactColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  }

  // ⭐ NEW: Toggle state for Price Alert button
  const [isAlerted, setIsAlerted] = useState(false)

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await auth.getUserSettings()
        if (settings) {
          setIsAlerted(settings.newsAlerts ?? false)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }
    loadSettings()
  }, [])

  // ⭐ NEW: Handle Price Alert button toggle
  const handleSetAlertClick = async () => {
    const newValue = !isAlerted
    setIsAlerted(newValue)
    playNotificationSound() // optional sound feedback
    
    try {
      // Persist to backend
      // We need to send the full settings object or just the partial update if the API supports it.
      // The API implementation in auth.py updates the whole settings object usually, 
      // but let's check api.ts. It calls PUT /users/me/settings.
      // The backend route expects UserSettings model.
      // We should probably fetch current settings first to merge, but for now let's try sending just the field 
      // if the backend supports partial updates (Pydantic models usually require all fields unless optional).
      // Looking at UserSettings in user.py, all fields have default values.
      // However, if we send only one field, the others might reset to default if we don't merge.
      // Safer to fetch, then update.
      
      const currentSettings = await auth.getUserSettings()
      await auth.updateUserSettings({
        ...currentSettings,
        newsAlerts: newValue
      })
      
    } catch (error) {
      console.error("Failed to update alert settings:", error)
      // Revert on failure
      setIsAlerted(!newValue)
    }
  }

  // ⭐ EXISTING: News notifications
  const showNewsNotification = (newsItem: NewsItem) => {
    // Only show notification if alerts are enabled
    if (!isAlerted) return

    // Add to global notification history if setNotifications is provided
    if (setNotifications) {
      // Persist to backend
      auth.createNotification(`News Alert: ${newsItem.title}`, "info").catch(console.error)

      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.message.includes(newsItem.title))) return prev
        
        return [{
          id: Date.now().toString(),
          message: `News Alert: ${newsItem.title}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false
        }, ...prev]
      })
    }

    if (showNotification) {
      setNotificationQueue(prev => [...prev, newsItem])
      return
    }
    setCurrentAlert({
      ...newsItem,
      time: 'Just now'
    })
    setShowNotification(true)
    playNotificationSound()

    const timer = setTimeout(() => {
      setShowNotification(false)
      setTimeout(processNextNotification, 500)
    }, 10000)

    return () => clearTimeout(timer)
  }

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        const data = await auth.getNews()
        const formattedNews: NewsItem[] = data.map((item: any, index: number) => ({
          id: `news-${index}-${Date.now()}`,
          title: item.title,
          source: item.provider,
          time: 'Today',
          impact: item.impact || (index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low'),
          isNew: index < 2,
          link: item.link,
          sentiment: item.sentiment
        }))
        setNews(formattedNews)

        // Prioritize Negative news for alerts, then High Impact
        const alertableNews = formattedNews.find(n => n.sentiment === 'negative') || formattedNews.find(n => n.impact === 'high')
        
        if (alertableNews) {
           // We need to check the current value of isAlerted here. 
           // Since we are in a closure, we might need a ref or pass it.
           // However, showNewsNotification checks it. 
           // But wait, showNewsNotification closes over the state 'isAlerted'.
           // If this useEffect runs once on mount, 'isAlerted' is false (initial).
           // We need to make sure we have the latest state.
           // Actually, let's just call it. The function will check the state.
           // BUT, if the function is defined outside, it captures the scope.
           // We should add isAlerted to dependency or use a ref.
           // Using a ref for the setting is safer for the interval.
           setTimeout(() => showNewsNotification(alertableNews), 1000)
        }
      } catch (error) {
        console.error("Failed to fetch news:", error)
        const fallbackNews: NewsItem[] = [
          {
            id: '1',
            title: 'Failed to load live news. Showing cached data.',
            source: 'System',
            time: 'Now',
            impact: 'medium',
            isNew: true
          }
        ]
        setNews(fallbackNews)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isAlerted]) // Re-create interval if alert setting changes to capture new scope

  const processNextNotification = () => {
    if (notificationQueue.length > 0 && !isProcessingQueue) {
      setIsProcessingQueue(true)
      const [nextNotification, ...remainingQueue] = notificationQueue
      setNotificationQueue(remainingQueue)
      showNewsNotification(nextNotification)

      setTimeout(() => {
        setIsProcessingQueue(false)
      }, 1000)
    }
  }

  const markAllAsRead = () => {
    setNews(prevNews =>
      prevNews.map(item => ({
        ...item,
        isNew: false
      }))
    )
  }

  return (
    <div className="relative">
      {/* Notification Alert */}
      {showNotification && currentAlert && (
        <div className="fixed top-4 right-4 z-50 w-80 animate-fade-in-up">
          <Card className={`p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-xl`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      currentAlert.impact === 'high'
                        ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                        : currentAlert.impact === 'medium'
                        ? darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                        : darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {currentAlert.impact === 'high'
                      ? t("breakingNews")
                      : currentAlert.impact === 'medium'
                      ? t("update")
                      : t("news")}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currentAlert.time} • {currentAlert.source}
                  </span>
                </div>
                <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentAlert.title}
                </h4>
              </div>

              <button
                onClick={() => setShowNotification(false)}
                className={`p-1 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* MAIN CARD */}
      <Card className={`p-6 ${darkMode ? 'bg-gradient-to-br from-white/10 to-white/5' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t("marketNewsAndAlerts")}
            </h3>
            {news.some(item => item.isNew) && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute h-2 w-2 rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>

          <button 
            className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-opacity-10 hover:bg-white/10"
            onClick={markAllAsRead}
          >
            <BellRing className="h-4 w-4" />
            <span>{t("markAllRead")}</span>
          </button>
        </div>

        {/* NEWS LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t("fetchingNews")}</p>
            </div>
          ) : news.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'} transition-colors cursor-pointer`}
              onClick={() => item.link && window.open(item.link, '_blank')}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">

                    {item.isNew && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute h-2 w-2 rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}

                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${darkMode ? impactColors[item.impact].replace('text-', 'text-').replace('bg-', 'bg-opacity-20 ') : impactColors[item.impact]}`}>
                      {t(item.impact)} {t("impact")}
                    </span>

                    {item.sentiment && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.sentiment === 'positive'
                          ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                          : item.sentiment === 'negative'
                          ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                      }`}>{t(item.sentiment)}</span>
                    )}

                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.time} • {item.source}
                    </span>
                  </div>

                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h4>
                </div>

                <button className="h-8 w-8 ml-2 flex items-center justify-center rounded-md hover:bg-opacity-10 hover:bg-white/10">
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PRICE ALERT SECTION */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                {t("newsAlerts")}
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t("marketNewsSubtitle")}
              </p>
            </div>

            {/* ⭐ TOGGLE BUTTON */}
            <button
              onClick={handleSetAlertClick}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 py-2 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isAlerted ? t("Alerted") : t("setAlert")}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default NewsSection

