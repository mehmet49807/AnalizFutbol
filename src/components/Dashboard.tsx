import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Users, Calendar, ArrowRight, Play, Activity, Trophy, Filter, Star, BellRing, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import MatchDetailModal from './MatchDetailModal';

const DEFAULT_LEAGUES = [
  { id: 'super-lig', name: 'Süper Lig' },
  { id: 'premier-league', name: 'Premier League' },
  { id: 'la-liga', name: 'La Liga' },
  { id: 'bundesliga', name: 'Bundesliga' },
];

interface LiveMatch {
  id: number;
  home: string;
  away: string;
  score: string;
  time: string;
  league: string;
  leagueId: string;
  isGoal?: boolean;
}

const upcomingMatches = [
  { id: 1, home: 'Bayern Münih', away: 'Leverkusen', date: 'Yarın, 21:00', league: 'Bundesliga', leagueId: 'bundesliga' },
  { id: 2, home: 'Man City', away: 'Arsenal', date: 'Paz, 18:30', league: 'Premier League', leagueId: 'premier-league' },
];

export default function Dashboard() {
  const { user, profile } = useFirebase();
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [lastGoalId, setLastGoalId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const favorites = profile?.favoriteLeagues || [];

  // Sort leagues: All first, then favorites, then others
  const sortedLeagues = [
    { id: 'all', name: 'Tüm Ligler' },
    ...[...DEFAULT_LEAGUES].sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    })
  ];

  useEffect(() => {
    // SSE for real-time updates
    const eventSource = new EventSource('/api/live-scores-sse');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveMatches(data);
        
        // Detect goals
        const goalMatch = data.find((m: any) => m.isGoal);
        if (goalMatch) {
          setLastGoalId(`${goalMatch.id}-${Date.now()}`);
          setTimeout(() => setLastGoalId(null), 5000);
        }
      } catch (err) {
        console.error("SSE parsing error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const toggleFavorite = async (id: string) => {
    if (!user) {
      alert("Lütfen ligleri favorilemek için giriş yapın.");
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      if (favorites.includes(id)) {
        await updateDoc(userRef, {
          favoriteLeagues: arrayRemove(id)
        });
      } else {
        await updateDoc(userRef, {
          favoriteLeagues: arrayUnion(id)
        });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  const filteredLive = liveMatches.filter(m => 
    selectedLeague === 'all' || m.leagueId === selectedLeague
  );

  const filteredUpcoming = upcomingMatches.filter(m => 
    selectedLeague === 'all' || m.leagueId === selectedLeague
  );

  return (
    <div className="space-y-8">
      {/* Real-time Notification Overlay */}
      <AnimatePresence>
        {lastGoalId && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3 border border-white/20"
          >
            <BellRing className="w-5 h-5 animate-bounce" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">CANLI GOOOL!</p>
              <p className="text-sm font-bold">Galatasaray 2 - 2 Fenerbahçe</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* League Filter */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {sortedLeagues.map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 flex items-center gap-2",
              selectedLeague === league.id 
                ? "bg-emerald-500 border-emerald-500 text-neutral-950" 
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            )}
          >
            {league.name}
            {league.id !== 'all' && (
              <Star 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(league.id); }}
                className={cn("w-3 h-3 transition-colors", favorites.includes(league.id) ? "fill-current text-yellow-400" : "text-neutral-600")} 
              />
            )}
          </button>
        ))}
      </div>
      {/* Hero Section */}
      <section className="relative h-64 lg:h-80 rounded-3xl overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000" 
          alt="Stadium" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 lg:p-12 w-full flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-emerald-500 text-neutral-950 text-[10px] font-bold rounded uppercase tracking-wide">Canlı</span>
              <span className="text-white/80 text-xs font-medium uppercase tracking-widest">Haftanın Maçı</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter text-white mb-2 underline decoration-emerald-500 decoration-4 underline-offset-4">DERBİ GÜNÜ</h1>
            <p className="text-white/60 text-sm max-w-md line-clamp-2">Süper Lig'de dev randevu! Galatasaray evinde Fenerbahçe'yi konuk ediyor. Takımların son durumları ve analizi için tıklayın.</p>
          </div>
          <button className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2 self-start lg:self-auto">
            Analizi Gör <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Aktif Maçlar', value: '12', icon: Activity, color: 'text-emerald-400' },
          { label: 'Bugünkü Goller', value: '34', icon: Play, color: 'text-blue-400' },
          { label: 'Lig Lideri', value: 'Galatasaray', icon: Trophy, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg bg-neutral-800", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-neutral-600" />
            </div>
            <p className="text-sm text-neutral-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Matches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 italic underline decoration-neutral-800 underline-offset-8">
              <Play className="w-5 h-5 text-emerald-500" /> Canlı Skorlar {selectedLeague !== 'all' && <span className="text-emerald-500 text-sm ml-2">({sortedLeagues.find(l => l.id === selectedLeague)?.name})</span>}
            </h2>
            <button className="text-xs text-emerald-500 font-bold hover:underline">Tümünü Gör</button>
          </div>
          <div className="grid gap-4">
            {filteredLive.length > 0 ? filteredLive.map((match) => (
              <motion.div 
                whileHover={{ x: 5 }}
                key={match.id} 
                onClick={() => setSelectedMatch(match)}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">{match.league}</span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-[8px] font-bold text-emerald-500 border border-emerald-500/20">
                      <Sparkles className="w-2 h-2" />
                      AI TAHMİNİ
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1 w-20">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-lg">
                        {match.home[0]}
                      </div>
                      <span className="text-xs font-bold text-center truncate w-full">{match.home}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black italic tracking-tighter bg-neutral-800 px-4 py-1 rounded-xl">{match.score}</span>
                      <span className="text-[10px] text-emerald-500 font-bold mt-2 animate-pulse">{match.time}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 w-20">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-lg">
                        {match.away[0]}
                      </div>
                      <span className="text-xs font-bold text-center truncate w-full">{match.away}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-700 group-hover:text-emerald-500 transition-colors ml-4" />
              </motion.div>
            )) : (
              <div className="py-20 text-center border border-dashed border-neutral-800 rounded-3xl">
                <p className="text-neutral-500 font-medium">Bu ligde aktif maç bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Upcoming */}
          <section>
            <h2 className="text-xl font-bold flex items-center gap-2 italic mb-6">
              <Calendar className="w-5 h-5 text-blue-500" /> Gelecek Maçlar
            </h2>
            <div className="space-y-4">
              {filteredUpcoming.length > 0 ? filteredUpcoming.map((match) => (
                <div 
                  key={match.id} 
                  onClick={() => setSelectedMatch(match)}
                  className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">{match.league}</span>
                      <div className="px-1 py-0.5 rounded bg-emerald-500/10 text-[7px] font-bold text-emerald-500 border border-emerald-500/10">AI</div>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400">{match.date}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span>{match.home}</span>
                    <span className="text-neutral-500 font-medium mx-2">vs</span>
                    <span>{match.away}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-neutral-600 text-center py-4 italic">Planlanmış maç yok.</p>
              )}
            </div>
          </section>

          {/* Top Players */}
          <section>
             <h2 className="text-xl font-bold flex items-center gap-2 italic mb-6">
              <Users className="w-5 h-5 text-yellow-500" /> Gol Krallığı
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Osimhen', team: 'Galatasaray', goals: 14 },
                { name: 'Immobile', team: 'Beşiktaş', goals: 12 },
                { name: 'Dzeko', team: 'Fenerbahçe', goals: 11 },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/30 border border-neutral-800/30">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-600 font-bold text-sm w-4">{i+1}</span>
                    <div>
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-[10px] text-neutral-500">{p.team}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 px-2 rounded">{p.goals}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      
      {/* Match Detail Modal */}
      <MatchDetailModal 
        match={selectedMatch} 
        onClose={() => setSelectedMatch(null)} 
      />
    </div>
  );
}

function ChevronRight(props: any) {
  return <ArrowRight {...props} />;
}
