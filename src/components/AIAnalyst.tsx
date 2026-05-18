import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Info, Sparkles, Brain, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAnalyst() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Merhaba! Ben GOL AI Analist. Takım taktikleri, oyuncu performansları veya yaklaşan maçlar hakkında ne merak ediyorsun?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await response.json();
      
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.text || 'Üzgünüm, şu an analiz yapamıyorum.' 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: 'Bir hata oluştu. Lütfen tekrar deneyin.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
      <header className="mb-6">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 underline decoration-emerald-500 decoration-4 underline-offset-8">
          <Brain className="w-8 h-8 text-emerald-500" /> AI Teknik Analist
        </h2>
        <p className="text-neutral-500 text-sm mt-4 font-medium">Gemini 3 tarafından desteklenen derinlemesine futbol analizi.</p>
      </header>

      <div className="flex-1 flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />
        
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex items-start gap-4 transition-all max-w-[85%]",
                  m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                  m.role === 'assistant' 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                    : "bg-neutral-800 border-neutral-700 text-neutral-400"
                )}>
                  {m.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-5 rounded-2xl text-sm leading-relaxed",
                  m.role === 'assistant' 
                    ? "bg-neutral-800/80 text-neutral-200 border border-neutral-700/50 backdrop-blur-sm" 
                    : "bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-900/20"
                )}>
                   <div className="markdown-body">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex items-center gap-3 text-neutral-500 p-4 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Stratejiler Geliştiriliyor...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 bg-neutral-900 border-t border-neutral-800">
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Örn: Galatasaray bu akşam nasıl bir dizilişle çıkmalı?"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder:text-neutral-600"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-4 flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-neutral-600">
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Taktik Analizi</span>
            <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Oyuncu İstatistikleri</span>
            <span className="flex items-center gap-1"><Search className="w-3 h-3" /> Maç Tahminleri</span>
          </div>
        </div>
      </div>
    </div>
  );
}
