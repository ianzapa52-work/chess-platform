"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Square, Chess } from 'chess.js';

interface Piece { color: 'w' | 'b'; type: string; }
type BoardMatrix = Array<Array<Piece | null>>;

interface PlayOnlineProps {
  onGameStateChange: (status: string) => void;
  onMoveUpdate: (history: string[], lastMoveColor: 'w' | 'b' | null, serverTimes?: {w: number, b: number}) => void;
  onGameData: (data: any, color: 'w' | 'b') => void;
  onGameEnded: (data: { result: string; termination_reason: string; eloChange?: number }) => void;
  onDrawOffered: (senderUsername: string) => void;
  onChatMessage: (username: string, message: string) => void;
  serverUrl: string;
  socketRef: React.MutableRefObject<WebSocket | null>;
}

const PIECE_MAP: Record<string, string> = {
  p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king"
};

const getCapturedPieces = (chess: Chess) => {
  const initial = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
  };
  const current = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
  };

  chess.board().forEach(row => {
    row.forEach(sq => {
      if (sq) current[sq.color][sq.type as keyof typeof current['w']]++;
    });
  });

  const capW: string[] = [];
  const capB: string[] = [];

  for (const type in initial.w) {
    const diffW = initial.w[type as keyof typeof initial.w] - current.w[type as keyof typeof current.w];
    for (let i = 0; i < diffW; i++) capW.push(`/pieces/w_${PIECE_MAP[type]}.svg`);
    const diffB = initial.b[type as keyof typeof initial.b] - current.b[type as keyof typeof current.b];
    for (let i = 0; i < diffB; i++) capB.push(`/pieces/b_${PIECE_MAP[type]}.svg`);
  }
  return { capW, capB };
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
export default function PlayOnline({
  onGameStateChange,
  onMoveUpdate,
  onGameData,
  onGameEnded,
  onDrawOffered,
  onChatMessage,
  serverUrl,
  socketRef,
}: PlayOnlineProps) {
  const chessRef = useRef(new Chess());
  const [board, setBoard] = useState<BoardMatrix>([]);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const orientationRef = useRef<'w' | 'b'>('w');
  const myUsernameRef = useRef<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Drag state
  const [dragFrom, setDragFrom] = useState<Square | null>(null);
  const [dragOver, setDragOver] = useState<Square | null>(null);

  // Appear animation
  const [appearing, setAppearing] = useState(false);
  const appearingRef = useRef(false);

  const boardRef      = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<{ destroy: () => void } | null>(null);
  const handleMoveRef = useRef<(from: Square, to: Square) => void>(() => {});

  const moveHistoryRef = useRef<string[]>([]);
  const lastMoveColorRef = useRef<'w' | 'b' | null>(null);

  const [premove, setPremove] = useState<{ from: Square; to: Square } | null>(null);
  const premoveRef = useRef<{ from: Square; to: Square } | null>(null);

  const clearPremove = useCallback(() => {
    setPremove(null);
    premoveRef.current = null;
  }, []);

  const setPremoveIfLegal = useCallback((from: Square, to: Square) => {
    const chess = chessRef.current;
    const myColor = orientationRef.current;

    const fenParts = chess.fen().split(' ');
    fenParts[1] = myColor;
    const tempFen = fenParts.join(' ');

    const tempChess = new Chess();
    try {
      tempChess.load(tempFen);
    } catch {
      return;
    }

    const piece = tempChess.get(from);
    if (!piece || piece.color !== myColor) return;

    const legalTargets = tempChess.moves({ square: from, verbose: true }).map(m => m.to);
    if (!legalTargets.includes(to)) return;

    const pm = { from, to };
    setPremove(pm);
    premoveRef.current = pm;
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const handleGameEnd = useCallback((
    result: string,
    terminationReason: string,
    whiteEloChange?: number,
    blackEloChange?: number
  ) => {
    clearPremove();
    const myColor = orientationRef.current;
    const eloChange = myColor === 'w' ? (whiteEloChange ?? 0) : (blackEloChange ?? 0);

    onGameEnded({ result, termination_reason: terminationReason, eloChange });

    if (result === "1/2-1/2") {
      onGameStateChange("TABLAS");
    } else if (
      (result === "1-0" && myColor === 'w') ||
      (result === "0-1" && myColor === 'b')
    ) {
      onGameStateChange("JAQUE MATE - ¡HAS GANADO!");
    } else {
      onGameStateChange("PARTIDA FINALIZADA");
    }
  }, [clearPremove, onGameEnded, onGameStateChange]);

  const updateBoardFromChess = useCallback((extraData: any = {}) => {
    const chess = chessRef.current;
    const newBoard = chess.board();
    setBoard([...newBoard]);
    const currentTurn = chess.turn();
    setTurn(currentTurn);

    const { capW, capB } = getCapturedPieces(chess);

    const serverTimes = (extraData.time_white !== undefined && extraData.time_black !== undefined)
      ? { w: extraData.time_white, b: extraData.time_black }
      : undefined;

    onMoveUpdate(moveHistoryRef.current, lastMoveColorRef.current, serverTimes);
    onGameData({ ...extraData, capturedW: capW, capturedB: capB }, orientationRef.current);

    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const winner = currentTurn === 'w' ? 'b' : 'w';
        onGameStateChange(`JAQUE MATE - GANAN ${winner === 'w' ? 'BLANCAS' : 'NEGRAS'}`);
      } else if (chess.isDraw()) {
        onGameStateChange("TABLAS");
      } else {
        onGameStateChange("PARTIDA FINALIZADA");
      }
    } else {
      onGameStateChange(currentTurn === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS");
    }
  }, [onMoveUpdate, onGameStateChange, onGameData]);

  const executePremoveIfAny = useCallback(() => {
    const pm = premoveRef.current;
    if (!pm) return;
    clearPremove();

    const chess = chessRef.current;
    if (chess.turn() !== orientationRef.current) return;

    const piece = chess.get(pm.from);
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && pm.to[1] === '8') || (piece.color === 'b' && pm.to[1] === '1'));

    let moveResult = null;
    try {
      moveResult = chess.move({ from: pm.from, to: pm.to, promotion: isPromotion ? 'q' : undefined });
    } catch { }

    if (!moveResult) return;

    setBoard([...chess.board()]);
    setLastMove({ from: pm.from, to: pm.to });

    const moveData = isPromotion ? `${pm.from}${pm.to}q` : pm.from + pm.to;
    socketRef.current?.send(JSON.stringify({ action: "make_move", move: moveData }));

    chess.undo();
  }, [clearPremove, socketRef]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const ws = new WebSocket(`${serverUrl}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "game_state") {
        moveHistoryRef.current = [];
        lastMoveColorRef.current = null;

        if (msg.fen) chessRef.current.load(msg.fen);
        orientationRef.current = msg.color || 'w';
        setOrientation(msg.color || 'w');
        const myPlayer = msg.color === 'w' ? msg.white_player : msg.black_player;
        if (myPlayer?.username) myUsernameRef.current = myPlayer.username;

        // Trigger appear animation on game start
        setAppearing(true);
        appearingRef.current = true;
        setTimeout(() => { setAppearing(false); appearingRef.current = false; }, 900);

        updateBoardFromChess(msg);
      }

      if (msg.type === "game_update") {
        if (msg.san) {
          const moveIndex = moveHistoryRef.current.length;
          lastMoveColorRef.current = moveIndex % 2 === 0 ? 'w' : 'b';
          moveHistoryRef.current = [...moveHistoryRef.current, msg.san];
        }

        chessRef.current.load(msg.fen);

        if (msg.move && msg.move.length >= 4) {
          setLastMove({
            from: msg.move.slice(0, 2),
            to: msg.move.slice(2, 4),
          });
        }

        setSelectedSquare(null);
        setLegalMoves([]);
        updateBoardFromChess(msg);
        executePremoveIfAny();

        if (msg.status === "completed" && msg.result) {
          handleGameEnd(
            msg.result,
            msg.termination_reason || "",
            msg.white_elo_change,
            msg.black_elo_change
          );
        }
      }

      if (msg.type === "game_message" || msg.action) {
        const payload = msg.message || msg;

        if (payload.action === "game_ended" || payload.action === "game_over") {
          handleGameEnd(
            payload.result,
            payload.termination_reason || "",
            payload.white_elo_change,
            payload.black_elo_change
          );
        }

        if (payload.action === "draw_offered") {
          if (payload.sender !== myUsernameRef.current) {
            onDrawOffered(payload.sender);
          }
        }
      }

      if (msg.type === "chat_message") {
        onChatMessage(msg.username, msg.message);
      }

      if (msg.type === "move_error" || msg.type === "error") {
        setSelectedSquare(null);
        setLegalMoves([]);
        clearPremove();
        updateBoardFromChess();
      }
    };

    ws.onclose = () => setIsConnected(false);
    return () => { ws.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  // ── Drag controller ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    controllerRef.current?.destroy();
    controllerRef.current = createDragController(
      el,
      () => orientationRef.current,
      {
        canDrag: (coord) => {
          const chess = chessRef.current;
          const myColor = orientationRef.current;
          if (chess.turn() !== myColor) return false;
          const file = coord.charCodeAt(0) - 97;
          const rank = 8 - parseInt(coord[1]);
          const piece = chess.board()[rank]?.[file];
          return !!piece && piece.color === myColor;
        },
        pieceSrc: (coord) => {
          const file = coord.charCodeAt(0) - 97;
          const rank = 8 - parseInt(coord[1]);
          const piece = chessRef.current.board()[rank]?.[file];
          if (!piece) return null;
          return `/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`;
        },
        onStart: (from) => {
          setDragFrom(from);
          setSelectedSquare(from);
          setDragOver(from);
          // show legal moves while dragging
          const moves = chessRef.current.moves({ square: from, verbose: true });
          setLegalMoves(moves.map(m => m.to));
        },
        onOver: (sq) => setDragOver(sq),
        onEnd: (from, to) => {
          setDragFrom(null);
          setDragOver(null);
          if (to && to !== from) {
            handleMoveRef.current(from, to);
            setSelectedSquare(null);
            setLegalMoves([]);
          }
        },
      },
    );
    return () => { controllerRef.current?.destroy(); controllerRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, orientation]);

  const handleMove = useCallback((from: Square, to: Square) => {
    if (!isConnected || from === to) return;
    const chess = chessRef.current;
    const myColor = orientationRef.current;

    if (chess.turn() !== myColor) {
      setPremoveIfLegal(from, to);
      return;
    }

    const piece = chess.get(from);
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

    let moveResult = null;
    try {
      moveResult = chess.move({ from, to, promotion: isPromotion ? 'q' : undefined });
    } catch { }

    if (!moveResult) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    setBoard([...chess.board()]);
    setLastMove({ from, to });
    setSelectedSquare(null);
    setLegalMoves([]);

    const moveData = isPromotion ? `${from}${to}q` : from + to;
    socketRef.current?.send(JSON.stringify({ action: "make_move", move: moveData }));

    chess.undo();
  }, [isConnected, socketRef, setPremoveIfLegal]);

  useEffect(() => { handleMoveRef.current = handleMove; }, [handleMove]);

  const selectSquare = useCallback((coord: Square) => {
    const moves = chessRef.current.moves({ square: coord, verbose: true });
    setSelectedSquare(coord);
    setLegalMoves(moves.map(m => m.to));
  }, []);

  const handleSquareClick = useCallback((coord: Square, piece: Piece | null) => {
    if (dragFrom) return;
    const myColor = orientationRef.current;
    const currentTurn = chessRef.current.turn();
    const isMyTurn = currentTurn === myColor;

    if (premoveRef.current && coord === premoveRef.current.from) {
      clearPremove();
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare) {
      if (selectedSquare === coord) {
        setSelectedSquare(null);
        setLegalMoves([]);
        clearPremove();
      } else if (piece && piece.color === myColor && isMyTurn) {
        selectSquare(coord);
      } else if (piece && piece.color === myColor && !isMyTurn) {
        setSelectedSquare(coord);
        setLegalMoves([]);
      } else {
        handleMove(selectedSquare, coord);
      }
    } else if (piece && piece.color === myColor) {
      if (isMyTurn) {
        selectSquare(coord);
      } else {
        setSelectedSquare(coord);
        setLegalMoves([]);
      }
    }
  }, [dragFrom, selectedSquare, handleMove, selectSquare, clearPremove]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const isDragging = !!dragFrom;

  const range = orientation === 'w' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

  return (
    <div className="relative w-[min(95vw,780px)] aspect-square flex items-center justify-center">
      {!isConnected && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2.5rem] text-gold font-black tracking-widest text-[10px] uppercase">
          Conectando...
        </div>
      )}
      {premove && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">
            Premovimiento: {premove.from} → {premove.to}
          </span>
          <button
            onClick={clearPremove}
            className="text-red-400/60 hover:text-red-400 text-[10px] font-black ml-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div
        ref={boardRef}
        className={`grid grid-cols-8 grid-rows-8 w-full h-full bg-zinc-900 overflow-hidden rounded-[2.5rem] border-[6px] border-zinc-950 shadow-2xl select-none ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        {range.map((r) =>
          range.map((c) => {
            const piece = board[r]?.[c] ?? null;
            const coord = (String.fromCharCode(97 + c) + (8 - r)) as Square;

            const rowIdx = r;
            const colIdx = c;

            const isDark        = (r + c) % 2 === 1;
            const isSelected    = selectedSquare === coord;
            const isLastMoveHi  = lastMove?.from === coord || lastMove?.to === coord;
            const isLegal       = legalMoves.includes(coord);
            const isDragTarget  = isDragging && dragOver === coord;
            const isPremoveFrom = premove?.from === coord;
            const isPremoveTo   = premove?.to   === coord;
            const isCheck       = chessRef.current.isCheck()
              && piece?.type === 'k'
              && piece?.color === chessRef.current.turn();
            const isPieceMine   = piece && piece.color === orientationRef.current;

            const appearDelay = appearing && piece
              ? `${(colIdx + rowIdx) * 18}ms` : '0ms';

            let bgClass = isDark ? 'bg-[#b8860b]' : 'bg-[#f0e68c]';
            if (isSelected)    bgClass = isDark ? 'bg-yellow-500/80' : 'bg-yellow-300/70';
            if (isPremoveFrom || isPremoveTo) bgClass = 'bg-red-400/60';
            if (isCheck)       bgClass = 'bg-red-500/70';

            const squareCursor = isDragging
              ? 'cursor-grabbing'
              : isPieceMine ? 'cursor-grab'
              : (isLegal || (selectedSquare && !piece)) ? 'cursor-pointer'
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
                  <div className="absolute inset-0 pointer-events-none z-0 bg-black/20 transition-colors duration-300" />
                )}
                {((orientation === 'w' && c === 0) || (orientation === 'b' && c === 7)) && (
                  <span className={`absolute top-0.5 left-1 text-[9px] font-bold font-mono z-10 pointer-events-none
                    ${isDark ? 'text-[#f0e68c]/60' : 'text-[#7a5200]/80'}`}>
                    {8 - r}
                  </span>
                )}
                {((orientation === 'w' && r === 7) || (orientation === 'b' && r === 0)) && (
                  <span className={`absolute bottom-0.5 right-1 text-[9px] font-bold font-mono uppercase z-10 pointer-events-none
                    ${isDark ? 'text-[#f0e68c]/60' : 'text-[#7a5200]/80'}`}>
                    {String.fromCharCode(97 + c)}
                  </span>
                )}
                {isLegal && (
                  <div className={`absolute z-20 rounded-full pointer-events-none
                    transition-transform duration-100
                    ${isDragTarget ? 'scale-125' : 'scale-100'}
                    ${piece ? 'inset-0 border-[5px] border-black/25' : 'w-[34%] h-[34%] bg-black/20'}`}
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
                      w-[90%] h-[90%] z-20 drop-shadow-xl
                      ${appearing ? '' : 'transition-[opacity,transform] duration-150'}
                      ${isPieceMine ? 'cursor-grab' : ''}
                      ${isSelected && !isDragging ? 'scale-110 -translate-y-1' : ''}
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