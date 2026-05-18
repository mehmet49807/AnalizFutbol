import { useState } from 'react';
import { Trophy, Star, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const DEFAULT_LEAGUES = [
  { id: 'super-lig', name: 'Süper Lig' },
  { id: 'premier-league', name: 'Premier League' },
  { id: 'la-liga', name: 'La Liga' },
];

const ligaData: Record<string, any[]> = {
  'super-lig': [
    { rank: 1, name: 'Galatasaray', p: 32, w: 26, d: 4, l: 2, gd: 45, pts: 82 },
    { rank: 2, name: 'Fenerbahçe', p: 32, w: 25, d: 5, l: 2, gd: 42, pts: 80 },
    { rank: 3, name: 'Beşiktaş', p: 32, w: 18, d: 8, l: 6, gd: 21, pts: 62 },
    { rank: 4, name: 'Trabzonspor', p: 32, w: 17, d: 7, l: 8, gd: 18, pts: 58 },
    { rank: 5, name: 'Samsunspor', p: 32, w: 13, d: 9, l: 10, gd: 5, pts: 48 },
  ],
  'premier-league': [
    { rank: 1, name: 'Man City', p: 30, w: 23, d: 5, l: 2, gd: 50, pts: 74 },
    { rank: 2, name: 'Arsenal', p: 30, w: 22, d: 5, l: 3, gd: 48, pts: 71 },
    { rank: 3, name: 'Liverpool', p: 30, w: 21, d: 7, l: 2, gd: 42, pts: 70 },
  ],
  'la-liga': [
    { rank: 1, name: 'Real Madrid', p: 31, w: 24, d: 6, l: 1, gd: 46, pts: 78 },
    { rank: 2, name: 'Barcelona', p: 31, w: 21, d: 7, l: 3, gd: 31, pts: 70 },
    { rank: 3, name: 'Girona', p: 31, w: 20, d: 5, l: 6, gd: 27, pts: 65 },
  ]
};

export default function Standings() {
  const { user, profile } = useFirebase();
  const [selectedLeague, setSelectedLeague] = useState('super-lig');

  const favorites = profile?.favoriteLeagues || [];

  const sortedLeagues = [...DEFAULT_LEAGUES].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  const teams = ligaData[selectedLeague] || [];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 underline decoration-emerald-500 decoration-4 underline-offset-8 text-neutral-100">
            <Trophy className="w-8 h-8 text-emerald-500" /> Puan Durumu
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleFavorite(selectedLeague)}
            className={cn(
              "mt-2 p-2 rounded-full border transition-all duration-300",
              favorites.includes(selectedLeague)
                ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                : "bg-neutral-800/50 border-neutral-700 text-neutral-500 hover:border-neutral-500"
            )}
          >
            <Star className={cn("w-5 h-5", favorites.includes(selectedLeague) && "fill-current")} />
          </motion.button>
        </div>
        
        <div className="flex gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 overflow-x-auto">
          {sortedLeagues.map((league) => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                selectedLeague === league.id 
                  ? "bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/20" 
                  : "text-neutral-400 hover:text-white"
              )}
            >
              {league.name}
              {favorites.includes(league.id) && (
                <Star className="w-3 h-3 fill-current text-yellow-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-800/50 border-b border-neutral-800 text-[10px] uppercase font-black tracking-widest text-neutral-400">
                <th className="px-6 py-4">Sıra</th>
                <th className="px-6 py-4">Takım</th>
                <th className="px-6 py-4">O</th>
                <th className="px-6 py-4">G</th>
                <th className="px-6 py-4">B</th>
                <th className="px-6 py-4">M</th>
                <th className="px-6 py-4">AV</th>
                <th className="px-6 py-4 text-right">Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {teams.map((team) => (
                <tr key={team.rank} className="hover:bg-neutral-800/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {team.rank <= 3 && <div className={`w-1 h-4 rounded-full ${team.rank === 1 ? 'bg-yellow-500' : team.rank === 2 ? 'bg-blue-500' : 'bg-red-500'}`} />}
                      <span className="font-bold text-sm">{team.rank}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs">
                        {team.name[0]}
                      </div>
                      <span className="font-bold text-sm tracking-tight">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-neutral-400">{team.p}</td>
                  <td className="px-6 py-5 text-sm font-medium text-neutral-400">{team.w}</td>
                  <td className="px-6 py-5 text-sm font-medium text-neutral-400">{team.d}</td>
                  <td className="px-6 py-5 text-sm font-medium text-neutral-400">{team.l}</td>
                  <td className="px-6 py-5 text-sm font-medium text-neutral-400">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">
                      {team.pts}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-black">ŞL</div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Şampiyonlar Ligi</p>
          <p className="text-2xl font-black italic">1. Takım</p>
        </div>
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-black">AVR</div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Avrupa Ligi</p>
          <p className="text-2xl font-black italic">2-3. Takımlar</p>
        </div>
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-black">DÜŞ</div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Alt Lig</p>
          <p className="text-2xl font-black italic">Son 4 Takım</p>
        </div>
      </div>
    </div>
  );
}
