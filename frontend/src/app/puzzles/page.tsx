"use client";

import React, { useState, useRef, useEffect } from 'react';
import PuzzleBoard from '@/components/game/PuzzleBoard';
import AchievementToast from '@/components/ui/AchievementToast';

const PUZZLES_DATA = [
  { id: "p1", fen: "4kb1r/p2n1ppp/4q3/4p3/3P4/8/PP1P1PPP/RNB1KBNR w KQk - 0 1", solution: "d4e5", objective: "Blancas ganan material" },
  { id: "p2", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", solution: "f3e5", objective: "Ataque táctico" },
  { id: "p3", fen: "6k1/pp3p1p/6p1/8/8/1P6/P1P2PPP/3R2K1 w - - 0 1", solution: "d1d8", objective: "Mate en 1" }
];

function InfoBox({ title, content, subContent, isObjective }: any) {
  return (
    <div className={`p-6 rounded-[2.5rem] border-2 bg-zinc-900/40 border-white/5 transition-all duration-500 shadow-xl backdrop-blur-xl relative overflow-hidden`}>
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isObjective ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600 shadow-[0_0_10px_#10b981]'}`}></div>
          <h4 className="text-white font-black text-[11px] uppercase tracking-[0.2em]">{title}</h4>
        </div>
      </div>
      <div className={`flex flex-col gap-2 p-6 rounded-[1.5rem] border border-black/30 shadow-inner min-h-[120px] justify-center items-center text-center relative z-10 ${
             isObjective ? 'bg-gradient-to-br from-[#4ade80] to-[#166534]' : 'bg-black/40'
           }`}>
        <h2 className={`text-xl font-black uppercase tracking-tight leading-tight ${isObjective ? 'text-black/90' : 'text-white'}`}>
          {content}
        </h2>
        {subContent && <p className={`text-[9px] uppercase font-black tracking-[0.2em] ${isObjective ? 'text-black/50' : 'text-emerald-400/60'}`}>{subContent}</p>}
      </div>
    </div>
  );
}

export default function PuzzlesPremiumPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [feedback, setFeedback] = useState({ text: "TU TURNO", color: "text-white" });

  const nextPuzzle = () => {
    setCurrentIndex((prev) => (prev + 1) % PUZZLES_DATA.length);
    setFeedback({ text: "TU TURNO", color: "text-white" });
  };

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-4 xl:p-10 font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050508]"></div>
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-600/20 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-emerald-500/10 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto grid grid-cols-12 gap-8 items-start">
        
        <div className="col-span-12 xl:col-span-3 space-y-4">
          <InfoBox title="Objetivo" content={PUZZLES_DATA[currentIndex].objective} isObjective={true} />
          
          <div className="bg-zinc-950/60 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            <p className="text-center text-emerald-400/60 text-[9px] tracking-[0.4em] font-black uppercase mb-4">Estado del Puzzle</p>
            <h2 className={`text-center text-3xl font-black italic tracking-tighter drop-shadow-md transition-all duration-300 ${feedback.color}`}>
              {feedback.text}
            </h2>
          </div>

          <button onClick={nextPuzzle} className="relative group overflow-hidden py-5 px-8 w-full rounded-[2rem] border-2 border-emerald-500 bg-zinc-50 text-black font-black text-[11px] tracking-[0.25em] uppercase transition-all shadow-xl hover:-translate-y-1 hover:bg-emerald-600 active:scale-95 hover:text-white hover:border-emerald-600 cursor-pointer">
            <span className="relative z-10 flex items-center justify-center gap-3">SIGUIENTE PUZZLE</span>
          </button>
        </div>

        <div className="col-span-12 xl:col-span-6 flex flex-col items-center">
          <PuzzleBoard 
            puzzle={PUZZLES_DATA[currentIndex]}
            onSuccess={() => setSolvedCount(c => c + 1)}
            onFeedback={(text, color) => {
              const tailwindColor = color === "#2ecc71" ? "text-emerald-400" : (text === "TU TURNO" ? "text-white" : "text-red-500");
              setFeedback({ text, color: tailwindColor });
            }}
          />
        </div>

        <div className="col-span-12 xl:col-span-3">
          <InfoBox 
            title="Tu Progreso" 
            content={solvedCount.toString()} 
            subContent="PUZZLES COMPLETADOS" 
            isObjective={false} 
          />
        </div>
      </div>

      <AchievementToast />
    </main>
  );
}