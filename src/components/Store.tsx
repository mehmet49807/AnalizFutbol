import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Coins, PlayCircle, CreditCard, Zap, Crown, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc, increment, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../lib/FirebaseProvider';
import { useNotification } from './Notification';
import { cn } from '../lib/utils';

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

export default function Store() {
  const { user, profile } = useFirebase();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [adReward, setAdReward] = useState(25);
  const [packages, setPackages] = useState<TokenPackage[]>([
    { id: 'pkt_1', name: 'Bronz Paket', tokens: 100, price: 19.99 },
    { id: 'pkt_2', name: 'Gümüş Paket', tokens: 500, price: 79.99, popular: true, bonus: 50 },
    { id: 'pkt_3', name: 'Altın Paket', tokens: 1200, price: 149.99, bonus: 200 },
    { id: 'pkt_4', name: 'Elmas Paket', tokens: 3000, price: 299.99, bonus: 500 },
  ]);

  useEffect(() => {
    const configRef = doc(db, 'config', 'tokens');
    const unsubscribe = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.adReward) setAdReward(data.adReward);
        if (data.packages) setPackages(data.packages);
      } else {
        // Only initialize if we're sure it's missing (though better to do this in admin)
        setDoc(configRef, { adReward: 25, packages }, { merge: true }).catch(console.error);
      }
    }, (err) => {
      console.error("Store config error:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleWatchAd = async () => {
    if (!user || loading) return;
    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await updateDoc(userRef, {
        tokens: increment(adReward),
        totalAdsWatched: increment(1),
        dailyTokensEarned: profile?.lastEarnedDate === today ? (profile?.dailyTokensEarned || 0) + adReward : adReward,
        lastEarnedDate: today
      });
      showNotification(`Tebrikler! ${adReward} Jeton kazandın.`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('İşlem sırasında bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    if (!user || loading) return;
    setLoading(true);

    // Simulate payment logic
    // In a real app, you would integrate Stripe/PayPal here
    setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const totalTokens = pkg.tokens + (pkg.bonus || 0);
        
        await updateDoc(userRef, {
          tokens: increment(totalTokens)
        });
        
        showNotification(`${totalTokens} Jeton hesabına başarıyla yüklendi!`, 'success');
      } catch (err) {
        console.error(err);
        showNotification('Ödeme sırasında bir hata oluştu.', 'error');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-yellow-500/20 via-neutral-900 to-neutral-950 p-8 md:p-12 border border-yellow-500/10">
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
              Jeton Mağazası
            </h2>
          </motion.div>
          <p className="text-neutral-400 text-lg md:text-xl font-medium leading-relaxed mb-8">
            Daha fazla AI analizi ve premium tahminler için jetonlarını hemen artır. Reklam izleyerek ücretsiz kazan veya paketlerden sana en uygun olanı seç.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleWatchAd}
              disabled={loading}
              className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-500 transition-all group disabled:opacity-50"
            >
              <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Ücretsiz Kazan (+{adReward})
            </button>
            <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-xl font-black text-white">{profile?.tokens?.toLocaleString() || 0} Jeton</span>
            </div>
          </div>
        </div>
        
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg, index) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative group p-6 rounded-[2rem] border transition-all hover:scale-[1.02]",
              pkg.popular 
                ? "bg-yellow-500/5 border-yellow-500/30 ring-2 ring-yellow-500/20" 
                : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
            )}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-yellow-900/20">
                En Popüler
              </div>
            )}

            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "p-3 rounded-2xl border shadow-lg",
                pkg.tokens >= 3000 ? "bg-red-500/10 border-red-500/20" :
                pkg.tokens >= 1000 ? "bg-yellow-500/10 border-yellow-500/20" :
                "bg-neutral-800 border-neutral-700"
              )}>
                <Coins className={cn(
                  "w-8 h-8",
                  pkg.tokens >= 3000 ? "text-red-500" :
                  pkg.tokens >= 1000 ? "text-yellow-500" :
                  "text-neutral-400"
                )} />
              </div>
              {pkg.bonus && (
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                  +{pkg.bonus} Bonus
                </span>
              )}
            </div>

            <div className="space-y-2 mb-8">
              <h3 className="text-xl font-black text-white tracking-widest">{pkg.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{(pkg.tokens + (pkg.bonus || 0)).toLocaleString()}</span>
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Jeton</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Anında Hesabına Yüklenir</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Tüm Tahminlerde Geçerli</span>
              </div>
            </div>

            <button 
              onClick={() => handlePurchase(pkg)}
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50",
                pkg.popular 
                  ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-xl shadow-yellow-900/20" 
                  : "bg-neutral-800 text-white hover:bg-neutral-700"
              )}
            >
              <CreditCard className="w-5 h-5" />
              {pkg.price} TL
            </button>
          </motion.div>
        ))}
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2rem] bg-neutral-900/30 border border-neutral-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <Target className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase">Jetonlar Ne İşe Yarar?</h3>
          </div>
          <ul className="space-y-4">
            {[
              'Maçlar için AI destekli profesyonel analizler alabilirsin.',
              'Kilitli yüksek oranlı tahminleri görebilirsin.',
              'Leaderboard yarışmalarına katılım sağlayabilirsin.',
              'Profilini özelleştirmek için ek özellikler açabilirsin.'
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-neutral-400 leading-relaxed">
                <span className="text-red-500 font-black">•</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-8 rounded-[2rem] bg-neutral-900/30 border border-neutral-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase">Neden Premium?</h3>
          </div>
          <p className="text-neutral-400 leading-relaxed mb-6">
            Premium jeton paketleri, sadece jeton kazandırmakla kalmaz, aynı zamanda platformun gelişmesine ve daha isabetli AI modelleri eğitmemize destek olur.
          </p>
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
            <Zap className="w-4 h-4 fill-current" /> Yakında: Premium Üyelik Sistemleri
          </div>
        </div>
      </div>
    </div>
  );
}
