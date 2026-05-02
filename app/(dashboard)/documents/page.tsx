'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { FileText, Upload, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react'

// Supabase client instance safely created in-component
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accessLevel, setAccessLevel] = useState('company')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This will permanently remove the file and all its AI data.')) return
    
    setIsDeleting(id)
    setError(null)
    
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete document')
      }
      await fetchDocuments()
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsDeleting(null)
    }
  }

  // Use a stable reference to the client
  const supabase = useRef(createBrowserClient(supabaseUrl, supabaseKey)).current

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setDocuments(data)
  }

  useEffect(() => {
    fetchDocuments()
    
    // Polling every 2 seconds for processing docs
    const interval = setInterval(() => {
      setDocuments(docs => {
        if (docs.some(d => d.status === 'processing')) {
          fetchDocuments() // trigger actual refresh
        }
        return docs
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [supabase])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('access_level', accessLevel)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      })
      
      let data
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json()
      } else {
        const textError = await res.text()
        console.error("Non-JSON Server Error:", textError)
        setError(`Server error: ${res.status} ${res.statusText}. Please check the server terminal console.`)
        return
      }
      
      if (!res.ok) {
        setError(data.error || 'Upload failed')
      } else {
        await fetchDocuments()
      }
    } catch (err: any) {
      console.error(err)
      setError(`Network error: ${err.message}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Knowledge Graph</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage and sync your enterprise documents.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={accessLevel} 
            onChange={(e) => setAccessLevel(e.target.value)}
            disabled={isUploading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <option value="company" className="bg-[#050505]">Public to Company</option>
            <option value="private" className="bg-[#050505]">Private to Me</option>
          </select>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="hidden" 
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center rounded-lg bg-white text-black px-5 py-2.5 text-sm font-semibold shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all hover:scale-105 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {isUploading ? 'Syncing...' : 'Upload Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-100 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-xl overflow-hidden relative z-10">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-black/40 backdrop-blur-md">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">File Name</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Indexed At</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-transparent">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-zinc-500 text-sm">
                  Knowledge graph is empty. Upload documents to begin.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <FileText className="flex-shrink-0 h-5 w-5 text-zinc-500 mr-3 group-hover:text-[#00F0FF] transition-colors" />
                        <div className="text-sm font-medium text-zinc-200 max-w-xs truncate">{doc.name}</div>
                      </div>
                      <div className="mt-1.5 ml-8">
                        {doc.access_level === 'private' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#7000FF]/20 text-[#00F0FF] border border-[#7000FF]/30">
                            Private
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-zinc-400 border border-white/10">
                            Company
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      {doc.status === 'ready' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Indexed
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400 border border-blue-400/20">
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Parsing
                        </span>
                      )}
                      {doc.status === 'failed' && (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20 self-start">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Failed
                          </span>
                          {doc.failure_reason && (
                            <span className="text-xs text-red-400 mt-1.5 max-w-xs truncate" title={doc.failure_reason}>
                              {doc.failure_reason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-zinc-400">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={isDeleting === doc.id}
                      className="text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50 p-2 rounded-lg hover:bg-white/5"
                      title="Delete document"
                    >
                      {isDeleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
