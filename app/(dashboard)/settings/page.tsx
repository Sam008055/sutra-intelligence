'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { KeyRound, RefreshCw, Code, Loader2 } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [originUrl, setOriginUrl] = useState('')
  const supabase = useRef(createBrowserClient(supabaseUrl, supabaseKey)).current

  useEffect(() => {
    setOriginUrl(window.location.origin)
    
    // Fetch current key
    const fetchKey = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()
        if (userData?.company_id) {
          const { data: companyData } = await supabase.from('companies').select('embed_api_key').eq('id', userData.company_id).single()
          if (companyData) setApiKey(companyData.embed_api_key)
        }
      }
      setIsLoading(false)
    }
    fetchKey()
  }, [supabase])

  const regenerateKey = async () => {
    if (!confirm('Are you sure? This will break your existing embedded widgets until you update the scripts.')) return
    
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/regenerate-key', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.newKey)
      }
    } catch (err) {
      console.error(err)
    }
    setIsRegenerating(false)
  }

  const embedCode = `<script src="${originUrl}/widget.js" data-key="${apiKey}"></script>`

  return (
    <div className="max-w-4xl mx-auto w-full h-full flex flex-col relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your integration keys and widget layout.</p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-2 font-medium text-white mb-2">
            <Code className="w-5 h-5 text-[#00F0FF]" />
            Widget Embed Code
          </div>
          <p className="text-sm text-zinc-400 mb-6">Paste this script snippet just before the closing <code className="text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 rounded">&lt;/body&gt;</code> tag of your website.</p>
          
          {isLoading ? (
            <div className="h-24 bg-white/5 rounded-lg border border-white/10 animate-pulse"></div>
          ) : (
            <div className="relative group">
              <pre className="p-5 bg-black/40 border border-white/10 text-zinc-300 rounded-xl text-sm overflow-x-auto shadow-inner">
                <code>{embedCode}</code>
              </pre>
              <button 
                onClick={() => navigator.clipboard.writeText(embedCode)}
                className="absolute top-4 right-4 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs border border-white/20 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-md"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div className="p-8 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-medium text-white mb-1">
              <KeyRound className="w-4 h-4 text-[#7000FF]" />
              Embed API Key
            </div>
            <p className="text-sm text-zinc-500 font-mono select-none mt-1">
              {isLoading ? '...' : apiKey?.slice(0, 12) + '*'.repeat(20)}
            </p>
          </div>
          
          <button 
            onClick={regenerateKey}
            disabled={isLoading || isRegenerating}
            className="flex items-center justify-center whitespace-nowrap rounded-lg bg-red-500/10 border border-red-500/20 px-5 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/40 disabled:pointer-events-none disabled:opacity-50 shadow-sm"
          >
            {isRegenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Regenerate Key
          </button>
        </div>
      </div>
    </div>
  )
}
