import React, { useState, useEffect, useMemo } from 'react';

export default function HomeFriendsSidebar() {
  const [friends, setFriends] = useState([]);

  const syncFriends = () => {
    const saved = localStorage.getItem('chess_friends');
    if (saved) {
      const parsedFriends = JSON.parse(saved);
      // Aplicamos la misma ordenación que en el componente de amigos
      const sorted = parsedFriends.sort((a: any, b: any) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return b.elo - a.elo;
      });
      setFriends(sorted);
    }
  };

  useEffect(() => {
    syncFriends(); // Carga inicial

    // Escucha cambios manuales (CustomEvent que lanzamos al aceptar solicitudes)
    window.addEventListener('social-update', syncFriends);
    
    // Escucha cambios de otras pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === 'chess_friends') syncFriends();
    });

    return () => {
      window.removeEventListener('social-update', syncFriends);
    };
  }, []);

  const onlineFriends = useMemo(() => friends.filter((f: any) => f.online), [friends]);

  return (
    <aside className="hidden xl:flex col-span-2 border-r border-[#d4af37]/10 bg-[#0a0a0a] flex-col overflow-hidden relative">
      <div className="absolute right-0 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#d4af37]/20 to-transparent"></div>
      
      <div className="mt-4 p-5 border-b border-[#d4af37]/10 bg-[#d4af37]/5 flex justify-between items-center shrink-0">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Amigos</h3>
        <span className="text-[10px] text-[#d4af37]/80 font-bold bg-[#d4af37]/10 px-2 py-0.5 rounded">
          {onlineFriends.length} ON
        </span>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
        {friends.length > 0 ? (
          friends.map((friend: any) => (
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
    </aside>
  );
}