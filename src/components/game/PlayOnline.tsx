"use client";

import { MutableRefObject, useState, useEffect, useRef, useCallback } from 'react';
import { Square, Chess } from 'chess.js';
import { useDragController } from '@/hooks/useDragController';

interface Piece { color: 'w' | 'b'; type: string; }
type BoardMatrix = Array<Array<Piece | null>>;

interface PlayOnlineProps {
  onGameStateChange: (status: string) => void;
  onMoveUpdate: (history: string[], lastMoveColor: 'w' | 'b' | null, serverTimes?: {w: number, b: number}) => void;
  onGameData: (data: any, color: 'w' | 'b') => void;
  onGameEnded: (data: { result: string; termination_reason: string; eloChange?: number }) => void;
  onDrawOffered: (senderUsername: string) => void;
  onChatMessage: (username: string, message: string) => void;
  onPlayerDisconnected?: (color: string) => void;
  onPlayerReconnected?: (color: string) => void;
  serverUrl: string;
  socketRef: MutableRefObject<WebSocket | null>;
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

  for (const type in initial.b) {
    const t = type as keyof typeof initial.b;
    const diffB = initial.b[t] - current.b[t]; // negras perdidas → blancas capturaron
    for (let i = 0; i < diffB; i++) capW.push(`/pieces/b_${PIECE_MAP[t]}.svg`);

    const diffW = initial.w[t] - current.w[t]; // blancas perdidas → negras capturaron
    for (let i = 0; i < diffW; i++) capB.push(`/pieces/w_${PIECE_MAP[t]}.svg`);
  }

  return { capW, capB };
};

