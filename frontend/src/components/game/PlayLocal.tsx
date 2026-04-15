"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square } from 'chess.js';

interface PlayLocalProps {
  onGameStateChange: (status: string) => void;
  onMove: (history: string[], capturedW: string[], capturedB: string[]) => void;
  resetSignal: number;
  orientation: 'w' | 'b';
}

const PIECE_MAP: Record<string, string> = { 
  p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" 
};

export default function PlayLocal({ onGameStateChange, onMove, resetSignal, orientation }: PlayLocalProps) {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const [capW, setCapW] = useState<string[]>([]);
  const [capB, setCapB] = useState<string[]>([]);

  useEffect(() => {
    setGame(new Chess());
    setLastMove(null);
    setSelectedSquare(null);
    setCapW([]);
    setCapB([]);
  }, [resetSignal]);

  const executeMove = useCallback((moveData: any) => {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(moveData);

      if (result) {
        let newCapW = [...capW];
        let newCapB = [...capB];

        if (result.captured) {
          // Si el que mueve es blanco (w), captura una pieza negra (b)
          const pieceImg = `/pieces/${result.color === 'w' ? 'b' : 'w'}_${PIECE_MAP[result.captured]}.svg`;
          if (result.color === 'w') newCapB.push(pieceImg);
          else newCapW.push(pieceImg);
          setCapB(newCapB);
          setCapW(newCapW);
        }

        setGame(gameCopy);
        setLastMove({ from: result.from, to: result.to });
        
        let status = gameCopy.turn() === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS";
        if (gameCopy.isCheckmate()) status = "¡JAQUE MATE!";
        else if (gameCopy.isDraw()) status = "TABLAS";

        onGameStateChange(status);
        onMove(gameCopy.history(), newCapW, newCapB);
        return true;
      }
      return false;
    } catch (e) { return false; }
  }, [game, capW, capB, onMove, onGameStateChange]);

  const onDragStart = (e: React.DragEvent, square: Square) => {
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      e.dataTransfer.setData("fromSquare", square);
      setSelectedSquare(square);
    } else e.preventDefault();
  };

  const board = game.board();
  const displayBoard = orientation === 'w' 
    ? board 
    : [...board].reverse().map(row => [...row].reverse());

  return (
    <div className="p-1 bg-zinc-950 rounded-[2rem] shadow-[0_60px_120px_rgba(0,0,0,0.95)] border border-white/10 backdrop-blur-sm">
      <div className="grid grid-cols-8 grid-rows-8 w-[min(95vw,780px)] h-[min(95vw,780px)] bg-zinc-900 overflow-hidden rounded-xl border-[4px] border-black shadow-inner">
        {displayBoard.map((row, i) =>
          row.map((piece, j) => {
            const rowIdx = orientation === 'w' ? i : 7 - i;
            const colIdx = orientation === 'w' ? j : 7 - j;
            const coord = (String.fromCharCode(97 + colIdx) + (8 - rowIdx)) as Square;
            
            const isDark = (rowIdx + colIdx) % 2 === 1;
            const isSelected = selectedSquare === coord;
            const isLastMove = lastMove?.from === coord || lastMove?.to === coord;
            const isCheck = game.isCheck() && piece?.type === 'k' && piece?.color === game.turn();
            const isLegal = selectedSquare && game.moves({ square: selectedSquare, verbose: true }).some(m => m.to === coord);

            return (
              <div
                key={coord}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const fromSquare = e.dataTransfer.getData("fromSquare") as Square;
                  executeMove({ from: fromSquare, to: coord, promotion: 'q' });
                  setSelectedSquare(null);
                }}
                onClick={() => {
                  if (selectedSquare) {
                    executeMove({ from: selectedSquare, to: coord, promotion: 'q' });
                    setSelectedSquare(null);
                  } else if (piece && piece.color === game.turn()) setSelectedSquare(coord);
                }}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200
                  ${isDark ? 'bg-[#5c7da5]' : 'bg-[#d9e4f1]'}
                  ${isSelected ? 'bg-gold/50' : ''}
                  ${isCheck ? 'bg-red-500/60 animate-pulse' : ''}
                  ${isLastMove ? 'after:absolute after:inset-0 after:bg-gold/25 after:z-10' : ''}
                `}
              >
                {/* Coordenadas */}
                {j === 0 && (
                  <span className={`absolute top-0.5 left-1 text-[11px] font-bold font-mono ${isDark ? 'text-[#d9e4f1] opacity-60' : 'text-[#5c7da5] opacity-70'} z-0`}>
                    {8 - rowIdx}
                  </span>
                )}
                {i === 7 && (
                  <span className={`absolute bottom-0.5 right-1 text-[11px] font-bold font-mono uppercase ${isDark ? 'text-[#d9e4f1] opacity-60' : 'text-[#5c7da5] opacity-70'} z-0`}>
                    {String.fromCharCode(97 + colIdx)}
                  </span>
                )}
                
                {isLegal && <div className={`absolute z-30 rounded-full ${piece ? 'w-full h-full border-4 border-black/10' : 'w-5 h-5 bg-black/15'}`} />}
                {piece && (
                  <img 
                    src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`} 
                    draggable
                    onDragStart={(e) => onDragStart(e, coord)}
                    className={`w-[92%] h-[92%] z-20 transition-transform drop-shadow-lg ${isSelected ? 'scale-105 -translate-y-1' : ''}`} 
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