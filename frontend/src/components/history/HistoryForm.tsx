"use client";

import React, { useState, useEffect } from 'react';
import { Cinzel } from "next/font/google";
import { useTheme } from '@/hooks/useTheme';

const cinzel = Cinzel({ subsets: ["latin"] });

interface GameFromAPI {
  id: string;
  mode: string;
  status: string;
  result: string;
  created_at: string;
  white_username: string;
  black_username: string;
  winner_username: string | null;
}

interface HistoryFormProps {
  onClose?: () => void;
}

export default function HistoryForm({ onClose: _onClose }: HistoryFormProps) {
  const [games, setGames] = useState<GameFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const { isLight } = useTheme();

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("access_token");

      try {
        const meRes = await fetch("http://localhost:8000/api/users/me/", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setMyUsername(meData.username);
        }
      } catch (e) {
        console.error("Error obteniendo usuario:", e);
      }

      try {
        const response = await fetch("http://localhost:8000/api/games/my-games/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          setGames(data);
        }
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getResultType = (game: GameFromAPI): "win" | "loss" | "draw" => {
    if (game.result === "1/2-1/2" || game.winner_username === null) return "draw";
    if (game.winner_username === myUsername) return "win";
    return "loss";
  };

  const filteredGames = games.filter(g => {
    if (!myUsername) return false;
    const res = getResultType(g);
    if (filter === 'all') return true;
    return res === filter;
  });

  const resultStyles = isLight ? {
    win:  { label: "Victoria", color: "text-emerald-600", border: "border-emerald-300", bg: "bg-emerald-50 shadow-sm"  },
    loss: { label: "Derrota",  color: "text-rose-600",    border: "border-rose-300",    bg: "bg-rose-50 shadow-sm"    },
    draw: { label: "Tablas",   color: "text-zinc-600",    border: "border-zinc-300",    bg: "bg-zinc-100 shadow-sm"   },
  } : {
    win:  { label: "Victoria", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
    loss: { label: "Derrota",  color: "text-rose-500",    border: "border-rose-500/20",    bg: "bg-rose-500/5"    },
    draw: { label: "Tablas",   color: "text-zinc-400",    border: "border-zinc-500/20",    bg: "bg-zinc-500/5"    },
  };

  if (loading) {
    return (
      <div className={`${cinzel.className} w-full h-[600px] flex flex-col items-center justify-center gap-6`}>
        <div className="w-16 h-16 border-2 border-gold/10 border-t-gold rounded-full animate-spin"></div>
        <p className="text-gold text-[10px] tracking-[0.6em] uppercase font-bold animate-pulse">Sincronizando Archivos...</p>
      </div>
    );
  }

  return (
    <div className={`${cinzel.className} relative w-full max-w-5xl mx-auto h-[85vh] flex flex-col overflow-hidden`}>

      {/* HEADER */}
      <div className="flex flex-col items-center shrink-0 pt-10 px-6">
        <h2 className="text-6xl md:text-5xl font-black text-white [.light_&]:text-gray-900 tracking-[0.25em] uppercase mb-3 text-center">
          Historial
        </h2>
        <div className="text-gold/70 text-[11px] tracking-[0.5em] uppercase font-black mb-8">
          Registros de Batalla Real
        </div>
        <div className="w-full h-px bg-white/10 [.light_&]:bg-black/10"></div>

        {/* FILTROS */}
        <div className="flex flex-wrap justify-center gap-2 py-6">
          {(['all', 'win', 'loss', 'draw'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
                filter === f
                  ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'text-zinc-500 [.light_&]:text-gray-400 border-white/5 [.light_&]:border-gray-200 hover:border-white/20 [.light_&]:hover:border-gray-400 hover:text-white [.light_&]:hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'Todo' : f === 'win' ? 'Victorias' : f === 'loss' ? 'Derrotas' : 'Tablas'}
            </button>
          ))}
        </div>
        <div className="w-full h-px bg-white/10 [.light_&]:bg-black/10"></div>
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar space-y-3">
        {filteredGames.length > 0 ? filteredGames.map((game) => {
          const resType = getResultType(game);
          const style = resultStyles[resType];
          const opponent = game.white_username === myUsername ? game.black_username : game.white_username;

          return (
            <div
              key={game.id}
              className={`w-full group flex items-center justify-between p-4 md:p-6 border ${style.border} ${style.bg} rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:border-gold/40`}
            >
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-black/40 [.light_&]:bg-white [.light_&]:shadow border border-white/5 [.light_&]:border-gray-200 font-black">
                  <span className="text-gold text-[10px] uppercase">{game.mode}</span>
                  <span className="text-zinc-500 [.light_&]:text-gray-400 text-[8px] uppercase">FIN</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xl md:text-2xl font-black uppercase tracking-wider ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 [.light_&]:bg-gray-100 text-zinc-400 [.light_&]:text-gray-500">
                      {game.result}
                    </span>
                  </div>
                  <p className="text-zinc-400 [.light_&]:text-gray-500 text-xs font-bold uppercase tracking-widest">
                    vs <span className="text-white [.light_&]:text-gray-900">{opponent}</span>
                  </p>
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <p className="text-white [.light_&]:text-gray-800 font-bold tracking-widest text-xs uppercase mb-1">
                  {new Date(game.created_at).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
                </p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">ID: {game.id.slice(0, 8)}</p>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-20 text-zinc-600 [.light_&]:text-gray-400 uppercase tracking-widest text-xs">
            No hay registros en la base de datos
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="shrink-0 pt-2 pb-8 flex flex-col items-center px-6">
        <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-50 mb-6"></div>
        <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase">
          Welikechess • Cloud Sync
        </p>
      </div>
    </div>
  );
}