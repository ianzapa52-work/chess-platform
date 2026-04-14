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

  useEffect(() => {
    setGame(new Chess(puzzle.fen));
    setSelectedSquare(null);
    setLastMove(null);
    setFlash(null);
  }, [puzzle]);

  const playSound = (type: 'move' | 'capture' | 'error' | 'success') => {
    const audioPath = type === 'capture' ? '/sounds/capture_sound.mp3' : '/sounds/move_sound.mp3'; 
    const audio = new Audio(audioPath);
    audio.play().catch(() => {});
  };

  const executeMove = useCallback((from: Square, to: Square) => {
    try {
      const moveStr = from + to;
      const gameCopy = new Chess(game.fen());
      const moveResult = gameCopy.move({ from, to, promotion: 'q' });

      if (!moveResult) return false;

      // Movimiento optimista (estilo Local)
      setGame(gameCopy);
      setLastMove({ from, to });

      if (moveStr === puzzle.solution) {
        setFlash({ coord: to, type: 'success' });
        onFeedback("¡CORRECTO!", "#2ecc71");
        playSound(moveResult.captured ? 'capture' : 'move');
        
        // --- DISPARO DEL TOAST GLOBAL ---
        window.dispatchEvent(new CustomEvent('puzzle-solved', { 
          detail: puzzle.objective 
        }));
        
        onSuccess();
      } else {
        setFlash({ coord: to, type: 'error' });
        onFeedback("INTÉNTALO DE NUEVO", "#ec2914");
        playSound('move');
        
        // Reset tras fallo para repetir el puzzle
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

  // Handlers de Drag & Drop (Misma lógica que PlayLocal)
  const onDragStart = (e: React.DragEvent, square: Square) => {
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      e.dataTransfer.setData("fromSquare", square);
      setSelectedSquare(square);
    } else e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, toSquare: Square) => {
    const fromSquare = e.dataTransfer.getData("fromSquare") as Square;
    executeMove(fromSquare, toSquare);
    setSelectedSquare(null);
  };

  return (
    <div className="chess-board-wrapper p-2">
      <div className="grid grid-cols-8 grid-rows-8 w-[min(85vw,750px)] h-[min(85vw,750px)] bg-[#1a1a1a] shadow-2xl relative border-4 border-[#2a2a2a]">
        {game.board().map((row, i) =>
          row.map((piece, j) => {
            const coord = (String.fromCharCode(97 + j) + (8 - i)) as Square;
            const isDark = (i + j) % 2 === 1;
            const isSelected = selectedSquare === coord;
            const isLastMove = lastMove?.from === coord || lastMove?.to === coord;
            const isLegal = selectedSquare && game.moves({ square: selectedSquare, verbose: true }).some(m => m.to === coord);
            
            const isSuccess = flash?.coord === coord && flash.type === 'success';
            const isError = flash?.coord === coord && flash.type === 'error';

            return (
              <div
                key={coord}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, coord)}
                onClick={() => {
                  if (selectedSquare) {
                    executeMove(selectedSquare, coord);
                    setSelectedSquare(null);
                  } else if (piece && piece.color === game.turn()) {
                    setSelectedSquare(coord);
                  }
                }}
                className={`
                  relative flex items-center justify-center cursor-pointer transition-all duration-200
                  ${isDark ? 'bg-[#779556]' : 'bg-[#ebecd0]'}
                  ${isSelected ? 'bg-[#f6f669]' : ''}
                  ${isSuccess ? 'bg-emerald-500/80 !important' : ''}
                  ${isError ? 'bg-red-500/80 !important' : ''}
                  ${isLastMove && !isSelected ? 'after:absolute after:inset-0 after:bg-gold/20' : ''}
                `}
              >
                {/* Labels de coordenadas */}
                {j === 0 && <span className={`absolute top-0.5 left-1 text-[10px] font-bold opacity-40 ${isDark ? 'text-[#ebecd0]' : 'text-[#779556]'}`}>{8 - i}</span>}
                {i === 7 && <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold opacity-40 uppercase ${isDark ? 'text-[#ebecd0]' : 'text-[#779556]'}`}>{String.fromCharCode(97 + j)}</span>}

                {/* Guía de movimientos legales */}
                {isLegal && (
                  <div className={`absolute z-10 rounded-full ${piece ? 'w-[90%] h-[90%] border-4 border-black/10' : 'w-4 h-4 bg-black/10'}`} />
                )}

                {piece && (
                  <img 
                    src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`} 
                    draggable
                    onDragStart={(e) => onDragStart(e, coord)}
                    className={`w-full h-full p-1 z-20 transition-transform duration-150 ${isSelected ? 'scale-110 -translate-y-1' : ''}`} 
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