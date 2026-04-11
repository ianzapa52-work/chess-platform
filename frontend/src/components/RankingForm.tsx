import React, { useState, useMemo } from 'react';
import EloWindow from './EloWindow';

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
  { id: "1", name: "MAGNUS CARLSEN", elo: 2850, wins: 542, streak: 12, avatar: "/avatars/w_king_avatar.png", tier: "SUPER GRAN MAESTRO" },
  { id: "2", name: "HIKARU NAKAMURA", elo: 2800, wins: 498, streak: 8, avatar: "/avatars/b_king_avatar.png", tier: "SUPER GRAN MAESTRO" },
  { id: "3", name: "ALIREZA FIROUZJA", elo: 2780, wins: 320, streak: 5, avatar: "/avatars/w_rook_avatar.png", tier: "SUPER GRAN MAESTRO" },
  { id: "4", name: "FABIANO CARUANA", elo: 2765, wins: 410, streak: 3, avatar: "/avatars/b_queen_avatar.png", tier: "SUPER GRAN MAESTRO" },
  { id: "5", name: "IAN NEPOMNIACHTCHI", elo: 2750, wins: 380, streak: 0, avatar: "/avatars/b_bishop_avatar.png", tier: "SUPER GRAN MAESTRO" },
];

export default function RankingForm() {
  const [search, setSearch] = useState('');
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  const filteredPlayers = useMemo(() => {
    return PLAYERS_DATA.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const topThree = PLAYERS_DATA.slice(0, 3);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] gap-8 w-full max-w-[1800px] mx-auto p-4 relative">
      
      {/* PANEL IZQUIERDO: STATS & ACTIVIDAD */}
      <div className="hidden lg:flex flex-col w-80 gap-6 overflow-hidden">
        <div className="bg-gradient-to-b from-[#d4af37]/20 to-black/40 border border-[#d4af37]/30 rounded-[32px] p-8 relative overflow-hidden shrink-0">
          <p className="text-[#d4af37] text-[10px] tracking-[0.4em] font-black mb-6 uppercase text-center">MVP SEMANAL</p>
          <img src={PLAYERS_DATA[0].avatar} className="w-24 h-24 rounded-3xl border-2 border-[#d4af37] mb-4 mx-auto shadow-[0_0_30px_rgba(212,175,55,0.2)]" alt="MVP" />
          <h3 className="text-white font-['Cinzel'] text-center font-bold text-lg leading-tight">{PLAYERS_DATA[0].name}</h3>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[32px] p-8 space-y-6 backdrop-blur-md">
          <StatItem label="PARTIDAS" value="12,450" />
          <StatItem label="MAESTROS" value="3,120" />
        </div>

        {/* REGISTRO CON SCROLL */}
        <div className="bg-black/40 border border-white/5 rounded-[32px] p-8 flex-grow flex flex-col min-h-0 overflow-hidden relative backdrop-blur-md">
           <h4 className="text-[#d4af37] font-['Cinzel'] text-[10px] tracking-[0.4em] mb-6 uppercase shrink-0">Registro de Actividad</h4>
           <div className="overflow-y-auto custom-scrollbar space-y-6 pr-2">
              <LogItem user="MAGNUS" action="Racha x12 activa" time="2m" />
              <LogItem user="HIKARU" action="Ascenso a GM" time="15m" />
              <LogItem user="USER_82" action="Entró al Top 100" time="24m" />
              <LogItem user="NEPO" action="ELO Sincronizado" time="1h" />
              <LogItem user="ALIREZA" action="Nueva racha x5" time="2h" />
           </div>
           <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* PANEL CENTRAL: TABLERO */}
      <div className="flex-grow flex flex-col bg-white/[0.02] border border-white/10 rounded-[48px] overflow-hidden backdrop-blur-xl relative shadow-2xl">
        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-3xl font-black font-['Cinzel'] text-white tracking-[0.3em]">TABLERO MAESTRO</h2>
          <input 
            type="text"
            placeholder="BUSCAR JUGADOR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-2xl px-8 py-4 text-[10px] focus:text-sm text-white tracking-[0.3em] outline-none focus:border-[#d4af37]/50 w-full md:w-80 transition-all duration-300 placeholder:tracking-[0.3em]"
          />
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar px-6 md:px-12 py-6">
          {filteredPlayers.map((player, index) => (
            <PlayerRow key={player.id} player={player} rank={index + 1} />
          ))}
        </div>
      </div>

      {/* PANEL DERECHO: CÍRCULO ÉLITE */}
      <div className="hidden xl:flex flex-col w-96 gap-6">
        <div className="bg-black/40 border border-white/5 rounded-[48px] p-10 flex-grow flex flex-col">
          <h4 className="text-[#d4af37] font-['Cinzel'] text-[11px] tracking-[0.5em] mb-12 text-center uppercase font-black italic">Círculo de Élite</h4>
          
          <div className="flex flex-col gap-10 w-full mb-10">
            {topThree.map((p, i) => (
              <a key={p.id} href={`/players/${p.id}`} className="relative flex items-center gap-6 group">
                 <span className={`text-5xl font-['Cinzel'] font-black opacity-10 absolute -left-4 ${i === 0 ? 'text-[#d4af37]' : 'text-white'}`}>{i + 1}</span>
                 <img src={p.avatar} className={`w-16 h-16 rounded-2xl border-2 ${i === 0 ? 'border-[#d4af37]' : 'border-white/10'} object-cover relative z-10 transition-transform group-hover:scale-105`} />
                 <div className="relative z-10">
                    <p className="text-white font-['Cinzel'] text-[11px] tracking-widest font-bold uppercase group-hover:text-[#d4af37] transition-colors">{p.name}</p>
                    <p className="text-[#d4af37] font-black text-lg">{p.elo}</p>
                 </div>
              </a>
            ))}
          </div>

          <button 
            onClick={() => setIsWindowOpen(true)}
            className="mt-auto w-full py-5 bg-white/[0.03] border border-white/10 rounded-3xl text-[10px] text-white tracking-[0.4em] hover:bg-[#d4af37] hover:text-black transition-all font-black uppercase shadow-lg active:scale-95 cursor-pointer"
          >
            Reglamento ELO
          </button>
        </div>
      </div>

      {/* COMPONENTE VENTANA */}
      <EloWindow isOpen={isWindowOpen} onClose={() => setIsWindowOpen(false)} />
    </div>
  );
}

