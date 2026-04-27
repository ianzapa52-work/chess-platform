"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Activity, Award, Search, Info, Loader2, Zap, Timer, Coffee } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  elo: number;
  wins: number;
  avatar: string;
  tier: string;
  online?: boolean;
}

type Mode = 'bullet' | 'blitz' | 'rapid';

export default function RankingForm() {
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('blitz');

  const fetchGlobalRanking = async (selectedMode: Mode) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/users/global_ranking/?type=${selectedMode}`);
      if (!response.ok) throw new Error("Error en servidor");
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error("Error cargando ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGlobalRanking(mode); }, [mode]);

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.elo - a.elo);
  }, [search, players]);

  const topThree = useMemo(() => players.slice(0, 3), [players]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] gap-8 w-full max-w-[1800px] mx-auto p-4 relative font-['Outfit']">
      
      {/* PANEL IZQUIERDO: LÍDER */}
      <div className="hidden lg:flex flex-col w-80 gap-6 overflow-hidden">
        <div className="bg-gradient-to-b from-[#d4af37]/20 to-black/40 border border-[#d4af37]/30 rounded-[32px] p-8 shrink-0">
          <p className="text-[#d4af37] text-[10px] tracking-[0.4em] font-black mb-6 uppercase text-center">LÍDER {mode}</p>
          <div className="relative w-24 h-24 mx-auto mb-4">
            {topThree[0] ? (
              <img 
                src={`/avatars/${topThree[0].avatar}`} 
                className="w-full h-full rounded-3xl border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.2)] object-cover bg-zinc-900 cursor-pointer" 
                alt="Lider" 
              />
            ) : (
              <div className="w-full h-full rounded-3xl border border-white/10 bg-zinc-900/50 flex items-center justify-center">
                <Loader2 className="animate-spin text-zinc-700" size={20} />
              </div>
            )}
            <div className="absolute -top-2 -right-2 bg-[#d4af37] text-black p-1 rounded-lg">
              <Trophy size={14} />
            </div>
          </div>
          <h3 className="text-white font-['Cinzel'] text-center font-bold text-lg leading-tight uppercase tracking-widest truncate">
            {topThree[0]?.name || "ESPERANDO..."}
          </h3>
          <p className="text-[#d4af37] text-center font-black text-sm mt-2 tracking-tighter">
            ELO {topThree[0]?.elo || "---"}
          </p>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[32px] p-8 space-y-6 backdrop-blur-md">
          <StatItem label="CATEGORÍA" value={mode.toUpperCase()} icon={<Activity size={14}/>} />
          <StatItem label="MAESTROS" value={players.length.toString()} icon={<Award size={14}/>} />
        </div>
      </div>

      {/* PANEL CENTRAL: TABLA */}
      <div className="flex-grow flex flex-col bg-white/[0.02] border border-white/10 rounded-[48px] overflow-hidden backdrop-blur-xl shadow-2xl relative">
        <div className="p-8 border-b border-white/5 flex flex-col gap-6 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h2 className="text-3xl font-black font-['Cinzel'] text-white tracking-[0.3em]">TABLERO MAESTRO</h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text"
                placeholder="BUSCAR JUGADOR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-2xl pl-14 pr-8 py-4 text-white tracking-[0.3em] outline-none focus:border-[#d4af37]/50 w-full transition-all text-xs uppercase"
              />
            </div>
          </div>

          <div className="flex gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5 self-start">
            <ModeTab active={mode === 'bullet'} onClick={() => setMode('bullet')} label="Bullet" icon={<Zap size={14}/>} />
            <ModeTab active={mode === 'blitz'} onClick={() => setMode('blitz')} label="Blitz" icon={<Timer size={14}/>} />
            <ModeTab active={mode === 'rapid'} onClick={() => setMode('rapid')} label="Rapid" icon={<Coffee size={14}/>} />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar px-6 md:px-12 py-6 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
              <Loader2 className="text-[#d4af37] animate-spin" size={40} />
            </div>
          )}
          {filteredPlayers.map((player, index) => (
            <PlayerRow key={player.id} player={player} rank={index + 1} />
          ))}
        </div>
      </div>

      {/* PANEL DERECHO: TOP 3 */}
      <div className="hidden xl:flex flex-col w-96 gap-6">
        <div className="bg-black/40 border border-white/5 rounded-[48px] p-10 flex-grow flex flex-col">
          <h4 className="text-[#d4af37] font-['Cinzel'] text-[11px] tracking-[0.5em] mb-12 text-center uppercase font-black italic">Círculo de Élite</h4>
          <div className="flex flex-col gap-10 w-full mb-10">
            {topThree.map((p, i) => (
              <div key={p.id} className="relative flex items-center gap-6 group cursor-pointer">
                 <span className={`text-5xl font-['Cinzel'] font-black opacity-10 absolute -left-4 ${i === 0 ? 'text-[#d4af37]' : 'text-white'}`}>{i + 1}</span>
                 <img src={`/avatars/${p.avatar}`} className={`w-16 h-16 rounded-2xl border-2 ${i === 0 ? 'border-[#d4af37]' : 'border-white/10'} object-cover relative z-10 bg-zinc-900`} alt="" />
                 <div className="relative z-10">
                    <p className="text-white font-['Cinzel'] text-[11px] tracking-widest font-bold uppercase truncate w-40">{p.name}</p>
                    <p className="text-[#d4af37] font-black text-lg">{p.elo}</p>
                 </div>
              </div>
            ))}
          </div>
          <button onClick={() => window.dispatchEvent(new Event('open-elo-info'))} className="mt-auto w-full py-5 bg-white/[0.03] border border-white/10 rounded-3xl text-[10px] text-white tracking-[0.4em] hover:bg-[#d4af37] hover:text-black transition-all font-black uppercase cursor-pointer">
            <Info size={16} className="inline mr-2" /> Reglamento ELO
          </button>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES DE APOYO
function ModeTab({ active, onClick, label, icon }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer ${active ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
      {icon} {label}
    </button>
  );
}

function StatItem({ label, value, icon }: any) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-zinc-500">{icon}<span className="text-[10px] font-bold tracking-[0.2em] uppercase">{label}</span></div>
      <span className="text-lg text-[#d4af37] font-black font-['Cinzel']">{value}</span>
    </div>
  );
}

function PlayerRow({ player, rank }: any) {
  return (
    <div className="group flex items-center gap-8 p-6 mb-3 hover:bg-white/[0.03] rounded-[32px] transition-all duration-500 border border-transparent hover:border-white/5 relative cursor-pointer">
      <div className="w-12 font-['Cinzel'] text-2xl font-black text-zinc-800 group-hover:text-[#d4af37] transition-colors">{rank < 10 ? `0${rank}` : rank}</div>
      <div className="relative shrink-0">
        <img src={`/avatars/${player.avatar}`} className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] object-cover border border-white/10 group-hover:border-[#d4af37]/40 transition-all bg-zinc-900" alt="" />
        {player.online && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_10px_#22c55e]"></div>}
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="text-white font-['Cinzel'] font-bold text-lg md:text-2xl tracking-[0.1em] uppercase group-hover:text-[#d4af37] truncate">{player.name}</h3>
        <div className="flex items-center gap-4 mt-1">
           <span className="text-[10px] text-[#d4af37] font-bold tracking-[0.3em] uppercase bg-[#d4af37]/10 px-2 py-0.5 rounded-md">{player.tier}</span>
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