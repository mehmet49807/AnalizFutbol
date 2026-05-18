import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Coins, PlayCircle, TrendingUp, Search, ArrowRight, Activity, RefreshCw } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { UserProfile } from '../lib/FirebaseProvider';
import { useNotification } from './Notification';

export default function AdminDashboard() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adReward, setAdReward] = useState(25);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTokens: 0,
    totalAds: 0,
    dailyEarnings: 0
  });
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Listen to config
    const configRef = doc(db, 'config', 'tokens');
    const unsubscribeConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        setAdReward(snap.data().adReward || 25);
      }
    }, (err) => {
      console.error("Config fetch error:", err);
    });

    // Listen to all users for aggregate stats
    const usersRef = collection(db, 'users');
    
    const unsubscribeStats = onSnapshot(usersRef, (snapshot) => {
      let tokens = 0;
      let ads = 0;
      let daily = 0;
      const today = new Date().toISOString().split('T')[0];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        tokens += data.tokens || 0;
        ads += data.totalAdsWatched || 0;
        if (data.lastEarnedDate === today) {
          daily += data.dailyTokensEarned || 0;
        }
      });

      setStats({
        totalUsers: snapshot.size,
        totalTokens: tokens,
        totalAds: ads,
        dailyEarnings: daily
      });
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Stats fetch error:", err);
      // Only set error if it's a real failure, not just a transient connection drop
      if (err.code as string !== 'unavailable') {
        setError("Veriler senkronize edilemedi. Lütfen bağlantınızı kontrol edin.");
      }
      setLoading(false);
    });

    // Listen to recent users
    const recentQuery = query(usersRef, orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });
      setRecentUsers(users);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeStats();
      unsubscribeRecent();
    };
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const configRef = doc(db, 'config', 'tokens');
      await setDoc(configRef, { adReward }, { merge: true });
      showNotification('Sistem ayarları güncellendi.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Ayarlar kaydedilirken hata oluştu.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Activity className="w-10 h-10 text-red-500 animate-spin" />
        <p className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] animate-pulse">Veriler Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3 underline decoration-red-500 decoration-4 underline-offset-8">
          <Shield className="w-10 h-10 text-red-500" /> Admin Paneli
        </h2>
        <div className="flex items-center gap-3">
          {error && (
            <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{error}</span>
              <button onClick={() => window.location.reload()} className="p-1 hover:bg-yellow-500/20 rounded">
                <RefreshCw className="w-3 h-3 text-yellow-500" />
              </button>
            </div>
          )}
          <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Canlı İzleme Aktif</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-xl"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Toplam Kullanıcı</p>
          <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-xl"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <Coins className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Dolaşımdaki Jeton</p>
          <p className="text-3xl font-black text-white">{stats.totalTokens.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-xl"
        >
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-4">
            <PlayCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">İzlenen Reklamlar</p>
          <p className="text-3xl font-black text-white">{stats.totalAds}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-xl"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Bugün Kazanılan (Jtn)</p>
          <p className="text-3xl font-black text-white">{stats.dailyEarnings}</p>
        </motion.div>
      </div>

      {/* Mağaza Ayarları */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-yellow-500/10 rounded-2xl">
            <Coins className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Sistem & Mağaza Ayarları</h3>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Global fiyat ve ödül tanımlamaları</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Reklam İzleme Ödülü (Jeton)</label>
            <div className="flex gap-3">
              <input 
                type="number" 
                value={adReward}
                onChange={(e) => setAdReward(parseInt(e.target.value) || 0)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
              />
              <button 
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="bg-red-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isSaving ? 'Yükleniyor...' : 'Güncelle'}
              </button>
            </div>
            <p className="text-[10px] text-neutral-600 font-medium italic">Kullanıcıların her reklam izlediğinde kazanacağı miktar.</p>
          </div>

          <div className="space-y-3 opacity-50 cursor-not-allowed">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Premium Paketler (Yakında)</label>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-400 font-bold text-xs italic">
              Paket yönetimi bir sonraki güncellemede gelecek.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="font-black italic uppercase text-neutral-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-red-500" /> Son Kayıt Olanlar
          </h3>
          <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1">
            Tümünü Gör <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950/50">
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Kullanıcı</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Bakiye</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Reklamlar</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Bugün</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {recentUsers.map((user, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white">
                        {user.name.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-neutral-400 font-mono">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 w-fit">
                      <Coins className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-400">{user.tokens}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-neutral-300">{user.totalAdsWatched || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-xs font-bold",
                      (user.dailyTokensEarned || 0) > 0 ? "text-blue-400" : "text-neutral-600"
                    )}>
                      +{user.dailyTokensEarned || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase border",
                      user.role === 'admin' ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-blue-500/10 border-blue-500/30 text-blue-500"
                    )}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
