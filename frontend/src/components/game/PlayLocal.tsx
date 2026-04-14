"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square } from 'chess.js';

interface PlayLocalProps {
  onGameStateChange: (status: string) => void;
  onMove: (history: string[], capturedW: string[], capturedB: string[]) => void;
  resetSignal: number;
}

const PIECE_MAP: Record<string, string> = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };

export default function PlayLocal({ onGameStateChange, onMove, resetSignal }: PlayLocalProps) {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  
  const [capW, setCapW] = useState<string[]>([]);
  const [capB, setCapB] = useState<string[]>([]);

  const playSound = (type: 'move' | 'capture' | 'check') => {
    const audioPath = 
      type === 'capture' ? '/sounds/capture_sound.mp3' : 
      '/sounds/move_sound.mp3';
      
    const audio = new Audio(audioPath);
    audio.play().catch(() => {});
  };

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
        if (gameCopy.isCheck()) playSound('check');
        else if (result.captured) playSound('capture');
        else playSound('move');

        let newCapW = [...capW];
        let newCapB = [...capB];

        if (result.captured) {
          const pieceImg = `/pieces/${result.color === 'w' ? 'b' : 'w'}_${PIECE_MAP[result.captured]}.svg`;
          if (result.color === 'w') {
            newCapB = [...newCapB, pieceImg];
            setCapB(newCapB);
          } else {
            newCapW = [...newCapW, pieceImg];
            setCapW(newCapW);
          }
        }

        setGame(gameCopy);
        setLastMove({ from: result.from, to: result.to });
        
        onMove(gameCopy.history(), newCapW, newCapB);

        let status = gameCopy.turn() === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS";
        if (gameCopy.isCheckmate()) status = "¡JAQUE MATE!";
        else if (gameCopy.isCheck()) status = `JAQUE AL ${gameCopy.turn() === 'w' ? 'REY BLANCO' : 'REY NEGRO'}`;
        onGameStateChange(status);
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

  const onDrop = (e: React.DragEvent, toSquare: Square) => {
    const fromSquare = e.dataTransfer.getData("fromSquare") as Square;
    executeMove({ from: fromSquare, to: toSquare, promotion: 'q' });
    setSelectedSquare(null);
  };

  return (
    <div className="chess-board-wrapper p-2">
      <div className="grid grid-cols-8 grid-rows-8 w-[min(85vw,750px)] h-[min(85vw,750px)] bg-[#1a1a1a] shadow-2xl">
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
                  if (selectedSquare) {
                    executeMove({ from: selectedSquare, to: coord, promotion: 'q' });
                    setSelectedSquare(null);
                  } else if (piece && piece.color === game.turn()) setSelectedSquare(coord);
                }}
                className={`
                  chess-square ${isDark ? 'chess-square-dark' : 'chess-square-light'}
                  ${isSelected ? 'chess-square-selected' : ''}
                  ${isCheck ? 'check-warning' : ''}
                  ${isLastMove ? 'before:absolute before:inset-0 before:bg-gold/10' : ''}
                `}
              >
                {j === 0 && <span className="square-label top-1 left-1 opacity-40">{8 - i}</span>}
                {i === 7 && <span className="square-label bottom-1 right-1 opacity-40 uppercase">{String.fromCharCode(97 + j)}</span>}
                {isLegal && <div className={`absolute z-10 rounded-full ${piece ? 'w-[90%] h-[90%] border-4 border-gold/20' : 'w-4 h-4 bg-gold/20'}`} />}
                {piece && (
                  <img 
                    src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`} 
                    draggable
                    onDragStart={(e) => onDragStart(e, coord)}
                    className={`chess-piece piece-animate ${isSelected ? 'scale-110 -translate-y-1' : ''}`} 
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