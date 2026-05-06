"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, type Square } from 'chess.js';
import { useDragController } from '@/hooks/useDragController';

interface ApiPuzzle {
  id: string;
  rating: number;
  themes: string[];
  initial_fen: string;
  blunder_move: string;
  solution: string[];
}

interface PuzzleBoardProps {
  puzzle: ApiPuzzle;
  onSuccess: () => void;
  onFeedback: (msg: string, color: string) => void;
}

const PIECE_MAP: Record<string, string> = {
  p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king",
};

function buildStartPosition(puzzle: ApiPuzzle): Chess {
  const g = new Chess(puzzle.initial_fen);
  g.move(puzzle.blunder_move);
  return g;
}

function getPuzzleOrientation(puzzle: ApiPuzzle): 'w' | 'b' {
  const g = new Chess(puzzle.initial_fen);
  g.move(puzzle.blunder_move);
  return g.turn();
}

export default function PuzzleBoard({ puzzle, onSuccess, onFeedback }: PuzzleBoardProps) {
  const [game, setGame]                     = useState<Chess>(() => buildStartPosition(puzzle));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove]             = useState<{ from: string; to: string } | null>(null);
  const [wrongSquare, setWrongSquare]       = useState<string | null>(null);
  const [returnPiece, setReturnPiece]       = useState<string | null>(null);
  const [returnOffset, setReturnOffset]     = useState<{ x: number; y: number } | null>(null);
  const [solved, setSolved]                 = useState(false);
  const [appearing, setAppearing]           = useState(true);

  const gameRef   = useRef(game);
  const solvedRef = useRef(solved);
  useEffect(() => { gameRef.current   = game;   }, [game]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);

  // Devuelve el offset en px de `to` relativo a `from` dentro del tablero
  const getSquareOffset = useCallback((from: Square, to: Square): { x: number; y: number } | null => {
    const el = boardRef.current;
    if (!el) return null;
    const fromEl = el.querySelector<HTMLElement>(`[data-square="${from}"]`);
    const toEl   = el.querySelector<HTMLElement>(`[data-square="${to}"]`);
    if (!fromEl || !toEl) return null;
    const fr = fromEl.getBoundingClientRect();
    const tr = toEl.getBoundingClientRect();
    return { x: tr.left - fr.left, y: tr.top - fr.top };
  }, []);

  // Reset al cambiar puzzle
  useEffect(() => {
    setGame(buildStartPosition(puzzle));
    setSelectedSquare(null);
    setLastMove(null);
    setWrongSquare(null);
    setReturnPiece(null);
    setReturnOffset(null);
    setSolved(false);
    setAppearing(true);
    const t = setTimeout(() => setAppearing(false), 900);
    return () => clearTimeout(t);
  }, [puzzle]);

  const executeMove = useCallback((from: Square, to: Square): boolean => {
    if (solvedRef.current) return false;
    if (from === to) return false;
    const g = gameRef.current;
    const moveStr   = from + to;
    const isCorrect = moveStr === puzzle.solution[0] || moveStr + 'q' === puzzle.solution[0];
    try {
      const gameCopy = new Chess(g.fen());
      const result   = gameCopy.move({ from, to, promotion: 'q' });
      if (!result) return false;
      setLastMove({ from, to });
      if (isCorrect) {
        setGame(gameCopy);
        setWrongSquare(null);
        setReturnPiece(null);
        setSolved(true);
        onFeedback("¡CORRECTO!", "#2ecc71");
        window.dispatchEvent(new CustomEvent('puzzle-solved', { detail: puzzle.id }));
        onSuccess();
      } else {
        setGame(gameCopy);
        setWrongSquare(to);
        onFeedback("INTÉNTALO DE NUEVO", "#ec2914");

        const FLASH_MS    = 350; // duración del flash rojo
        const SLIDE_MS    = 420; // debe coincidir con la duración CSS de pieceSlideBack

        // 1. Flash rojo termina → calculamos offset y restauramos el juego
        //    En el mismo frame: la pieza ya está en `from` (posición real del juego original)
        //    y la animación la desplaza visualmente desde `to` hasta `from`.
        setTimeout(() => {
          const offset = getSquareOffset(from, to);
          setGame(buildStartPosition(puzzle)); // ← juego restaurado: pieza aparece en `from`
          setReturnOffset(offset);             // ← offset listo antes del paint
          setReturnPiece(from);                // ← activa la animación
          setWrongSquare(null);
          setLastMove(null);
          setSelectedSquare(null);
        }, FLASH_MS);

        // 2. Animación termina → limpiamos returnPiece/offset y mensaje
        setTimeout(() => {
          setReturnPiece(null);
          setReturnOffset(null);
          onFeedback("TU TURNO", "#ffffff");
        }, FLASH_MS + SLIDE_MS);
      }
      return true;
    } catch { return false; }
  }, [puzzle, onSuccess, onFeedback, getSquareOffset]);

  const executeMoveRef = useRef(executeMove);
  useEffect(() => { executeMoveRef.current = executeMove; }, [executeMove]);

  // ── Drag controller ───────────────────────────────────────────────────────
  const { boardRef, dragFrom, dragOver, isDragging } = useDragController({
    orientation: getPuzzleOrientation(puzzle),
    canDrag: (coord: Square) => {
      if (solvedRef.current) return false;
      const file  = coord.charCodeAt(0) - 97;
      const rank  = 8 - parseInt(coord[1]);
      const piece = gameRef.current.board()[rank]?.[file];
      return !!piece && piece.color === gameRef.current.turn();
    },
    pieceSrc: (coord: Square) => {
      const file  = coord.charCodeAt(0) - 97;
      const rank  = 8 - parseInt(coord[1]);
      const piece = gameRef.current.board()[rank]?.[file];
      return piece ? `/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg` : null;
    },
    onDragStart: (from: Square) => setSelectedSquare(from),
    onDragEnd: (from: Square, to: Square | null) => {
      if (to && to !== from) {
        executeMoveRef.current(from, to);
        setSelectedSquare(null);
      }
    },
    deps: [puzzle],
  });

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleSquareClick = useCallback((coord: Square, piece: ReturnType<Chess['board']>[0][0]) => {
    if (solvedRef.current || dragFrom) return;
    const isPieceMine = piece && piece.color === gameRef.current.turn();
    if (selectedSquare) {
      if (selectedSquare === coord) { setSelectedSquare(null); return; }
      const moved = executeMoveRef.current(selectedSquare, coord);
      if (!moved && isPieceMine) setSelectedSquare(coord);
      else setSelectedSquare(null);
    } else if (isPieceMine) {
      setSelectedSquare(coord);
    }
  }, [dragFrom, selectedSquare]);

  // ── Render ────────────────────────────────────────────────────────────────
  const orient       = getPuzzleOrientation(puzzle);
  const board        = game.board();
  const displayBoard = orient === 'w'
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
            const rowIdx = orient === 'w' ? i : 7 - i;
            const colIdx = orient === 'w' ? j : 7 - j;
            const coord  = (String.fromCharCode(97 + colIdx) + (8 - rowIdx)) as Square;

            const isDark        = (rowIdx + colIdx) % 2 === 1;
            const isSelected    = selectedSquare === coord;
            const isLastMoveHi  = lastMove?.from === coord || lastMove?.to === coord;
            const isLegalTarget = legalTargets.includes(coord);
            const isWrong       = wrongSquare === coord;
            const isReturn      = returnPiece === coord;
            const isSuccess     = solved && isLastMoveHi;
            const isPieceMine   = piece && piece.color === game.turn() && !solved;
            const isDragTarget  = isDragging && dragOver === coord;
            const isCheck       = !solved && game.isCheck()
              && piece?.type === 'k'
              && piece?.color === game.turn();

            const appearDelay = appearing && piece
              ? `${(colIdx + rowIdx) * 18}ms` : '0ms';

            let bgClass = isDark ? 'bg-[#779845]' : 'bg-[#ebecd0]';
            if (isSelected) bgClass = isDark ? 'bg-[#bbcc44]' : 'bg-[#f6f669]/80';
            if (isCheck)    bgClass = 'bg-red-500/70';
            if (isWrong)    bgClass = '';

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
                style={isWrong ? {
                  background: 'radial-gradient(circle at center, #ff1a1a 0%, #c0392b 45%, #7b1010 100%)',
                } : undefined}
                className={`
                  relative flex items-center justify-center
                  transition-colors duration-150
                  ${bgClass} ${squareCursor}
                  ${isCheck     ? 'animate-pulse' : ''}
                  ${isWrong     ? 'wrong-flash shadow-[inset_0_0_28px_rgba(255,0,0,0.6)]' : ''}
                  ${isSuccess   ? 'shadow-[inset_0_0_16px_rgba(46,204,113,0.5)]' : ''}
                  ${isDragTarget && !isWrong ? 'brightness-110' : ''}
                `}
              >
                {isLastMoveHi && !isSelected && !isWrong && (
                  <div className={`absolute inset-0 pointer-events-none z-0 transition-colors duration-300
                    ${isSuccess ? 'bg-[#2ecc71]/30' : 'bg-[#f6f669]/30'}`} />
                )}
                {j === 0 && (
                  <span className={`absolute top-0.5 left-1 text-[10px] font-bold font-mono z-10 pointer-events-none
                    ${isDark ? 'text-[#eeeed2]/60' : 'text-[#779845]/90'}`}>
                    {8 - rowIdx}
                  </span>
                )}
                {i === 7 && (
                  <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold font-mono uppercase z-10 pointer-events-none
                    ${isDark ? 'text-[#eeeed2]/60' : 'text-[#779845]/90'}`}>
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
                    style={
                      isReturn && returnOffset
                        ? ({
                            '--rx': `${returnOffset.x}px`,
                            '--ry': `${returnOffset.y}px`,
                          } as React.CSSProperties)
                        : appearing ? {
                            opacity: 0,
                            animationName: 'pieceAppear',
                            animationDuration: '0.45s',
                            animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            animationFillMode: 'both',
                            animationDelay: appearDelay,
                          }
                        : undefined
                    }
                    className={`
                      w-[92%] h-[92%] z-20 drop-shadow-lg
                      ${appearing || isReturn ? '' : 'transition-[opacity,transform] duration-150'}
                      ${isPieceMine ? 'cursor-grab' : ''}
                      ${isSelected && !isDragging ? 'scale-105 -translate-y-1' : ''}
                      ${isReturn && returnOffset ? 'piece-return' : ''}
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
          60%  { opacity: 1; }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .piece-return {
          animation: pieceSlideBack 420ms cubic-bezier(0.22, 0.68, 0.36, 1) both;
        }
        @keyframes pieceSlideBack {
          0%   { transform: translate(var(--rx), var(--ry)) scale(1); opacity: 0.7; }
          60%  { opacity: 1; }
          85%  { transform: translate(0, 0) scale(1.06); }
          100% { transform: translate(0, 0) scale(1);    opacity: 1; }
        }
        .wrong-flash {
          animation: wrongPulse 0.65s ease-out forwards;
        }
        @keyframes wrongPulse {
          0%   { filter: brightness(1.6) saturate(1.2); }
          40%  { filter: brightness(1.2) saturate(1.1); }
          100% { filter: brightness(1) saturate(1); }
        }
      `}</style>
    </div>
  );
}