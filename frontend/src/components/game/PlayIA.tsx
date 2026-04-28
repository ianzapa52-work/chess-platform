"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { useAIGameSocket } from '@/hooks/useAIGameSocket';

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
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capW, setCapW] = useState<string[]>([]);
  const [capB, setCapB] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);

  // ── Badge de desconexión: solo se muestra tras un delay para evitar flash al montar
  const [showDisconnected, setShowDisconnected] = useState(false);

  const [premove, setPremove] = useState<{ from: Square; to: Square } | null>(null);
  const premoveRef = useRef<{ from: Square; to: Square } | null>(null);

  const capWRef  = useRef<string[]>([]);
  const capBRef  = useRef<string[]>([]);
  const gameRef  = useRef<Chess>(game);

  useEffect(() => { capWRef.current  = capW;  }, [capW]);
  useEffect(() => { capBRef.current  = capB;  }, [capB]);
  useEffect(() => { gameRef.current  = game;  }, [game]);

  const { sendMove, connected, connecting, reconnect } = useAIGameSocket(difficulty);

  // Solo mostrar el badge de desconexión si llevamos >600 ms sin conectar
  // Esto elimina el flash al navegar a la página
  useEffect(() => {
    if (connected || connecting) {
      setShowDisconnected(false);
      return;
    }
    const t = setTimeout(() => setShowDisconnected(true), 600);
    return () => clearTimeout(t);
  }, [connected, connecting]);

  // ── Reset
  useEffect(() => {
    const newGame = new Chess();
    setGame(newGame);
    gameRef.current = newGame;
    setLastMove(null);
    setSelectedSquare(null);
    setCapW([]);
    setCapB([]);
    capWRef.current = [];
    capBRef.current = [];
    setPremove(null);
    premoveRef.current = null;
    setIsAIThinking(false);
    onGameStateChange("TU TURNO");
  }, [resetSignal, onGameStateChange]);

  const clearPremove = useCallback(() => {
    setPremove(null);
    premoveRef.current = null;
  }, []);

  const applyMoveResult = useCallback((
    result: ReturnType<Chess['move']>,
    g: Chess,
    currentCapW: string[],
    currentCapB: string[]
  ) => {
    const newCapW = [...currentCapW];
    const newCapB = [...currentCapB];

    if (result.captured) {
      const pieceImg = `/pieces/${result.color === 'w' ? 'b' : 'w'}_${PIECE_MAP[result.captured]}.svg`;
      if (result.color === 'w') newCapB.push(pieceImg);
      else newCapW.push(pieceImg);
    }

    setCapW(newCapW);
    setCapB(newCapB);
    capWRef.current = newCapW;
    capBRef.current = newCapB;
    setGame(g);
    gameRef.current = g;
    setLastMove({ from: result.from, to: result.to });
    onMove(g.history(), newCapW, newCapB);

    return { newCapW, newCapB };
  }, [onMove]);

  const checkGameOver = useCallback((g: Chess): boolean => {
    if (g.isCheckmate()) { onGameStateChange('¡JAQUE MATE!'); return true; }
    if (g.isDraw())      { onGameStateChange('TABLAS');       return true; }
    return false;
  }, [onGameStateChange]);

  const handleMove = useCallback(async (from: Square, to: Square) => {
    const currentGame = gameRef.current;

    if (currentGame.turn() !== orientation) {
      const fenParts = currentGame.fen().split(' ');
      fenParts[1] = orientation;
      const tempChess = new Chess();
      try {
        tempChess.load(fenParts.join(' '));
        const piece = tempChess.get(from);
        if (!piece || piece.color !== orientation) return;
        const legalTargets = tempChess.moves({ square: from, verbose: true }).map(m => m.to);
        if (!legalTargets.includes(to)) return;
        const pm = { from, to };
        setPremove(pm);
        premoveRef.current = pm;
        setSelectedSquare(null);
      } catch { }
      return;
    }

    const gameCopy = new Chess(currentGame.fen());
    let moveResult: ReturnType<Chess['move']> | null = null;
    try {
      moveResult = gameCopy.move({ from, to, promotion: 'q' });
    } catch { }

    if (!moveResult) { setSelectedSquare(null); return; }

    const { newCapW, newCapB } = applyMoveResult(moveResult, gameCopy, capWRef.current, capBRef.current);
    setSelectedSquare(null);
    clearPremove();

    if (checkGameOver(gameCopy)) return;

    const uci = `${from}${to}${moveResult.promotion ?? ''}`;
    setIsAIThinking(true);
    onGameStateChange('IA PENSANDO...');

    try {
      const response = await sendMove(uci);
      setIsAIThinking(false);

      if (response.gameOver) {
        onGameStateChange(response.result === '1/2-1/2' ? 'TABLAS' : '¡JAQUE MATE!');
        return;
      }

      const afterAI = new Chess(response.fen);
      const aiFrom  = response.aiMove.slice(0, 2) as Square;
      const aiTo    = response.aiMove.slice(2, 4) as Square;

      const capturedByAI = gameCopy.get(aiTo);
      const finalCapW = [...newCapW];
      const finalCapB = [...newCapB];

      if (capturedByAI) {
        const aiColor  = orientation === 'w' ? 'b' : 'w';
        const pieceImg = `/pieces/${aiColor === 'w' ? 'b' : 'w'}_${PIECE_MAP[capturedByAI.type]}.svg`;
        if (aiColor === 'w') finalCapB.push(pieceImg);
        else finalCapW.push(pieceImg);
        setCapW(finalCapW);
        setCapB(finalCapB);
        capWRef.current = finalCapW;
        capBRef.current = finalCapB;
      }

      setGame(afterAI);
      gameRef.current = afterAI;
      setLastMove({ from: aiFrom, to: aiTo });
      onMove(afterAI.history(), finalCapW, finalCapB);

      if (!checkGameOver(afterAI)) {
        const pm = premoveRef.current;
        if (pm) {
          clearPremove();
          if (afterAI.turn() === orientation) {
            const piece = afterAI.get(pm.from);
            if (piece && piece.color === orientation) {
              const legalTargets = afterAI.moves({ square: pm.from, verbose: true }).map(m => m.to);
              if (legalTargets.includes(pm.to)) {
                setTimeout(() => handleMove(pm.from, pm.to), 0);
                return;
              }
            }
          }
        }
        onGameStateChange('TU TURNO');
      }
    } catch (err) {
      console.error('Error comunicando con Stockfish:', err);
      setIsAIThinking(false);
      onGameStateChange('TU TURNO');
    }
  }, [orientation, applyMoveResult, clearPremove, checkGameOver, sendMove, onGameStateChange, onMove]);

  const handleSquareClick = useCallback((coord: Square, piece: ReturnType<Chess['board']>[0][0]) => {
    if (isAIThinking) return;

    if (premoveRef.current && coord === premoveRef.current.from) {
      clearPremove();
      setSelectedSquare(null);
      return;
    }

    if (selectedSquare) {
      if (selectedSquare === coord) {
        setSelectedSquare(null);
        clearPremove();
      } else if (piece && piece.color === orientation && gameRef.current.turn() === orientation) {
        setSelectedSquare(coord);
      } else {
        handleMove(selectedSquare, coord);
      }
    } else if (piece && piece.color === orientation) {
      setSelectedSquare(coord);
    }
  }, [selectedSquare, orientation, handleMove, clearPremove, isAIThinking]);

  const board        = game.board();
  const displayBoard = orientation === 'w' ? board : [...board].reverse().map(row => [...row].reverse());

  return (
    <div className="relative flex flex-col items-center">

      {/* Badge de desconexión — con delay para no aparecer al montar */}
      {showDisconnected && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-700/50 backdrop-blur-sm whitespace-nowrap pointer-events-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-red-300 text-[9px] font-bold tracking-widest uppercase">Sin conexión</span>
          <button
            onClick={reconnect}
            className="text-red-400 text-[9px] font-black uppercase tracking-widest underline underline-offset-2 hover:text-white transition-colors cursor-pointer ml-1"
          >
            Reconectar
          </button>
        </div>
      )}

      <div className="p-1 bg-zinc-950 rounded-[2rem] shadow-[0_60px_120px_rgba(0,0,0,0.95)] border border-white/10 backdrop-blur-sm">
        <div className={`grid grid-cols-8 grid-rows-8 w-[min(95vw,780px)] h-[min(95vw,780px)] bg-zinc-900 overflow-hidden rounded-xl border-[4px] border-black shadow-inner ${isDragging ? 'cursor-grabbing' : ''}`}>
          {displayBoard.map((row, i) =>
            row.map((piece, j) => {
              const rowIdx = orientation === 'w' ? i : 7 - i;
              const colIdx = orientation === 'w' ? j : 7 - j;
              const coord  = (String.fromCharCode(97 + colIdx) + (8 - rowIdx)) as Square;

              const isDark        = (rowIdx + colIdx) % 2 === 1;
              const isSelected    = selectedSquare === coord;
              const isLastMove    = lastMove?.from === coord || lastMove?.to === coord;
              const isCheck       = game.isCheck() && piece?.type === 'k' && piece?.color === game.turn();
              const isLegal       = selectedSquare && game.moves({ square: selectedSquare, verbose: true }).some(m => m.to === coord);
              const isPieceMine   = piece && piece.color === orientation;
              const isPremoveFrom = premove?.from === coord;
              const isPremoveTo   = premove?.to === coord;

              return (
                <div
                  key={coord}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const fromSquare = e.dataTransfer.getData("fromSquare") as Square;
                    if (fromSquare) handleMove(fromSquare, coord);
                    setSelectedSquare(null);
                    setIsDragging(false);
                  }}
                  onClick={() => handleSquareClick(coord, piece)}
                  className={`relative flex items-center justify-center transition-colors duration-200
                    ${isDark ? 'bg-[#a0522d]' : 'bg-[#e9ca9c]'}
                    ${isSelected    ? '!bg-gold/50'     : ''}
                    ${isPremoveFrom || isPremoveTo ? '!bg-red-400/60' : ''}
                    ${isCheck       ? '!bg-red-500/60 animate-pulse' : ''}
                    ${isLastMove && !isSelected && !isPremoveFrom && !isPremoveTo
                      ? 'after:absolute after:inset-0 after:bg-gold/25 after:z-10' : ''}
                    ${isAIThinking  ? 'cursor-wait' : ''}
                  `}
                >
                  {j === 0 && (
                    <span className={`absolute top-0.5 left-1 text-[11px] font-bold font-mono ${isDark ? 'text-[#e9ca9c] opacity-70' : 'text-[#3e2723] opacity-80'}`}>
                      {8 - rowIdx}
                    </span>
                  )}
                  {i === 7 && (
                    <span className={`absolute bottom-0.5 right-1 text-[11px] font-bold font-mono uppercase ${isDark ? 'text-[#e9ca9c] opacity-70' : 'text-[#3e2723] opacity-80'}`}>
                      {String.fromCharCode(97 + colIdx)}
                    </span>
                  )}
                  {isLegal && (
                    <div className={`absolute z-30 rounded-full ${piece ? 'w-full h-full border-4 border-black/10' : 'w-5 h-5 bg-black/15'}`} />
                  )}
                  {piece && (
                    <img
                      src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`}
                      draggable={!!isPieceMine && !isAIThinking}
                      onDragStart={e => {
                        if (!isPieceMine || isAIThinking) return e.preventDefault();
                        e.dataTransfer.setData("fromSquare", coord);
                        setSelectedSquare(coord);
                        setIsDragging(true);
                      }}
                      onDragEnd={() => setIsDragging(false)}
                      className={`w-[92%] h-[92%] z-20 transition-transform drop-shadow-lg
                        ${isAIThinking ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}
                        ${isSelected   ? 'scale-105 -translate-y-1' : ''}
                      `}
                      alt=""
                    />
                  )}
                  {isAIThinking && isLastMove && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-gold animate-ping opacity-70" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}