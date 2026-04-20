"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Game {
  id: string;
  mode: "online" | "ia" | "local";
  result: "win" | "loss" | "draw";
  opponent: string;
  eloChange?: string;
  date: string;
  moves: number;
  timeControl: string;
}

// Añadimos onClose como prop opcional
interface HistoryFormProps {
  onClose?: () => void;
}

export default function HistoryForm({ onClose }: HistoryFormProps) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedHistory = localStorage.getItem('chess_history');
      if (savedHistory) {
        setGames(JSON.parse(savedHistory));
      } else {
        const dummyHistory: Game[] = [
          { id: "1", mode: "online", result: "win", opponent: "GrandMaster_X", eloChange: "+12", date: "2026-02-20", moves: 42, timeControl: "10+0" },
          { id: "2", mode: "ia", result: "loss", opponent: "Stockfish Lvl 8", eloChange: "-8", date: "2026-02-18", moves: 31, timeControl: "3+2" },
          { id: "3", mode: "local", result: "draw", opponent: "Invitado_01", date: "2026-02-15", moves: 58, timeControl: "5+0" },
        ];
        setGames(dummyHistory);
        localStorage.setItem('chess_history', JSON.stringify(dummyHistory));
      }
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Lógica para cerrar y navegar
  const handleAnalyze = (id: string) => {
    if (onClose) onClose(); // Si existe la función (está en un modal), la ejecuta
    router.push(`/analysis/${id}`);
  };

  const filteredGames = filter === 'all' ? games : games.filter(g => g.result === filter);

  const resultStyles = {
    win: { label: "Victoria", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5", shadow: "shadow-[0_0_20px_rgba(52,211,153,0.1)]" },
    loss: { label: "Derrota", color: "text-rose-500", border: "border-rose-500/20", bg: "bg-rose-500/5", shadow: "shadow-[0_0_20px_rgba(244,63,94,0.1)]" },
    draw: { label: "Tablas", color: "text-zinc-400", border: "border-zinc-500/20", bg: "bg-zinc-500/5", shadow: "shadow-[0_0_20px_rgba(161,161,170,0.05)]" }
  };

  if (loading) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center gap-6 font-cinzel">
        <div className="w-16 h-16 border-2 border-gold/10 border-t-gold rounded-full animate-spin"></div>
        <p className="text-gold text-[10px] tracking-[0.6em] uppercase font-bold animate-pulse">Sincronizando archivos...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[85vh] flex flex-col font-cinzel overflow-hidden">
      
      <div className="flex flex-col items-center shrink-0 pt-10 px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] uppercase mb-2 text-center">Historial</h2>
        <div className="text-gold/60 text-[10px] tracking-[0.4em] uppercase font-bold mb-8">Registros de Batalla</div>
        <div className="w-full h-px bg-white/10"></div>

        <div className="flex flex-wrap justify-center gap-2 py-6">
            {(['all', 'win', 'loss', 'draw'] as const).map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${
                        filter === f 
                        ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                        : 'text-zinc-500 border-white/5 hover:border-white/20 hover:text-white cursor-pointer'
                    }`}
                >
                    {f === 'all' ? 'Todo' : f === 'win' ? 'Victorias' : f === 'loss' ? 'Derrotas' : 'Tablas'}
                </button>
            ))}
        </div>
        <div className="w-full h-px bg-white/10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar space-y-3">
        {filteredGames.length > 0 ? filteredGames.map((game) => {
          const style = resultStyles[game.result];
          return (
            <div 
              key={game.id}
              className={`w-full group relative flex items-center justify-between p-4 md:p-6 border ${style.border} ${style.bg} ${style.shadow} rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:border-gold/40`}
            >
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-black/40 border border-white/5 font-black">
                    <span className="text-gold text-[10px] uppercase font-sans">{game.timeControl}</span>
                    <span className="text-zinc-500 text-[8px] uppercase font-sans">{game.mode}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xl md:text-2xl font-black uppercase tracking-wider ${style.color}`}>
                        {style.label}
                    </span>
                    {game.eloChange && game.result !== 'draw' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 font-sans ${game.result === 'win' ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {game.eloChange} ELO
                        </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest font-sans">
                    vs <span className="text-white">{game.opponent}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden sm:block text-right">
                  <p className="text-white font-bold tracking-widest text-xs uppercase mb-1 font-sans">
                    {new Date(game.date).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.1em] font-sans">{game.moves} JUGADAS</p>
                </div>
                <button 
                  onClick={() => handleAnalyze(game.id)}
                  className="h-10 w-10 md:h-12 md:w-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-black transition-all group/btn font-black text-[10px] uppercase tracking-widest cursor-pointer font-sans"
                >
                    <span className="hidden md:block">Analizar</span>
                    <span className="md:hidden">→</span>
                </button>
              </div>
            </div>
          );
        }) : (
            <div className="text-center py-20 text-zinc-600 uppercase tracking-widest text-xs font-sans">
                No se han encontrado registros
            </div>
        )}
      </div>

      <div className="shrink-0 pt-2 pb-8 flex flex-col items-center px-6">
        <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-50 mb-6 shadow-[0_0_8px_rgba(212,175,55,0.4)]"></div>
        <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase font-sans">Welikechess • 2026</p>
      </div>
    </div>
  );
}