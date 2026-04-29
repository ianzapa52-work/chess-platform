"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayIA from '@/components/game/PlayIA';
import GameHistory from '@/components/ui/GameHistory';

const COUNTDOWN_OPTIONS = [
  { n: "1 min",  m: 60  },
  { n: "2 min",  m: 120 },
  { n: "3 min",  m: 180 },
  { n: "5 min",  m: 300 },
  { n: "10 min", m: 600 },
  { n: "15 min", m: 900 },
];

function IABox({ captured }: { captured: string[] }) {
  return (
    <div className="p-5 rounded-[2rem] border border-white/[0.08] bg-black/40 backdrop-blur-xl shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
            <span className="text-lg leading-none">♟</span>
          </div>
          <div>
            <p className="text-white font-black text-[11px] uppercase tracking-widest leading-none mb-1">Einstein IA</p>
            <p className="text-[8px] text-zinc-500 font-bold tracking-tight">Stockfish · Sin reloj</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/[0.06] font-mono text-sm font-black text-zinc-500 tracking-widest">
          ∞
        </div>
      </div>
      <div className="h-px bg-white/[0.05] mb-3" />
      <div className="p-3 rounded-2xl border border-black/30 shadow-inner min-h-[52px] flex items-center bg-gradient-to-br from-[#d2b48c] to-[#a68a64]">
        <div className="flex flex-wrap gap-1 max-w-full">
          {captured.length > 0 ? (
            captured.map((img, i) => (
              <img key={i} src={img} className="w-5 h-5 object-contain drop-shadow-md" alt="" />
            ))
          ) : (
            <span className="text-[8px] uppercase tracking-[0.2em] text-black/40 font-black italic ml-1">Sin bajas</span>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerBox({
  captured, isActive, seconds, showClock, isTimedOut,
}: {
  captured: string[]; isActive: boolean; seconds: number;
  showClock: boolean; isTimedOut: boolean;
}) {
  const mins    = Math.floor(seconds / 60);
  const secs    = Math.floor(seconds % 60);
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isLow     = showClock && seconds <= 30 && !isTimedOut;
  const isVeryLow = showClock && seconds <= 10 && !isTimedOut;

  return (
    <div className={`p-5 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden ${
      isTimedOut
        ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
        : isActive
          ? 'bg-black/50 border-gold shadow-[0_0_40px_rgba(212,175,55,0.12)]'
          : 'bg-black/40 border-white/[0.06]'
    }`}>
      {isActive && !isTimedOut && <div className="absolute inset-0 bg-gold/[0.03] pointer-events-none" />}
      {isTimedOut && <div className="absolute inset-0 bg-red-500/[0.05] pointer-events-none" />}

      <div className="relative flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-500 ${
            isTimedOut ? 'bg-red-500/20 border-red-500/40'
              : isActive ? 'bg-gold/20 border-gold/40'
              : 'bg-zinc-800/80 border-white/10'
          }`}>
            <span className={`text-lg leading-none transition-all duration-500 ${
              isTimedOut ? 'text-red-400' : isActive ? 'text-gold' : 'text-zinc-500'
            }`}>♙</span>
          </div>
          <div>
            <p className={`font-black text-[11px] uppercase tracking-widest leading-none mb-0.5 transition-colors duration-500 ${
              isTimedOut ? 'text-red-400' : isActive ? 'text-white' : 'text-zinc-400'
            }`}>
              {isTimedOut ? '¡Tiempo!' : 'Tú'}
            </p>
            <p className="text-[8px] text-zinc-600 font-bold tracking-tight">Jugador local</p>
          </div>
        </div>

        {showClock && (
          <div className={`relative px-4 py-2 rounded-xl border-2 font-mono font-black text-lg tracking-tighter transition-all duration-300 ${
            isTimedOut
              ? 'bg-red-500/20 border-red-500/60 text-red-300'
              : isVeryLow
                ? 'bg-red-500/20 border-red-500/60 text-red-300 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                : isLow
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : isActive
                    ? 'bg-gold/15 border-gold/50 text-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'bg-black/60 border-white/5 text-zinc-600'
          }`}>
            {timeStr}
          </div>
        )}
      </div>

      <div className="h-px bg-white/[0.05] mb-3" />
      <div className="p-3 rounded-2xl border border-black/30 shadow-inner min-h-[52px] flex items-center bg-gradient-to-br from-[#d2b48c] to-[#a68a64]">
        <div className="flex flex-wrap gap-1 max-w-full">
          {captured.length > 0 ? (
            captured.map((img, i) => (
              <img key={i} src={img} className="w-5 h-5 object-contain drop-shadow-md" alt="" />
            ))
          ) : (
            <span className="text-[8px] uppercase tracking-[0.2em] text-black/40 font-black italic ml-1">Sin bajas</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeoutOverlay({ onReset }: { onReset: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent" />

      <div className="relative flex flex-col items-center gap-6 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50
          flex items-center justify-center
          shadow-[0_0_60px_rgba(239,68,68,0.4),0_0_120px_rgba(239,68,68,0.15)]">
          <span className="text-4xl">⏱</span>
        </div>

        <div className="space-y-2">
          <p className="text-red-300 font-black text-2xl uppercase tracking-[0.15em] leading-none drop-shadow-lg">
            Tiempo agotado
          </p>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            La IA gana por tiempo
          </p>
        </div>

        <button
          onClick={onReset}
          className="px-8 py-3.5 rounded-2xl font-black text-[11px] tracking-[0.25em] uppercase
            bg-white text-black border border-transparent
            hover:bg-gold
            transition-colors duration-200 cursor-pointer
            shadow-[0_0_30px_rgba(255,255,255,0.12)]"
        >
          Nueva partida
        </button>
      </div>
    </div>
  );
}

export default function PlayIAPage() {
  const [history, setHistory]         = useState<string[]>([]);
  const [status, setStatus]           = useState("TU TURNO");
  const [capturedW, setCapturedW]     = useState<string[]>([]);
  const [capturedB, setCapturedB]     = useState<string[]>([]);
  const [resetKey, setResetKey]       = useState(0);
  const [difficulty, setDifficulty]   = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [isTimedOut, setIsTimedOut]   = useState(false);

  const [mode, setMode]             = useState<'free' | 'countdown'>('free');
  const [selectedCD, setSelectedCD] = useState(COUNTDOWN_OPTIONS[4]);
  const [timeW, setTimeW]           = useState(selectedCD.m);

  const cdPanelRef   = useRef<HTMLDivElement>(null);
  const [cdHeight, setCdHeight] = useState(0);

  const statusRef     = useRef(status);
  const modeRef       = useRef(mode);
  const selectedCDRef = useRef(selectedCD);

  useEffect(() => { statusRef.current     = status;     }, [status]);
  useEffect(() => { modeRef.current       = mode;       }, [mode]);
  useEffect(() => { selectedCDRef.current = selectedCD; }, [selectedCD]);

  useEffect(() => {
    if (!cdPanelRef.current) return;
    const measure = () => setCdHeight(cdPanelRef.current?.scrollHeight ?? 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cdPanelRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (modeRef.current !== 'countdown' || !gameStarted) return;

    const timer = setInterval(() => {
      const s = statusRef.current;
      if (s.includes("MATE") || s.includes("TABLAS") || s.includes("TIEMPO")) return;
      if (s !== "TU TURNO") return;

      setTimeW(prev => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          const ns = "TIEMPO AGOTADO — DERROTA";
          setStatus(ns);
          statusRef.current = ns;
          setIsTimedOut(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted]);

  const handleMove = useCallback((newHistory: string[], cw: string[], cb: string[]) => {
    if (!gameStarted) setGameStarted(true);
    setHistory(newHistory);
    setCapturedW(cw);
    setCapturedB(cb);
  }, [gameStarted]);

  const handleGameStateChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  }, []);

  const resetGame = useCallback(() => {
    setResetKey(k => k + 1);
    setHistory([]);
    setCapturedW([]);
    setCapturedB([]);
    setTimeW(selectedCDRef.current.m);
    setGameStarted(false);
    setIsTimedOut(false);
    const ns = "TU TURNO";
    setStatus(ns);
    statusRef.current = ns;
  }, []);

  const isGameOver = status.includes("MATE") || status.includes("TABLAS") || status.includes("TIEMPO") || isTimedOut;

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-6 xl:p-10 font-sans selection:bg-gold/30 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#06010a]" />
        <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[85%] h-[75%]
          bg-red-500/35 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute top-[5%] right-[-10%] w-[45%] h-[55%]
          bg-rose-600/25 blur-[160px] rounded-full animate-pulse [animation-delay:1.2s]" />
        <div className="absolute bottom-[-25%] left-1/2 -translate-x-1/2 w-[90%] h-[70%]
          bg-red-800/30 blur-[200px] rounded-full animate-pulse [animation-delay:2.5s]" />
        <div className="absolute inset-0 opacity-[0.18]
          [background-image:radial-gradient(#ffffff_1.5px,transparent_1.5px)]
          [background-size:32px_32px]" />
        <div className="absolute inset-0 opacity-[0.22] mix-blend-overlay
          bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto grid grid-cols-12 gap-6 xl:gap-8 items-start">
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-3">
          <IABox captured={capturedW} />

          <div className="bg-black/50 border border-white/[0.07] rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl space-y-5">
            <div>
              <p className="text-[8px] font-black tracking-[0.35em] text-zinc-600 uppercase mb-2.5">Nivel IA</p>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/60 rounded-2xl border border-white/15">
                {([
                  { lvl: 1,  label: 'Novato',      sub: '< 1400',     color: 'emerald' },
                  { lvl: 5,  label: 'Aficionado B', sub: '1400', color: 'blue'    },
                  { lvl: 7,  label: 'Aficionado A', sub: '1800', color: 'indigo'  },
                  { lvl: 10, label: 'Experto',      sub: '2000', color: 'purple'  },
                  { lvl: 13, label: 'FM',           sub: '2300', color: 'gold'    },
                  { lvl: 15, label: 'IM',           sub: '2400', color: 'gold'    },
                  { lvl: 18, label: 'GM',           sub: '2500',       color: 'rose'    },
                  { lvl: 20, label: 'ORÁCULO',    sub: '3200',       color: 'red'     },
                ] as const).map(({ lvl, label, sub, color }) => {
                  const isActive = difficulty === lvl;
                  const colorMap: any = {
                    emerald: isActive ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'text-zinc-500',
                    blue: isActive ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'text-zinc-500',
                    indigo: isActive ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'text-zinc-500',
                    purple: isActive ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'text-zinc-500',
                    gold: isActive ? 'bg-gold/20 border-gold/40 text-gold' : 'text-zinc-500',
                    rose: isActive ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'text-zinc-500',
                    red: isActive ? 'bg-red-600/30 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'text-zinc-500',
                  };

                  return (
                    <button
                      key={lvl}
                      disabled={gameStarted}
                      onClick={() => { setDifficulty(lvl); resetGame(); }}
                      className={`
                        px-3 py-1.5 rounded-xl flex flex-col items-start
                        transition-all duration-200 border
                        ${gameStarted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        ${isActive ? colorMap[color] : 'border-white/10 hover:bg-white/5 hover:border-white/25'}
                      `}
                    >
                      <p className={`text-xs font-black leading-tight mb-0.5 ${isActive ? 'text-inherit' : 'text-zinc-500'}`}>
                        {label}
                      </p>
                      <p className={`text-[9px] font-mono leading-none ${isActive ? 'opacity-70' : 'text-zinc-600'}`}>
                        {sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-white/[0.04]" />

            <div>
              <p className="text-[8px] font-black tracking-[0.35em] text-zinc-600 uppercase mb-2.5">Tu tiempo</p>
              <div className="flex gap-1.5 p-1 bg-black/60 rounded-2xl border border-white/15">
                <button
                  disabled={gameStarted}
                  onClick={() => { setMode('free'); modeRef.current = 'free'; resetGame(); }}
                  className={`
                    flex-1 py-3 rounded-xl
                    transition-colors duration-200 flex flex-col items-center gap-1
                    ${gameStarted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    ${mode === 'free'
                      ? 'bg-zinc-700/50 border border-white/20'
                      : 'border border-white/10 hover:bg-white/5 hover:border-white/20'
                    }
                  `}
                >
                  <span className={`text-xl font-black leading-none ${mode === 'free' ? 'text-white' : 'text-zinc-600'}`}>∞</span>
                  <span className={`text-[9px] font-black tracking-wider ${mode === 'free' ? 'text-white/70' : 'text-zinc-600'}`}>Sin límite</span>
                </button>
                <button
                  disabled={gameStarted}
                  onClick={() => { setMode('countdown'); modeRef.current = 'countdown'; resetGame(); }}
                  className={`
                    flex-1 py-3 rounded-xl
                    transition-colors duration-200 flex flex-col items-center gap-1
                    ${gameStarted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    ${mode === 'countdown'
                      ? 'bg-red-500/20 border-red-500/60'
                      : 'border border-white/10 hover:bg-white/5 hover:border-white/20'
                    }
                  `}
                >
                  <span className={`text-xl font-black leading-none ${mode === 'countdown' ? 'text-red-300' : 'text-zinc-600'}`}>⏱</span>
                  <span className={`text-[9px] font-black tracking-wider ${mode === 'countdown' ? 'text-red-300/80' : 'text-zinc-600'}`}>Contrarreloj</span>
                </button>
              </div>
            </div>

            <div
              style={{
                height: (mode === 'countdown' && !gameStarted) ? cdHeight : 0,
                overflow: 'hidden',
                transition: 'height 280ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div ref={cdPanelRef}>
                <div className="grid grid-cols-3 gap-1">
                  {COUNTDOWN_OPTIONS.map((opt) => (
                    <button
                      key={opt.n}
                      disabled={gameStarted}
                      onClick={() => {
                        setSelectedCD(opt);
                        selectedCDRef.current = opt;
                        setTimeW(opt.m);
                      }}
                      className={`
                        py-1 rounded-lg text-[9px] font-bold
                        transition-colors duration-200 border
                        ${gameStarted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        ${selectedCD.n === opt.n
                          ? 'bg-red-500/20 border-red-500/60 text-red-300'
                          : 'bg-black/30 border-white/20 text-zinc-500 hover:border-white/35 hover:text-zinc-400'
                        }
                      `}
                    >
                      {opt.n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <PlayerBox
            captured={capturedB}
            isActive={gameStarted && status === "TU TURNO" && !isTimedOut}
            seconds={timeW}
            showClock={mode === 'countdown'}
            isTimedOut={isTimedOut}
          />
        </div>

        <div className="col-span-12 xl:col-span-6 flex flex-col items-center gap-4">
          <div className="relative w-full flex justify-center">
            <PlayIA
              difficulty={difficulty}
              resetSignal={resetKey}
              onGameStateChange={handleGameStateChange}
              onMove={handleMove}
              orientation="w"
            />
            {isTimedOut && <TimeoutOverlay onReset={resetGame} />}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 h-[min(85vw,785px)]">
          <GameHistory
            history={history}
            status={status}
            isGameOver={isGameOver}
            gameStarted={gameStarted}
            onReset={resetGame}
            orientation="w"
          />
        </div>
      </div>
    </main>
  );
}