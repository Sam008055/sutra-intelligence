'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'up' | 'down'>('all')
  const supabase = useRef(createBrowserClient(supabaseUrl, supabaseKey)).current

  useEffect(() => {
    const fetchFeedback = async () => {
      const { data } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setFeedback(data)
      setLoading(false)
    }
    fetchFeedback()
  }, [supabase])

  const filtered = filter === 'all' ? feedback : feedback.filter(f => f.rating === filter)
  const upCount = feedback.filter(f => f.rating === 'up').length
  const downCount = feedback.filter(f => f.rating === 'down').length

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Feedback</h1>
          <p className="text-sm text-zinc-500 mt-1">Review user ratings on chatbot answers.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            All ({feedback.length})
          </button>
          <button
            onClick={() => setFilter('up')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${filter === 'up' ? 'bg-green-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> {upCount}
          </button>
          <button
            onClick={() => setFilter('down')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${filter === 'down' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            <ThumbsDown className="w-3.5 h-3.5" /> {downCount}
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-sm animate-pulse">Loading feedback...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No feedback yet. Users can rate answers in the chatbot.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((item) => (
              <div key={item.id} className="p-5 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {item.rating === 'up' ? (
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                        <ThumbsDown className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{item.question}</p>
                    <p className="text-sm text-zinc-500 mt-1.5 line-clamp-3">{item.answer}</p>
                    <p className="text-xs text-zinc-400 mt-2">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
