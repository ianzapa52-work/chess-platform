"use client";

import { useEffect, useState } from 'react';

export type GameResult = 'win' | 'loss' | 'draw';

interface GameOverModalProps {
  result: GameResult | null;
  title: string;
  subtitle: string;
  moveCount: number;
  onReset: () => void;
}

function WinIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 drop-shadow-lg" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 36h32M12 36l-4-20 10 8 6-16 6 16 10-8-4 20H12z" />
      <path strokeLinecap="round" d="M16 40h16v4H16z" />
    </svg>
  );
}

function LossIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 drop-shadow-lg" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M24 6c-5 0-9 4-9 9 0 3 1.5 5.5 3.8 7L17 28h14l-1.8-6c2.3-1.5 3.8-4 3.8-7 0-5-4-9-9-9z" />
      <path strokeLinecap="round" d="M18 28h12v3H18zM16 31h16v3H16z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12h6M24 12v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 42l32-32M8 10l32 32" className="opacity-40" />
    </svg>
  );
}

function DrawIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 drop-shadow-lg" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h24M12 28h24" />
      <circle cx="24" cy="24" r="18" strokeDasharray="4 3" />
    </svg>
  );
}

const CONFIG = {
  win: {
    overlay: 'from-amber-950/30 to-zinc-950/95',
    glow: 'rgba(212,175,55,0.18)',
    glowClass: 'bg-gold/15',
    border: 'border-gold/35',
    boxShadow: '0 0 100px rgba(212,175,55,0.18), inset 0 1px 0 rgba(212,175,55,0.15)',
    topLine: 'via-gold/70',
    iconRing: 'border-gold/40 bg-gold/10',
    iconGlow: '0 0 40px rgba(212,175,55,0.5)',
    iconColor: 'text-gold',
    titleColor: 'text-gold',
    btnClass: 'bg-gold text-black hover:bg-white hover:text-black',
    btnLabel: 'Nueva partida',
  },
  loss: {
    overlay: 'from-red-950/30 to-zinc-950/95',
    glow: 'rgba(239,68,68,0.15)',
    glowClass: 'bg-red-600/10',
    border: 'border-red-500/25',
    boxShadow: '0 0 80px rgba(239,68,68,0.12), inset 0 1px 0 rgba(239,68,68,0.1)',
    topLine: 'via-red-500/50',
    iconRing: 'border-red-500/40 bg-red-500/10',
    iconGlow: '0 0 35px rgba(239,68,68,0.4)',
    iconColor: 'text-red-400',
    titleColor: 'text-red-400',
    btnClass: 'bg-zinc-800 text-white hover:bg-red-600 border border-white/10',
    btnLabel: 'Intentar de nuevo',
  },
  draw: {
    overlay: 'from-zinc-800/20 to-zinc-950/95',
    glow: 'rgba(113,113,122,0.12)',
    glowClass: 'bg-zinc-500/8',
    border: 'border-zinc-600/30',
    boxShadow: '0 0 60px rgba(113,113,122,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
    topLine: 'via-zinc-500/50',
    iconRing: 'border-zinc-500/40 bg-zinc-700/20',
    iconGlow: '0 0 30px rgba(113,113,122,0.35)',
    iconColor: 'text-zinc-400',
    titleColor: 'text-zinc-200',
    btnClass: 'bg-zinc-700 text-white hover:bg-white hover:text-black border border-white/10',
    btnLabel: 'Nueva partida',
  },
} as const;

export default function GameOverModal({ result, title, subtitle, moveCount, onReset }: GameOverModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!result) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), 350);
    return () => clearTimeout(t);
  }, [result]);

  if (!result) return null;

  const cfg = CONFIG[result];
  const Icon = result === 'win' ? WinIcon : result === 'loss' ? LossIcon : DrawIcon;

  const handleReset = () => {
    setVisible(false);
    setTimeout(onReset, 250);
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[5px]" onClick={handleReset} />

      {/* Ambient glow orb */}
      <div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none ${cfg.glowClass} transition-all duration-1000`}
        style={{ background: cfg.glow }}
      />

      {/* Card */}
      <div
        className={`
          relative z-10 flex flex-col items-center gap-6 px-10 py-10
          w-full max-w-[400px] mx-4 rounded-[2.5rem]
          bg-gradient-to-b ${cfg.overlay} border ${cfg.border} backdrop-blur-2xl
          transition-all duration-500 ease-out
          ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-6'}
        `}
        style={{ boxShadow: cfg.boxShadow }}
      >
        {/* Top accent line */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-linear-to-r from-transparent ${cfg.topLine} to-transparent`} />

        {/* Icon */}
        <div
          className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${cfg.iconRing}`}
          style={{ boxShadow: cfg.iconGlow }}
        >
          <span className={cfg.iconColor}>
            <Icon />
          </span>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h2 className={`text-4xl font-black uppercase tracking-[0.18em] leading-none ${cfg.titleColor}`}>
            {title}
          </h2>
          <p className="text-zinc-400 text-sm tracking-wide leading-relaxed">{subtitle}</p>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-white/5" />
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-zinc-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 3h6l1 3H8L9 3zm-2 4h10l1 14H6L7 7zm5 2a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
              {moveCount} {moveCount === 1 ? 'jugada' : 'jugadas'}
            </span>
          </div>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Button */}
        <button
          onClick={handleReset}
          className={`
            w-full py-4 rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase
            transition-all duration-200 active:scale-[0.97] cursor-pointer
            ${cfg.btnClass}
          `}
        >
          {cfg.btnLabel}
        </button>
      </div>
    </div>
  );
}
