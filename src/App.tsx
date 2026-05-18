/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Table, 
  MessageSquare, 
  Newspaper, 
  Home, 
  Activity, 
  Shield,
  ChevronRight,
  TrendingUp,
  Search,
  Bell,
  Menu,
  X,
  Target,
  ShoppingBag,
  PlayCircle,
  Coins,
  LogIn,
  LogOut,
  Zap,
  User as UserIcon
} from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import Standings from './components/Standings';
import AIAnalyst from './components/AIAnalyst';
import News from './components/News';
import Predictions from './components/Predictions';
import AdminDashboard from './components/AdminDashboard';
import Store from './components/Store';
import MyBets from './components/MyBets';
import AuthModal from './components/AuthModal';
import Leaderboard from './components/Leaderboard';
import { useFirebase } from './lib/FirebaseProvider';
import { useNotification } from './components/Notification';
import { auth, db } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';

type Tab = 'dashboard' | 'standings' | 'analyst' | 'news' | 'predictions' | 'bets' | 'admin' | 'store';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, profile, loading } = useFirebase();
  const { showNotification } = useNotification();
  const [adReward, setAdReward] = useState(25);

  useEffect(() => {
    if (!user) return;
    const configRef = doc(db, 'config', 'tokens');
    const unsubscribe = onSnapshot(configRef, (snap) => {
      if (snap.exists()) setAdReward(snap.data().adReward || 25);
    }, (err) => {
      console.error("App config error:", err);
    });
    return () => unsubscribe();
  }, [user]);

  const tabs = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'predictions', label: 'Tahminler', icon: Target },
    { id: 'bets', label: 'Bahislerim', icon: Coins },
    { id: 'store', label: 'Mağaza', icon: ShoppingBag },
    { id: 'standings', label: 'Puan Durumu', icon: Table },
    { id: 'analyst', label: 'AI Analiz', icon: MessageSquare },
    { id: 'news', label: 'Haberler', icon: Newspaper },
    ...(profile?.role === 'admin' ? [{ id: 'admin', label: 'Yönetici', icon: Shield }] : []),
  ];

  const handleLogin = () => setIsAuthModalOpen(true);

  const handleLogout = () => signOut(auth);

  const handleWatchAd = async () => {
    if (!user) return;
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Zap className="w-12 h-12 text-emerald-500 animate-bounce" />
        <p className="text-emerald-500 font-bold uppercase tracking-widest text-sm">AnalizFutbol Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight italic text-emerald-500">AnalizFutbol</span>
        </div>
        <div className="flex items-center gap-3">
           {user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <Coins className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-400">{profile?.tokens || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-black text-blue-400">{profile?.points || 0}</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 h-screen",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full p-6">
            <div className="hidden lg:flex items-center gap-2 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter italic">Analiz<span className="text-emerald-500">Futbol</span></span>
            </div>

            <nav className="space-y-1.5 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-3 mb-2">MENÜ</p>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as Tab);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                      isActive 
                        ? "bg-emerald-500/10 text-emerald-400 font-medium" 
                        : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "group-hover:text-neutral-100")} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6">
              <Leaderboard />
            </div>

            <div className="mt-auto pt-6 border-t border-neutral-800 space-y-4">
              {!user ? (
                 <button 
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg"
                 >
                   <LogIn className="w-4 h-4" /> Giriş Yap
                 </button>
              ) : (
                <div className="space-y-4">
                  {/* Enhanced Profile Summary */}
                  <div className="p-4 rounded-2xl bg-neutral-800/50 border border-neutral-700/30 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Trophy className="w-12 h-12 text-blue-400 -rotate-12" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <img 
                          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                          className="w-10 h-10 rounded-full border border-neutral-700 object-cover" 
                          alt="Avatar" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white truncate uppercase tracking-tighter">{user.displayName || 'Üye'}</span>
                          {profile?.role === 'admin' && (
                            <span className="px-1 py-0.5 rounded-sm bg-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/30">Admin</span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Level 12</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                       <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-1 shadow-inner">
                          <div className="w-6 h-6 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-0.5">
                            <Coins className="w-4 h-4 text-yellow-500" />
                          </div>
                          <span className="text-sm font-black text-white">{profile?.tokens || 0}</span>
                          <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-tight">JETONLARIM</span>
                       </div>
                       <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center gap-1 shadow-inner relative overflow-hidden">
                          <div className="absolute inset-0 bg-blue-500/5 blur-xl animate-pulse" />
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center mb-0.5 relative z-10">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="text-lg font-black text-blue-400 relative z-10">{profile?.points || 0}</span>
                          <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tight relative z-10">TOPLAM PUAN</span>
                       </div>
                    </div>

                    <div className="mt-3 w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-blue-500 h-full w-2/3 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                  </div>

                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => {
                        setActiveTab('admin');
                        document.body.click(); // Close the popover if it's based on focus/click
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all shadow-lg shadow-red-900/10"
                    >
                      🛡️ Admin Paneli
                    </button>
                  )}

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-900 text-neutral-400 rounded-xl text-xs font-bold hover:text-red-400 hover:bg-red-500/10 transition-all border border-neutral-700"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
                  </button>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-800/50 border border-neutral-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold text-neutral-200 uppercase tracking-tight">Pro Analiz</span>
                </div>
                <p className="text-xs text-neutral-400 mb-3 leading-relaxed">AI destekli derinlemesine maç analizlerine erişin.</p>
                <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-900/20">
                  Şimdi Yükselt
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          <header className="hidden lg:flex items-center justify-between px-10 py-6 border-b border-neutral-800 sticky top-0 bg-neutral-950/80 backdrop-blur-md z-10">
            <div className="relative w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Takım, oyuncu veya lig ara..." 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex gap-4 mr-4">
                   <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-4 bg-neutral-900 px-5 py-3 rounded-2xl border border-neutral-800 shadow-xl shadow-black/40"
                   >
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Coins className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest leading-none mb-1">Cüzdan</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white leading-none tracking-tighter">{profile?.tokens || 0}</span>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">JTN</span>
                        </div>
                      </div>
                   </motion.div>

                   <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-5 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 px-6 py-3 rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/10 group overflow-hidden relative"
                   >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-500" />
                      <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 shadow-inner relative z-10">
                        <Trophy className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex flex-col relative z-10">
                        <span className="text-[11px] text-blue-300 font-black uppercase tracking-[0.2em] leading-none mb-1 shadow-sm">Başarı Puanı</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 leading-none tracking-tighter drop-shadow-sm">{profile?.points || 0}</span>
                          <span className="text-sm font-black text-blue-400/80 italic">PTS</span>
                        </div>
                      </div>
                   </motion.div>
                </div>
              )}

              {user && (
                <button 
                  onClick={handleWatchAd}
                  className="hidden md:flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-xl border border-yellow-500/20 transition-all group"
                >
                  <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Jeton Kazan</span>
                </button>
              )}

              <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-neutral-950" />
              </button>
              <div className="h-6 w-px bg-neutral-800 mx-2" />
              <div className="flex items-center gap-3 pl-2">
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden">
                  <img src={user ? (user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`) : "https://api.dicebear.com/7.x/avataaars/svg?seed=football"} alt="User" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-tight">{user ? user.displayName : 'Ziyaretçi'}</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{user ? 'Premium Üye' : 'Giriş Gerekli'}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 lg:p-10 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'standings' && <Standings />}
                {activeTab === 'analyst' && <AIAnalyst />}
                {activeTab === 'news' && <News />}
                {activeTab === 'predictions' && <Predictions />}
                {activeTab === 'bets' && <MyBets />}
                {activeTab === 'store' && <Store />}
                {activeTab === 'admin' && <AdminDashboard />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
