"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Game {
  id: string;
  mode: string;
  result: string;
  opponent: string;
  date: string;
  moves: number;
  timeControl: string;
}

export default function AnalysisForm({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [evaluation, setEvaluation] = useState<number>(0); 

  useEffect(() => {
    const savedHistory = localStorage.getItem('chess_history');
    if (savedHistory) {
      const history: Game[] = JSON.parse(savedHistory);
      const foundGame = history.find(g => g.id === gameId);
      setGame(foundGame || null);
    }
    
    // Simulación de evaluación del motor (-5.0 a +5.0)
    const fakeEval = (Math.random() * 4 - 2).toFixed(1);
    setEvaluation(parseFloat(fakeEval));
  }, [gameId]);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-screen font-sans text-white bg-[#020202]">
        <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse tracking-[0.4em] uppercase text-[10px] text-zinc-500">Sincronizando motor...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen p-4 md:p-10 font-sans text-white relative">
      
      {/* FONDO: Resplandor plateado sutil */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050508]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* HEADER Estilo Platino */}
      <div className="relative z-10 flex justify-between items-end mb-12 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]"></div>
            <span className="text-[10px] tracking-[0.4em] uppercase font-black text-zinc-500">Motor de Análisis v16</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white italic">
            Partida <span className="text-zinc-500">#{gameId}</span>
          </h2>
          <p className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase font-bold mt-2">
            vs {game.opponent} • {game.date}
          </p>
        </div>
        <button 
          onClick={() => router.back()}
          className="px-8 py-3 border-2 border-zinc-800 bg-zinc-950 text-white text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500 font-black rounded-2xl shadow-xl"
        >
          Volver
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ÁREA DEL TABLERO Y BARRA */}
        <div className="lg:col-span-8 flex gap-6 h-[min(85vw,680px)]">
          
          {/* Barra de Evaluación Técnica */}
          <div className="w-6 md:w-10 bg-zinc-900 rounded-full overflow-hidden flex flex-col-reverse relative border border-white/10 shadow-2xl">
            <div 
              className="bg-gradient-to-t from-zinc-600 via-zinc-200 to-white transition-all duration-1000 ease-out" 
              style={{ height: `${Math.min(Math.max(50 + (evaluation * 10), 5), 95)}%` }}
            ></div>
            <span className="absolute top-4 left-0 w-full text-[10px] text-center font-black text-white mix-blend-difference z-10 font-mono">
              {evaluation > 0 ? `+${evaluation}` : evaluation}
            </span>
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-white/30 z-0"></div>
          </div>

          {/* TABLERO PLATEADO */}
          <div className="flex-1 bg-zinc-950 p-2 rounded-[2.5rem] border border-white/5 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-8 grid-rows-8 h-full w-full rounded-2xl overflow-hidden border-4 border-zinc-900 shadow-inner">
              {[...Array(64)].map((_, index) => {
                const i = Math.floor(index / 8);
                const j = index % 8;
                const isDark = (i + j) % 2 === 1;
                
                return (
                  <div
                    key={index}
                    className={`relative flex items-center justify-center transition-colors duration-500
                      ${isDark ? 'bg-[#3f3f46]' : 'bg-[#d4d4d8]'} 
                    `}
                  >
                    {/* Brillo Metálico en claras */}
                    {!isDark && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                    )}

                    {/* Coordenadas Técnicas */}
                    {j === 0 && (
                      <span className={`absolute top-1 left-1.5 text-[9px] font-black font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {8 - i}
                      </span>
                    )}
                    {i === 7 && (
                      <span className={`absolute bottom-1 right-1.5 text-[9px] font-black font-mono uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {String.fromCharCode(97 + j)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL LATERAL */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          <div className="bg-zinc-950 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Métricas de Precisión</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-6 rounded-2xl border border-white/5 text-center">
                <p className="text-[9px] text-zinc-500 uppercase mb-2 font-black">Tú (Blanco)</p>
                <p className="text-4xl font-black text-white italic">82<span className="text-sm not-italic opacity-40">%</span></p>
              </div>
              <div className="bg-zinc-100 p-6 rounded-2xl text-center shadow-lg">
                <p className="text-[9px] text-zinc-600 uppercase mb-2 font-black italic">Engine</p>
                <p className="text-4xl font-black text-black italic">94<span className="text-sm not-italic opacity-40">%</span></p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-[2.5rem] flex-1 min-h-[300px] backdrop-blur-sm relative overflow-hidden">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Líneas Principales</h3>
            
            <div className="space-y-4">
              {[
                { n: "18.", m: "Nf3", d: "Movimiento brillante", active: true },
                { n: "19.", m: "Qh5", d: "Presión en flanco", active: false },
                { n: "20.", m: "O-O", d: "Seguridad de rey", active: false }
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-5 text-[11px] p-4 rounded-2xl transition-all border-l-4 ${
                  item.active 
                    ? 'bg-white/10 border-white shadow-lg translate-x-1' 
                    : 'bg-black/20 border-zinc-800 opacity-60'
                }`}>
                  <span className="text-zinc-600 font-mono font-bold w-6">{item.n}</span>
                  <span className={`font-black w-12 uppercase text-sm ${item.active ? 'text-white' : 'text-zinc-400'}`}>{item.m}</span>
                  <span className="text-[10px] text-zinc-600 font-medium italic">{item.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}