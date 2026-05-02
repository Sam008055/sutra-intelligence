import { ChatWidget } from '@/components/ChatWidget'

export default function ChatbotPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Test Chatbot</h1>
        <p className="text-sm text-zinc-500 mt-1">Chat securely with your uploaded company documents to verify RAG.</p>
      </div>
      
      <div className="flex-1 flex items-start justify-center pb-8">
        <ChatWidget />
      </div>
    </div>
  )
}
