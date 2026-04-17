"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Chess, type Square } from 'chess.js';

interface Puzzle { id: string; fen: string; solution: string; objective: string; }

interface PuzzleBoardProps {
  puzzle: Puzzle;
  onSuccess: () => void;
  onFeedback: (msg: string, color: string) => void;
}

const PIECE_MAP: Record<string, string> = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };

export default function PuzzleBoard({ puzzle, onSuccess, onFeedback }: PuzzleBoardProps) {
  const [game, setGame] = useState(new Chess(puzzle.fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const [flash, setFlash] = useState<{ coord: string; type: 'success' | 'error' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setGame(new Chess(puzzle.fen));
    setSelectedSquare(null);
    setLastMove(null);
    setFlash(null);
  }, [puzzle]);

  const executeMove = useCallback((from: Square, to: Square) => {
    try {
      const moveStr = from + to;
      const gameCopy = new Chess(game.fen());
      const moveResult = gameCopy.move({ from, to, promotion: 'q' });

      if (!moveResult) return false;

      setGame(gameCopy);
      setLastMove({ from, to });

      if (moveStr === puzzle.solution) {
        setFlash({ coord: to, type: 'success' });
        onFeedback("¡CORRECTO!", "#2ecc71");
        
        window.dispatchEvent(new CustomEvent('puzzle-solved', { 
          detail: puzzle.objective 
        }));
        
        onSuccess();
      } else {
        setFlash({ coord: to, type: 'error' });
        onFeedback("INTÉNTALO DE NUEVO", "#ec2914");
        
        setTimeout(() => {
          setGame(new Chess(puzzle.fen));
          setFlash(null);
          setLastMove(null);
          onFeedback("TU TURNO", "#ffffff");
        }, 800);
      }
      return true;
    } catch (e) { return false; }
  }, [game, puzzle, onSuccess, onFeedback]);

  return (
    <div className="p-1 bg-zinc-950 rounded-[2rem] shadow-[0_60px_120px_rgba(0,0,0,0.95)] border border-white/10 backdrop-blur-sm">
      <div className={`grid grid-cols-8 grid-rows-8 w-[min(95vw,780px)] h-[min(95vw,780px)] bg-zinc-900 overflow-hidden rounded-xl border-[4px] border-black shadow-inner ${isDragging ? 'cursor-grabbing' : ''}`}>
        {game.board().map((row, i) =>
          row.map((piece, j) => {
            const coord = (String.fromCharCode(97 + j) + (8 - i)) as Square;
            const isDark = (i + j) % 2 === 1;
            const isSelected = selectedSquare === coord;
            const isLastMove = lastMove?.from === coord || lastMove?.to === coord;
            const isLegal = selectedSquare && game.moves({ square: selectedSquare, verbose: true }).some(m => m.to === coord);
            
            const isSuccess = flash?.coord === coord && flash.type === 'success';
            const isError = flash?.coord === coord && flash.type === 'error';
            const isPieceMine = piece && piece.color === game.turn();

            return (
              <div
                key={coord}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const fromSquare = e.dataTransfer.getData("fromSquare") as Square;
                  executeMove(fromSquare, coord);
                  setSelectedSquare(null);
                  setIsDragging(false);
                }}
                onClick={() => {
                  if (selectedSquare) {
                    executeMove(selectedSquare, coord);
                    setSelectedSquare(null);
                  } else if (isPieceMine) {
                    setSelectedSquare(coord);
                  }
                }}
                className={`
                  relative flex items-center justify-center transition-all duration-200
                  ${isDark ? 'bg-[#779845]' : 'bg-[#ebecd0]'} 
                  ${isSelected ? 'bg-[#f6f669]/70' : ''}
                  ${isLastMove && !isSelected ? 'after:absolute after:inset-0 after:bg-[#f6f669]/30 after:z-10' : ''}
                  ${isSuccess ? 'bg-[#81b64c] !important animate-[softGlowSuccess_2s_ease-in-out_infinite] z-20 shadow-[0_0_15px_rgba(129,182,76,0.6)]' : ''}
                  ${isError ? 'bg-[#e01c1c] !important animate-[softGlowError_1s_ease-in-out_infinite] z-20 shadow-[0_0_12px_rgba(224,28,28,0.7)]' : ''}
                `}
              >
                {/* Coordenadas */}
                {j === 0 && (
                  <span className={`absolute top-0.5 left-1 text-[11px] font-bold font-mono ${isDark ? 'text-[#eeeed2] opacity-60' : 'text-[#166534] opacity-70'}`}>
                    {8 - i}
                  </span>
                )}
                {i === 7 && (
                  <span className={`absolute bottom-0.5 right-1 text-[11px] font-bold font-mono uppercase ${isDark ? 'text-[#eeeed2] opacity-60' : 'text-[#166534] opacity-70'}`}>
                    {String.fromCharCode(97 + j)}
                  </span>
                )}

                {/* Movimientos Legales */}
                {isLegal && (
                  <div className={`absolute z-30 rounded-full ${piece ? 'w-full h-full border-4 border-black/10' : 'w-5 h-5 bg-black/15'}`} />
                )}

                {/* Piezas */}
                {piece && (
                  <img 
                    src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`} 
                    // Siempre draggable para habilitar el cursor nativo de agarre
                    draggable={true}
                    onDragStart={(e) => {
                      // Solo permitimos la lógica de arrastre si es nuestra pieza
                      if(!isPieceMine) return e.preventDefault();
                      e.dataTransfer.setData("fromSquare", coord);
                      setSelectedSquare(coord);
                      setIsDragging(true);
                    }}
                    onDragEnd={() => setIsDragging(false)}
                    className={`w-[92%] h-[92%] z-20 transition-transform drop-shadow-lg cursor-grab active:cursor-grabbing ${isSelected ? 'scale-105 -translate-y-1' : ''}`} 
                    alt="" 
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}