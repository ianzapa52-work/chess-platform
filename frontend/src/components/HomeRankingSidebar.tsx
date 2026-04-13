import React, { useState, useEffect } from 'react';

export default function HomeRankingSidebar() {
  const [players, setPlayers] = useState([]);

  const syncRanking = () => {
    const saved = localStorage.getItem('chess_ranking');
    if (saved) {
      const data = JSON.parse(saved);
      // Ordenamos por ELO y tomamos el Top 3 real del historial
      const topThree = data.sort((a: any, b: any) => b.elo - a.elo).slice(0, 3);
      setPlayers(topThree);
    }
  };

  useEffect(() => {
    syncRanking(); // Carga inicial desde el historial

    window.addEventListener('social-update', syncRanking);
    window.addEventListener('storage', (e) => {
      if (e.key === 'chess_ranking') syncRanking();
    });

    return () => window.removeEventListener('social-update', syncRanking);
  }, []);

  // Si no hay historial, mostramos un estado vacío elegante en lugar de fallbacks
  if (players.length === 0) {
    return (
      <div className="py-10 text-center opacity-20 border border-dashed border-[#d4af37]/20 rounded-2xl">
        <p className="text-[10px] uppercase tracking-[0.3em]">Sin datos de ranking</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-s font-black uppercase tracking-widest text-[#d4af37]">Top Ranking</h3>
        <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
      </div>
      
      <div className="space-y-4">
        {players.map((p: any, i: number) => (
          <a 
            key={p.id || i}
            href="/ranking" 
            className="flex items-center justify-between p-4 bg-[#d4af37]/5 border border-transparent hover:border-[#d4af37]/30 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-5">
              <span className={`text-[13px] font-mono ${i < 3 ? 'text-[#d4af37] font-bold' : 'text-zinc-600'}`}>
                0{i + 1}
              </span>
              <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors truncate max-w-[120px]">
                {p.name}
              </span>
            </div>
            <span className="text-[11px] font-black text-zinc-300 bg-black/40 px-3 py-1.5 rounded-lg group-hover:text-[#d4af37]">
              {p.elo}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}