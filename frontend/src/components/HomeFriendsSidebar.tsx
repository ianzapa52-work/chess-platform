import React, { useState, useEffect, useMemo } from 'react';

interface Friend {
  id: string | number;
  name: string;
  avatar: string;
  online: boolean;
  elo: number;
  currentGame?: string;
}

export default function HomeFriendsSidebar() {
  const [friends, setFriends] = useState<Friend[]>([]);

  const syncFriends = () => {
    const saved = localStorage.getItem('chess_friends');
    if (saved) {
      try {
        const parsedFriends: Friend[] = JSON.parse(saved);
        const sorted = parsedFriends.sort((a, b) => {
          if (a.online !== b.online) return a.online ? -1 : 1;
          return b.elo - a.elo;
        });
        setFriends(sorted);
      } catch (e) {
        console.error("Error parseando amigos", e);
      }
    }
  };

  useEffect(() => {
    syncFriends();
    window.addEventListener('social-update', syncFriends);
    window.addEventListener('storage', (e) => {
      if (e.key === 'chess_friends') syncFriends();
    });
    return () => window.removeEventListener('social-update', syncFriends);
  }, []);

  const onlineFriends = useMemo(() => friends.filter((f) => f.online), [friends]);

  return (
    <>
      <div className="p-5 border-b border-[#d4af37]/10 flex justify-between items-center shrink-0 bg-black">
        <h3 className="text-s font-black uppercase tracking-[0.2em] text-[#d4af37]">Amigos</h3>
        <span className="text-s text-[#d4af37]/80 font-bold bg-[#d4af37]/10 px-2 py-0.5 rounded">
          {onlineFriends.length} ON
        </span>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4 bg-black">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <a 
              key={friend.id} 
              href="/friends" 
              className={`flex items-center gap-4 p-2 hover:bg-[#d4af37]/5 rounded-lg transition-all group ${!friend.online ? 'opacity-50' : ''}`}
            >
              <div className="relative shrink-0">
                <img 
                  src={friend.avatar} 
                  className={`w-10 h-10 rounded-lg border ${friend.online ? 'border-[#d4af37]/40 shadow-[0_0_10px_rgba(212,175,55,0.1)]' : 'border-white/5'}`} 
                  alt={friend.name}
                />
                {friend.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black shadow-[0_0_5px_#22c55e]"></div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-bold truncate ${friend.online ? 'text-zinc-200 group-hover:text-[#d4af37]' : 'text-zinc-600'}`}>
                    {friend.name}
                  </span>
                  <span className="text-[9px] text-[#d4af37]/50 font-black tracking-tighter">
                    {friend.elo}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 italic truncate tracking-tight">
                  {friend.online ? (friend.currentGame || "En línea") : "Desconectado"}
                </span>
              </div>
            </a>
          ))
        ) : (
          <div className="py-20 text-center opacity-20">
            <p className="text-[10px] uppercase tracking-[0.3em]">Sin contactos</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
      `}</style>
    </>
  );
}