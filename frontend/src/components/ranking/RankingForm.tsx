"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Activity, Award, Search, Info } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  elo: number;
  wins: number;
  streak: number;
  avatar: string;
  tier: string;
}

const PLAYERS_DATA: Player[] = [
  { id: "1", name: "MAGNUS CARLSEN", elo: 2850, wins: 542, streak: 12, avatar: "/avatars/w_king_avatar.png", tier: "GRAN MAESTRO" },
  { id: "2", name: "HIKARU NAKAMURA", elo: 2800, wins: 498, streak: 8, avatar: "/avatars/b_king_avatar.png", tier: "GRAN MAESTRO" },
  { id: "3", name: "ALIREZA FIROUZJA", elo: 2780, wins: 320, streak: 5, avatar: "/avatars/w_rook_avatar.png", tier: "GRAN MAESTRO" },
  { id: "4", name: "FABIANO CARUANA", elo: 2765, wins: 410, streak: 3, avatar: "/avatars/b_queen_avatar.png", tier: "GRAN MAESTRO" },
  { id: "5", name: "IAN NEPOMNIACHTCHI", elo: 2750, wins: 380, streak: 0, avatar: "/avatars/b_bishop_avatar.png", tier: "GRAN MAESTRO" },
];

export default function RankingForm() {
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('chess_ranking');
    if (saved) {
      setPlayers(JSON.parse(saved));
    } else {
      localStorage.setItem('chess_ranking', JSON.stringify(PLAYERS_DATA));
      setPlayers(PLAYERS_DATA);
    }
    window.dispatchEvent(new CustomEvent('social-update'));
  }, []);

  const openEloReglamento = () => {
    window.dispatchEvent(new Event('open-elo-info'));
  };

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.elo - a.elo);
  }, [search, players]);

  const topThree = useMemo(() => {
    return [...players].sort((a, b) => b.elo - a.elo).slice(0, 3);
  }, [players]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] gap-8 w-full max-w-[1800px] mx-auto p-4 relative font-['Outfit']">
      
      {/* PANEL IZQUIERDO: STATS */}
      <div className="hidden lg:flex flex-col w-80 gap-6 overflow-hidden">
        <div className="bg-gradient-to-b from-[#d4af37]/20 to-black/40 border border-[#d4af37]/30 rounded-[32px] p-8 relative overflow-hidden shrink-0">
          <p className="text-[#d4af37] text-[10px] tracking-[0.4em] font-black mb-6 uppercase text-center">MVP SEMANAL</p>
          <div className="relative w-24 h-24 mx-auto mb-4">
            <img src={topThree[0]?.avatar} className="w-full h-full rounded-3xl border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.2)] object-cover" alt="MVP" />
            <div className="absolute -top-2 -right-2 bg-[#d4af37] text-black p-1 rounded-lg">
              <Trophy size={14} />
            </div>
          </div>
          <h3 className="text-white font-['Cinzel'] text-center font-bold text-lg leading-tight uppercase tracking-widest">
            {topThree[0]?.name || "CARGANDO..."}
          </h3>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[32px] p-8 space-y-6 backdrop-blur-md">
          <StatItem label="PARTIDAS TOTALES" value="12,450" icon={<Activity size={14}/>} />
          <StatItem label="MAESTROS ACTIVOS" value={players.length.toString()} icon={<Award size={14}/>} />
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[32px] p-8 flex-grow flex flex-col min-h-0 overflow-hidden relative backdrop-blur-md">
           <h4 className="text-[#d4af37] font-['Cinzel'] text-[10px] tracking-[0.4em] mb-6 uppercase shrink-0">Registro Global</h4>
           <div className="overflow-y-auto custom-scrollbar space-y-6 pr-2">
              <LogItem user={topThree[0]?.name.split(' ')[0]} action="lidera la tabla" time="Ahora" />
              <LogItem user="SISTEMA" action="Ranking sincronizado" time="15m" />
              <LogItem user={topThree[1]?.name.split(' ')[0]} action="entró en racha" time="1h" />
           </div>
           <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* PANEL CENTRAL: TABLERO */}
      <div className="flex-grow flex flex-col bg-white/[0.02] border border-white/10 rounded-[48px] overflow-hidden backdrop-blur-xl relative shadow-2xl">
        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-3xl font-black font-['Cinzel'] text-white tracking-[0.3em]">TABLERO MAESTRO</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text"
              placeholder="BUSCAR JUGADOR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-2xl pl-14 pr-8 py-4 text-white tracking-[0.3em] outline-none focus:border-[#d4af37]/50 w-full transition-all duration-300 placeholder:text-zinc-700 text-xs uppercase"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar px-6 md:px-12 py-6">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player, index) => (
              <PlayerRow key={player.id} player={player} rank={index + 1} />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
              <Search size={48} className="mb-4" />
              <p className="tracking-[0.5em] uppercase text-xs">Sin resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: SOLO TOP 3 */}
      <div className="hidden xl:flex flex-col w-96 gap-6">
        <div className="bg-black/40 border border-white/5 rounded-[48px] p-10 flex-grow flex flex-col">
          <h4 className="text-[#d4af37] font-['Cinzel'] text-[11px] tracking-[0.5em] mb-12 text-center uppercase font-black italic">Círculo de Élite</h4>
          
          <div className="flex flex-col gap-10 w-full mb-10">
            {topThree.map((p, i) => (
              <div key={p.id} className="relative flex items-center gap-6 group">
                 <span className={`text-5xl font-['Cinzel'] font-black opacity-10 absolute -left-4 ${i === 0 ? 'text-[#d4af37]' : 'text-white'}`}>{i + 1}</span>
                 <img src={p.avatar} className={`w-16 h-16 rounded-2xl border-2 ${i === 0 ? 'border-[#d4af37]' : 'border-white/10'} object-cover relative z-10`} alt="" />
                 <div className="relative z-10">
                    <p className="text-white font-['Cinzel'] text-[11px] tracking-widest font-bold uppercase">{p.name}</p>
                    <p className="text-[#d4af37] font-black text-lg">{p.elo}</p>
                 </div>
              </div>
            ))}
          </div>

          <button 
            onClick={openEloReglamento}
            className="mt-auto w-full py-5 bg-white/[0.03] border border-white/10 rounded-3xl text-[10px] text-white tracking-[0.4em] hover:bg-[#d4af37] hover:text-black transition-all font-black uppercase shadow-lg flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
          >
            <Info size={16} /> Reglamento ELO
          </button>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
