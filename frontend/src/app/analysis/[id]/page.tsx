"use client";

import React, { useState, useEffect, useRef } from 'react';
import PlayLocal from '@/components/game/PlayLocal';

function AnalysisInfoBox({ name, isActive, evaluation, type }: any) {
  return (
    <div className={`p-5 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${
      isActive 
        ? 'bg-white/10 border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.15)] scale-[1.02] z-10' 
        : 'bg-zinc-900/40 border-white/10 opacity-80 backdrop-blur-xl' 
    }`}>
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white animate-pulse shadow-[0_0_10px_#fff]' : 'bg-zinc-700'}`}></div>
          <h4 className="text-white font-black text-[11px] uppercase tracking-[0.1em] leading-none">{name}</h4>
        </div>
        <div className="px-4 py-1.5 rounded-xl border border-white/10 bg-black/60 text-white/60 font-mono text-xs font-bold">
          {type === 'white' ? 'IA v16' : 'Stockfish'}
        </div>
      </div>

      <div className="p-3 rounded-2xl border border-black/30 shadow-inner min-h-[65px] flex items-center justify-between bg-zinc-950/50 relative z-10 px-6">
        <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-black italic">Evaluación</span>
        <span className={`text-xl font-mono font-black ${evaluation >= 0 ? 'text-white' : 'text-zinc-400'}`}>
            {evaluation > 0 ? `+${evaluation}` : evaluation}
        </span>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [boardOrientation, setBoardOrientation] = useState<'w' | 'b'>('w');
  const [history, setHistory] = useState<string[]>(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]);
  const [status, setStatus] = useState("ANALIZANDO...");
  const [evaluation, setEvaluation] = useState(0.8);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ moveNum: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] || null });
  }

  const evalPercentage = Math.min(Math.max(50 + (evaluation * 10), 5), 95);

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-6 xl:p-10 font-sans selection:bg-white/30 relative overflow-hidden">
      
      {/* FONDO PLATEADO */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050508]"></div>
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        {/* Resplandores Blancos/Plata */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-white/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-white/5 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto grid grid-cols-12 gap-8 items-start">
        
        {/* PANEL IZQUIERDO */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-2">
          <AnalysisInfoBox name="IA ENGINE (NEGRAS)" evaluation={evaluation} isActive={false} type="black" />
          
          <div className="bg-zinc-950/60 border border-white/10 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-[10px] font-black tracking-[0.25em] text-white uppercase mb-3 px-1">Girar Tablero</p>
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => setBoardOrientation('w')} className={`py-2 rounded-xl text-[9px] font-black transition-all border-2 cursor-pointer ${boardOrientation === 'w' ? 'bg-zinc-100 text-black border-transparent shadow-lg' : 'text-zinc-500 border-transparent hover:bg-white/5'}`}>
                  BLANCAS
                </button>
                <button onClick={() => setBoardOrientation('b')} className={`py-2 rounded-xl text-[9px] font-black transition-all border-2 cursor-pointer ${boardOrientation === 'b' ? 'bg-zinc-100 text-black border-transparent shadow-lg' : 'text-zinc-500 border-transparent hover:bg-white/5'}`}>
                  NEGRAS
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black tracking-[0.25em] text-white uppercase mb-3 px-1">Mejor Jugada</p>
              <div className="bg-white/5 border-2 border-white/20 p-4 rounded-2xl flex items-center justify-between group hover:border-white transition-all cursor-pointer">
                  <span className="text-xl font-black text-white font-mono">E2E4</span>
                  <div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-bold">→</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between gap-3 bg-black/50 p-4 rounded-2xl border border-white/[0.06]">
                  <span className="text-[9px] text-zinc-400 uppercase font-black tracking-tight">Profundidad</span>
                  <span className="text-[11px] text-white font-mono font-bold uppercase">24 Capas</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-black/50 p-4 rounded-2xl border border-white/[0.06]">
                  <span className="text-[9px] text-zinc-400 uppercase font-black tracking-tight">Velocidad</span>
                  <span className="text-[11px] text-white font-mono font-bold uppercase">1.4M n/s</span>
                </div>
            </div>
          </div>

          <AnalysisInfoBox name="IA ENGINE (BLANCAS)" evaluation={evaluation} isActive={true} type="white" />
        </div>

        {/* PANEL CENTRAL */}
        <div className="col-span-12 xl:col-span-6 flex gap-6 justify-center items-center h-full self-center">
          <div className="w-10 h-[600px] bg-zinc-900 rounded-full border border-white/10 overflow-hidden relative flex flex-col-reverse shadow-2xl">
            <div 
              className="bg-gradient-to-t from-zinc-400 to-white transition-all duration-700 ease-out shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
              style={{ height: `${evalPercentage}%` }}
            ></div>
            <div className="absolute inset-0 flex flex-col justify-between py-6 items-center pointer-events-none z-10 text-[8px] font-black text-zinc-500 uppercase">
              <span className="rotate-90">Negras</span>
              <div className="h-[2px] w-full bg-white/20"></div>
              <span className="rotate-90">Blancas</span>
            </div>
          </div>

          <div className="flex-grow max-w-[780px]">
            <PlayLocal 
              resetSignal={0} 
              onGameStateChange={setStatus} 
              onMove={() => {}} 
              orientation={boardOrientation} 
            />
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="col-span-12 xl:col-span-3 h-[min(85vw,785px)]">
          <div className="bg-[#050505]/80 h-full flex flex-col border-2 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative backdrop-blur-xl">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
              <span className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-70">Revisión de Análisis</span>
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff] animate-pulse"></div>
            </div>
            
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-black/30">
              {rows.map((row) => (
                <div key={row.moveNum} className="grid grid-cols-[30px_1fr_1fr] gap-3 mb-2 items-center p-2 rounded-xl hover:bg-white/[0.04] transition-all border-b border-white/[0.02]">
                  <span className="font-mono text-[10px] text-zinc-600 font-bold">{row.moveNum}.</span>
                  <div className="bg-white/5 rounded-lg py-1.5 px-3 border border-white/5 text-center text-zinc-100 font-mono text-sm font-bold hover:bg-white/20 cursor-pointer transition-colors">{row.white}</div>
                  <div className={`rounded-lg py-1.5 px-3 text-center text-zinc-400 font-mono text-sm cursor-pointer hover:bg-white/10 transition-colors ${row.black ? 'bg-zinc-800/40 border border-white/5' : ''}`}>{row.black || ""}</div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/10 bg-black/80 space-y-3">
               <div className="grid grid-cols-4 gap-2">
                 {['«', '‹', '›', '»'].map((icon) => (
                   <button key={icon} className="bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white hover:text-black transition-all text-white font-black text-xl cursor-pointer">
                     {icon}
                   </button>
                 ))}
               </div>
               <button className="w-full bg-zinc-50 text-black py-4 rounded-2xl font-black text-[10px] tracking-[0.25em] uppercase hover:bg-white transition-all duration-500 cursor-pointer">
                 Exportar PGN
               </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}