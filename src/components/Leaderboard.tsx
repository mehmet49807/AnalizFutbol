import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Medal, Crown } from 'lucide-react';
import { cn } from '../lib/utils';

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
}

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardUser[];
      setTopUsers(users);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-neutral-800 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 mb-2">
        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Liderlik Tablosu</span>
      </div>
      
      <div className="space-y-1">
        {topUsers.map((user, index) => (
          <div 
            key={user.id} 
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-xl border transition-all",
              index === 0 
                ? "bg-yellow-500/10 border-yellow-500/20" 
                : "bg-neutral-800/30 border-neutral-700/30"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                {index === 0 ? <Crown className="w-4 h-4 text-yellow-500" /> : 
                 index === 1 ? <Medal className="w-4 h-4 text-neutral-400" /> :
                 index === 2 ? <Medal className="w-4 h-4 text-amber-600" /> :
                 <span className="text-[10px] font-bold text-neutral-500">{index + 1}</span>}
              </div>
              <span className="text-xs font-bold text-neutral-200 truncate w-24">
                {user.name || 'İsimsiz'}
              </span>
            </div>
            <span className="text-[10px] font-black text-blue-400">
              {user.points || 0} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
