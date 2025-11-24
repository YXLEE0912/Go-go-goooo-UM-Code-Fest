"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Send, Activity } from "lucide-react"
import { Card, Input } from "./ui-components"
import type { Message } from "../../lib/gosense-types"
import { auth } from "../../lib/api"

export const ChatModal = () => {
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "ai",
      content: `Hello! I'm your AI-powered stock analysis assistant for NVIDIA. I can help you understand:

• Reasons for price movements (news & sentiment)
• Risk alerts and warnings
• Optimization strategies
• Market trends and forecasts

What would you like to know?`,
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = { type: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Convert messages to history format for API
      const history = messages.map(m => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content
      }))

      const response = await auth.chat(userMessage.content, history)
      
      setMessages((prev) => [...prev, { 
        type: "ai", 
        content: response.response,
        sources: response.sources 
      }])
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [...prev, { 
        type: "ai", 
        content: "Sorry, I encountered an error processing your request. Please try again." 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-600/50 flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-24 right-6 w-96 max-h-[500px] flex flex-col z-50"
          >
            <Card className="flex-1 flex flex-col overflow-hidden h-[500px]">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.type === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Activity className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white/10 backdrop-blur-md text-gray-200 border border-white/10 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs font-semibold mb-2 opacity-70">Sources:</p>
                          <div className="space-y-2">
                            {msg.sources.map((source, i) => (
                              <a 
                                key={i}
                                href={source.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs bg-white/5 hover:bg-white/10 p-2 rounded transition-colors"
                              >
                                <div className="font-medium truncate">{source.title}</div>
                                <div className="text-[10px] opacity-60 mt-0.5">{source.provider}</div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-md text-gray-200 border border-white/10 rounded-2xl rounded-bl-none p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e: any) => setInput(e.target.value)}
                    onKeyPress={(e: any) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 text-sm py-2"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading}
                    className={`p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