// SUBCOMPONENTES
function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">{label}</span>
      <span className="text-lg text-[#d4af37] font-black font-['Cinzel']">{value}</span>
    </div>
  );
}

function LogItem({ user, action, time }: { user: string, action: string, time: string }) {
  return (
    <div className="flex flex-col border-l-2 border-[#d4af37]/20 pl-4 py-1">
      <p className="text-[10px] text-white font-bold tracking-widest">{user} <span className="text-zinc-500 font-normal lowercase">{action}</span></p>
      <span className="text-[8px] text-[#d4af37]/50 mt-1">{time} ago</span>
    </div>
  );
}

function PlayerRow({ player, rank }: { player: Player, rank: number }) {
  return (
    <a href={`/players/${player.id}`} className="group flex items-center gap-8 p-6 mb-3 hover:bg-white/[0.03] rounded-[32px] transition-all duration-500 border border-transparent hover:border-white/5 relative block">
      <div className="w-12 font-['Cinzel'] text-2xl font-black text-zinc-800 group-hover:text-[#d4af37] transition-colors">
        {rank < 10 ? `0${rank}` : rank}
      </div>
      
      <div className="relative shrink-0">
        <img src={player.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] object-cover border border-white/10 group-hover:border-[#d4af37]/40 transition-all duration-500 shadow-xl" />
        {player.streak >= 3 && (
          <div className="absolute -top-3 -right-3 flex flex-col items-center select-none">
            <span className="text-xl drop-shadow-[0_0_8px_rgba(255,69,0,0.8)] animate-pulse-slow">🔥</span>
            <span className="text-[8px] bg-red-600/90 text-white font-black px-1.5 rounded-full -mt-2.5 relative z-10">x{player.streak}</span>
          </div>
        )}
      </div>

      <div className="flex-grow">
        <h3 className="text-white font-['Cinzel'] font-bold text-lg md:text-2xl tracking-[0.1em] uppercase group-hover:text-[#d4af37] transition-colors">{player.name}</h3>
        <div className="flex items-center gap-4 mt-1">
           <span className="text-[10px] text-[#d4af37] font-bold tracking-[0.3em] uppercase">{player.tier}</span>
           <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
           <span className="text-[9px] text-zinc-500 font-black tracking-widest uppercase">Victorias: {player.wins}</span>
        </div>
      </div>

      <div className="text-right px-6">
        <div className="text-2xl md:text-5xl font-black font-['Cinzel'] text-white leading-none tracking-tighter">{player.elo}</div>
      </div>
      
      <div className="absolute left-0 top-6 bottom-6 w-[3px] bg-[#d4af37] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 rounded-r-full shadow-[0_0_15px_#d4af37]"></div>
    </a>
  );
}