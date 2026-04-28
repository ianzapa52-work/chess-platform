"use client";

import React, { useState, useEffect, useRef } from 'react';
import PlayLocal from '@/components/game/PlayLocal';

const TIME_MODES = [
  { label: "Bullet", options: [{ n: "1+0", m: 60, i: 0 }, { n: "1+1", m: 60, i: 1 }, { n: "2+1", m: 120, i: 1 }] },
  { label: "Blitz", options: [{ n: "3+0", m: 180, i: 0 }, { n: "3+2", m: 180, i: 2 }, { n: "5+3", m: 300, i: 3 }] },
  { label: "Rápidas", options: [{ n: "10+0", m: 600, i: 0 }, { n: "15+10", m: 900, i: 10 }] },
];

function PlayerBox({ name, captured, isActive, seconds, isNoTimeMode, isTimedOut }: any) {
  const formatTime = (s: number) => {
    if (isNoTimeMode) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-5 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${
      isTimedOut
        ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
        : isActive
          ? 'bg-gold/20 border-gold shadow-[0_0_40px_rgba(212,175,55,0.25)] scale-[1.02] z-10'
          : 'bg-zinc-900/40 border-white/10 opacity-80 backdrop-blur-xl'
    }`}>
      {isTimedOut && <div className="absolute inset-0 bg-red-500/[0.05] pointer-events-none" />}

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            isTimedOut ? 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
              : isActive ? 'bg-gold animate-pulse shadow-[0_0_10px_#d4af37]'
              : 'bg-zinc-700'
          }`} />
          <h4 className={`font-black text-[11px] uppercase tracking-[0.1em] leading-none ${
            isTimedOut ? 'text-red-400' : 'text-white'
          }`}>
            {isTimedOut ? '¡Tiempo!' : name}
          </h4>
        </div>
        <div className={`px-4 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all ${
          isTimedOut
            ? 'bg-red-500/20 border-red-500/50 text-red-300'
            : isActive && !isNoTimeMode
              ? 'bg-red-500/40 border-red-500/50 text-red-200'
              : 'bg-black/60 border-white/10 text-white/60'
        }`}>
          {formatTime(seconds)}
        </div>
      </div>

      <div className="p-3 rounded-2xl border border-black/30 shadow-inner min-h-[65px] flex items-center bg-gradient-to-br from-[#d2b48c] to-[#a68a64] relative z-10">
        <div className="flex flex-wrap gap-1 max-w-full">
          {captured.length > 0 ? (
            captured.map((img: string, i: number) => (
              <img key={i} src={img} className="w-5 h-5 object-contain drop-shadow-md" alt="piece" />
            ))
          ) : (
            <span className="text-[8px] uppercase tracking-[0.2em] text-black/40 font-black italic ml-1">Sin bajas</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Overlay tiempo agotado ────────────────────────────────────────────────────
function TimeoutOverlay({ loser, onReset }: { loser: 'w' | 'b'; onReset: () => void }) {
  const winner = loser === 'w' ? 'Usuario Local 2' : 'Usuario Local 1';
  const loserName = loser === 'w' ? 'Usuario Local 1' : 'Usuario Local 2';

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
          <p className="text-zinc-300 text-[11px] font-bold uppercase tracking-[0.25em]">
            {loserName} pierde por tiempo
          </p>
          <p className="text-gold text-[13px] font-black uppercase tracking-[0.2em] mt-1">
            🏆 {winner} gana
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

export default function LocalPremiumPage() {
  const [boardOrientation, setBoardOrientation] = useState<'w' | 'b'>('w');
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("TURNO BLANCAS");
  const [capturedW, setCapturedW] = useState<string[]>([]);
  const [capturedB, setCapturedB] = useState<string[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [currentMode, setCurrentMode] = useState({ n: "10+0", m: 600, i: 0 });
  const [timeW, setTimeW] = useState(600);
  const [timeB, setTimeB] = useState(600);
  const [isNoTimeMode, setIsNoTimeMode] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  // quién se quedó sin tiempo: 'w' | 'b' | null
  const [timedOutPlayer, setTimedOutPlayer] = useState<'w' | 'b' | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  useEffect(() => {
    if (isNoTimeMode || !gameStarted || status.includes("MATE") || status.includes("TABLAS") || timedOutPlayer) return;

    const timer = setInterval(() => {
      if (status.includes("BLANCAS")) {
        setTimeW(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) setTimedOutPlayer('w');
          return next;
        });
      } else if (status.includes("NEGRAS")) {
        setTimeB(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) setTimedOutPlayer('b');
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status, gameStarted, isNoTimeMode, timedOutPlayer]);

  const selectMode = (mode: any) => {
    if (gameStarted) return;
    setCurrentMode(mode);
    setTimeW(mode.m);
    setTimeB(mode.m);
    setIsNoTimeMode(false);
  };

  const handleMove = (newHistory: string[], cw: string[], cb: string[]) => {
    if (!isNoTimeMode && gameStarted) {
      if (status.includes("BLANCAS")) setTimeW(prev => prev + currentMode.i);
      else if (status.includes("NEGRAS")) setTimeB(prev => prev + currentMode.i);
    }
    if (!gameStarted) setGameStarted(true);
    setHistory(newHistory);
    setCapturedW(cw);
    setCapturedB(cb);
  };

  const resetGame = () => {
    setResetKey(k => k + 1);
    setHistory([]);
    setCapturedW([]);
    setCapturedB([]);
    setTimeW(currentMode.m);
    setTimeB(currentMode.m);
    setGameStarted(false);
    setTimedOutPlayer(null);
    setStatus("TURNO BLANCAS");
  };

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ moveNum: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] || null });
  }

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-6 xl:p-10 font-sans selection:bg-gold/30 relative overflow-hidden">

      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#00050a]" />
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] bg-blue-600/25 blur-[200px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-30%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] bg-blue-900/30 blur-[200px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="absolute inset-0 opacity-[0.2] [background-image:radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto grid grid-cols-12 gap-8 items-start">

        <div className="col-span-12 xl:col-span-3 flex flex-col gap-2">
          <PlayerBox
            name="Usuario Local 2" captured={capturedW}
            isActive={gameStarted && status.includes("NEGRAS") && !timedOutPlayer}
            seconds={timeB} isNoTimeMode={isNoTimeMode}
            isTimedOut={timedOutPlayer === 'b'}
          />

          <div className="bg-zinc-950/60 border border-white/10 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-[10px] font-black tracking-[0.25em] text-white uppercase mb-3 px-1">Elegir Bando</p>
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                <button
                  onClick={() => setBoardOrientation('w')}
                  disabled={gameStarted}
                  className={`py-2 rounded-xl text-[9px] font-black transition-colors duration-200 border-2 cursor-pointer ${boardOrientation === 'w' ? 'bg-zinc-100 text-black border-transparent shadow-lg' : 'text-zinc-500 border-transparent hover:bg-white/5'}`}
                >
                  BLANCAS
                </button>
                <button
                  onClick={() => setBoardOrientation('b')}
                  disabled={gameStarted}
                  className={`py-2 rounded-xl text-[9px] font-black transition-colors duration-200 border-2 cursor-pointer ${boardOrientation === 'b' ? 'bg-zinc-800 text-white shadow-lg border-white/10' : 'text-zinc-500 border-transparent hover:bg-white/5'}`}
                >
                  NEGRAS
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black tracking-[0.25em] text-white uppercase mb-3 px-1">Configuración</p>
              <button
                onClick={() => setIsNoTimeMode(!isNoTimeMode)}
                disabled={gameStarted}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-colors duration-200 cursor-pointer ${isNoTimeMode ? 'bg-gold/10 border-gold text-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Modo Sin Tiempo</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isNoTimeMode ? 'bg-gold' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isNoTimeMode ? 'left-6' : 'left-1'}`} />
                </div>
              </button>
            </div>

            <div className={`grid grid-cols-1 gap-3 transition-opacity duration-300 ${isNoTimeMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
              {TIME_MODES.map((category) => (
                <div key={category.label} className="flex items-center justify-between gap-3 bg-black/50 p-3 rounded-2xl border border-white/[0.06]">
                  <span className="text-[9px] text-zinc-400 uppercase font-black tracking-tight w-12">{category.label}</span>
                  <div className="flex gap-1.5">
                    {category.options.map((opt) => (
                      <button
                        key={opt.n}
                        disabled={gameStarted}
                        onClick={() => selectMode(opt)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors duration-200 border cursor-pointer ${currentMode.n === opt.n && !isNoTimeMode ? 'bg-gold text-black border-gold' : 'bg-zinc-800 border-white/10 hover:border-white/30'}`}
                      >
                        {opt.n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PlayerBox
            name="Usuario Local 1" captured={capturedB}
            isActive={gameStarted && status.includes("BLANCAS") && !timedOutPlayer}
            seconds={timeW} isNoTimeMode={isNoTimeMode}
            isTimedOut={timedOutPlayer === 'w'}
          />
        </div>

        {/* ── Tablero ──────────────────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-6 flex justify-center">
          <div className="relative">
            <PlayLocal
              resetSignal={resetKey} onGameStateChange={setStatus}
              onMove={handleMove} orientation={boardOrientation}
            />
            {/* Overlay — bloquea el tablero cuando el tiempo llega a 0 */}
            {timedOutPlayer && (
              <TimeoutOverlay loser={timedOutPlayer} onReset={resetGame} />
            )}
          </div>
        </div>

        {/* ── Historial ────────────────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-3 h-[min(85vw,785px)]">
          <div className="bg-[#050505]/80 h-full flex flex-col border-2 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative backdrop-blur-xl">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
              <span className="text-gold/90 text-[10px] font-black tracking-[0.4em] uppercase">Historial de movimientos</span>
              <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_#d4af37] animate-pulse" />
            </div>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-black/30">
              {rows.map((row) => (
                <div key={row.moveNum} className="grid grid-cols-[30px_1fr_1fr] gap-3 mb-2 items-center p-2 rounded-xl hover:bg-white/[0.04] transition-all border-b border-white/[0.02]">
                  <span className="font-mono text-[10px] text-zinc-600 font-bold">{row.moveNum}.</span>
                  <div className="bg-white/5 rounded-lg py-1.5 px-3 border border-white/5 text-center text-zinc-100 font-mono text-sm font-bold">{row.white}</div>
                  <div className={`rounded-lg py-1.5 px-3 text-center text-zinc-400 font-mono text-sm ${row.black ? 'bg-zinc-800/40 border border-white/5' : ''}`}>{row.black || ""}</div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/10 bg-black/80">
              <button
                onClick={resetGame}
                className="w-full bg-zinc-50 text-black py-4 rounded-2xl font-black text-[10px] tracking-[0.25em] uppercase hover:bg-gold transition-colors duration-200 cursor-pointer"
              >
                Reiniciar Partida
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}