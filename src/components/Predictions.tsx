import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Clock, 
  Coins, 
  Target, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Zap
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot,
  Timestamp,
  increment
} from 'firebase/firestore';
import { useFirebase } from '../lib/FirebaseProvider';
import { cn } from '../lib/utils';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  league: string;
  status: 'upcoming' | 'finished';
  result?: 'home' | 'draw' | 'away';
}

interface Prediction {
  id: string;
  matchId: string;
  predictedResult: 'home' | 'draw' | 'away';
  redCardPrediction?: 'yes' | 'no';
  cornerPrediction?: 'over' | 'under';
  status: 'pending' | 'correct' | 'wrong';
}

export default function Predictions() {
  const { user, profile } = useFirebase();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Mock matches for demo if DB is empty
  const mockMatches: Match[] = [
    { id: 'm1', homeTeam: 'Galatasaray', awayTeam: 'Fenerbahçe', startTime: new Date(Date.now() + 86400000).toISOString(), league: 'Süper Lig', status: 'upcoming' },
    { id: 'm2', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', startTime: new Date(Date.now() + 172800000).toISOString(), league: 'La Liga', status: 'upcoming' },
    { id: 'm3', homeTeam: 'Man City', awayTeam: 'Liverpool', startTime: new Date(Date.now() + 259200000).toISOString(), league: 'Premier League', status: 'upcoming' },
  ];

  useEffect(() => {
    // In a real app, match loading would be from Firestore
    // For demo, we use mock matches but sync predictions with Firestore
    setMatches(mockMatches);

    if (user) {
      const q = query(collection(db, 'predictions'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const preds: Record<string, Prediction> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data() as Prediction;
          preds[data.matchId] = { ...data, id: doc.id };
        });
        setPredictions(preds);
        setIsLoading(false);
      }, (err) => {
        console.error("Predictions fetch error:", err);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const [selectedRedCard, setSelectedRedCard] = useState<Record<string, 'yes' | 'no'>>({});
  const [selectedCorners, setSelectedCorners] = useState<Record<string, 'over' | 'under'>>({});

  const handlePredict = async (matchId: string, result: 'home' | 'draw' | 'away') => {
    if (!user || !profile) {
      alert("Lütfen önce giriş yapın.");
      return;
    }

    const redCard = selectedRedCard[matchId];
    const corners = selectedCorners[matchId];

    if (!redCard || !corners) {
      alert("Lütfen önce kırmızı kart ve korner tahminlerinizi seçin.");
      return;
    }

    if (profile.tokens < 10) {
      alert("Yeterli jetonun yok! Reklam izleyerek veya jeton alarak kazanabilirsin.");
      return;
    }

    setIsSubmitting(matchId);
    try {
      // 1. Create prediction
      await addDoc(collection(db, 'predictions'), {
        userId: user.uid,
        matchId,
        predictedResult: result,
        redCardPrediction: redCard,
        cornerPrediction: corners,
        status: 'pending',
        rewardClaimed: false,
        createdAt: new Date().toISOString()
      });

      // 2. Deduct tokens
      await updateDoc(doc(db, 'users', user.uid), {
        tokens: increment(-10)
      });

    } catch (error) {
      console.error("Prediction Error:", error);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleEarnTokens = async () => {
    if (!user) return;
    // Simulate watching an ad
    const btn = document.getElementById('ad-btn');
    if (btn) btn.innerText = "İzleniyor...";
    
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          tokens: increment(50)
        });
        if (btn) btn.innerText = "50 Jeton Kazan";
        alert("Tebrikler! 50 Jeton kazandın.");
      } catch (error) {
        console.error(error);
      }
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 underline decoration-emerald-500 decoration-4 underline-offset-8">
            <Target className="w-8 h-8 text-emerald-500" /> Tahmin Merkezi
          </h2>
          <p className="text-neutral-500 text-sm mt-4 font-medium uppercase tracking-widest">Doğru tahminler yap, jeton ve puan kazan!</p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Jetonların</p>
              <p className="text-xl font-black text-emerald-400">{profile?.tokens || 0}</p>
            </div>
          </div>
          <motion.button 
            id="ad-btn"
            onClick={handleEarnTokens}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white px-6 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/20 hover:scale-105 transition-all"
          >
            <Zap className="w-4 h-4 fill-white" /> Jeton Kazan
          </motion.button>
        </div>
      </header>

      {/* Rules Info */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
        <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-300">Tahmin Kuralları</p>
          <p className="text-xs text-blue-400/80 leading-relaxed">Her tahmin 10 jeton maliyetindedir. Doğru tahmin sonucu 50 jeton ve 100 puan kazandırır. Maç sonuçları AI Analisti tarafından doğrulanır.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.map((match) => {
          const prediction = predictions[match.id];
          const hasPredicted = !!prediction;

          return (
            <motion.div 
              layout
              key={match.id}
              className={cn(
                "p-6 rounded-3xl bg-neutral-900 border transition-all duration-300",
                hasPredicted ? "border-emerald-500/30" : "border-neutral-800"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-neutral-500 tracking-widest uppercase">{match.league}</span>
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">{new Date(match.startTime).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col items-center gap-3 w-24">
                  <div className="w-14 h-14 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-xl shadow-inner">
                    {match.homeTeam[0]}
                  </div>
                  <span className="text-xs font-bold text-center leading-tight">{match.homeTeam}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-black italic tracking-tighter text-neutral-600">VS</span>
                  <div className="w-px h-8 bg-neutral-800" />
                </div>
                <div className="flex flex-col items-center gap-3 w-24">
                  <div className="w-14 h-14 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-xl shadow-inner">
                    {match.awayTeam[0]}
                  </div>
                  <span className="text-xs font-bold text-center leading-tight">{match.awayTeam}</span>
                </div>
              </div>

              {hasPredicted ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase">Tahmininiz</p>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-black text-emerald-400 uppercase">
                          {prediction.predictedResult === 'home' ? 'EV SAHİBİ' : prediction.predictedResult === 'away' ? 'DEPLASMAN' : 'BERABERE'}
                        </p>
                        {prediction.redCardPrediction && (
                          <p className="text-[10px] font-black italic">
                            KIRMIZI KART: <span className={cn(prediction.redCardPrediction === 'yes' ? "text-red-500" : "text-emerald-500")}>
                              {prediction.redCardPrediction === 'yes' ? 'VAR' : 'YOK'}
                            </span>
                          </p>
                        )}
                        {prediction.cornerPrediction && (
                          <p className="text-[10px] font-black italic">
                            KORNER (2.5): <span className={cn(prediction.cornerPrediction === 'over' ? "text-blue-500" : "text-neutral-500")}>
                              {prediction.cornerPrediction === 'over' ? 'ÜST' : 'ALT'}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Durum</p>
                    <p className="text-xs font-bold text-amber-500 italic">BEKLENİYOR</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">1. Kırmızı Kart Tahmini</p>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRedCard(prev => ({ ...prev, [match.id]: 'yes' }))}
                        className={cn(
                          "p-3 rounded-2xl border text-xs font-black transition-all",
                          selectedRedCard[match.id] === 'yes' 
                            ? "bg-red-500/20 border-red-500 text-red-500" 
                            : "bg-neutral-800/50 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        K. KART VAR
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRedCard(prev => ({ ...prev, [match.id]: 'no' }))}
                        className={cn(
                          "p-3 rounded-2xl border text-xs font-black transition-all",
                          selectedRedCard[match.id] === 'no' 
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" 
                            : "bg-neutral-800/50 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        K. KART YOK
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">2. Korner Tahmini (2.5)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCorners(prev => ({ ...prev, [match.id]: 'over' }))}
                        className={cn(
                          "p-3 rounded-2xl border text-xs font-black transition-all",
                          selectedCorners[match.id] === 'over' 
                            ? "bg-blue-500/20 border-blue-500 text-blue-500" 
                            : "bg-neutral-800/50 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        ÜST 2.5
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCorners(prev => ({ ...prev, [match.id]: 'under' }))}
                        className={cn(
                          "p-3 rounded-2xl border text-xs font-black transition-all",
                          selectedCorners[match.id] === 'under' 
                            ? "bg-neutral-500/10 border-neutral-700 text-neutral-400" 
                            : "bg-neutral-800/50 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        ALT 2.5
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">3. Maç Sonucu Tahmini</p>
                    <div className="grid grid-cols-3 gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isSubmitting !== null}
                        onClick={() => handlePredict(match.id, 'home')}
                        className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-neutral-800 border border-neutral-700 hover:border-emerald-500 group transition-all"
                      >
                        <span className="text-[10px] font-black text-neutral-500 group-hover:text-white">1</span>
                        <span className="text-xs font-bold">EV</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isSubmitting !== null}
                        onClick={() => handlePredict(match.id, 'draw')}
                        className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-neutral-800 border border-neutral-700 hover:border-emerald-500 group transition-all"
                      >
                        <span className="text-[10px] font-black text-neutral-500 group-hover:text-white">X</span>
                        <span className="text-xs font-bold">BERABERE</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isSubmitting !== null}
                        onClick={() => handlePredict(match.id, 'away')}
                        className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-neutral-800 border border-neutral-700 hover:border-emerald-500 group transition-all"
                      >
                        <span className="text-[10px] font-black text-neutral-500 group-hover:text-white">2</span>
                        <span className="text-xs font-bold">DEP</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
              
              {isSubmitting === match.id && (
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">İşleniyor...</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
          <h3 className="text-xl font-bold italic underline decoration-neutral-800 underline-offset-8">Küresel Sıralama</h3>
        </div>
        <div className="space-y-4">
          {[
            { rank: 1, name: 'AnalizKralı', points: 4500, avatar: '1' },
            { rank: 2, name: 'GolMakinesi', points: 4200, avatar: '2' },
            { rank: 3, name: 'TaktikDehası', points: 3800, avatar: '3' },
          ].map((leader) => (
            <div key={leader.rank} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/50 border border-neutral-800 group hover:border-neutral-600 transition-all">
              <div className="flex items-center gap-4">
                <span className="text-lg font-black italic text-neutral-600 group-hover:text-emerald-500 w-6">{leader.rank}</span>
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`} 
                  alt={leader.name} 
                  className="w-10 h-10 rounded-full border border-neutral-700" 
                />
                <span className="font-bold text-sm">{leader.name}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-neutral-500 uppercase">Puan</p>
                <p className="font-black text-emerald-400">{leader.points}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
