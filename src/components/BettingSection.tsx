import { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, Trophy, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFirebase } from '../lib/FirebaseProvider';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface BettingSectionProps {
  match: {
    id: number | string;
    home: string;
    away: string;
    league: string;
  };
}

const AMOUNTS = [10, 20, 50, 100, 250];

export default function BettingSection({ match }: BettingSectionProps) {
  const { user, profile } = useFirebase();
  const [selectedResult, setSelectedResult] = useState<'home' | 'draw' | 'away' | null>(null);
  const [redCardPrediction, setRedCardPrediction] = useState<'yes' | 'no' | null>(null);
  const [cornerPrediction, setCornerPrediction] = useState<'over' | 'under' | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceBet = async () => {
    if (!user || !profile) {
      setError('Bahis yapmak için giriş yapmalısınız.');
      return;
    }

    if (!selectedResult || !redCardPrediction || !cornerPrediction) {
      setError('Lütfen tüm tahminleri seçin (Maç Sonucu, Kırmızı Kart ve Korner).');
      return;
    }

    if (profile.tokens < betAmount) {
      setError('Yetersiz jeton.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create Prediction/Bet record
      await addDoc(collection(db, 'predictions'), {
        userId: user.uid,
        matchId: String(match.id),
        homeTeam: match.home,
        awayTeam: match.away,
        league: match.league,
        predictedResult: selectedResult,
        redCardPrediction: redCardPrediction,
        cornerPrediction: cornerPrediction,
        amount: betAmount,
        multiplier: 5.5, // Result + Red Card + Corners
        status: 'pending',
        rewardClaimed: false,
        createdAt: serverTimestamp(),
      });

      // 2. Deduct tokens from user profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tokens: increment(-betAmount)
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("Betting error:", err);
      setError('İşlem sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center"
      >
        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <h4 className="text-emerald-500 font-bold mb-1">Bahis Başarıyla Alındı!</h4>
        <p className="text-xs text-neutral-400">Şansın bol olsun, maç sonuçlandığında jetonların eklenecektir.</p>
      </motion.div>
    );
  }

  return (
    <div className="mt-8 border-t border-neutral-800 pt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Coins className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-white italic">Hemen Bahis Yap</h3>
      </div>

      <p className="text-xs text-neutral-500 mb-6">Maç sonucunu tahmin et, doğru bilirsen jetonlarını ikiye katla!</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { id: 'home', label: match.home, multiplier: '2.10' },
          { id: 'draw', label: 'Berabere', multiplier: '3.40' },
          { id: 'away', label: match.away, multiplier: '2.80' },
        ].map((opt) => (
          <motion.button
            key={opt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedResult(opt.id as any)}
            className={cn(
              "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
              selectedResult === opt.id 
                ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-500"
            )}
          >
            <span className="text-[10px] font-black uppercase truncate w-full text-center">{opt.label}</span>
            <span className="text-xs font-black">{opt.multiplier}</span>
          </motion.button>
        ))}
      </div>

      {/* Red Card Prediction Section */}
      <p className="text-xs text-neutral-500 mb-3 mt-4">Kırmızı Kart Tahmini</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { id: 'yes', label: 'VAR', color: 'bg-red-500' },
          { id: 'no', label: 'YOK', color: 'bg-emerald-500' },
        ].map((opt) => (
          <motion.button
            key={opt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRedCardPrediction(opt.id as any)}
            className={cn(
              "p-3 rounded-2xl border transition-all flex items-center justify-between px-6",
              redCardPrediction === opt.id 
                ? `${opt.color} border-white/20 text-white shadow-lg` 
                : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-500"
            )}
          >
            <span className="text-[10px] font-black tracking-widest uppercase">Kırmızı Kart</span>
            <span className="text-sm font-black italic">{opt.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Corners Prediction Section */}
      <p className="text-xs text-neutral-500 mb-3 mt-4">Toplam Korner (2.5)</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { id: 'over', label: 'ÜST 2.5', color: 'bg-blue-500' },
          { id: 'under', label: 'ALT 2.5', color: 'bg-neutral-700' },
        ].map((opt) => (
          <motion.button
            key={opt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCornerPrediction(opt.id as any)}
            className={cn(
              "p-3 rounded-2xl border transition-all flex items-center justify-between px-6",
              cornerPrediction === opt.id 
                ? `${opt.color} border-white/20 text-white shadow-lg` 
                : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-500"
            )}
          >
            <span className="text-[10px] font-black tracking-widest uppercase">KORNER</span>
            <span className="text-sm font-black italic">{opt.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <span className="text-xs font-bold text-neutral-400">Bahis Miktarı</span>
           <span className="text-xs font-bold text-emerald-500">{betAmount} Jeton</span>
        </div>
        
        <div className="flex gap-2">
          {AMOUNTS.map((amt) => (
            <motion.button
              key={amt}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBetAmount(amt)}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border",
                betAmount === amt 
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                  : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"
              )}
            >
              {amt}
            </motion.button>
          ))}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-red-500 text-[10px] bg-red-500/5 p-2 rounded-lg border border-red-500/10"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </motion.div>
        )}

        <motion.button
          whileHover={!loading && selectedResult ? { scale: 1.02 } : {}}
          whileTap={!loading && selectedResult ? { scale: 0.95 } : {}}
          onClick={handlePlaceBet}
          disabled={loading || !selectedResult}
          className={cn(
            "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2",
            loading || !selectedResult
              ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95"
          )}
        >
          {loading ? 'İşleniyor...' : (
            <>
              <Trophy className="w-4 h-4" />
              Bahsi Onayla
            </>
          )}
        </motion.button>

        <div className="flex items-center justify-center gap-2 opacity-50">
           <Info className="w-3 h-3 text-neutral-400" />
           <span className="text-[9px] text-neutral-500 font-bold uppercase">Maç sonuçlandığında kazançlar otomatik eklenecektir.</span>
        </div>
      </div>
    </div>
  );
}
