"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Camera, Activity, Star, Compass, Binary } from 'lucide-react';

export default function ProfileForm() {
  const [user, setUser] = useState<any>(null);

  const loadUser = () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("user");
    if (stored && stored !== "null") {
      const parsedUser = JSON.parse(stored);
      setUser({
        ...parsedUser,
        name: parsedUser.username || parsedUser.name || "NUEVO JUGADOR",
        avatar: parsedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsedUser.username || 'default'}`,
        rating: parsedUser.rating || 1200,
        wins: parsedUser.wins || 0,
        losses: parsedUser.losses || 0,
        puzzlesSolved: parsedUser.puzzlesSolved || 0,
        streak: parsedUser.streak || 0,
        ranking: parsedUser.ranking || 'N/A'
      });
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('user-updated', loadUser);
    return () => window.removeEventListener('user-updated', loadUser);
  }, []);

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] gap-8 w-full max-w-[1800px] mx-auto p-4 relative font-sans overflow-hidden">
      
      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex flex-col w-80 gap-6 shrink-0 h-full">
        <div className="chess-panel-gold !p-8">
          <p className="text-gold text-[10px] tracking-[0.5em] font-black mb-6 uppercase opacity-70 cursor-default">Identity_Core</p>
          <div className="relative w-28 h-28 mx-auto mb-6 group">
             <img src={user.avatar} className="w-full h-full rounded-[32px] border-2 border-gold object-cover shadow-[0_0_20px_rgba(212,175,55,0.2)]" alt="Avatar" />
             <button onClick={() => window.dispatchEvent(new CustomEvent('open-avatar'))} className="absolute -bottom-2 -right-2 bg-gold text-black p-2.5 rounded-xl shadow-lg hover:bg-white transition-all active:scale-90 cursor-pointer">
                <Camera size={18} strokeWidth={3} />
             </button>
          </div>
          <h3 className="text-white font-cinzel font-bold text-xl tracking-[0.2em] uppercase truncate mb-4 cursor-default">{user.name}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-2xl p-2 border border-white/10 cursor-default">
                <p className="text-gold text-[8px] font-black uppercase mb-1">Rank</p>
                <p className="text-white font-cinzel font-bold text-sm">#{user.ranking}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-2 border border-white/10 cursor-default">
                <p className="text-gold text-[8px] font-black uppercase mb-1">Elo</p>
                <p className="text-white font-cinzel font-bold text-sm">{user.rating}</p>
            </div>
          </div>
        </div>

        <div className="chess-panel !p-8 flex-grow">
           <h4 className="text-gold font-cinzel text-[10px] tracking-[0.5em] mb-6 uppercase font-black italic cursor-default">Hitos_Recientes</h4>
           <div className="overflow-y-auto space-y-5 pr-2 custom-scrollbar">
              <LogItem icon={<Trophy size={14}/>} user="Estado" action="Cuenta verificada" time="Ahora" />
              <LogItem icon={<Star size={14}/>} user="Perfil" action="Listo para la arena" time="Reciente" />
           </div>
        </div>
      </div>

      {/* PANEL CENTRAL */}
      <div className="flex-grow flex flex-col gap-8 min-w-0 h-full">
        <div className="flex-grow flex flex-col bg-white/[0.02] border border-white/10 rounded-[56px] overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center shrink-0 cursor-default">
            <div className="flex items-center gap-4">
               <Activity className="text-gold" size={28} />
               <h2 className="text-3xl font-black font-cinzel text-white tracking-[0.4em] uppercase">Statistics</h2>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto px-10 py-10 custom-scrollbar space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BigMetricCard label="Partidas" value={user.wins + user.losses} sub="Total Jugado" />
                <BigMetricCard label="Precisión" value="--" sub="Sin datos" />
                <BigMetricCard label="Mejor ELO" value={user.rating} sub="Peak Season" />
            </div>

            <div className="bg-black/40 border border-gold/20 rounded-[40px] p-10 relative overflow-hidden group cursor-default">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
                <div>
                    <h4 className="text-gold font-cinzel text-6xl font-black italic">-- %</h4>
                    <p className="text-zinc-500 tracking-[0.6em] text-[10px] font-black uppercase mt-4">Cargando Rendimiento...</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
                <AnalysisBox title="Análisis de Juego" icon={<Compass size={18}/>}>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest italic text-center py-4 cursor-default">Sin datos de partida</p>
                </AnalysisBox>
                <AnalysisBox title="Técnica" icon={<Binary size={18}/>}>
                    <div className="grid grid-cols-2 gap-4 opacity-30 cursor-default">
                        <MiniStat label="Middle" value="--" />
                        <MiniStat label="Endgame" value="--" />
                    </div>
                </AnalysisBox>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="hidden xl:flex flex-col w-96 gap-6 shrink-0 h-full">
        <div className="chess-panel !p-10 flex-grow items-center justify-between shadow-2xl">
          <h4 className="text-gold font-cinzel text-xs tracking-[0.6em] mb-8 text-center uppercase font-black italic cursor-default">Táctica_Core</h4>
          
          <div className="text-center cursor-default">
            <div className="relative inline-block mb-4">
                <span className="text-8xl font-black text-white font-cinzel italic tracking-tighter">{user.puzzlesSolved}</span>
                <span className="absolute -bottom-2 -right-6 text-gold font-black text-sm">PTS</span>
            </div>
            <p className="text-zinc-500 font-bold text-[10px] tracking-[0.4em] uppercase">Puzzles Resueltos</p>
          </div>

          <div className="w-full">
            <div className="bg-gold text-black rounded-[28px] p-8 flex items-center justify-between shadow-[0_0_40px_rgba(212,175,55,0.2)] cursor-default">
                <div>
                  <p className="text-[8px] font-black uppercase opacity-60 mb-1">Racha</p>
                  <p className="text-3xl font-cinzel font-bold italic">{user.streak} WINS</p>
                </div>
                <Flame size={40} className="fill-current" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigMetricCard({ label, value, sub }: any) {
    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 text-center cursor-default hover:border-gold/20 transition-all">
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2">{label}</p>
            <p className="text-4xl text-white font-black font-cinzel mb-1">{value}</p>
            <p className="text-gold text-[8px] font-bold uppercase opacity-50">{sub}</p>
        </div>
    );
}

function LogItem({ user, action, time, icon }: any) {
  return (
    <div className="flex items-center gap-4 border-l-2 border-gold/30 pl-5 py-2 cursor-default">
      <div className="text-gold opacity-50">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-white font-bold tracking-tight uppercase truncate">{user} <span className="text-zinc-500 font-normal lowercase">{action}</span></p>
        <span className="text-[9px] text-gold/40 font-bold uppercase italic">{time}</span>
      </div>
    </div>
  );
}

function AnalysisBox({ title, icon, children }: any) {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 cursor-default">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-gold/10 rounded-xl text-gold">{icon}</div>
                <h5 className="text-white font-cinzel text-xs font-bold tracking-[0.4em] uppercase">{title}</h5>
            </div>
            {children}
        </div>
    );
}

function MiniStat({ label, value }: any) {
    return (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 text-center cursor-default">
            <p className="text-zinc-600 text-[8px] font-black uppercase mb-1 tracking-widest">{label}</p>
            <p className="text-white font-cinzel font-bold text-sm">{value}</p>
        </div>
    );
}