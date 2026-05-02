'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ScrollText, Clock, Search } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = useRef(createBrowserClient(supabaseUrl, supabaseKey)).current

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setLogs(data)
      setLoading(false)
    }
    fetchLogs()
  }, [supabase])

  const filtered = search
    ? logs.filter(l => l.question.toLowerCase().includes(search.toLowerCase()) || l.answer.toLowerCase().includes(search.toLowerCase()))
    : logs

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Query Logs</h1>
          <p className="text-sm text-zinc-500 mt-1">Full history of questions asked to your chatbot.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions or answers..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-sm animate-pulse">Loading logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">{search ? 'No logs match your search.' : 'No queries logged yet.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((log) => (
              <div key={log.id} className="p-5 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{log.question}</p>
                    <p className="text-sm text-zinc-500 mt-1.5 line-clamp-2">{log.answer}</p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-xs text-zinc-400">{new Date(log.created_at).toLocaleString()}</p>
                    {log.response_time_ms && (
                      <div className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="w-3 h-3" />
                        {log.response_time_ms}ms
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500">
            Showing {filtered.length} of {logs.length} logs (last 100)
          </div>
        )}
      </div>
    </div>
  )
}
