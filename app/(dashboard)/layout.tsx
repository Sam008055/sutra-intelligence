import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileText, Settings, LogOut, MessageSquare, ThumbsDown, ScrollText } from 'lucide-react'
import { signout } from '../(auth)/actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, companies (name)')
    .eq('id', user.id)
    .single()

  // Extract company name if it exists (type-safe extraction since the join object shape can vary)
  const companyObj = userData?.companies as { name?: string } | undefined
  const companyName = companyObj?.name || 'Workspace'

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 overflow-hidden relative">
      {/* Subtle Dashboard Background Effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] aurora-blob-2 rounded-full blur-[100px] opacity-[0.15] mix-blend-screen pointer-events-none" />

      {/* Sidebar */}
      <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col shadow-2xl z-10 backdrop-blur-md">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00F0FF] to-[#7000FF] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(112,0,255,0.3)] mr-3">
            <span className="font-bold text-white text-sm">S</span>
          </div>
          <h2 className="font-semibold text-lg text-white truncate">{companyName}</h2>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all group">
            <LayoutDashboard className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-[#00F0FF] transition-colors" />
            Dashboard
          </Link>
          <Link href="/documents" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all group">
            <FileText className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-[#00F0FF] transition-colors" />
            Documents
          </Link>
          <Link href="/chatbot" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all group">
            <MessageSquare className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-[#00F0FF] transition-colors" />
            Test Chatbot
          </Link>
          <Link href="/feedback" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all group">
            <ThumbsDown className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-[#00F0FF] transition-colors" />
            Feedback
          </Link>
          <Link href="/logs" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all group">
            <ScrollText className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-[#00F0FF] transition-colors" />
            Query Logs
          </Link>
          <Link href="/settings" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all group">
            <Settings className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-[#00F0FF] transition-colors" />
            Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-zinc-500 capitalize mt-0.5">{userData?.role || 'Member'}</p>
            </div>
            <form action={signout}>
              <button type="submit" className="text-zinc-500 hover:text-red-400 cursor-pointer p-1.5 rounded-md transition-colors bg-white/5 hover:bg-white/10" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10 relative">
        <div className="max-w-7xl mx-auto w-full p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
