"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Send, Activity } from "lucide-react"
import { Card, Input } from "./ui-components"
import type { Message } from "../../lib/gosense-types"

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

  const handleSendMessage = () => {
    if (!input.trim()) return

    const userMessage = { type: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])

    setTimeout(() => {
      let aiResponse = ""
      const lowerInput = input.toLowerCase()

      if (lowerInput.includes("rising") || lowerInput.includes("why")) {
        aiResponse =
          "NVIDIA stock is rising due to:\n\n• Strong AI chip demand from major tech companies\n• Data center revenue growth exceeding 40% YoY\n• Positive market sentiment around AI infrastructure\n• Technical indicators showing bullish momentum"
      } else if (lowerInput.includes("risk")) {
        aiResponse =
          "Key risks to consider:\n\n• Market volatility in tech sector\n• Competition from AMD and Intel\n• Regulatory concerns around AI development\n• High valuation metrics (P/E ratio)"
      } else {
        aiResponse =
          "I can provide detailed analysis on:\n\n• Price predictions and trends\n• Market sentiment analysis\n• Risk factors and opportunities\n• Technical and fundamental analysis\n\nWhat specific aspect would you like to explore?"
      }

      setMessages((prev) => [...prev, { type: "ai", content: aiResponse }])
    }, 800)

    setInput("")
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
            <Card className="flex-1 flex flex-col overflow-hidden">
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
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e: any) => setInput(e.target.value)}
                    onKeyPress={(e: any) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 text-sm py-2"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
