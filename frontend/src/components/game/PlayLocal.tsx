"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { useDragController } from '@/hooks/useDragController';

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
  const [game, setGame]               = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove]       = useState<{ from: string; to: string } | null>(null);
  const [capW, setCapW]               = useState<string[]>([]);
  const [capB, setCapB]               = useState<string[]>([]);
  const [appearing, setAppearing]     = useState(true);

  const gameRef        = useRef(game);
  const capWRef        = useRef<string[]>([]);
  const capBRef        = useRef<string[]>([]);
  const executeMoveRef = useRef<(from: Square, to: Square) => boolean>(() => false);
  const moveHistoryRef = useRef<string[]>([]);

  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { capWRef.current = capW; }, [capW]);
  useEffect(() => { capBRef.current = capB; }, [capB]);

  useEffect(() => {
    const g = new Chess();
    setGame(g); gameRef.current = g;
    setLastMove(null); setSelectedSquare(null);
    setCapW([]); setCapB([]);
    capWRef.current = []; capBRef.current = [];
    moveHistoryRef.current = [];
    setAppearing(true);
    const t = setTimeout(() => setAppearing(false), 900);
    return () => clearTimeout(t);
  }, [resetSignal]);

  const executeMove = useCallback((from: Square, to: Square): boolean => {
    const g = gameRef.current;
    if (from === to) return false;
    try {
      const gameCopy = new Chess(g.fen());
      const result   = gameCopy.move({ from, to, promotion: 'q' });
      if (!result) return false;

      const san = gameCopy.history({ verbose: true }).slice(-1)[0]?.san || result.san || '';
      if (san) moveHistoryRef.current = [...moveHistoryRef.current, san];

      const newCapW = [...capWRef.current];
      const newCapB = [...capBRef.current];
      if (result.captured) {
        const pieceImg = `/pieces/${result.color === 'w' ? 'b' : 'w'}_${PIECE_MAP[result.captured]}.svg`;
        if (result.color === 'w') newCapB.push(pieceImg);
        else newCapW.push(pieceImg);
        setCapW(newCapW); setCapB(newCapB);
        capWRef.current = newCapW; capBRef.current = newCapB;
      }

      setGame(gameCopy); gameRef.current = gameCopy;
      setLastMove({ from: result.from, to: result.to });

      let status = gameCopy.turn() === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS";
      if (gameCopy.isCheckmate()) status = "¡JAQUE MATE!";
      else if (gameCopy.isDraw()) status = "TABLAS";

      onGameStateChange(status);
      onMove(moveHistoryRef.current, newCapW, newCapB);
      return true;
    } catch { return false; }
  }, [onMove, onGameStateChange]);

  useEffect(() => { executeMoveRef.current = executeMove; }, [executeMove]);

  const { boardRef, dragFrom, dragOver, isDragging } = useDragController({
    orientation,
    canDrag: (coord) => {
      const g = gameRef.current;
      const file = coord.charCodeAt(0) - 97;
      const rank = 8 - parseInt(coord[1]);
      const piece = g.board()[rank]?.[file];
      return !!piece && piece.color === g.turn();
    },
    pieceSrc: (coord) => {
      const g = gameRef.current;
      const file = coord.charCodeAt(0) - 97;
      const rank = 8 - parseInt(coord[1]);
      const piece = g.board()[rank]?.[file];
      if (!piece) return null;
      return `/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`;
    },
    onDragStart: (from) => setSelectedSquare(from),
    onDragEnd: (from, to) => {
      if (to && to !== from) {
        executeMoveRef.current(from, to);
        setSelectedSquare(null);
      }
    },
    deps: [resetSignal, orientation],
  });

  const handleSquareClick = useCallback((coord: Square, piece: ReturnType<Chess['board']>[0][0]) => {
    if (isDragging) return;
    const isPieceMine = piece && piece.color === gameRef.current.turn();
    if (selectedSquare) {
      if (selectedSquare === coord) { setSelectedSquare(null); return; }
      const moved = executeMoveRef.current(selectedSquare, coord);
      if (!moved && isPieceMine) setSelectedSquare(coord);
      else setSelectedSquare(null);
    } else if (isPieceMine) {
      setSelectedSquare(coord);
    }
  }, [isDragging, selectedSquare]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const board        = game.board();
  const displayBoard = orientation === 'w'
    ? board
    : [...board].reverse().map(row => [...row].reverse());

  const legalTargets = selectedSquare
    ? game.moves({ square: selectedSquare, verbose: true }).map(m => m.to)
    : [];

  return (
    <div className="p-1 bg-zinc-950 rounded-[2rem] shadow-[0_60px_120px_rgba(0,0,0,0.95)] border border-white/10 backdrop-blur-sm select-none">
      <div
        ref={boardRef}
        className="grid grid-cols-8 grid-rows-8 w-[min(95vw,780px)] h-[min(95vw,780px)] bg-zinc-900 overflow-hidden rounded-xl border-[4px] border-black shadow-inner"
      >
        {displayBoard.map((row, i) =>
          row.map((piece, j) => {
            const rowIdx = orientation === 'w' ? i : 7 - i;
            const colIdx = orientation === 'w' ? j : 7 - j;
            const coord  = (String.fromCharCode(97 + colIdx) + (8 - rowIdx)) as Square;

            const isDark        = (rowIdx + colIdx) % 2 === 1;
            const isSelected    = selectedSquare === coord;
            const isLastMoveHi  = lastMove?.from === coord || lastMove?.to === coord;
            const isLegalTarget = legalTargets.includes(coord);
            const isDragTarget  = isDragging && dragOver === coord;
            const isCheck       = game.isCheck()
              && piece?.type === 'k'
              && piece?.color === game.turn();
            const isPieceMine   = piece && piece.color === game.turn();

            const appearDelay = appearing && piece
              ? `${(colIdx + rowIdx) * 18}ms` : '0ms';

            let bgClass = isDark ? 'bg-[#5c7da5]' : 'bg-[#d9e4f1]';
            if (isSelected) bgClass = isDark ? 'bg-[#7aaad4]' : 'bg-[#b8d4f0]/80';
            if (isCheck)    bgClass = 'bg-red-500/70';

            const squareCursor = isDragging
              ? 'cursor-grabbing'
              : isPieceMine ? 'cursor-grab'
              : (isLegalTarget || (selectedSquare && !piece)) ? 'cursor-pointer'
              : 'cursor-default';

            return (
              <div
                key={coord}
                data-square={coord}
                onClick={() => handleSquareClick(coord, piece)}
                className={`
                  relative flex items-center justify-center
                  transition-colors duration-150
                  ${bgClass} ${squareCursor}
                  ${isCheck ? 'animate-pulse' : ''}
                  ${isDragTarget ? 'brightness-110' : ''}
                `}
              >
                {isLastMoveHi && !isSelected && (
                  <div className="absolute inset-0 pointer-events-none z-0 bg-[#f6f669]/30 transition-colors duration-300" />
                )}
                {j === 0 && (
                  <span className={`absolute top-0.5 left-1 text-[10px] font-bold font-mono z-10 pointer-events-none
                    ${isDark ? 'text-[#d9e4f1]/60' : 'text-[#5c7da5]/90'}`}>
                    {8 - rowIdx}
                  </span>
                )}
                {i === 7 && (
                  <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold font-mono uppercase z-10 pointer-events-none
                    ${isDark ? 'text-[#d9e4f1]/60' : 'text-[#5c7da5]/90'}`}>
                    {String.fromCharCode(97 + colIdx)}
                  </span>
                )}
                {isLegalTarget && (
                  <div className={`absolute z-20 rounded-full pointer-events-none
                    transition-transform duration-100
                    ${isDragTarget ? 'scale-90' : 'scale-100'}
                    ${piece ? 'inset-0 rounded-full bg-black/15 shadow-[inset_0_0_0_5px_rgba(0,0,0,0.3)]' : 'w-[34%] h-[34%] bg-black/20'}`}
                  />
                )}
                {piece && (
                  <img
                    src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`}
                    draggable={false}
                    style={appearing ? {
                      opacity: 0,
                      animationName: 'pieceAppear',
                      animationDuration: '0.45s',
                      animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      animationFillMode: 'both',
                      animationDelay: appearDelay,
                    } : undefined}
                    className={`
                      w-[92%] h-[92%] z-20 drop-shadow-lg
                      ${appearing ? '' : 'transition-[opacity,transform] duration-150'}
                      ${isPieceMine ? 'cursor-grab' : ''}
                      ${isSelected && !isDragging ? 'scale-105 -translate-y-1' : ''}
                    `}
                    alt=""
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      <style>{`
        @keyframes pieceAppear {
          0%   { opacity: 0; transform: scale(0.88) translateY(6px); }
          60%  { opacity: 1;                                          }
          100% { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}