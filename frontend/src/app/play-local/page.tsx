"use client";

import React, { useState, useEffect, useRef } from 'react';
import PlayLocal from '@/components/game/PlayLocal';

const TIME_MODES = [
  { label: "Bullet", options: [{ n: "1+0", m: 60, i: 0 }, { n: "1+1", m: 60, i: 1 }, { n: "2+1", m: 120, i: 1 }] },
  { label: "Blitz", options: [{ n: "3+0", m: 180, i: 0 }, { n: "3+2", m: 180, i: 2 }, { n: "5+3", m: 300, i: 3 }] },
  { label: "Rápidas", options: [{ n: "10+0", m: 600, i: 0 }, { n: "15+10", m: 900, i: 10 }] },
];

function PlayerBox({ name, elo, captured, isActive, seconds, isNoTimeMode }: any) {
  const formatTime = (s: number) => {
    if (isNoTimeMode) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-5 rounded-[2rem] border transition-all duration-500 ${
      isActive 
        ? 'bg-gold/15 border-gold shadow-[0_0_35px_rgba(212,175,55,0.2)] scale-[1.02] z-10' 
        : 'bg-zinc-900/90 border-white/10 opacity-70' 
    }`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-gold animate-pulse shadow-[0_0_10px_#d4af37]' : 'bg-zinc-700'}`}></div>
          <h4 className="text-white font-black text-[11px] uppercase tracking-[0.1em] leading-none">{name}</h4>
        </div>
        <div className={`px-4 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all ${
          isActive && !isNoTimeMode ? 'bg-red-500/30 border-red-500/50 text-red-300' : 'bg-black/60 border-white/10 text-white/60'
        }`}>
          {formatTime(seconds)}
        </div>
      </div>

      <div className="p-3 rounded-2xl border border-black/30 shadow-inner min-h-[65px] flex items-center bg-gradient-to-br from-[#d2b48c] to-[#a68a64]">
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isNoTimeMode || !gameStarted || status.includes("MATE")) return;
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
      if (status.includes("BLANCAS")) setTimeB(prev => prev + currentMode.i);
      else setTimeW(prev => prev + currentMode.i);
    }
    if (!gameStarted) setGameStarted(true);
    
    setHistory(newHistory); 
    setCapturedW(cw);
    setCapturedB(cb);
  };

  // --- LÓGICA DE AGRUPACIÓN CORREGIDA ---
  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      moveNum: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] || null
    });
  }

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-6 xl:p-10 font-sans selection:bg-gold/30">
      <div className="max-w-[1700px] mx-auto grid grid-cols-12 gap-8 items-start">
        
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-2">
          <PlayerBox 
            name="Usuario local 2" elo={2800} captured={capturedW} 
            isActive={gameStarted && status.includes("NEGRAS")} seconds={timeB} isNoTimeMode={isNoTimeMode}
          />
          
          <div className="bg-zinc-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl backdrop-blur-sm">
            <div className="mb-6">
              <p className="text-[10px] font-black tracking-[0.25em] text-white uppercase mb-3 px-1">Elegir Bando</p>
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setBoardOrientation('w')}
                  disabled={gameStarted}
                  className={`py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${
                    boardOrientation === 'w' 
                      ? 'bg-zinc-100 text-black border-transparent shadow-lg' 
                      : 'text-zinc-500 border-transparent hover:bg-white/5 disabled:opacity-30'
                  }`}
                >
                  BLANCAS
                </button>
                <button 
                  onClick={() => setBoardOrientation('b')}
                  disabled={gameStarted}
                  className={`py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${
                    boardOrientation === 'b' 
                      ? 'bg-zinc-800 text-white shadow-lg border-white/10' 
                      : 'text-zinc-500 border-transparent hover:bg-white/5 disabled:opacity-30'
                  }`}
                >
                  NEGRAS
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5 px-1">
              <div className="w-1.5 h-4 bg-gold rounded-full shadow-[0_0_5px_#d4af37]"></div>
              <p className="text-[10px] font-black tracking-[0.25em] text-white uppercase">Control de Tiempo</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {TIME_MODES.map((category) => (
                <div key={category.label} className="flex items-center justify-between gap-3 bg-black/50 p-3 rounded-2xl border border-white/[0.06]">
                  <span className="text-[9px] text-zinc-400 uppercase font-black tracking-tight w-14">{category.label}</span>
                  <div className="flex gap-1.5">
                    {category.options.map((opt) => (
                      <button
                        key={opt.n}
                        disabled={gameStarted}
                        onClick={() => selectMode(opt)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                          currentMode.n === opt.n && !isNoTimeMode
                            ? 'bg-gold text-black border-gold shadow-[0_0_12px_rgba(212,175,55,0.3)]' 
                            : 'bg-zinc-800 border-white/10 hover:border-white/30 disabled:opacity-30'
                        }`}
                      >
                        {opt.n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              disabled={gameStarted}
              onClick={() => setIsNoTimeMode(!isNoTimeMode)}
              className={`w-full mt-5 py-4 rounded-2xl border font-black text-[9px] tracking-[0.3em] uppercase transition-all duration-300 ${
                isNoTimeMode 
                  ? 'bg-white/10 border-white/20 text-white shadow-inner' 
                  : 'bg-black/60 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
              }`}
            >
              {isNoTimeMode ? "⏳ RELOJ OFF" : "♾️ MODO INFINITO"}
            </button>
          </div>

          <PlayerBox 
            name="Usuario Local" elo={1850} captured={capturedB} 
            isActive={gameStarted && status.includes("BLANCAS")} seconds={timeW} isNoTimeMode={isNoTimeMode}
          />
        </div>

        <div className="col-span-12 xl:col-span-6 flex justify-center">
          <PlayLocal 
            resetSignal={resetKey} 
            onGameStateChange={setStatus} 
            onMove={handleMove}
            orientation={boardOrientation} 
          />
        </div>

        {/* COLUMNA HISTORIAL ACTUALIZADA */}
        <div className="col-span-12 xl:col-span-3 h-[min(85vw,785px)]">
          <div className="bg-[#050505] h-full flex flex-col border-2 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
              <span className="text-gold/90 text-[10px] font-black tracking-[0.4em] uppercase">Historial</span>
              <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_10px_red] animate-pulse"></div>
            </div>
            
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-black/30">
              {rows.map((row) => (
                <div key={row.moveNum} className="grid grid-cols-[30px_1fr_1fr] gap-3 mb-2 items-center p-2 rounded-xl hover:bg-white/[0.04] transition-all border-b border-white/[0.02]">
                  <span className="font-mono text-[10px] text-zinc-600 font-bold">{row.moveNum}.</span>
                  
                  {/* Celda Blancas */}
                  <div className="bg-white/5 rounded-lg py-1.5 px-3 border border-white/5 text-center">
                    <span className="text-zinc-100 font-mono text-sm font-bold tracking-tight">
                      {row.white}
                    </span>
                  </div>
                  
                  {/* Celda Negras */}
                  <div className={`rounded-lg py-1.5 px-3 text-center ${row.black ? 'bg-zinc-800/40 border border-white/5' : ''}`}>
                    <span className="text-zinc-400 font-mono text-sm tracking-tight">
                      {row.black || ""}
                    </span>
                  </div>
                </div>
              ))}
              
              {history.length === 0 && (
                <div className="h-full flex items-center justify-center opacity-20 italic text-[10px] uppercase tracking-widest">
                  Esperando movimientos...
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-black">
               <button 
                onClick={() => {
                  setResetKey(k => k + 1);
                  setHistory([]);
                  setCapturedW([]);
                  setCapturedB([]);
                  setTimeW(currentMode.m);
                  setTimeB(currentMode.m);
                  setGameStarted(false);
                  setStatus("TURNO BLANCAS");
                }} 
                className="w-full bg-zinc-50 text-black py-4 rounded-2xl font-black text-[10px] tracking-[0.25em] uppercase hover:bg-gold hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all duration-500"
               >
                 Reiniciar Batalla
               </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4af37; }
      `}</style>
    </main>
  );
}