export default function PlayOnline({
  onGameStateChange, onMoveUpdate, onGameData, onGameEnded,
  onDrawOffered, onChatMessage, onPlayerDisconnected, onPlayerReconnected,
  serverUrl, socketRef,
}: PlayOnlineProps) {
  const chessRef = useRef(new Chess());
  const [board, setBoard]               = useState<BoardMatrix>([]);
  const [orientation, setOrientation]   = useState<'w' | 'b'>('w');
  const orientationRef                  = useRef<'w' | 'b'>('w');
  const myUsernameRef                   = useRef<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves]     = useState<string[]>([]);
  const [lastMove, setLastMove]         = useState<{ from: string; to: string } | null>(null);
  const [isConnected, setIsConnected]   = useState(false);
  const [appearing, setAppearing]       = useState(false);
  const [premove, setPremove]           = useState<{ from: Square; to: Square } | null>(null);

  const moveHistoryRef   = useRef<string[]>([]);
  const lastMoveColorRef = useRef<'w' | 'b' | null>(null);
  const premoveRef       = useRef<{ from: Square; to: Square } | null>(null);
  const handleMoveRef    = useRef<(from: Square, to: Square) => void>(() => {});

  const clearPremove = useCallback(() => {
    setPremove(null); premoveRef.current = null;
  }, []);

  const setPremoveIfLegal = useCallback((from: Square, to: Square) => {
    const chess   = chessRef.current;
    const myColor = orientationRef.current;
    const fenParts = chess.fen().split(' ');
    fenParts[1] = myColor;
    const tempChess = new Chess();
    try { tempChess.load(fenParts.join(' ')); } catch { return; }
    const piece = tempChess.get(from);
    if (!piece || piece.color !== myColor) return;
    const legalTargets = tempChess.moves({ square: from, verbose: true }).map(m => m.to);
    if (!legalTargets.includes(to)) return;
    const pm = { from, to };
    setPremove(pm); premoveRef.current = pm;
    setSelectedSquare(null); setLegalMoves([]);
  }, []);

  const handleGameEnd = useCallback((
    result: string, terminationReason: string,
    whiteEloChange?: number, blackEloChange?: number
  ) => {
    clearPremove();
    const myColor   = orientationRef.current;
    const eloChange = myColor === 'w' ? (whiteEloChange ?? 0) : (blackEloChange ?? 0);
    onGameEnded({ result, termination_reason: terminationReason, eloChange });
    if (result === "1/2-1/2") {
      onGameStateChange("TABLAS");
    } else if ((result === "1-0" && myColor === 'w') || (result === "0-1" && myColor === 'b')) {
      onGameStateChange("JAQUE MATE - ¡HAS GANADO!");
    } else {
      onGameStateChange("PARTIDA FINALIZADA");
    }
  }, [clearPremove, onGameEnded, onGameStateChange]);

  const updateBoardFromChess = useCallback((extraData: any = {}) => {
    const chess       = chessRef.current;
    const currentTurn = chess.turn();
    setBoard([...chess.board()]);
    const { capW, capB } = getCapturedPieces(chess);
    const serverTimes = (extraData.time_white !== undefined && extraData.time_black !== undefined)
      ? { w: extraData.time_white, b: extraData.time_black } : undefined;
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
    const isPromotion = piece?.type === 'p' &&
      ((piece.color === 'w' && pm.to[1] === '8') || (piece.color === 'b' && pm.to[1] === '1'));
    let moveResult = null;
    try { moveResult = chess.move({ from: pm.from, to: pm.to, promotion: isPromotion ? 'q' : undefined }); } catch { }
    if (!moveResult) return;
    setBoard([...chess.board()]);
    setLastMove({ from: pm.from, to: pm.to });
    socketRef.current?.send(JSON.stringify({ action: "make_move", move: isPromotion ? `${pm.from}${pm.to}q` : pm.from + pm.to }));
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
        moveHistoryRef.current = []; lastMoveColorRef.current = null;
        if (msg.fen) chessRef.current.load(msg.fen);
        orientationRef.current = msg.color || 'w';
        setOrientation(msg.color || 'w');
        const myPlayer = msg.color === 'w' ? msg.white_player : msg.black_player;
        if (myPlayer?.username) myUsernameRef.current = myPlayer.username;
        setAppearing(true);
        setTimeout(() => setAppearing(false), 900);
        updateBoardFromChess(msg);
      }
      if (msg.type === "game_update") {
        if (msg.san) {
          const moveIndex = moveHistoryRef.current.length;
          lastMoveColorRef.current = moveIndex % 2 === 0 ? 'w' : 'b';
          moveHistoryRef.current = [...moveHistoryRef.current, msg.san];
        }
        chessRef.current.load(msg.fen);
        if (msg.move?.length >= 4) setLastMove({ from: msg.move.slice(0, 2), to: msg.move.slice(2, 4) });
        setSelectedSquare(null); setLegalMoves([]);
        updateBoardFromChess(msg);
        executePremoveIfAny();
        if (msg.status === "completed" && msg.result) {
          handleGameEnd(msg.result, msg.termination_reason || "", msg.white_elo_change, msg.black_elo_change);
        }
      }
      if (msg.type === "game_message" || msg.action) {
        const payload = msg.message || msg;
        if (payload.action === "game_ended" || payload.action === "game_over") {
          handleGameEnd(payload.result, payload.termination_reason || "", payload.white_elo_change, payload.black_elo_change);
        }
        if (payload.action === "draw_offered" && payload.sender !== myUsernameRef.current) {
          onDrawOffered(payload.sender);
        }
        if (payload.action === "player_disconnected") onPlayerDisconnected?.(payload.color);
        if (payload.action === "player_reconnected")  onPlayerReconnected?.(payload.color);
      }
      if (msg.type === "chat_message") onChatMessage(msg.username, msg.message);
      if (msg.type === "move_error" || msg.type === "error") {
        setSelectedSquare(null); setLegalMoves([]); clearPremove(); updateBoardFromChess();
      }
    };
    ws.onclose = () => setIsConnected(false);
    return () => { ws.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  const handleMove = useCallback((from: Square, to: Square) => {
    if (!isConnected || from === to) return;
    const chess   = chessRef.current;
    const myColor = orientationRef.current;
    if (chess.turn() !== myColor) { setPremoveIfLegal(from, to); return; }
    const piece = chess.get(from);
    const isPromotion = piece?.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));
    let moveResult = null;
    try { moveResult = chess.move({ from, to, promotion: isPromotion ? 'q' : undefined }); } catch { }
    if (!moveResult) { setSelectedSquare(null); setLegalMoves([]); return; }
    setBoard([...chess.board()]);
    setLastMove({ from, to });
    setSelectedSquare(null); setLegalMoves([]);
    socketRef.current?.send(JSON.stringify({ action: "make_move", move: isPromotion ? `${from}${to}q` : from + to }));
    chess.undo();
  }, [isConnected, socketRef, setPremoveIfLegal]);

  useEffect(() => { handleMoveRef.current = handleMove; }, [handleMove]);

  const selectSquare = useCallback((coord: Square) => {
    const moves = chessRef.current.moves({ square: coord, verbose: true });
    setSelectedSquare(coord);
    setLegalMoves(moves.map(m => m.to));
  }, []);

  const { boardRef, dragFrom, dragOver, isDragging } = useDragController({
    orientation,
    canDrag: (coord) => {
      const file  = coord.charCodeAt(0) - 97;
      const rank  = 8 - parseInt(coord[1]);
      const piece = chessRef.current.board()[rank]?.[file];
      return !!piece && piece.color === orientationRef.current;
    },
    pieceSrc: (coord) => {
      const file  = coord.charCodeAt(0) - 97;
      const rank  = 8 - parseInt(coord[1]);
      const piece = chessRef.current.board()[rank]?.[file];
      if (!piece) return null;
      return `/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`;
    },
    onDragStart: (from) => {
      const chess = chessRef.current;
      setSelectedSquare(from);
      if (chess.turn() === orientationRef.current) {
        setLegalMoves(chess.moves({ square: from, verbose: true }).map(m => m.to));
      } else {
        setLegalMoves([]);
      }
    },
    onDragEnd: (from, to) => {
      if (to && to !== from) {
        handleMoveRef.current(from, to);
        setSelectedSquare(null); setLegalMoves([]);
      }
    },
    deps: [isConnected, orientation],
  });

  const handleSquareClick = useCallback((coord: Square, piece: Piece | null) => {
    if (isDragging) return;
    const myColor  = orientationRef.current;
    const isMyTurn = chessRef.current.turn() === myColor;
    if (premoveRef.current && coord === premoveRef.current.from) {
      clearPremove(); setSelectedSquare(null); setLegalMoves([]); return;
    }
    if (selectedSquare) {
      if (selectedSquare === coord) { setSelectedSquare(null); setLegalMoves([]); clearPremove(); }
      else if (piece && piece.color === myColor && isMyTurn)  { selectSquare(coord); }
      else if (piece && piece.color === myColor && !isMyTurn) { setSelectedSquare(coord); setLegalMoves([]); }
      else { handleMoveRef.current(selectedSquare, coord); }
    } else if (piece && piece.color === myColor) {
      if (isMyTurn) selectSquare(coord);
      else { setSelectedSquare(coord); setLegalMoves([]); }
    }
  }, [isDragging, selectedSquare, clearPremove, selectSquare]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const range = orientation === 'w' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

  return (
    <div className="relative w-[min(95vw,780px)] aspect-square flex items-center justify-center">
      {!isConnected && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2.5rem] font-black tracking-widest text-[10px] uppercase">
          Conectando...
        </div>
      )}
      {premove && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-red-500/30 rounded-full">
          <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[7px] font-black text-red-400/80 uppercase tracking-widest">
            Premovimiento: {premove.from}→{premove.to}
          </span>
          <button onClick={clearPremove} className="text-red-400/50 hover:text-red-400 text-[8px] font-black ml-0.5 cursor-pointer">✕</button>
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
              ? `${(c + r) * 18}ms` : '0ms';

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
                  <div className="absolute inset-0 pointer-events-none z-0 bg-[#f6f669]/30 transition-colors duration-300" />
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