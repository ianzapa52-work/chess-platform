"use client";

import { useRef, useEffect } from 'react';

interface GameHistoryProps {
  history: string[];
  status: string;
  isGameOver: boolean;
  gameStarted: boolean;
  onReset: () => void;
  orientation?: 'w' | 'b';
}

export default function GameHistory({
  history,
  status,
  isGameOver,
  gameStarted,
  onReset,
  orientation = 'w'
}: GameHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const rows: { moveNum: number; white: string; black: string | null }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      moveNum: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] || null
    });
  }

  const totalMoves = Math.ceil(history.length / 2);

  return (
    <div className="bg-black/50 in-[.light]:bg-white h-full flex flex-col border border-white/7 in-[.light]:border-gray-200 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="px-6 py-5 border-b border-white/5 in-[.light]:border-gray-100 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black tracking-[0.4em] text-zinc-500 in-[.light]:text-gray-500 uppercase">Movimientos</p>
          <p className={`text-sm font-bold mt-1 transition-colors duration-300 ${
            gameStarted
              ? 'text-white/80 in-[.light]:text-gray-900'
              : 'text-zinc-600 in-[.light]:text-gray-400'
          }`}>
            {totalMoves} {totalMoves === 1 ? 'jugada' : 'jugadas'}
          </p>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full shadow-lg transition-all duration-500 ${
          gameStarted && !isGameOver
            ? 'bg-emerald-400 shadow-emerald-500/50 scale-110 animate-pulse'
            : 'bg-zinc-800 in-[.light]:bg-gray-300'
        }`} />
      </div>

      <div ref={scrollRef} className="grow overflow-y-auto p-5 space-y-2 custom-scrollbar bg-linear-to-b from-black/20 to-black/50 in-[.light]:from-gray-50 in-[.light]:to-gray-100/50">
        {rows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 in-[.light]:bg-gray-100 border border-white/10 in-[.light]:border-gray-200 flex items-center justify-center">
              <span className="text-xl">📜</span>
            </div>
            <p className="text-[11px] text-zinc-600 in-[.light]:text-gray-400 font-bold uppercase tracking-widest">Esperando primer movimiento</p>
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.moveNum}
              className={`
                group grid grid-cols-[32px_1fr_1fr] gap-3 items-center
                px-4 py-3 rounded-2xl border border-transparent
                hover:bg-white/5 in-[.light]:hover:bg-gray-50 hover:border-white/20 in-[.light]:hover:border-gray-200 hover:shadow-lg
                transition-all duration-200 cursor-default
                ${index === rows.length - 1
                  ? 'bg-linear-to-r from-emerald-500/5 to-transparent in-[.light]:from-emerald-50 in-[.light]:to-white border-emerald-500/30 in-[.light]:border-emerald-200 shadow-emerald-500/20 ring-1 ring-emerald-500/20 in-[.light]:ring-emerald-300/40'
                  : 'hover:shadow-md'
                }
              `}
            >
              <span className="font-mono text-[12px] font-black text-zinc-500 in-[.light]:text-gray-500 text-right tracking-tight">
                {row.moveNum}.
              </span>

              <div className="bg-linear-to-r from-white/8 to-white/3 in-[.light]:from-gray-100 in-[.light]:to-gray-50 rounded-xl py-2.5 px-4
                text-center text-white in-[.light]:text-gray-900 font-mono text-sm font-bold
                border border-white/10 in-[.light]:border-gray-200 shadow-inner backdrop-blur-sm
                group-hover:shadow-white/20 group-hover:scale-[1.02]
                transition-all duration-200">
                {row.white}
              </div>

              <div className={`
                rounded-xl py-2.5 px-4 text-center font-mono text-sm font-semibold
                backdrop-blur-sm transition-all duration-200 group-hover:scale-[1.02]
                ${row.black
                  ? 'bg-zinc-900/50 in-[.light]:bg-gray-100 border border-zinc-700/50 in-[.light]:border-gray-200 shadow-inner text-zinc-400 in-[.light]:text-gray-600 hover:shadow-zinc-600/30 hover:text-zinc-200 in-[.light]:hover:text-gray-900'
                  : 'bg-zinc-950/30 in-[.light]:bg-gray-50 border border-zinc-800/20 in-[.light]:border-gray-100 text-zinc-600 in-[.light]:text-gray-400 italic opacity-60'
                }
              `}>
                {row.black || "—"}
              </div>
            </div>
          ))
        )}
      </div>

      {isGameOver && (
        <div className="px-6 py-4 border-t border-white/8 in-[.light]:border-gray-100 bg-linear-to-r from-red-900/20 to-rose-900/10 in-[.light]:from-red-50 in-[.light]:to-rose-50">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.3em]
            bg-red-500/20 in-[.light]:bg-red-100 border border-red-500/40 in-[.light]:border-red-300 px-4 py-2 rounded-2xl text-red-300 in-[.light]:text-red-700
            backdrop-blur-sm shadow-lg">
            {status}
          </p>
        </div>
      )}

      <div className="p-6 border-t border-white/8 in-[.light]:border-gray-100 bg-linear-to-b from-black/60 to-black/80 in-[.light]:from-gray-50 in-[.light]:to-gray-100">
        <button
          onClick={onReset}
          className="w-full h-14 rounded-3xl font-black text-sm tracking-[0.2em] uppercase
            bg-linear-to-r from-zinc-50/95 to-zinc-100 text-black
            border-2 border-transparent shadow-2xl shadow-black/30
            hover:from-gold/90 hover:to-gold hover:text-black/90 hover:shadow-gold/25
            hover:shadow-[0_20px_40px_rgba(212,175,55,0.3)]
            active:scale-[0.98] active:shadow-lg
            transition-all duration-300 cursor-pointer
            backdrop-blur-xl"
        >
          Reiniciar Partida
        </button>
      </div>
    </div>
  );
}
