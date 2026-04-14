"use client";

import React, { useState } from 'react';
import PuzzleBoard from '@/components/game/PuzzleBoard';
import AchievementToast from '@/components/ui/AchievementToast';

const PUZZLES_DATA = [
  { id: "p1", fen: "4kb1r/p2n1ppp/4q3/4p3/3P4/8/PP1P1PPP/RNB1KBNR w KQk - 0 1", solution: "d4e5", objective: "Blancas ganan material" },
  { id: "p2", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", solution: "f3e5", objective: "Ataque táctico" },
  { id: "p3", fen: "6k1/pp3p1p/6p1/8/8/1P6/P1P2PPP/3R2K1 w - - 0 1", solution: "d1d8", objective: "Mate en 1" }
];

function InfoBox({ title, content, subContent, isObjective }: any) {
  return (
    <div className={`p-6 rounded-[2.5rem] border-2 bg-black/40 border-white/5 transition-all duration-500 shadow-xl`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isObjective ? 'bg-gold animate-ping' : 'bg-emerald-500'}`}></div>
          <h4 className="text-white font-black text-[11px] uppercase tracking-widest">{title}</h4>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-6 rounded-xl border border-white/10 shadow-inner min-h-[100px] justify-center items-center text-center" 
           style={{ 
             backgroundColor: isObjective ? '#d2b48c' : '#1a1a1a', 
             backgroundImage: isObjective ? 'linear-gradient(to bottom right, #e5d3b3, #d2b48c)' : 'none',
             boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' 
           }}>
        <h2 className={`text-xl font-bold uppercase tracking-tight ${isObjective ? 'text-black/80' : 'text-white'}`}>
          {content}
        </h2>
        {subContent && <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gold/60">{subContent}</p>}
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
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-4 xl:p-10 font-sans selection:bg-gold/30">
      <div className="max-w-[1700px] mx-auto grid grid-cols-12 gap-10 items-start">
        
        {/* PANEL IZQUIERDO */}
        <div className="col-span-12 xl:col-span-3 space-y-8">
          <InfoBox title="Objetivo" content={PUZZLES_DATA[currentIndex].objective} isObjective={true} />
          
          <div className="chess-panel border-gold/20 bg-gradient-to-b from-gold/5 to-transparent py-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
            <p className="text-center text-gold text-[9px] tracking-[0.8em] font-black uppercase mb-3">Puzzle Status</p>
            <h2 className={`text-center text-4xl font-cinzel italic tracking-tighter drop-shadow-lg leading-tight transition-all duration-300 ${feedback.color}`}>
              {feedback.text}
            </h2>
          </div>

          <button onClick={nextPuzzle} className="relative group overflow-hidden py-5 px-8 w-full rounded-2xl border-2 border-gold bg-gradient-to-r from-gold via-[#f3cf7a] to-gold text-black font-black text-[11px] tracking-[0.25em] uppercase transition-all shadow-xl hover:-translate-y-1 active:scale-95">
            <span className="relative z-10 flex items-center justify-center gap-3">SIGUIENTE PUZZLE</span>
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>
        </div>

        {/* TABLERO (CENTRO) */}
        <div className="col-span-12 xl:col-span-6 flex flex-col items-center">
          <PuzzleBoard 
            puzzle={PUZZLES_DATA[currentIndex]}
            onSuccess={() => setSolvedCount(c => c + 1)}
            onFeedback={(text, color) => {
              const tailwindColor = color === "#2ecc71" ? "text-emerald-400" : "text-red-500";
              setFeedback({ text, color: tailwindColor });
            }}
          />
        </div>

        {/* PROGRESO (DERECHA) */}
        <div className="col-span-12 xl:col-span-3">
          <InfoBox title="Éxitos" content={solvedCount.toString()} subContent="PUZZLES COMPLETADOS" isObjective={false} />
        </div>
      </div>

      {/* COMPONENTE DE LOGRO (TOAST) */}
      <AchievementToast />

      <style jsx>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </main>
  );
}