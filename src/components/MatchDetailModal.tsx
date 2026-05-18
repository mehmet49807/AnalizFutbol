import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Sparkles, Trophy, Users, Activity, Info, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import BettingSection from './BettingSection';

interface Match {
  id: number;
  home: string;
  away: string;
  league: string;
  score?: string;
  time?: string;
  date?: string;
}

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
}

export default function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!match) {
      setAnalysis('');
      setError('');
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const url = `/api/match-details/${match.id}?home=${encodeURIComponent(match.home)}&away=${encodeURIComponent(match.away)}&league=${encodeURIComponent(match.league)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAnalysis(data.analysis);
      } catch (err: any) {
        setError(err.message || 'Analiz yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [match]);

  return (
    <AnimatePresence>
      {match && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight">{match.home} vs {match.away}</h3>
                  <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">{match.league}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                   <div className="relative">
                      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                      <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-emerald-400 animate-pulse" />
                   </div>
                   <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                     Yapay Zeka Analiz Yapıyor...
                   </p>
                </div>
              ) : error ? (
                <div className="py-10 text-center">
                  <Info className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 font-medium">{error}</p>
                  <button 
                    onClick={() => onClose()}
                    className="mt-4 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Kapat
                  </button>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none prose-emerald">
                  {/* Visual Red Card Alert */}
                  {analysis.toUpperCase().includes('KIRMIZI KART: 🤖 AI TAHMİNİ: VAR') && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4"
                    >
                       <div className="w-10 h-14 bg-red-600 rounded flex items-center justify-center shadow-lg shadow-red-900/40 rotate-12 shrink-0">
                          <span className="text-[10px] font-black text-white/40 uppercase vertical-text">RED CARD</span>
                       </div>
                       <div>
                          <p className="text-red-500 font-black text-sm uppercase tracking-tighter">AI KIRMIZI KART BEKLİYOR!</p>
                          <p className="text-[10px] text-red-500/80 font-bold">Maçın sert geçeceği ve en az bir kırmızı kart çıkacağı tahmin ediliyor.</p>
                       </div>
                    </motion.div>
                  )}

                  {/* Visual Corners Alert */}
                  {analysis.toUpperCase().includes('KORNER: 🤖 AI TAHMİNİ: ÜST') && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4"
                    >
                       <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 -rotate-6 shrink-0">
                          <Zap className="w-6 h-6 text-white" />
                       </div>
                       <div>
                          <p className="text-blue-500 font-black text-sm uppercase tracking-tighter">KORNER ŞÖLENİ BEKLENİYOR!</p>
                          <p className="text-[10px] text-blue-500/80 font-bold">İki takımın da hücum hattı oldukça hareketli. 2.5 Korner üstü bekleniyor.</p>
                       </div>
                    </motion.div>
                  )}

                  <div className="markdown-body">
                    <ReactMarkdown 
                      components={{
                        p: ({ children }) => {
                          const text = children?.toString() || '';
                          if (text.includes('🤖 AI TAHMİNİ:')) {
                            const isRedCardPositive = text.toLowerCase().includes('kırmızı kart') && text.toUpperCase().includes('VAR');
                            return (
                              <div className={cn(
                                "my-4 p-4 rounded-2xl border italic font-bold",
                                isRedCardPositive 
                                  ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              )}>
                                {children}
                              </div>
                            );
                          }
                          return <p>{children}</p>;
                        }
                      }}
                    >
                      {analysis}
                    </ReactMarkdown>
                  </div>

                  {/* Betting Section */}
                  {!loading && !error && analysis && (
                    <BettingSection match={match} />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-neutral-950/50 border-t border-neutral-800 flex items-center justify-center gap-6">
               <div className="flex items-center gap-2 text-neutral-500">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Kadro Analizi</span>
               </div>
               <div className="flex items-center gap-2 text-neutral-500">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Canlı İstatistik</span>
               </div>
               <div className="flex items-center gap-2 text-neutral-500">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Uzman Tahmini</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
