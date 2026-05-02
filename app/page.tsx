"use client"
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Hexagon, Zap, Shield, Sparkles, Server, Network } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 overflow-hidden relative">
      {/* Animated Background Aurora */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] aurora-blob-1 rounded-full blur-[100px] opacity-40 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] aurora-blob-2 rounded-full blur-[120px] opacity-40 mix-blend-screen pointer-events-none" />

      {/* Nav */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 glass-panel"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00F0FF] to-[#7000FF] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(112,0,255,0.4)]">
              <Hexagon className="w-5 h-5 text-white fill-white/20" />
            </div>
            <span className="font-bold text-xl tracking-tight">Sutra</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Get Access
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full text-xs font-medium text-zinc-300 mb-8 border border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" /> Enterprise AI Intelligence
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1] mb-8"
          >
            Connect the threads of your <br/>
            <span className="text-gradient">dark data.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Sutra transforms isolated enterprise documents into an interconnected, lightning-fast knowledge graph. Upload your data, embed the widget, and instantly answer any question.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup" className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] w-full sm:w-auto">
              Deploy Your Instance →
            </Link>
            <Link href="/login" className="px-8 py-4 glass-panel text-white font-medium rounded-xl hover:bg-white/10 transition-colors w-full sm:w-auto">
              View Documentation
            </Link>
          </motion.div>
        </div>

        {/* 3D Floating Elements Simulation */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ perspective: '1000px' }}>
          <motion.div 
             animate={{ y: [0, -20, 0], rotateX: [20, 25, 20], rotateY: [-10, -5, -10] }}
             transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-[20%] left-[10%] w-64 h-80 glass-panel rounded-2xl border border-white/10 opacity-30 transform-gpu"
          />
          <motion.div 
             animate={{ y: [0, 30, 0], rotateX: [10, 15, 10], rotateY: [15, 20, 15] }}
             transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-[30%] right-[10%] w-72 h-96 glass-panel rounded-2xl border border-white/10 opacity-20 transform-gpu"
          />
        </div>
      </section>

      {/* Grid Features */}
      <section className="py-32 px-6 relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Built for scale. <br/><span className="text-zinc-600">Designed for speed.</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Server, title: "Zero-Trust Architecture", desc: "Hardened row-level security. Your enterprise data never crosses tenant boundaries." },
              { icon: Zap, title: "LlamaParse Engine", desc: "Extract perfectly formatted markdown from complex scanned PDFs and tables instantly." },
              { icon: Network, title: "HNSW Vector Search", desc: "Sub-millisecond retrieval across millions of chunks using pgvector." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                whileHover={{ y: -5 }}
                className="glass-panel p-8 rounded-2xl group cursor-default"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#7000FF]/20 transition-colors border border-white/5">
                  <f.icon className="w-6 h-6 text-zinc-400 group-hover:text-[#00F0FF] transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-zinc-200">{f.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-zinc-600">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Hexagon className="w-4 h-4" />
            <span className="font-semibold text-zinc-400">Sutra AI</span>
          </div>
          <span>Enterprise RAG Systems © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
