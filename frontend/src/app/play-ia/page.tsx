"use client";

import React, { useState, useEffect, useRef } from 'react';
import PlayIA from '@/components/game/PlayIA';

/**
 * PlayerBox reutilizado con el mismo estilo de madera clara que Local
 */
function PlayerBox({ name, elo, color, captured, isActive, seconds, isNoTimeMode }: any) {
  const formatTime = (s: number) => {
    if (isNoTimeMode) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${
      isActive 
        ? 'bg-gold/10 border-gold shadow-[0_0_40px_rgba(212,175,55,0.15)] scale-[1.02]' 
        : 'bg-black/40 border-white/5 opacity-80'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-gold animate-ping' : 'bg-zinc-800'}`}></div>
          <div>
            <h4 className="text-white font-black text-[11px] uppercase tracking-widest">{name}</h4>
            <p className="text-gold/60 text-[9px] font-mono font-bold tracking-tighter">RANKING {elo}</p>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full border border-white/10 text-white font-mono text-xs font-bold transition-all ${isActive && !isNoTimeMode ? 'bg-red-500/30 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-black/50'}`}>
          {formatTime(seconds)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-white/10 shadow-inner min-h-[80px] items-center" 
           style={{ 
             backgroundColor: '#d2b48c', 
             backgroundImage: 'linear-gradient(to bottom right, #e5d3b3, #d2b48c)',
             boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' 
           }}>
        {captured.length > 0 ? (
          captured.map((img: string, i: number) => (
            <img key={i} src={img} className="w-10 h-10 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)]" alt="piece" />
          ))
        ) : (
          <span className="text-[9px] uppercase tracking-[0.3em] text-black/30 font-black ml-2 italic">Sin bajas</span>
        )}
      </div>
    </div>
  );
}

export default function PlayIAPage() {
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("TU TURNO");
  const [capturedW, setCapturedW] = useState<string[]>([]);
  const [capturedB, setCapturedB] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(5);
  const [resetKey, setResetKey] = useState(0);
  
  const [timeW, setTimeW] = useState(600);
  const [timeB, setTimeB] = useState(600);
  const [isNoTimeMode, setIsNoTimeMode] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNoTimeMode || !gameStarted || status.includes("MATE")) return;
    const timer = setInterval(() => {
      if (status.includes("TU TURNO") || status.includes("BLANCAS")) setTimeW(prev => (prev > 0 ? prev - 1 : 0));
      else if (status.includes("IA") || status.includes("NEGRAS")) setTimeB(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [status, gameStarted, isNoTimeMode]);

  const movePairs = history.reduce((acc: string[][], move, i) => {
    if (i % 2 === 0) acc.push([move]);
    else acc[acc.length - 1].push(move);
    return acc;
  }, []);

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-4 xl:p-10 font-sans selection:bg-gold/30">
      <div className="max-w-[1700px] mx-auto grid grid-cols-12 gap-10 items-start">
        
        {/* COLUMNA IZQUIERDA: IA ENGINE */}
        <div className="col-span-12 xl:col-span-3 space-y-8">
          <PlayerBox 
            name="Einstein IA" elo={difficulty === 15 ? 3200 : difficulty === 5 ? 1800 : 800} color="NEGRAS" captured={capturedW} 
            isActive={status.includes("IA") || status.includes("NEGRAS")} seconds={timeB} isNoTimeMode={isNoTimeMode}
          />
          
          <div className="flex flex-col gap-6">
            <div className="chess-panel border-gold/20 bg-gradient-to-b from-gold/5 to-transparent py-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
              <p className="text-center text-gold text-[9px] tracking-[0.8em] font-black uppercase mb-3">Live Engine Analysis</p>
              <h2 className="text-center text-4xl font-cinzel text-white italic tracking-tighter drop-shadow-lg leading-tight uppercase">
                {status}
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-[9px] text-center text-zinc-500 font-black tracking-widest uppercase">Nivel de dificultad</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 5, 15].map((lvl) => (
                  <button 
                    key={lvl}
                    onClick={() => { setDifficulty(lvl); setResetKey(k => k + 1); }}
                    className={`py-2 rounded-lg border text-[10px] font-black transition-all ${difficulty === lvl ? 'bg-gold text-black border-gold' : 'bg-black border-white/10 text-zinc-500 hover:border-gold/50'}`}
                  >
                    {lvl === 1 ? 'NOVEL' : lvl === 5 ? 'MAESTRO' : 'DEMONIO'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PlayerBox 
            name="Usuario Local" elo={1850} color="BLANCAS" captured={capturedB} 
            isActive={status.includes("TU TURNO") || status.includes("BLANCAS")} seconds={timeW} isNoTimeMode={isNoTimeMode}
          />
        </div>

        {/* COLUMNA CENTRAL: EL TABLERO */}
        <div className="col-span-12 xl:col-span-6 flex flex-col items-center">
          <PlayIA 
            difficulty={difficulty}
            resetSignal={resetKey}
            onGameStateChange={(s) => {
              setStatus(s);
              if (!gameStarted) setGameStarted(true);
            }}
            onMove={(h, cw, cb) => {
              setHistory([...h]);
              setCapturedW(cw);
              setCapturedB(cb);
            }}
          />
        </div>

        {/* COLUMNA DERECHA: LOG */}
        <div className="col-span-12 xl:col-span-3 h-[min(85vw,750px)]">
          <div className="history-container-premium bg-[#050505] h-full flex flex-col border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-gold/20 bg-gold/5 shrink-0 flex justify-between items-center">
              <span className="text-gold text-[11px] font-black tracking-[0.4em] uppercase">AI Battle History</span>
            </div>
            <div ref={scrollRef} className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-2">
              {movePairs.map((pair, i) => (
                <div key={i} className="flex items-center p-3 rounded-xl border border-white/5 hover:bg-gold/5 transition-all group">
                  <span className="move-number">{i + 1}</span>
                  <div className="flex-grow grid grid-cols-2 gap-4">
                    <span className="text-white font-mono text-sm font-bold group-hover:text-gold">{pair[0]}</span>
                    <span className="text-zinc-500 font-mono text-sm">{pair[1] || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gold/5 border-t border-gold/20">
               <button 
                onClick={() => {
                  setResetKey(k => k + 1);
                  setHistory([]);
                  setCapturedW([]);
                  setCapturedB([]);
                  setTimeW(600);
                  setTimeB(600);
                  setGameStarted(false);
                }} 
                className="btn-gold !py-4"
               >
                 NUEVO DESAFÍO
               </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}