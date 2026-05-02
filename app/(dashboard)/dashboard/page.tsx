'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { FileText, MessageSquare, ThumbsUp, ThumbsDown, Activity, TrendingUp, Clock } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface Stats {
  totalDocs: number
  readyDocs: number
  totalQuestions: number
  questionLimit: number
  totalFeedback: number
  thumbsUp: number
  thumbsDown: number
  avgResponseTime: number
  recentQuestions: any[]
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createBrowserClient(supabaseUrl, supabaseKey)).current

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()
      if (!userData) return

      const companyId = userData.company_id

      // Fetch all stats in parallel
      const [docsRes, companyRes, feedbackRes, logsRes] = await Promise.all([
        supabase.from('documents').select('id, status').eq('company_id', companyId),
        supabase.from('companies').select('question_count, question_limit').eq('id', companyId).single(),
        supabase.from('feedback').select('id, rating').eq('company_id', companyId),
        supabase.from('logs').select('id, question, answer, response_time_ms, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
      ])

      const docs = docsRes.data || []
      const feedback = feedbackRes.data || []
      const logs = logsRes.data || []

      setStats({
        totalDocs: docs.length,
        readyDocs: docs.filter(d => d.status === 'ready').length,
        totalQuestions: companyRes.data?.question_count || 0,
        questionLimit: companyRes.data?.question_limit || 100,
        totalFeedback: feedback.length,
        thumbsUp: feedback.filter(f => f.rating === 'up').length,
        thumbsDown: feedback.filter(f => f.rating === 'down').length,
        avgResponseTime: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / logs.length) : 0,
        recentQuestions: logs,
      })
      setLoading(false)
    }
    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-zinc-200 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    )
  }

  const usagePercent = stats ? Math.round((stats.totalQuestions / stats.questionLimit) * 100) : 0

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of your AI chatbot platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500">Documents</span>
            <FileText className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats?.readyDocs}<span className="text-sm text-zinc-400 font-normal">/{stats?.totalDocs}</span></p>
          <p className="text-xs text-zinc-500 mt-1">Ready / Total uploaded</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500">Questions Used</span>
            <MessageSquare className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats?.totalQuestions}<span className="text-sm text-zinc-400 font-normal">/{stats?.questionLimit}</span></p>
          <div className="mt-2 w-full bg-zinc-100 rounded-full h-1.5">
            <div className="bg-zinc-900 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(usagePercent, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500">Feedback</span>
            <TrendingUp className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span className="text-xl font-bold text-zinc-900">{stats?.thumbsUp}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <span className="text-xl font-bold text-zinc-900">{stats?.thumbsDown}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1">{stats?.totalFeedback} total reviews</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500">Avg. Response</span>
            <Clock className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats?.avgResponseTime}<span className="text-sm text-zinc-400 font-normal">ms</span></p>
          <p className="text-xs text-zinc-500 mt-1">Average AI response time</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-200 flex items-center gap-2">
          <Activity className="w-5 h-5 text-zinc-500" />
          <h2 className="font-semibold text-zinc-900">Recent Questions</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {stats?.recentQuestions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No questions asked yet. Test your chatbot!</div>
          ) : (
            stats?.recentQuestions.map((log) => (
              <div key={log.id} className="p-4 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{log.question}</p>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{log.answer}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-zinc-400">{new Date(log.created_at).toLocaleString()}</span>
                    {log.response_time_ms && (
                      <p className="text-xs text-zinc-400 mt-0.5">{log.response_time_ms}ms</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