function StatItem({ label, value, icon }: any) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{label}</span>
      </div>
      <span className="text-lg text-[#d4af37] font-black font-['Cinzel']">{value}</span>
    </div>
  );
}

function LogItem({ user, action, time }: any) {
  return (
    <div className="flex flex-col border-l-2 border-[#d4af37]/20 pl-4 py-1">
      <p className="text-[10px] text-white font-bold tracking-widest uppercase">{user} <span className="text-zinc-600 font-normal lowercase">{action}</span></p>
      <span className="text-[8px] text-[#d4af37]/40 mt-1 uppercase">{time}</span>
    </div>
  );
}

function PlayerRow({ player, rank }: any) {
  return (
    <div className="group flex items-center gap-8 p-6 mb-3 hover:bg-white/[0.03] rounded-[32px] transition-all duration-500 border border-transparent hover:border-white/5 relative">
      <div className="w-12 font-['Cinzel'] text-2xl font-black text-zinc-800 group-hover:text-[#d4af37] transition-colors">
        {rank < 10 ? `0${rank}` : rank}
      </div>
      <div className="relative shrink-0">
        <img src={player.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] object-cover border border-white/10 group-hover:border-[#d4af37]/40 transition-all duration-500 shadow-xl" alt="" />
        {player.streak >= 3 && (
          <div className="absolute -top-3 -right-3 flex flex-col items-center select-none">
            <span className="text-xl animate-pulse">🔥</span>
            <span className="text-[8px] bg-red-600 text-white font-black px-1.5 rounded-full -mt-2.5 relative z-10">x{player.streak}</span>
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="text-white font-['Cinzel'] font-bold text-lg md:text-2xl tracking-[0.1em] uppercase group-hover:text-[#d4af37] transition-colors truncate">{player.name}</h3>
        <div className="flex items-center gap-4 mt-1">
           <span className="text-[10px] text-[#d4af37] font-bold tracking-[0.3em] uppercase">{player.tier}</span>
           <span className="hidden md:inline w-1 h-1 bg-zinc-800 rounded-full"></span>
           <span className="hidden md:inline text-[9px] text-zinc-500 font-black tracking-widest uppercase">WINS: {player.wins}</span>
        </div>
      </div>
      <div className="text-right px-6">
        <div className="text-2xl md:text-5xl font-black font-['Cinzel'] text-white leading-none tracking-tighter">{player.elo}</div>
      </div>
      <div className="absolute left-0 top-6 bottom-6 w-[3px] bg-[#d4af37] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 rounded-r-full shadow-[0_0_15px_#d4af37]"></div>
    </div>
  );
}