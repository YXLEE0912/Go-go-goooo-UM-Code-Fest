"use client"

import { Card } from "../ui/card"
// Using native button to avoid UI changes
// import { Button } from "../ui/button"
import { ArrowUpRight, Bell, BellRing, X } from "lucide-react"
import { useState, useEffect } from "react"
import { playNotificationSound } from "../../lib/gosense-data"
import { auth } from "../../lib/api"

export const NewsSection = ({ darkMode }: { darkMode: boolean }) => {
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
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0)
  const [showNotification, setShowNotification] = useState<boolean>(false)
  const [currentAlert, setCurrentAlert] = useState<NewsItem | null>(null)
  const [notificationQueue, setNotificationQueue] = useState<NewsItem[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [loading, setLoading] = useState(true)

  // Function to show notification
  const showNewsNotification = (newsItem: NewsItem) => {
    // If there's already a notification showing, add to queue
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
    
    // Auto-hide notification after 10 seconds
    const timer = setTimeout(() => {
      setShowNotification(false)
      // Process next notification after hiding current one
      setTimeout(processNextNotification, 500)
    }, 10000)
    
    return () => clearTimeout(timer)
  }

  // Fetch news from backend
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        const data = await auth.getNews()
        
        // Map backend data to NewsItem format
        const formattedNews: NewsItem[] = data.map((item: any, index: number) => ({
          id: `news-${index}-${Date.now()}`,
          title: item.title,
          source: item.provider,
          time: 'Today', // Backend doesn't return time yet
          impact: item.impact || (index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low'),
          isNew: index < 2, // Mark first 2 as new
          link: item.link,
          sentiment: item.sentiment
        }))
        
        setNews(formattedNews)
        
        // Show notification for the first high impact news
        const highImpactNews = formattedNews.find(n => n.impact === 'high')
        if (highImpactNews) {
          setTimeout(() => showNewsNotification(highImpactNews), 1000)
        }
      } catch (error) {
        console.error("Failed to fetch news:", error)
        // Fallback to mock data if fetch fails
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
    
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const impactColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  }

  // Close notification
  const handleCloseNotification = () => {
    setShowNotification(false)
    // Process next notification in queue after a short delay
    setTimeout(() => {
      processNextNotification()
    }, 500)
  }
  
  const processNextNotification = () => {
    if (notificationQueue.length > 0 && !isProcessingQueue) {
      setIsProcessingQueue(true)
      const [nextNotification, ...remainingQueue] = notificationQueue
      setNotificationQueue(remainingQueue)
      showNewsNotification(nextNotification)
      
      // Allow time for the notification to be shown before processing the next one
      setTimeout(() => {
        setIsProcessingQueue(false)
      }, 1000)
    }
  }

  // Mark all news as read
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
                      ? 'Breaking News' 
                      : currentAlert.impact === 'medium' 
                        ? 'Update' 
                        : 'News'}
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
                onClick={handleCloseNotification}
                className={`p-1 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      <Card className={`p-6 ${darkMode ? 'bg-gradient-to-br from-white/10 to-white/5' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Market News & Alerts
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
            <span>Mark all as read</span>
          </button>
        </div>
      
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fetching latest news...</p>
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
                    <div className="flex items-center gap-1">
                      {item.isNew && (
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute h-2 w-2 rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${darkMode ? impactColors[item.impact].replace('text-', 'text-').replace('bg-', 'bg-opacity-20 ') : impactColors[item.impact]}`}>
                        {item.impact.charAt(0).toUpperCase() + item.impact.slice(1)} Impact
                      </span>
                      {item.sentiment && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.sentiment === 'positive' 
                            ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                            : item.sentiment === 'negative'
                            ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                            : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                        </span>
                      )}
                    </div>
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

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                Price Alerts
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Get notified about significant price movements
              </p>
            </div>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 py-2 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground">
              <Bell className="h-4 w-4 mr-2" />
              Set Alert
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default NewsSection
