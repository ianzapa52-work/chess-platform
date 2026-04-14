"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square } from 'chess.js';

interface PlayIAProps {
  difficulty: number;
  onGameStateChange: (status: string) => void;
  onMove: (history: string[], capturedW: string[], capturedB: string[]) => void;
  resetSignal: number;
}

const PIECE_MAP: Record<string, string> = { 
  p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" 
};

export default function PlayIA({ difficulty, onGameStateChange, onMove, resetSignal }: PlayIAProps) {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const [capW, setCapW] = useState<string[]>([]);
  const [capB, setCapB] = useState<string[]>([]);

  const playSound = (type: 'move' | 'capture' | 'check') => {
    const audioPath = type === 'capture' ? '/sounds/capture_sound.mp3' : '/sounds/move_sound.mp3';
    new Audio(audioPath).play().catch(() => {});
  };

  useEffect(() => {
    setGame(new Chess());
    setLastMove(null);
    setSelectedSquare(null);
    setCapW([]);
    setCapB([]);
    onGameStateChange("TU TURNO");
  }, [resetSignal]);

  const executeMove = useCallback((moveData: any) => {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(moveData);

      if (result) {
        if (gameCopy.isCheck()) playSound('check');
        else if (result.captured) playSound('capture');
        else playSound('move');

        let newCapW = [...capW];
        let newCapB = [...capB];

        if (result.captured) {
          const pieceImg = `/pieces/${result.color === 'w' ? 'b' : 'w'}_${PIECE_MAP[result.captured]}.svg`;
          if (result.color === 'w') { newCapB.push(pieceImg); setCapB(newCapB); }
          else { newCapW.push(pieceImg); setCapW(newCapW); }
        }

        setGame(gameCopy);
        setLastMove({ from: result.from, to: result.to });
        onMove(gameCopy.history(), newCapW, newCapB);

        let status = gameCopy.turn() === 'w' ? "TU TURNO" : "IA PENSANDO...";
        if (gameCopy.isCheckmate()) status = "¡JAQUE MATE!";
        else if (gameCopy.isCheck()) status = `JAQUE AL ${gameCopy.turn() === 'w' ? 'REY BLANCO' : 'REY NEGRO'}`;
        onGameStateChange(status);
        return true;
      }
      return false;
    } catch (e) { return false; }
  }, [game, capW, capB, onMove, onGameStateChange]);

  useEffect(() => {
    if (game.turn() === 'b' && !game.isGameOver()) {
      const timer = setTimeout(() => {
        const moves = game.moves();
        if (moves.length > 0) {
          const move = moves[Math.floor(Math.random() * moves.length)];
          executeMove(move);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [game, executeMove]);

  const onDragStart = (e: React.DragEvent, square: Square) => {
    const piece = game.get(square);
    if (piece && piece.color === 'w' && game.turn() === 'w') {
      e.dataTransfer.setData("fromSquare", square);
      setSelectedSquare(square);
    } else e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, toSquare: Square) => {
    const fromSquare = e.dataTransfer.getData("fromSquare") as Square;
    executeMove({ from: fromSquare, to: toSquare, promotion: 'q' });
    setSelectedSquare(null);
  };

  return (
    <div className="chess-board-wrapper p-2">
      <div className="grid grid-cols-8 grid-rows-8 w-[min(85vw,750px)] h-[min(85vw,750px)] bg-[#1a1a1a] shadow-2xl relative border-8 border-[#3d2b1f] rounded-sm">
        {game.board().map((row, i) =>
          row.map((piece, j) => {
            const coord = (String.fromCharCode(97 + j) + (8 - i)) as Square;
            const isDark = (i + j) % 2 === 1;
            const isSelected = selectedSquare === coord;
            const isLastMove = lastMove?.from === coord || lastMove?.to === coord;
            const isCheck = game.isCheck() && piece?.type === 'k' && piece?.color === game.turn();
            const isLegal = selectedSquare && game.moves({ square: selectedSquare, verbose: true }).some(m => m.to === coord);

            return (
              <div
                key={coord}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, coord)}
                onClick={() => {
                  if (game.turn() !== 'w') return;
                  if (selectedSquare) {
                    executeMove({ from: selectedSquare, to: coord, promotion: 'q' });
                    setSelectedSquare(null);
                  } else if (piece && piece.color === 'w') setSelectedSquare(coord);
                }}
                className={`
                  relative flex items-center justify-center cursor-pointer transition-all duration-200
                  ${isDark ? 'bg-[#8b4513]' : 'bg-[#d2b48c]'} 
                  ${isSelected ? 'bg-[#f6f669]/80' : ''}
                  ${isCheck ? 'bg-red-600/60 shadow-[inset_0_0_20px_rgba(255,0,0,0.5)]' : ''}
                  ${isLastMove ? 'before:absolute before:inset-0 before:bg-white/10' : ''}
                `}
              >
                {/* Coordenadas con color adaptado al fondo marrón */}
                {j === 0 && <span className={`absolute top-0.5 left-1 text-[10px] font-bold opacity-50 ${isDark ? 'text-[#d2b48c]' : 'text-[#8b4513]'}`}>{8 - i}</span>}
                {i === 7 && <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold opacity-50 uppercase ${isDark ? 'text-[#d2b48c]' : 'text-[#8b4513]'}`}>{String.fromCharCode(97 + j)}</span>}
                
                {isLegal && (
                  <div className={`absolute z-10 rounded-full ${piece ? 'w-[85%] h-[85%] border-[3px] border-black/15' : 'w-4 h-4 bg-black/15'}`} />
                )}
                
                {piece && (
                  <img 
                    src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`} 
                    draggable={piece.color === 'w'}
                    onDragStart={(e) => onDragStart(e, coord)}
                    className={`w-full h-full p-1 z-20 transition-transform duration-150 drop-shadow-md ${isSelected ? 'scale-110 -translate-y-1' : ''}`} 
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