"use client";

import React, { useState, useEffect } from 'react';

export default function HomeFriendsSidebar() {
  const [friends, setFriends] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => {
      const saved = localStorage.getItem('chess_friends');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const sorted = parsed.sort((a: any, b: any) => {
            if (a.online !== b.online) return a.online ? -1 : 1;
            return b.elo - a.elo;
          });
          setFriends(sorted);
        } catch (e) {
          console.error(e);
        }
      }
    };
    sync();
    window.addEventListener('social-update', sync);
    return () => window.removeEventListener('social-update', sync);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-black/20">
      <div className="p-6 border-b border-gold/10 flex justify-between items-center">
        <h3 className="chess-label">Amigos</h3>
        <span className="text-[10px] text-gold font-black bg-gold/10 px-2 py-1 rounded-md">
          {friends.filter(f => f.online).length} ONLINE
        </span>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-2">
        {friends.length > 0 ? (
          friends.map((f) => (
            <button 
              key={f.id} 
              onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: f }))}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border border-transparent hover:bg-gold/5 hover:border-gold/10 group cursor-pointer ${!f.online && 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
            >
              <div className="relative shrink-0">
                <img src={f.avatar} className="w-10 h-10 rounded-xl border border-white/10 group-hover:border-gold/30 object-cover" alt="" />
                {f.online && <div className="status-dot !border-zinc-900 bg-green-500 absolute -top-1 -right-1 w-3 h-3 shadow-[0_0_5px_#22c55e]" />}
              </div>
              <div className="flex flex-col items-start min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-gold truncate">{f.name}</span>
                  <span className="text-[9px] text-gold/40 font-black">{f.elo}</span>
                </div>
                <span className="text-[9px] text-zinc-500 italic truncate tracking-tight">
                  {f.online ? (f.currentGame || "Chat libre") : "Offline"}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="py-10 text-center chess-label opacity-20">Sin contactos</div>
        )}
      </div>
    </div>
  );
}