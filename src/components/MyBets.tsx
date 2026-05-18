import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../lib/FirebaseProvider';
import { Coins, Clock, CheckCircle2, XCircle, Trophy, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface Bet {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  predictedResult: 'home' | 'draw' | 'away';
  redCardPrediction?: 'yes' | 'no';
  cornerPrediction?: 'over' | 'under';
  amount: number;
  multiplier: number;
  status: 'pending' | 'correct' | 'wrong';
  createdAt: any;
}

export default function MyBets() {
  const { user } = useFirebase();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'predictions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const betsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bet[];
      setBets(betsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bets:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Trophy className="w-16 h-16 text-neutral-800 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Bahislerini Görmek İçin Giriş Yap</h2>
        <p className="text-neutral-500 text-sm max-w-xs">Giriş yaparak yaptığın tahminleri ve kazançlarını takip edebilirsin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-black italic tracking-tighter text-white">BAHİSLERİM</h1>
        <p className="text-neutral-500 font-medium">Tahminlerin ve kazanma durumun burada listelenir.</p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Activity className="w-10 h-10 text-emerald-500 animate-pulse" />
           <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Yükleniyor...</p>
        </div>
      ) : bets.length === 0 ? (
        <div className="p-12 rounded-3xl bg-neutral-900/50 border border-neutral-800 border-dashed text-center">
           <Coins className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
           <p className="text-neutral-400 font-bold italic underline decoration-neutral-800 underline-offset-8">Henüz hiç bahis yapmadın.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {bets.map((bet) => (
              <motion.div
                key={bet.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="group relative p-6 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{bet.league}</span>
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1",
                        bet.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                        bet.status === 'correct' ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {bet.status === 'pending' ? <Clock className="w-2.5 h-2.5" /> :
                         bet.status === 'correct' ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                         <XCircle className="w-2.5 h-2.5" />}
                        {bet.status === 'pending' ? 'Bekliyor' : bet.status === 'correct' ? 'Kazandı' : 'Kaybetti'}
                      </div>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-black text-white">{bet.amount}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex-1">
                      <div className="flex items-center gap-4 text-white font-black text-lg italic">
                         <span className={cn(bet.predictedResult === 'home' && "text-emerald-500 underline decoration-emerald-800 underline-offset-4")}>{bet.homeTeam}</span>
                         <span className="text-neutral-700 font-normal">vs</span>
                         <span className={cn(bet.predictedResult === 'away' && "text-emerald-500 underline decoration-emerald-800 underline-offset-4")}>{bet.awayTeam}</span>
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-neutral-500 uppercase flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div>Tahminin: <span className="text-emerald-500">{bet.predictedResult === 'home' ? 'Ev Sahibi' : bet.predictedResult === 'away' ? 'Deplasman' : 'Berabere'}</span></div>
                        {bet.redCardPrediction && (
                          <div className="flex items-center gap-1.5">
                            <span>Kırmızı Kart:</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-black",
                              bet.redCardPrediction === 'yes' ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"
                            )}>
                              {bet.redCardPrediction === 'yes' ? 'VAR' : 'YOK'}
                            </span>
                          </div>
                        )}
                        {bet.cornerPrediction && (
                          <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-4 ml-4">
                            <span>Korner:</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                              bet.cornerPrediction === 'over' ? "bg-blue-500/20 text-blue-400" : "bg-neutral-500/20 text-neutral-400"
                            )}>
                              {bet.cornerPrediction === 'over' ? 'ÜST 2.5' : 'ALT 2.5'}
                            </span>
                          </div>
                        )}
                      </div>
                   </div>
                   
                   <div className="text-right">
                      <div className="text-[10px] font-black text-neutral-600 uppercase tracking-tighter">Olası Kazanç</div>
                      <div className="text-xl font-black text-emerald-500">
                        {Math.floor(bet.amount * bet.multiplier)} <span className="text-xs uppercase">Jeton</span>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
