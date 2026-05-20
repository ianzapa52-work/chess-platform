"use client";
import { CSSProperties, useState, useEffect, useCallback, useRef } from 'react';
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
  onWrongMove?: () => void;
  giveUp?: boolean;
  onGiveUpDone?: () => void;
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

export default function PuzzleBoard({
  puzzle, onSuccess, onFeedback, onWrongMove, giveUp = false, onGiveUpDone,
}: PuzzleBoardProps) {
  const initFen = () => buildStartPosition(puzzle).fen();

  const [game, setGame]                     = useState<Chess>(() => buildStartPosition(puzzle));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove]             = useState<{ from: string; to: string } | null>(null);
  const [wrongSquare, setWrongSquare]       = useState<string | null>(null);
  const [returnPiece, setReturnPiece]       = useState<string | null>(null);
  const [returnOffset, setReturnOffset]     = useState<{ x: number; y: number } | null>(null);
  const [solved, setSolved]                 = useState(false);
  const [appearing, setAppearing]           = useState(true);
  // stepIndex: index into solution[] of the next PLAYER move (0, 2, 4…)
  const [stepIndex, setStepIndex]           = useState(0);
  const [stepStartFen, setStepStartFen]     = useState<string>(initFen);

  const gameRef          = useRef(game);
  const solvedRef        = useRef(false);
  const stepIndexRef     = useRef(0);
  const stepStartFenRef  = useRef(stepStartFen);
  const onFeedbackRef    = useRef(onFeedback);
  const onGiveUpDoneRef  = useRef(onGiveUpDone);
  const giveUpTimersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { gameRef.current         = game;          }, [game]);
  useEffect(() => { solvedRef.current       = solved;        }, [solved]);
  useEffect(() => { stepIndexRef.current    = stepIndex;     }, [stepIndex]);
  useEffect(() => { stepStartFenRef.current = stepStartFen;  }, [stepStartFen]);
  useEffect(() => { onFeedbackRef.current    = onFeedback;   }, [onFeedback]);
  useEffect(() => { onGiveUpDoneRef.current = onGiveUpDone;  }, [onGiveUpDone]);

  // Play through all remaining solution moves when giving up
  useEffect(() => {
    if (!giveUp || solvedRef.current) return;

    giveUpTimersRef.current.forEach(clearTimeout);
    giveUpTimersRef.current = [];

    const remaining = puzzle.solution.slice(stepIndexRef.current);
    const g = new Chess(gameRef.current.fen());

    if (remaining.length === 0) {
      const t = setTimeout(() => onGiveUpDoneRef.current?.(), 800);
      giveUpTimersRef.current.push(t);
      return;
    }

    // Highlight first move immediately
    setLastMove({ from: remaining[0].slice(0, 2), to: remaining[0].slice(2, 4) });
    setSelectedSquare(null);

    remaining.forEach((moveStr, idx) => {
      const t = setTimeout(() => {
        const from = moveStr.slice(0, 2) as Square;
        const to   = moveStr.slice(2, 4) as Square;
        const prom = moveStr.length > 4 ? moveStr[4] : 'q';
        try { g.move({ from, to, promotion: prom }); } catch { /* ignore */ }
        setGame(new Chess(g.fen()));
        setLastMove({ from, to });

        if (idx === remaining.length - 1) {
          const t2 = setTimeout(() => onGiveUpDoneRef.current?.(), 1500);
          giveUpTimersRef.current.push(t2);
        }
      }, 800 + idx * 1300);
      giveUpTimersRef.current.push(t);
    });

    return () => {
      giveUpTimersRef.current.forEach(clearTimeout);
      giveUpTimersRef.current = [];
    };
  }, [giveUp, puzzle]);

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

  // Reset everything when puzzle changes
  useEffect(() => {
    const g = buildStartPosition(puzzle);
    const fen = g.fen();
    setGame(g);
    setSelectedSquare(null);
    setLastMove(null);
    setWrongSquare(null);
    setReturnPiece(null);
    setReturnOffset(null);
    setSolved(false);
    setAppearing(true);
    setStepIndex(0);
    setStepStartFen(fen);
    solvedRef.current      = false;
    stepIndexRef.current   = 0;
    stepStartFenRef.current = fen;
    onFeedbackRef.current(g.turn() === 'w' ? "JUEGAN BLANCAS" : "JUEGAN NEGRAS", "#ffffff");
    const t = setTimeout(() => setAppearing(false), 900);
    return () => clearTimeout(t);
  }, [puzzle]);

  const executeMove = useCallback((from: Square, to: Square): boolean => {
    if (solvedRef.current || giveUp || from === to) return false;

    const g          = gameRef.current;
    const moveStr    = from + to;
    const targetMove = puzzle.solution[stepIndexRef.current];
    const isCorrect  = !!targetMove && (moveStr === targetMove || moveStr + 'q' === targetMove);

    try {
      const gameCopy = new Chess(g.fen());
      if (!gameCopy.move({ from, to, promotion: 'q' })) return false;

      setLastMove({ from, to });

      if (isCorrect) {
        setGame(gameCopy);
        setWrongSquare(null);
        setReturnPiece(null);
        setSelectedSquare(null);

        const opIdx = stepIndexRef.current + 1;

        if (opIdx < puzzle.solution.length) {
          // Opponent has a reply — play it after a short pause
          onFeedback("BUENA JUGADA...", "#2ecc71");
          setTimeout(() => {
            const opMove  = puzzle.solution[opIdx];
            const oFrom   = opMove.slice(0, 2) as Square;
            const oTo     = opMove.slice(2, 4) as Square;
            const oProm   = opMove.length > 4 ? opMove[4] : 'q';
            const copy2   = new Chess(gameCopy.fen());
            try { copy2.move({ from: oFrom, to: oTo, promotion: oProm }); } catch { /* ignore */ }

            setGame(copy2);
            setLastMove({ from: oFrom, to: oTo });

            const playerNext = opIdx + 1;
            setStepIndex(playerNext);
            stepIndexRef.current    = playerNext;
            setStepStartFen(copy2.fen());
            stepStartFenRef.current = copy2.fen();

            if (playerNext >= puzzle.solution.length) {
              solvedRef.current = true;
              setSolved(true);
              onFeedback("¡CORRECTO!", "#2ecc71");
              window.dispatchEvent(new CustomEvent('puzzle-solved', { detail: puzzle.id }));
              onSuccess();
            } else {
              onFeedback(getPuzzleOrientation(puzzle) === 'w' ? "JUEGAN BLANCAS" : "JUEGAN NEGRAS", "#ffffff");
            }
          }, 600);
        } else {
          // Single-move puzzle — done immediately
          solvedRef.current = true;
          setSolved(true);
          onFeedback("¡CORRECTO!", "#2ecc71");
          window.dispatchEvent(new CustomEvent('puzzle-solved', { detail: puzzle.id }));
          onSuccess();
        }
      } else {
        // Wrong move
        setGame(gameCopy);
        setWrongSquare(to);
        onFeedback("INTÉNTALO DE NUEVO", "#ec2914");
        onWrongMove?.();

        const FLASH_MS = 350;
        const SLIDE_MS = 420;

        setTimeout(() => {
          const offset = getSquareOffset(from, to);
          // Restore to the start of the current step, not the whole puzzle start
          setGame(new Chess(stepStartFenRef.current));
          setReturnOffset(offset);
          setReturnPiece(from);
          setWrongSquare(null);
          setLastMove(null);
          setSelectedSquare(null);
        }, FLASH_MS);

        setTimeout(() => {
          setReturnPiece(null);
          setReturnOffset(null);
          onFeedback(getPuzzleOrientation(puzzle) === 'w' ? "JUEGAN BLANCAS" : "JUEGAN NEGRAS", "#ffffff");
        }, FLASH_MS + SLIDE_MS);
      }
      return true;
    } catch { return false; }
  }, [puzzle, onSuccess, onFeedback, onWrongMove, getSquareOffset, giveUp]);

  const executeMoveRef = useRef(executeMove);
  useEffect(() => { executeMoveRef.current = executeMove; }, [executeMove]);

  const { boardRef, dragFrom, dragOver, isDragging } = useDragController({
    orientation: getPuzzleOrientation(puzzle),
    canDrag: (coord: Square) => {
      if (solvedRef.current || giveUp) return false;
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
      if (to && to !== from) { executeMoveRef.current(from, to); setSelectedSquare(null); }
    },
    deps: [puzzle, giveUp],
  });

  const handleSquareClick = useCallback((coord: Square, piece: ReturnType<Chess['board']>[0][0]) => {
    if (solvedRef.current || giveUp || dragFrom) return;
    const isPieceMine = piece && piece.color === gameRef.current.turn();
    if (selectedSquare) {
      if (selectedSquare === coord) { setSelectedSquare(null); return; }
      const moved = executeMoveRef.current(selectedSquare, coord);
      if (!moved && isPieceMine) setSelectedSquare(coord);
      else setSelectedSquare(null);
    } else if (isPieceMine) {
      setSelectedSquare(coord);
    }
  }, [dragFrom, selectedSquare, giveUp]);

  const orient       = getPuzzleOrientation(puzzle);
  const board        = game.board();
  const displayBoard = orient === 'w'
    ? board
    : [...board].reverse().map(row => [...row].reverse());

  const legalTargets = selectedSquare && !giveUp
    ? game.moves({ square: selectedSquare, verbose: true }).map(m => m.to)
    : [];

  const solutionFrom = giveUp && !solved && puzzle.solution[stepIndex]
    ? puzzle.solution[stepIndex].slice(0, 2) : null;
  const solutionTo   = giveUp && !solved && puzzle.solution[stepIndex]
    ? puzzle.solution[stepIndex].slice(2, 4) : null;

  return (
    <div
      ref={boardRef}
      className="relative grid grid-cols-8 grid-rows-8 w-[min(95vw,780px)] h-[min(95vw,780px)] bg-zinc-900 overflow-hidden rounded-xl border-[4px] border-black shadow-inner"
    >
      {/* Solved overlay */}
      {solved && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-emerald-950/40 backdrop-blur-[2px] pointer-events-none rounded-[10px]">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]">
            <svg className="w-10 h-10 text-emerald-400 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-emerald-400 font-black uppercase tracking-[0.3em] text-sm drop-shadow-lg">Resuelto</span>
        </div>
      )}

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
          const isPieceMine   = piece && piece.color === game.turn() && !solved && !giveUp;
          const isDragTarget  = isDragging && dragOver === coord;
          const isCheck       = !solved && game.isCheck() && piece?.type === 'k' && piece?.color === game.turn();
          const isSolutionHi  = !solved && (coord === solutionFrom || coord === solutionTo);

          const appearDelay = appearing && piece ? `${(colIdx + rowIdx) * 18}ms` : '0ms';

          let bgClass = isDark ? 'bg-[#779845]' : 'bg-[#ebecd0]';
          if (isSelected)   bgClass = isDark ? 'bg-[#bbcc44]' : 'bg-[#f6f669]/80';
          if (isCheck)      bgClass = 'bg-red-500/70';
          if (isWrong)      bgClass = '';
          if (isSolutionHi) bgClass = isDark ? 'bg-sky-500/60' : 'bg-sky-300/70';

          const squareCursor = isDragging
            ? 'cursor-grabbing'
            : (isPieceMine && !giveUp) ? 'cursor-grab'
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
                relative flex items-center justify-center transition-colors duration-150
                ${bgClass} ${squareCursor}
                ${isCheck     ? 'animate-pulse' : ''}
                ${isWrong     ? 'wrong-flash shadow-[inset_0_0_28px_rgba(255,0,0,0.6)]' : ''}
                ${isSuccess   ? 'shadow-[inset_0_0_16px_rgba(46,204,113,0.5)]' : ''}
                ${isDragTarget && !isWrong ? 'brightness-110' : ''}
              `}
            >
              {isLastMoveHi && !isSelected && !isWrong && (
                <div className={`absolute inset-0 pointer-events-none z-0 transition-colors duration-300
                  ${isSuccess    ? 'bg-[#2ecc71]/30'
                  : isSolutionHi ? 'bg-sky-400/25'
                  : 'bg-[#f6f669]/30'}`}
                />
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
                <div className={`absolute z-20 rounded-full pointer-events-none transition-transform duration-100
                  ${isDragTarget ? 'scale-90' : 'scale-100'}
                  ${piece
                    ? 'inset-0 rounded-full bg-black/15 shadow-[inset_0_0_0_5px_rgba(0,0,0,0.3)]'
                    : 'w-[34%] h-[34%] bg-black/20'}`}
                />
              )}
              {piece && (
                <img
                  src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`}
                  draggable={false}
                  style={
                    isReturn && returnOffset
                      ? ({ '--rx': `${returnOffset.x}px`, '--ry': `${returnOffset.y}px` } as CSSProperties)
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
                    ${(isPieceMine && !giveUp) ? 'cursor-grab' : ''}
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
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        .wrong-flash { animation: wrongPulse 0.65s ease-out forwards; }
        @keyframes wrongPulse {
          0%   { filter: brightness(1.6) saturate(1.2); }
          40%  { filter: brightness(1.2) saturate(1.1); }
          100% { filter: brightness(1) saturate(1); }
        }
      `}</style>
    </div>
  );
}
