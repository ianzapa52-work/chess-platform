"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import PlayLocal from '@/components/game/PlayLocal';
import { Chess } from 'chess.js';

// Partida del Siglo: Donald Byrne vs Bobby Fischer (1956)
const FAMOUS_GAME = [
  "Nf3", "Nf6", "c4", "g6", "Nc3", "Bg7", "d4", "O-O", "Bf4", "d5", 
  "Qb3", "dxc4", "Qxc4", "c6", "e4", "Nbd7", "Rd1", "Nb6", "Qc5", "Bg4", 
  "Bg5", "Na4", "Qa3", "Nxc3", "bxc3", "Nxe4", "Bxe7", "Qb6", "Bc4", "Nxc3",
  "Bc5", "Rfe8+", "Kf1", "Be6", "Bxb6", "Bxc4+", "Kg1", "Ne2+", "Kf1", "Nxd4+",
  "Kg1", "Ne2+", "Kf1", "Nc3+", "Kg1", "axb6", "Qb4", "Ra4", "Qxb6", "Nxd1"
];

export default function AnalysisPage() {
  useEffect(() => {
    document.title = "WELIKECHESS | Análisis";
  }, []);
  
  const [game, setGame] = useState(new Chess());
  const [boardOrientation, setBoardOrientation] = useState<'w' | 'b'>('w');
  
  // Estados de Reproducción
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Engine States
  const [evaluation, setEvaluation] = useState(0.0);
  const [bestMove, setBestMove] = useState("");
  const engine = useRef<Worker | null>(null);
  const autoplayInterval = useRef<NodeJS.Timeout | null>(null);

  // --- CONFIGURACIÓN DEL MOTOR ---
  useEffect(() => {
    engine.current = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
    engine.current.onmessage = (e) => {
      const msg = e.data;
      if (msg.includes('score cp')) {
        const parts = msg.split(' ');
        const score = parseInt(parts[parts.indexOf('cp') + 1]) / 100;
        setEvaluation(boardOrientation === 'w' ? score : -score);
      }
      if (msg.includes('bestmove') && !msg.includes('ponder')) {
        setBestMove(msg.split('bestmove ')[1]?.split(' ')[0]);
      }
    };
    engine.current.postMessage('uci');
    return () => engine.current?.terminate();
  }, [boardOrientation]);

  const analyzeFen = (fen: string) => {
    engine.current?.postMessage(`position fen ${fen}`);
    engine.current?.postMessage('go depth 12');
  };

  // --- LÓGICA DE REPRODUCCIÓN AUTOMÁTICA ---
  useEffect(() => {
    if (isPlaying) {
      autoplayInterval.current = setInterval(() => {
        if (currentMoveIndex < FAMOUS_GAME.length - 1) {
          navigateMove(currentMoveIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1200); // Velocidad de los movimientos
    } else {
      if (autoplayInterval.current) clearInterval(autoplayInterval.current);
    }
    return () => { if (autoplayInterval.current) clearInterval(autoplayInterval.current); };
  }, [isPlaying, currentMoveIndex]);

  const navigateMove = (index: number) => {
    const newGame = new Chess();
    for (let i = 0; i <= index; i++) {
      newGame.move(FAMOUS_GAME[i]);
    }
    setGame(newGame);
    setCurrentMoveIndex(index);
    analyzeFen(newGame.fen());
  };

  const handleManualMove = (history: string[]) => {
    if (isReviewMode) return;
    const tempGame = new Chess();
    history.forEach(m => tempGame.move(m));
    setGame(tempGame);
    analyzeFen(tempGame.fen());
  };

  // --- RENDERIZADO DEL HISTORIAL ---
  const rows = useMemo(() => {
    const moves = isReviewMode ? FAMOUS_GAME : game.history();
    const res = [];
    for (let i = 0; i < moves.length; i += 2) {
      res.push({ num: Math.floor(i / 2) + 1, w: moves[i], b: moves[i + 1] || null, idxW: i, idxB: i + 1 });
    }
    return res;
  }, [game, isReviewMode]);

  const evalHeight = Math.min(Math.max(50 + (evaluation * 10), 5), 95);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-300 p-6 font-sans">
      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8 items-start">
        
        {/* IZQUIERDA: ENGINE & STATUS */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
              <h2 className="text-[11px] font-black tracking-[0.2em] text-white uppercase">Stockfish Local v16</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-black/50 p-5 rounded-2xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Evaluación</span>
                <span className="text-4xl font-mono font-black text-white italic">
                  {evaluation > 0 ? `+${evaluation}` : evaluation}
                </span>
              </div>
              <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Mejor jugada sugerida</span>
                <span className="text-xl font-mono font-bold text-emerald-400 uppercase tracking-tighter">
                  {bestMove || "Calculando..."}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest">Controles de análisis</h3>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => { setIsReviewMode(true); navigateMove(-1); }}
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all"
              >
                Cargar Partida del Siglo
              </button>
              <button 
                onClick={() => setBoardOrientation(boardOrientation === 'w' ? 'b' : 'w')}
                className="w-full py-3 bg-zinc-800 text-white rounded-2xl font-bold text-[10px] uppercase border border-white/5 hover:bg-zinc-700"
              >
                Girar Tablero
              </button>
            </div>
          </div>
        </div>

        {/* CENTRO: TABLERO & BARRA EVAL */}
        <div className="col-span-12 lg:col-span-6 flex gap-6 items-center">
          {/* Barra de Evaluación Vertical */}
          <div className="w-12 h-[600px] bg-zinc-800 rounded-2xl border border-white/10 overflow-hidden relative flex flex-col-reverse shadow-inner">
            <div 
              className="bg-white transition-all duration-700 ease-in-out shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
              style={{ height: `${evalHeight}%` }}
            ></div>
            <div className="absolute inset-0 flex flex-col justify-between py-8 items-center pointer-events-none z-10 text-[9px] font-black mix-blend-difference text-white opacity-50 uppercase">
              <span className="rotate-90">Negras</span>
              <span className="rotate-90">Blancas</span>
            </div>
          </div>

          <div className={`flex-grow relative ${isReviewMode ? 'pointer-events-none' : ''}`}>
             <PlayLocal 
                resetSignal={0} 
                onGameStateChange={() => {}} 
                onMove={handleManualMove} 
                orientation={boardOrientation} 
             />
             {isReviewMode && (
               <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter animate-bounce z-20 shadow-lg">
                 Modo Revisión
               </div>
             )}
          </div>
        </div>

        {/* DERECHA: HISTORIAL & AUTOPLAY */}
        <div className="col-span-12 lg:col-span-3 h-[650px] flex flex-col">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] flex-grow flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Historial</h2>
              <span className="text-[9px] bg-zinc-800 px-2 py-1 rounded-md text-zinc-400 font-mono">
                {currentMoveIndex + 1} / {FAMOUS_GAME.length}
              </span>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-1 bg-black/20 custom-scrollbar">
              {rows.map((row) => (
                <div key={row.num} className="grid grid-cols-[35px_1fr_1fr] gap-2 items-center">
                  <span className="text-[10px] font-mono text-zinc-600 font-bold text-center">{row.num}.</span>
                  <button 
                    onClick={() => isReviewMode && navigateMove(row.idxW)}
                    className={`py-2 text-sm font-mono font-bold rounded-lg transition-all ${currentMoveIndex === row.idxW ? 'bg-zinc-100 text-black scale-105 shadow-lg' : 'text-zinc-300 hover:bg-white/5'}`}
                  >
                    {row.w}
                  </button>
                  {row.b && (
                    <button 
                      onClick={() => isReviewMode && navigateMove(row.idxB)}
                      className={`py-2 text-sm font-mono font-bold rounded-lg transition-all ${currentMoveIndex === row.idxB ? 'bg-zinc-100 text-black scale-105 shadow-lg' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                      {row.b}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* PANEL DE NAVEGACIÓN (Estilo Chess.com) */}
            <div className="p-6 bg-zinc-950 border-t border-white/10">
              <div className="flex justify-center gap-4 mb-6">
                <button onClick={() => navigateMove(-1)} className="p-3 bg-zinc-900 rounded-xl hover:bg-white hover:text-black transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                </button>
                
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                >
                  {isPlaying ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>

                <button onClick={() => navigateMove(currentMoveIndex + 1)} className="p-3 bg-zinc-900 rounded-xl hover:bg-white hover:text-black transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                </button>
              </div>

              <button 
                onClick={() => { setIsReviewMode(false); setGame(new Chess()); setCurrentMoveIndex(-1); setIsPlaying(false); }}
                className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-white/40 transition-all"
              >
                Finalizar Análisis
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}