"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface GameEndModalProps {
  status: string;
  myColor: 'w' | 'b';
  eloChange: number | null;
  myElo: string;
  opponentElo: string;
  myName: string;
  opponentName: string;
  moveCount: number;
  timeMode: string;
  onNewGame: () => void;
}

const OVERLAY_CONFIGS = {
  win:  {
    glow: "rgba(212,175,55,0.4)",
    ring: "#D4AF37",
    label: "text-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]",
    bg: "from-[#0a0800]/95 via-[#14100a]/95 to-[#0a0800]/95",
    bgLight: "from-amber-50/98 via-yellow-50/98 to-amber-50/98",
    emoji: "👑"
  },
  loss: {
    glow: "rgba(239,68,68,0.3)",
    ring: "#ef4444",
    label: "text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]",
    bg: "from-[#0a0202]/95 via-[#120808]/95 to-[#0a0202]/95",
    bgLight: "from-red-50/98 via-rose-50/98 to-red-50/98",
    emoji: "💥"
  },
  draw: {
    glow: "rgba(148,163,184,0.25)",
    ring: "#94a3b8",
    label: "text-slate-300 drop-shadow-[0_0_20px_rgba(148,163,184,0.5)]",
    bg: "from-[#040406]/95 via-[#0c0c10]/95 to-[#040406]/95",
    bgLight: "from-slate-50/98 via-gray-50/98 to-slate-50/98",
    emoji: "🤝"
  },
} as const;

function parseResult(status: string, myColor: 'w' | 'b', eloChange: number | null) {
  const s = status.toUpperCase();
  if (s.includes("TABLAS")) return { outcome: "draw" as const, headline: "¡TABLAS!", sub: extractReason(status) };
  if (eloChange !== null) {
    if (eloChange > 0) return { outcome: "win" as const, headline: "¡VICTORIA!", sub: extractReason(status) };
    if (eloChange < 0) return { outcome: "loss" as const, headline: "DERROTA", sub: extractReason(status) };
  }
  if (s.includes("HAS GANADO") || s.includes("¡HAS GANADO"))
    return { outcome: "win" as const, headline: "¡VICTORIA!", sub: extractReason(status) };
  return { outcome: "loss" as const, headline: "DERROTA", sub: extractReason(status) };
}

function extractReason(status: string) {
  const m = status.match(/\$([^)]+)\$/);
  return m ? m[1] : "";
}

function CelebrationParticles({ outcome }: { outcome: 'win' | 'loss' | 'draw' }) {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  const colors = { win: '#D4AF37', loss: '#ef4444', draw: '#94a3b8' } as const;

  return (
    <>
      {particles.map((i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full animate-celebrate"
          style={{
            left: `${(i * 17.39) % 100}%`,
            top: `${(i * 23.61) % 100}%`,
            backgroundColor: colors[outcome],
            animationDelay: `${(i * 0.13) % 2}s`,
            animationDuration: `${2 + (i * 0.15)}s`
          }}
        />
      ))}
    </>
  );
}

