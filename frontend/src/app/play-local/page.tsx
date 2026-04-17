"use client";

import React, { useState, useEffect, useRef } from 'react';
import PlayLocal from '@/components/game/PlayLocal';

const TIME_MODES = [
  { label: "Bullet", options: [{ n: "1+0", m: 60, i: 0 }, { n: "1+1", m: 60, i: 1 }, { n: "2+1", m: 120, i: 1 }] },
  { label: "Blitz", options: [{ n: "3+0", m: 180, i: 0 }, { n: "3+2", m: 180, i: 2 }, { n: "5+3", m: 300, i: 3 }] },
  { label: "Rápidas", options: [{ n: "10+0", m: 600, i: 0 }, { n: "15+10", m: 900, i: 10 }] },
];

function PlayerBox({ name, captured, isActive, seconds, isNoTimeMode }: any) {
  const formatTime = (s: number) => {
    if (isNoTimeMode) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-5 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${
      isActive 
        ? 'bg-gold/20 border-gold shadow-[0_0_40px_rgba(212,175,55,0.25)] scale-[1.02] z-10' 
        : 'bg-zinc-900/40 border-white/10 opacity-80 backdrop-blur-xl' 
    }`}>
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-gold animate-pulse shadow-[0_0_10px_#d4af37]' : 'bg-zinc-700'}`}></div>
          <h4 className="text-white font-black text-[11px] uppercase tracking-[0.1em] leading-none">{name}</h4>
        </div>
        <div className={`px-4 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all ${
          isActive && !isNoTimeMode ? 'bg-red-500/40 border-red-500/50 text-red-200' : 'bg-black/60 border-white/10 text-white/60'
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

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  useEffect(() => {
    if (isNoTimeMode || !gameStarted || status.includes("MATE") || status.includes("TABLAS")) return;
    const timer = setInterval(() => {
      if (status.includes("BLANCAS")) setTimeW(prev => (prev > 0 ? prev - 1 : 0));
      else if (status.includes("NEGRAS")) setTimeB(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [status, gameStarted, isNoTimeMode]);

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

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ moveNum: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] || null });
  }

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-6 xl:p-10 font-sans selection:bg-gold/30 relative overflow-hidden">
      
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050508]"></div>
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/20 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-gold/15 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto grid grid-cols-12 gap-8 items-start">
        
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-2">
          <PlayerBox 
            name="Usuario Local 2" captured={capturedW} 
            isActive={gameStarted && status.includes("NEGRAS")} 
            seconds={timeB} isNoTimeMode={isNoTimeMode}
          />
          
          <div className="bg-zinc-950/60 border border-white/10 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-[10px] font-black tracking-[0.25em] text-white uppercase mb-3 px-1">Elegir Bando</p>
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setBoardOrientation('w')}
                  disabled={gameStarted}
                  className={`py-2 rounded-xl text-[9px] font-black transition-all border-2 cursor-pointer ${boardOrientation === 'w' ? 'bg-zinc-100 text-black border-transparent shadow-lg' : 'text-zinc-500 border-transparent hover:bg-white/5'}`}
                >
                  BLANCAS
                </button>
                <button 
                  onClick={() => setBoardOrientation('b')}
                  disabled={gameStarted}
                  className={`py-2 rounded-xl text-[9px] font-black transition-all border-2 cursor-pointer ${boardOrientation === 'b' ? 'bg-zinc-800 text-white shadow-lg border-white/10' : 'text-zinc-500 border-transparent hover:bg-white/5'}`}
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
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${isNoTimeMode ? 'bg-gold/10 border-gold text-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Modo Sin Tiempo</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isNoTimeMode ? 'bg-gold' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isNoTimeMode ? 'left-6' : 'left-1'}`}></div>
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
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${currentMode.n === opt.n && !isNoTimeMode ? 'bg-gold text-black border-gold' : 'bg-zinc-800 border-white/10 hover:border-white/30'}`}
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
            isActive={gameStarted && status.includes("BLANCAS")} 
            seconds={timeW} isNoTimeMode={isNoTimeMode}
          />
        </div>

        <div className="col-span-12 xl:col-span-6 flex justify-center">
          <PlayLocal 
            resetSignal={resetKey} onGameStateChange={setStatus} 
            onMove={handleMove} orientation={boardOrientation} 
          />
        </div>

        <div className="col-span-12 xl:col-span-3 h-[min(85vw,785px)]">
          <div className="bg-[#050505]/80 h-full flex flex-col border-2 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative backdrop-blur-xl">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
              <span className="text-gold/90 text-[10px] font-black tracking-[0.4em] uppercase">Historial de movimientos</span>
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_orange] animate-pulse"></div>
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
               <button onClick={() => { setResetKey(k => k + 1); setHistory([]); setCapturedW([]); setCapturedB([]); setTimeW(currentMode.m); setTimeB(currentMode.m); setGameStarted(false); setStatus("TURNO BLANCAS"); }} 
               className="w-full bg-zinc-50 text-black py-4 rounded-2xl font-black text-[10px] tracking-[0.25em] uppercase hover:bg-gold transition-all duration-500 cursor-pointer">
                 Reiniciar Partida
               </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}