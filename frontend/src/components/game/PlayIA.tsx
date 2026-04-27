"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';

interface PlayIAProps {
  difficulty: number;
  onGameStateChange: (status: string) => void;
  onMove: (history: string[], capturedW: string[], capturedB: string[]) => void;
  resetSignal: number;
  orientation: 'w' | 'b';
}

const PIECE_MAP: Record<string, string> = { 
  p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" 
};

export default function PlayIA({ difficulty, onGameStateChange, onMove, resetSignal, orientation }: PlayIAProps) {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const [capW, setCapW] = useState<string[]>([]);
  const [capB, setCapB] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // ── Premove ──────────────────────────────────────────────────────────────
  const [premove, setPremove] = useState<{ from: Square; to: Square } | null>(null);
  const premoveRef = useRef<{ from: Square; to: Square } | null>(null);

  const clearPremove = useCallback(() => {
    setPremove(null);
    premoveRef.current = null;
  }, []);

  useEffect(() => {
    setGame(new Chess());
    setLastMove(null);
    setSelectedSquare(null);
    setCapW([]);
    setCapB([]);
    clearPremove();
    onGameStateChange("TU TURNO");
  }, [resetSignal, onGameStateChange, clearPremove]);

  const executeMove = useCallback((moveData: any, gameCopy?: Chess, existingCapW?: string[], existingCapB?: string[]): Chess | null => {
    try {
      const g = gameCopy ?? new Chess(game.fen());
      const result = g.move(moveData);
      if (!result) return null;

      const newCapW = [...(existingCapW ?? capW)];
      const newCapB = [...(existingCapB ?? capB)];

      if (result.captured) {
        const pieceImg = `/pieces/${result.color === 'w' ? 'b' : 'w'}_${PIECE_MAP[result.captured]}.svg`;
        if (result.color === 'w') newCapB.push(pieceImg);
        else newCapW.push(pieceImg);
        setCapB(newCapB);
        setCapW(newCapW);
      }

      setGame(g);
      setLastMove({ from: result.from, to: result.to });

      let status = g.turn() === orientation ? "TU TURNO" : "IA PENSANDO...";
      if (g.isCheckmate()) status = "¡JAQUE MATE!";
      else if (g.isDraw()) status = "TABLAS";
      onGameStateChange(status);
      onMove(g.history(), newCapW, newCapB);
      return g;
    } catch { return null; }
  }, [game, capW, capB, onMove, onGameStateChange, orientation]);

  // ── Ejecutar premove tras movimiento de la IA ────────────────────────────
  const executePremoveIfAny = useCallback((currentGame: Chess, currentCapW: string[], currentCapB: string[]) => {
    const pm = premoveRef.current;
    if (!pm) return;
    clearPremove();

    if (currentGame.turn() !== orientation) return; // no es nuestro turno aún

    const piece = currentGame.get(pm.from);
    if (!piece || piece.color !== orientation) return;

    const legalTargets = currentGame.moves({ square: pm.from, verbose: true }).map(m => m.to);
    if (!legalTargets.includes(pm.to)) return; // movimiento ya no es legal

    executeMove({ from: pm.from, to: pm.to, promotion: 'q' }, new Chess(currentGame.fen()), currentCapW, currentCapB);
  }, [clearPremove, executeMove, orientation]);

  // ── Validar y registrar premove (solo mientras es turno de la IA) ────────
  const setPremoveIfLegal = useCallback((from: Square, to: Square) => {
    const fenParts = game.fen().split(' ');
    fenParts[1] = orientation === 'w' ? 'w' : 'b'; // simulamos nuestro turno
    const tempChess = new Chess();
    try { tempChess.load(fenParts.join(' ')); } catch { return; }

    const piece = tempChess.get(from);
    if (!piece || piece.color !== orientation) return;

    const legalTargets = tempChess.moves({ square: from, verbose: true }).map(m => m.to);
    if (!legalTargets.includes(to)) return;

    const pm = { from, to };
    setPremove(pm);
    premoveRef.current = pm;
    setSelectedSquare(null);
  }, [game, orientation]);

  // ── IA mueve y luego intenta ejecutar premove ────────────────────────────
  useEffect(() => {
    const isIATurn = game.turn() !== orientation;
    if (isIATurn && !game.isGameOver()) {
      const timer = setTimeout(() => {
        const moves = game.moves();
        if (moves.length === 0) return;
        const move = moves[Math.floor(Math.random() * moves.length)];
        const resultGame = executeMove(move);
        if (resultGame) {
          // Intentar ejecutar premove tras el movimiento de la IA
          executePremoveIfAny(resultGame, capW, capB);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [game, executeMove, orientation, executePremoveIfAny, capW, capB]);

  const handleMove = useCallback((from: Square, to: Square) => {
    if (game.turn() !== orientation) {
      // Es turno de la IA → registrar premove
      setPremoveIfLegal(from, to);
      return;
    }

    const result = executeMove({ from, to, promotion: 'q' });
    if (!result) {
      setSelectedSquare(null);
      clearPremove();
    } else {
      setSelectedSquare(null);
    }
  }, [game, orientation, executeMove, setPremoveIfLegal, clearPremove]);

  const handleSquareClick = useCallback((coord: Square, piece: ReturnType<Chess['board']>[0][0]) => {
    // Click en casilla origen del premove → cancelar
    if (premoveRef.current && coord === premoveRef.current.from) {
      clearPremove();
      setSelectedSquare(null);
      return;
    }

    if (selectedSquare) {
      if (selectedSquare === coord) {
        setSelectedSquare(null);
        clearPremove();
      } else if (piece && piece.color === orientation && game.turn() === orientation) {
        setSelectedSquare(coord);
      } else {
        handleMove(selectedSquare, coord);
      }
    } else if (piece && piece.color === orientation) {
      setSelectedSquare(coord);
    }
  }, [selectedSquare, game, orientation, handleMove, clearPremove]);

  const board = game.board();
  const displayBoard = orientation === 'w' ? board : [...board].reverse().map(row => [...row].reverse());

  return (
    <div className="p-1 bg-zinc-950 rounded-[2rem] shadow-[0_60px_120px_rgba(0,0,0,0.95)] border border-white/10 backdrop-blur-sm">
      <div className={`grid grid-cols-8 grid-rows-8 w-[min(95vw,780px)] h-[min(95vw,780px)] bg-zinc-900 overflow-hidden rounded-xl border-[4px] border-black shadow-inner  ${isDragging ? 'cursor-grabbing' : ''}`}>
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
            const isPieceMine = piece && piece.color === orientation;
            const isPremoveFrom = premove?.from === coord;
            const isPremoveTo = premove?.to === coord;

            return (
              <div
                key={coord}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const fromSquare = e.dataTransfer.getData("fromSquare") as Square;
                  if (fromSquare) handleMove(fromSquare, coord);
                  setSelectedSquare(null);
                  setIsDragging(false);
                }}
                onClick={() => handleSquareClick(coord, piece)}
                className={`relative flex items-center justify-center transition-colors duration-200
                  ${isDark ? 'bg-[#a0522d]' : 'bg-[#e9ca9c]'} 
                  ${isSelected ? '!bg-gold/50' : ''}
                  ${isPremoveFrom || isPremoveTo ? '!bg-red-400/60' : ''}
                  ${isCheck ? '!bg-red-500/60 animate-pulse' : ''}
                  ${isLastMove && !isSelected && !isPremoveFrom && !isPremoveTo ? 'after:absolute after:inset-0 after:bg-gold/25 after:z-10' : ''}
                `}
              >
                {j === 0 && <span className={`absolute top-0.5 left-1 text-[11px] font-bold font-mono ${isDark ? 'text-[#e9ca9c] opacity-70' : 'text-[#3e2723] opacity-80'}`}>{8 - rowIdx}</span>}
                {i === 7 && <span className={`absolute bottom-0.5 right-1 text-[11px] font-bold font-mono uppercase ${isDark ? 'text-[#e9ca9c] opacity-70' : 'text-[#3e2723] opacity-80'}`}>{String.fromCharCode(97 + colIdx)}</span>}
                
                {isLegal && <div className={`absolute z-30 rounded-full ${piece ? 'w-full h-full border-4 border-black/10' : 'w-5 h-5 bg-black/15'}`} />}
                
                {piece && (
                  <img 
                    src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`} 
                    draggable={true}
                    onDragStart={(e) => {
                      if (!isPieceMine) return e.preventDefault();
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