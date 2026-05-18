import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Newspaper, Clock, ExternalLink, RefreshCcw, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useFirebase } from '../lib/FirebaseProvider';

const LEAGUE_NAMES: Record<string, string> = {
  'super-lig': 'Süper Lig',
  'premier-league': 'Premier League',
  'la-liga': 'La Liga',
  'bundesliga': 'Bundesliga',
  'serie-a': 'Serie A',
  'ligue-1': 'Ligue 1',
  'champions-league': 'Şampiyonlar Ligi',
};

export default function News() {
  const [news, setNews] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useFirebase();

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const favorites = profile?.favoriteLeagues?.map(id => LEAGUE_NAMES[id] || id) || [];
      
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites })
      });
      const data = await response.json();
      setNews(data.text);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.favoriteLeagues]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 underline decoration-emerald-500 decoration-4 underline-offset-8">
            <Newspaper className="w-8 h-8 text-emerald-500" /> Futbol Manşetleri
          </h2>
          {profile?.favoriteLeagues && profile.favoriteLeagues.length > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Kişiselleştirilmiş</span>
            </div>
          )}
        </div>
        <button 
          onClick={fetchNews}
          disabled={isLoading}
          className="p-2 text-neutral-400 hover:text-emerald-500 transition-all rounded-xl hover:bg-neutral-900"
        >
          <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-neutral-600">Dünya Basını Taranıyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-3 space-y-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Son Dakika Özetleri</span>
              </div>
              <div className="markdown-body prose prose-invert prose-emerald max-w-none prose-p:text-neutral-300 prose-li:text-neutral-300">
                <ReactMarkdown>{news || ''}</ReactMarkdown>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Öne Çıkan Kaynaklar</p>
            {[
              { name: 'FIFA.com', url: 'https://fifa.com' },
              { name: 'beIN SPORTS Türkyie', url: 'https://beinsports.com.tr' },
              { name: 'Sky Sports', url: 'https://skysports.com' },
              { name: 'Transfermarkt', url: 'https://transfermarkt.com.tr' },
            ].map((source, i) => (
              <a 
                key={i}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 transition-all group"
              >
                <span className="text-sm font-bold">{source.name}</span>
                <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-emerald-500 transition-colors" />
              </a>
            ))}

            <div className="p-6 rounded-3xl bg-emerald-600 text-white relative overflow-hidden group mt-10">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Newspaper className="w-32 h-32" />
              </div>
              <p className="text-lg font-black italic leading-tight relative uppercase">Haber Bültenine Abone Ol</p>
              <p className="text-[10px] font-medium mt-2 relative opacity-80 uppercase tracking-wider">Hergün saat 09:00'da en önemli haberler cebinde.</p>
              <button className="mt-4 px-6 py-2 bg-white text-emerald-600 rounded-xl text-xs font-black relative">ABONE OL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