export default function GameEndModal({
  status,
  myColor,
  eloChange,
  myElo,
  opponentElo,
  myName,
  opponentName,
  moveCount,
  timeMode,
  onNewGame,
}: GameEndModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isLight } = useTheme();

  const { outcome, headline, sub } = parseResult(status, myColor, eloChange);
  const cfg = OVERLAY_CONFIGS[outcome];

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 z-50" style={{ display: 'none' }} suppressHydrationWarning />
    );
  }

  return (
    <>
      <style>{`
        @keyframes celebrate {
          0% { opacity: 0; transform: scale(0) translateY(0) rotate(0deg); }
          10% { opacity: 1; transform: scale(1.2) translateY(-20px) rotate(180deg); }
          90% { opacity: 1; transform: scale(0.8) translateY(-100px) rotate(720deg); }
          100% { opacity: 0; transform: scale(0) translateY(-150px) rotate(1080deg); }
        }
        .animate-celebrate { animation: celebrate 5s ease-out infinite; }
      `}</style>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-12' : 'opacity-0 pointer-events-none translate-y-0'
        }`}
        style={{ backdropFilter: 'blur(20px)' }}
        suppressHydrationWarning
      >
        {/* Fondo degradado */}
        <div className={`absolute inset-0 ${isLight ? cfg.bgLight : cfg.bg} opacity-95`} />

        <CelebrationParticles outcome={outcome} />

        {/* Modal */}
        <div
          className={`relative w-full max-w-md mx-4 backdrop-blur-2xl rounded-3xl p-8 md:p-10 transition-all duration-1000 ${
            isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'
          }`}
          style={{
            border: `2px solid ${cfg.ring}40`,
            background: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(4,4,6,0.95)',
            boxShadow: `0 0 100px ${cfg.glow}, inset 0 0 0 1px ${cfg.ring}20`
          }}
          suppressHydrationWarning
        >
          {/* Icono */}
          <div
            className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center text-5xl md:text-6xl border-4 shadow-2xl"
            style={{
              borderColor: `${cfg.ring}50`,
              background: `${cfg.ring}15`,
              boxShadow: `0 0 60px ${cfg.glow}`
            }}
          >
            <span suppressHydrationWarning>{cfg.emoji}</span>
          </div>

          {/* Título */}
          <div className="text-center mb-6 space-y-2">
            <p className={`text-xs md:text-sm tracking-[0.4em] uppercase font-black ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
              Partida Finalizada
            </p>
            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tightest ${
                isLight
                  ? outcome === 'win' ? 'text-gold' : outcome === 'loss' ? 'text-red-500' : 'text-slate-500'
                  : cfg.label
              }`}
              style={{ textShadow: `0 0 50px ${cfg.glow}` }}
              suppressHydrationWarning
            >
              {headline}
            </h1>
            {sub && (
              <p className={`text-xs md:text-sm tracking-[0.3em] uppercase font-bold ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                {sub}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 gap-4 mb-8 p-4 rounded-2xl border ${
            isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/40 border-white/10'
          }`}>
            <div className="text-center">
              <div className={`text-2xl md:text-3xl font-black text-gold`} suppressHydrationWarning>{myName}</div>
              <div className={`text-xs uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Tú</div>
              <div className={`text-lg md:text-xl font-black mt-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{myElo}</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl md:text-3xl font-black ${isLight ? 'text-gray-600' : 'text-zinc-300'}`} suppressHydrationWarning>{opponentName}</div>
              <div className={`text-xs uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Rival</div>
              <div className={`text-lg md:text-xl font-black mt-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{opponentElo}</div>
            </div>
          </div>

          {/* ELO change */}
          {eloChange !== null && (
            <div
              className={`p-4 rounded-2xl mb-8 text-center border-2 font-black text-xl tracking-wide transition-all duration-700 ${
                eloChange >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                  : 'bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              }`}
              suppressHydrationWarning
            >
              {eloChange >= 0 ? `+${eloChange}` : eloChange} ELO
            </div>
          )}

          {/* Botones */}
          <div className="flex">
            <button
              onClick={onNewGame}
              className={`group w-full py-5 px-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer relative overflow-hidden ${
                isLight
                  ? 'bg-gray-900 text-white hover:bg-gold hover:text-black'
                  : 'bg-linear-to-r from-white/90 to-zinc-100 text-black hover:from-white hover:to-zinc-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]'
              }`}
              type="button"
            >
              <span className="relative z-10">Nueva Partida</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-linear-to-r from-transparent via-white/50 to-transparent" />
            </button>
          </div>

          {/* Stats secundarios */}
          <div className={`mt-6 pt-6 border-t text-xs text-center tracking-wide space-y-1 ${
            isLight ? 'border-gray-200 text-gray-500' : 'border-white/10 text-zinc-400'
          }`}>
            <div>{moveCount} movimientos</div>
            <div className={isLight ? 'text-gray-400' : 'text-white/60'}>{timeMode}</div>
          </div>
        </div>
      </div>
    </>
  );
}
