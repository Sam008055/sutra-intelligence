'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, ThumbsUp, ThumbsDown, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  rating?: 'up' | 'down' | null
}

export function ChatWidget({ enableFeedback = true, apiEndpoint = '/api/chat', apiHeaders = {} }: { enableFeedback?: boolean, apiEndpoint?: string, apiHeaders?: any }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const question = input.trim()
    setInput('')
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    const asstMsgId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: asstMsgId, role: 'assistant', content: '' }])

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders },
        body: JSON.stringify({ question, sessionId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch response')
      }

      // Capture session ID if returned
      const newSessionId = response.headers.get('x-session-id')
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId)
      }

      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json()
        setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: data.answer || "No response" } : m))
        if (data.sessionId && !sessionId) setSessionId(data.sessionId)
      } else {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        if (reader) {
          let aiText = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            aiText += chunk
            setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: aiText } : m))
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: error.message } : m))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (msgId: string, question: string, answer: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, rating } : m))
    if (!enableFeedback) return
    
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders },
        body: JSON.stringify({ question, answer, rating })
      })
    } catch (e) {
      console.error('Feedback error', e)
    }
  }

  return (
    <div className="flex flex-col h-[650px] w-full glass-panel rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 p-5 flex items-center justify-between z-10">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" /> Sutra Intelligence
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Ask questions about your enterprise data.</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent z-10">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#00F0FF]/20 to-[#7000FF]/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              <Bot className="w-8 h-8 text-[#00F0FF]" />
            </div>
            <div>
              <p className="text-lg font-medium text-white">Sutra is ready.</p>
              <p className="text-sm text-zinc-400 mt-2 max-w-xs leading-relaxed">Ask any question. I will search across your uploaded knowledge graph.</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, i) => {
            const isUser = message.role === 'user'
            const prevMessage = messages[i - 1]
            
            return (
              <motion.div 
                key={message.id} 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 border
                    ${isUser ? 'bg-zinc-800 border-zinc-700 text-white ml-3' : 'bg-gradient-to-br from-[#00F0FF] to-[#7000FF] border-transparent text-white mr-3 shadow-[0_0_10px_rgba(112,0,255,0.4)]'}`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`p-4 rounded-2xl ${isUser ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm border border-zinc-700 shadow-sm' : 'bg-white/10 text-white border border-white/10 rounded-tl-sm backdrop-blur-md shadow-lg'}`}>
                      {message.content === '' && !isUser && isLoading ? (
                        <div className="flex items-center h-5 space-x-1.5">
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full" />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full" />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full" />
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-light">
                          {message.content.split(/(\[[^\]]+\.[a-zA-Z0-9]+\])/g).map((part, i) => {
                            if (part.match(/^\[([^\]]+\.[a-zA-Z0-9]+)\]$/)) {
                              return (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#7000FF]/20 text-[#00F0FF] mx-1 border border-[#7000FF]/30">
                                  {part.slice(1, -1)}
                                </span>
                              )
                            }
                            return <span key={i}>{part}</span>
                          })}
                        </div>
                      )}
                    </div>
                    
                    {!isUser && message.content && !message.content.includes('temporarily unavailable') && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-2 mt-2 ml-1">
                        <button 
                          onClick={() => handleFeedback(message.id, prevMessage?.content || '', message.content, 'up')}
                          className={`text-zinc-500 hover:text-green-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 ${message.rating === 'up' ? 'text-green-400 bg-green-400/10' : ''}`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleFeedback(message.id, prevMessage?.content || '', message.content, 'down')}
                          className={`text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 ${message.rating === 'down' ? 'text-red-400 bg-red-400/10' : ''}`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10 z-10">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Search your knowledge graph..."
            className="w-full pl-5 pr-14 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg bg-zinc-800 text-white disabled:bg-white/5 disabled:text-zinc-600 hover:bg-[#7000FF] hover:shadow-[0_0_15px_rgba(112,0,255,0.5)] transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  )
}
