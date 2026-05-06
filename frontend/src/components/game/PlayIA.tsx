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

// ── Cursor global ─────────────────────────────────────────────────────────────
let cursorStyle: HTMLStyleElement | null = null;
function setCursorGrabbing() {
  if (cursorStyle) return;
  cursorStyle = document.createElement('style');
  cursorStyle.textContent = '*{cursor:grabbing!important}';
  document.head.appendChild(cursorStyle);
}
function clearCursorGrabbing() {
  cursorStyle?.remove();
  cursorStyle = null;
}

// ── Drag controller ───────────────────────────────────────────────────────────
type DragCallbacks = {
  onStart : (from: Square) => void;
  onOver  : (sq: Square | null) => void;
  onEnd   : (from: Square, to: Square | null) => void;
  canDrag : (coord: Square) => boolean;
  pieceSrc: (coord: Square) => string | null;
};

function createDragController(
  boardEl: HTMLDivElement,
  getOrientation: () => 'w' | 'b',
  callbacks: DragCallbacks,
) {
  let floatImg  : HTMLImageElement | null = null;
  let sourceImg : HTMLImageElement | null = null;
  let fromSquare: Square | null = null;
  let lastOver  : Square | null = null;
  let raf       : number | null = null;
  let pendingX = 0, pendingY = 0;

  function squareSize() { return boardEl.getBoundingClientRect().width / 8; }
  function pointToSquare(clientX: number, clientY: number): Square | null {
    const rect = boardEl.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    const col = Math.floor(x / (rect.width  / 8));
    const row = Math.floor(y / (rect.height / 8));
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const o = getOrientation();
    return (String.fromCharCode(97 + (o === 'w' ? col : 7 - col)) +
            (8 - (o === 'w' ? row : 7 - row))) as Square;
  }
  function flushPosition() {
    raf = null;
    if (floatImg)
      floatImg.style.transform =
        `translate3d(${pendingX}px,${pendingY}px,0) translate(-50%,-50%)`;
  }
  function onMove(e: PointerEvent) {
    if (!fromSquare) return;
    pendingX = e.clientX; pendingY = e.clientY;
    if (!raf) raf = requestAnimationFrame(flushPosition);
    const sq = pointToSquare(e.clientX, e.clientY);
    if (sq !== lastOver) { lastOver = sq; callbacks.onOver(sq); }
  }
  function onUp(e: PointerEvent) {
    if (!fromSquare) return;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    const to   = pointToSquare(e.clientX, e.clientY);
    const from = fromSquare;
    floatImg?.remove(); floatImg = null;
    if (sourceImg) { sourceImg.style.opacity = ''; sourceImg = null; }
    clearCursorGrabbing();
    fromSquare = null; lastOver = null;
    document.removeEventListener('pointermove',   onMove);
    document.removeEventListener('pointerup',     onUp);
    document.removeEventListener('pointercancel', onUp);
    callbacks.onEnd(from, to);
  }
  function onDown(e: PointerEvent) {
    if (e.button !== 0) return;
    const sq = pointToSquare(e.clientX, e.clientY);
    if (!sq || !callbacks.canDrag(sq)) return;
    const src = callbacks.pieceSrc(sq);
    if (!src) return;
    setCursorGrabbing();
    e.preventDefault();
    fromSquare = sq;
    const imgEl = boardEl.querySelector<HTMLImageElement>(`[data-square="${sq}"] img`);
    if (imgEl) { sourceImg = imgEl; imgEl.style.opacity = '0.25'; }
    const size = squareSize() * 0.92;
    const fi   = document.createElement('img');
    fi.src           = src;
    fi.draggable     = false;
    fi.style.cssText = `
      position:fixed;top:0;left:0;
      width:${size}px;height:${size}px;
      pointer-events:none;z-index:9999;
      will-change:transform;
      filter:drop-shadow(0 8px 24px rgba(0,0,0,0.7));
      transform:translate3d(${e.clientX}px,${e.clientY}px,0) translate(-50%,-50%);
    `;
    document.body.appendChild(fi);
    floatImg = fi;
    pendingX = e.clientX; pendingY = e.clientY;
    document.addEventListener('pointermove',   onMove,  { passive: true });
    document.addEventListener('pointerup',     onUp);
    document.addEventListener('pointercancel', onUp);
    callbacks.onStart(sq);
  }
  boardEl.addEventListener('pointerdown', onDown);
  function destroy() {
    boardEl.removeEventListener('pointerdown', onDown);
    floatImg?.remove();
    if (sourceImg) sourceImg.style.opacity = '';
    clearCursorGrabbing();
    document.removeEventListener('pointermove',   onMove);
    document.removeEventListener('pointerup',     onUp);
    document.removeEventListener('pointercancel', onUp);
    if (raf) cancelAnimationFrame(raf);
  }
  return { destroy };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PlayIA({ difficulty, onGameStateChange, onMove, resetSignal, orientation }: PlayIAProps) {
  const [game, setGame]               = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove]       = useState<{ from: string; to: string } | null>(null);
  const [capW, setCapW]               = useState<string[]>([]);
  const [capB, setCapB]               = useState<string[]>([]);
  const [appearing, setAppearing]     = useState(true);
  const [dragFrom, setDragFrom]       = useState<Square | null>(null);
  const [dragOver, setDragOver]       = useState<Square | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showDisconnected, setShowDisconnected] = useState(false);
  const [premove, setPremove]         = useState<{ from: Square; to: Square } | null>(null);

  const boardRef       = useRef<HTMLDivElement>(null);
  const controllerRef  = useRef<{ destroy: () => void } | null>(null);
  const executeMoveRef = useRef<(from: Square, to: Square) => boolean>(() => false);
  const gameRef        = useRef(game);
  const premoveRef     = useRef<{ from: Square; to: Square } | null>(null);
  const capWRef        = useRef<string[]>([]);
  const capBRef        = useRef<string[]>([]);
  const moveHistoryRef = useRef<string[]>([]);

  useEffect(() => { gameRef.current = game; },  [game]);
  useEffect(() => { capWRef.current = capW; },  [capW]);
  useEffect(() => { capBRef.current = capB; },  [capB]);

  const { sendMove, connected, connecting, reconnect } = useAIGameSocket(difficulty);

  useEffect(() => {
    if (connected || connecting) { setShowDisconnected(false); return; }
    const t = setTimeout(() => setShowDisconnected(true), 600);
    return () => clearTimeout(t);
  }, [connected, connecting]);

  useEffect(() => {
    const g = new Chess();
    setGame(g); gameRef.current = g;
    setLastMove(null); setSelectedSquare(null);
    setCapW([]); setCapB([]);
    capWRef.current = []; capBRef.current = [];
    setDragFrom(null); setDragOver(null);
    moveHistoryRef.current = [];
    setPremove(null); premoveRef.current = null;
    setIsAIThinking(false);
    setAppearing(true);
    const t = setTimeout(() => setAppearing(false), 900);
    onGameStateChange("TU TURNO");
    reconnect();
    return () => clearTimeout(t);
  }, [resetSignal, onGameStateChange, reconnect]);

  // Drag controller — recreate when puzzle/orientation changes
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    controllerRef.current?.destroy();
    controllerRef.current = createDragController(
      el,
      () => orientation,
      {
        canDrag: (coord) => {
          if (gameRef.current.turn() !== orientation) return false;
          const file = coord.charCodeAt(0) - 97;
          const rank = 8 - parseInt(coord[1]);
          const piece = gameRef.current.board()[rank]?.[file];
          return !!piece && piece.color === orientation;
        },
        pieceSrc: (coord) => {
          const file = coord.charCodeAt(0) - 97;
          const rank = 8 - parseInt(coord[1]);
          const piece = gameRef.current.board()[rank]?.[file];
          if (!piece) return null;
          return `/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`;
        },
        onStart: (from) => { setDragFrom(from); setSelectedSquare(from); setDragOver(from); },
        onOver:  (sq)   => setDragOver(sq),
        onEnd:   (from, to) => {
          setDragFrom(null); setDragOver(null);
          if (to && to !== from) {
            executeMoveRef.current(from, to);
            setSelectedSquare(null);
          }
        },
      },
    );
    return () => { controllerRef.current?.destroy(); controllerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, orientation]);

  const clearPremove = useCallback(() => {
    setPremove(null); premoveRef.current = null;
  }, []);

  const applyMoveResult = useCallback((
    result: ReturnType<Chess['move']>,
    g: Chess,
    currentCapW: string[],
    currentCapB: string[]
  ) => {
    const san = g.history({ verbose: true }).slice(-1)[0]?.san || result.san || '';
    if (san) moveHistoryRef.current = [...moveHistoryRef.current, san];

    const newCapW = [...currentCapW];
    const newCapB = [...currentCapB];
    if (result.captured) {
      const pieceImg = `/pieces/${result.color === 'w' ? 'b' : 'w'}_${PIECE_MAP[result.captured]}.svg`;
      if (result.color === 'w') newCapB.push(pieceImg);
      else newCapW.push(pieceImg);
    }
    setCapW(newCapW); setCapB(newCapB);
    capWRef.current = newCapW; capBRef.current = newCapB;
    setGame(g); gameRef.current = g;
    setLastMove({ from: result.from, to: result.to });
    onMove(moveHistoryRef.current, newCapW, newCapB);
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
      // Premove
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
        setPremove(pm); premoveRef.current = pm;
        setSelectedSquare(null);
      } catch { }
      return;
    }

    const gameCopy = new Chess(currentGame.fen());
    let moveResult: ReturnType<Chess['move']> | null = null;
    try { moveResult = gameCopy.move({ from, to, promotion: 'q' }); } catch { }
    if (!moveResult) { setSelectedSquare(null); return; }

    const { newCapW, newCapB } = applyMoveResult(moveResult, gameCopy, capWRef.current, capBRef.current);
    setSelectedSquare(null);
    clearPremove();
    if (checkGameOver(gameCopy)) return;

    const uci = `${from}${to}${moveResult.promotion ?? ''}`;
    setIsAIThinking(true);
    onGameStateChange('IA PENSANDO...');

    const startTime = Date.now();
    const MIN_THINKING_TIME = 1300;

    try {
      const response = await sendMove(uci);
      const elapsed  = Date.now() - startTime;
      await new Promise(resolve => setTimeout(resolve, Math.max(0, MIN_THINKING_TIME - elapsed)));
      setIsAIThinking(false);

      if (response.gameOver) {
        onGameStateChange(response.result === '1/2-1/2' ? 'TABLAS' : '¡JAQUE MATE!');
        return;
      }

      const afterAI = new Chess(response.fen);
      const aiFrom  = response.aiMove.slice(0, 2) as Square;
      const aiTo    = response.aiMove.slice(2, 4) as Square;

      const tempForSAN = new Chess(gameCopy.fen());
      let aiSan = response.aiMove;
      try {
        tempForSAN.move(response.aiMove);
        aiSan = tempForSAN.history({ verbose: true }).slice(-1)[0]?.san || response.aiMove;
      } catch { }
      moveHistoryRef.current = [...moveHistoryRef.current, aiSan];

      const capturedByAI = gameCopy.get(aiTo);
      const finalCapW = [...newCapW];
      const finalCapB = [...newCapB];
      if (capturedByAI) {
        const aiColor  = orientation === 'w' ? 'b' : 'w';
        const pieceImg = `/pieces/${aiColor === 'w' ? 'b' : 'w'}_${PIECE_MAP[capturedByAI.type]}.svg`;
        if (aiColor === 'w') finalCapB.push(pieceImg);
        else finalCapW.push(pieceImg);
        setCapW(finalCapW); setCapB(finalCapB);
        capWRef.current = finalCapW; capBRef.current = finalCapB;
      }

      setGame(afterAI); gameRef.current = afterAI;
      setLastMove({ from: aiFrom, to: aiTo });
      onMove(moveHistoryRef.current, finalCapW, finalCapB);

      if (!checkGameOver(afterAI)) {
        const pm = premoveRef.current;
        if (pm) {
          clearPremove();
          if (afterAI.turn() === orientation) {
            const piece = afterAI.get(pm.from);
            if (piece && piece.color === orientation) {
              const legal = afterAI.moves({ square: pm.from, verbose: true }).map(m => m.to);
              if (legal.includes(pm.to)) {
                setTimeout(() => handleMove(pm.from, pm.to), 50);
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

  useEffect(() => {
    executeMoveRef.current = (from, to) => { handleMove(from, to); return true; };
  }, [handleMove]);

  const handleSquareClick = useCallback((coord: Square, piece: ReturnType<Chess['board']>[0][0]) => {
    if (dragFrom) return;
    if (premoveRef.current && coord === premoveRef.current.from) {
      clearPremove(); setSelectedSquare(null); return;
    }
    if (selectedSquare) {
      if (selectedSquare === coord) { setSelectedSquare(null); clearPremove(); return; }
      if (piece && piece.color === orientation && gameRef.current.turn() === orientation) {
        setSelectedSquare(coord);
      } else {
        handleMove(selectedSquare, coord);
        setSelectedSquare(null);
      }
    } else if (piece && piece.color === orientation) {
      setSelectedSquare(coord);
    }
  }, [dragFrom, selectedSquare, orientation, handleMove, clearPremove]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const board        = game.board();
  const displayBoard = orientation === 'w'
    ? board
    : [...board].reverse().map(row => [...row].reverse());

  const legalTargets = selectedSquare
    ? game.moves({ square: selectedSquare, verbose: true }).map(m => m.to)
    : [];
  const isDragging = !!dragFrom;

  return (
    <div className="relative flex flex-col items-center">
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

      {premove && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">
            Premovimiento: {premove.from} → {premove.to}
          </span>
          <button onClick={clearPremove} className="text-red-400/60 hover:text-red-400 text-[10px] font-black ml-1 cursor-pointer">✕</button>
        </div>
      )}

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
              const isPremoveFrom = premove?.from === coord;
              const isPremoveTo   = premove?.to   === coord;
              const isCheck       = game.isCheck()
                && piece?.type === 'k'
                && piece?.color === game.turn();
              const isPieceMine   = piece && piece.color === orientation;

              const appearDelay = appearing && piece
                ? `${(colIdx + rowIdx) * 18}ms` : '0ms';

              let bgClass = isDark ? 'bg-[#a0522d]' : 'bg-[#e9ca9c]';
              if (isSelected)    bgClass = isDark ? 'bg-[#c8763d]/80' : 'bg-[#f0d080]/80';
              if (isPremoveFrom || isPremoveTo) bgClass = 'bg-red-400/60';
              if (isCheck)       bgClass = 'bg-red-500/70';

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
                  {isLastMoveHi && !isSelected && !isPremoveFrom && !isPremoveTo && (
                    <div className="absolute inset-0 pointer-events-none z-0 bg-[#f6f669]/30 transition-colors duration-300" />
                  )}
                  {j === 0 && (
                    <span className={`absolute top-0.5 left-1 text-[10px] font-bold font-mono z-10 pointer-events-none
                      ${isDark ? 'text-[#e9ca9c]/70' : 'text-[#3e2723]/80'}`}>
                      {8 - rowIdx}
                    </span>
                  )}
                  {i === 7 && (
                    <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold font-mono uppercase z-10 pointer-events-none
                      ${isDark ? 'text-[#e9ca9c]/70' : 'text-[#3e2723]/80'}`}>
                      {String.fromCharCode(97 + colIdx)}
                    </span>
                  )}
                  {isLegalTarget && (
                    <div className={`absolute z-20 rounded-full pointer-events-none
                      transition-transform duration-100
                      ${isDragTarget ? 'scale-125' : 'scale-100'}
                      ${piece ? 'inset-0 border-[5px] border-black/25' : 'w-[32%] h-[32%] bg-black/20'}`}
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