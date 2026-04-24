"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Square, Chess } from 'chess.js';

interface Piece { color: 'w' | 'b'; type: string; }
type BoardMatrix = Array<Array<Piece | null>>;

interface PlayOnlineProps {
  onGameStateChange: (status: string) => void;
  onMoveUpdate: (history: string[], lastMoveColor: 'w' | 'b' | null, serverTimes?: {w: number, b: number}) => void;
  onGameData: (data: any, color: 'w' | 'b') => void;
  onGameEnded: (data: { result: string; termination_reason: string }) => void;
  onDrawOffered: (senderUsername: string) => void;
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

export default function PlayOnline({
  onGameStateChange,
  onMoveUpdate,
  onGameData,
  onGameEnded,
  onDrawOffered,
  serverUrl,
  socketRef,
}: PlayOnlineProps) {
  const chessRef = useRef(new Chess());
  const [board, setBoard] = useState<BoardMatrix>([]);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const orientationRef = useRef<'w' | 'b'>('w');
  // Username propio, guardado al recibir game_state para filtrar draw_offered
  const myUsernameRef = useRef<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const updateBoardFromChess = useCallback((extraData: any = {}) => {
    const chess = chessRef.current;
    const newBoard = chess.board();
    setBoard([...newBoard]);
    const currentTurn = chess.turn();
    setTurn(currentTurn);

    const { capW, capB } = getCapturedPieces(chess);
    const historyVerbose = chess.history({ verbose: true });
    const lastMoveColor = historyVerbose.length > 0 ? historyVerbose[historyVerbose.length - 1].color : null;

    const serverTimes = (extraData.time_white !== undefined && extraData.time_black !== undefined)
      ? { w: extraData.time_white, b: extraData.time_black }
      : undefined;

    onMoveUpdate(chess.history(), lastMoveColor, serverTimes);
    onGameData({ ...extraData, capturedW: capW, capturedB: capB }, orientationRef.current);

    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const winner = currentTurn === 'w' ? 'b' : 'w';
        const isWinner = winner === orientationRef.current;
        onGameStateChange(`JAQUE MATE - GANAN ${winner === 'w' ? 'BLANCAS' : 'NEGRAS'}`);
        window.dispatchEvent(new CustomEvent(isWinner ? 'game-victory' : 'game-defeat', {
          detail: { message: isWinner ? "¡Has ganado la partida!" : "Suerte la próxima vez", elo: "15" }
        }));
      } else if (chess.isDraw()) {
        onGameStateChange("TABLAS");
        window.dispatchEvent(new CustomEvent('game-draw', { detail: { message: "Empate técnico" } }));
      } else {
        onGameStateChange("PARTIDA FINALIZADA");
      }
    } else {
      onGameStateChange(currentTurn === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS");
    }
  }, [onMoveUpdate, onGameStateChange, onGameData]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    const ws = new WebSocket(`${serverUrl}?token=${token}`);
    socket.current = ws;
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      // Estado inicial de la partida (al conectar)
      if (msg.type === "game_state") {
        if (msg.fen) chessRef.current.load(msg.fen);
        orientationRef.current = msg.color || 'w';
        setOrientation(msg.color || 'w');
        // Guardar el username propio según el color asignado
        const myPlayer = msg.color === 'w' ? msg.white_player : msg.black_player;
        if (myPlayer?.username) myUsernameRef.current = myPlayer.username;
        updateBoardFromChess(msg);
      }

      // Actualización tras un movimiento
      if (msg.type === "game_update") {
        chessRef.current.load(msg.fen);
        const history = chessRef.current.history({ verbose: true });
        if (history.length > 0) {
          const last = history[history.length - 1];
          setLastMove({ from: last.from, to: last.to });
        }
        setSelectedSquare(null);
        setLegalMoves([]);
        updateBoardFromChess(msg);

        // Si el servidor indica que la partida terminó en este game_update (timeout, etc.)
        if (msg.status === "completed" && msg.result) {
          onGameEnded({ result: msg.result, termination_reason: "" });
        }
      }

      // Mensajes de juego: rendición, tablas aceptadas, oferta de tablas
      if (msg.type === "game_message" || msg.action) {
        const payload = msg.message || msg;
        if (payload.action === "game_ended") {
          onGameEnded({
            result: payload.result,
            termination_reason: payload.termination_reason || ""
          });
          const isWinner =
            (payload.result === "1-0" && orientationRef.current === 'w') ||
            (payload.result === "0-1" && orientationRef.current === 'b');
          const isDraw = payload.result === "1/2-1/2";

          if (isDraw) {
            onGameStateChange("TABLAS");
            window.dispatchEvent(new CustomEvent('game-draw', { detail: { message: "Tablas acordadas" } }));
          } else if (isWinner) {
            onGameStateChange("JAQUE MATE - ¡HAS GANADO!");
            window.dispatchEvent(new CustomEvent('game-victory', { detail: { message: "¡Has ganado la partida!", elo: "15" } }));
          } else {
            const reason = payload.termination_reason === "resignation" ? "El rival se rindió... espera, tú te rendiste" : "Has perdido";
            onGameStateChange("PARTIDA FINALIZADA");
            window.dispatchEvent(new CustomEvent('game-defeat', { detail: { message: reason, elo: "15" } }));
          }
        }

        if (payload.action === "draw_offered") {
          // Solo mostrar el banner al rival, no al que ha ofrecido las tablas
          if (payload.sender !== myUsernameRef.current) {
            onDrawOffered(payload.sender);
          }
        }
      }

      if (msg.type === "move_error" || msg.type === "error") {
        setSelectedSquare(null);
        setLegalMoves([]);
        updateBoardFromChess();
      }
    };

    ws.onclose = () => setIsConnected(false);
    return () => { ws.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  const socket = useRef<WebSocket | null>(null);

  const selectSquare = useCallback((coord: Square) => {
    const moves = chessRef.current.moves({ square: coord, verbose: true });
    setSelectedSquare(coord);
    setLegalMoves(moves.map(m => m.to));
  }, []);

  const handleMove = useCallback((from: Square, to: Square) => {
    if (!isConnected || from === to) return;
    const chess = chessRef.current;
    if (chess.turn() !== orientationRef.current) return;

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
    socket.current?.send(JSON.stringify({ action: "make_move", move: moveData }));

    chess.undo();
  }, [isConnected]);

  const handleSquareClick = useCallback((coord: Square, piece: Piece | null) => {
    const myColor = orientationRef.current;
    const currentTurn = chessRef.current.turn();
    if (selectedSquare) {
      if (selectedSquare === coord) {
        setSelectedSquare(null);
        setLegalMoves([]);
      } else if (piece && piece.color === myColor && piece.color === currentTurn) {
        selectSquare(coord);
      } else {
        handleMove(selectedSquare, coord);
      }
    } else if (piece && piece.color === myColor && piece.color === currentTurn) {
      selectSquare(coord);
    }
  }, [selectedSquare, handleMove, selectSquare]);

  const renderBoard = () => {
    const squares = [];
    const range = orientation === 'w' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
    for (const r of range) {
      for (const c of range) {
        const piece = board[r]?.[c];
        const coord = (String.fromCharCode(97 + c) + (8 - r)) as Square;
        const isDark = (r + c) % 2 === 1;
        const isSelected = selectedSquare === coord;
        const isLast = lastMove?.from === coord || lastMove?.to === coord;
        const isLegal = legalMoves.includes(coord);

        squares.push(
          <div
            key={coord}
            onClick={() => handleSquareClick(coord, piece)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const from = e.dataTransfer.getData("fromSquare") as Square;
              if (from) handleMove(from, coord);
              setIsDragging(false);
            }}
            className={`relative flex items-center justify-center select-none cursor-pointer ${isDark ? 'bg-[#b8860b]' : 'bg-[#f0e68c]'} ${isSelected ? '!bg-yellow-300/70' : ''} ${isLast && !isSelected ? 'after:absolute after:inset-0 after:bg-black/20 after:z-10' : ''}`}
          >
            {((orientation === 'w' && c === 0) || (orientation === 'b' && c === 7)) && <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-40">{8 - r}</span>}
            {((orientation === 'w' && r === 7) || (orientation === 'b' && r === 0)) && <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-40 uppercase">{String.fromCharCode(97 + c)}</span>}
            {isLegal && <div className={`absolute z-30 rounded-full ${piece ? 'w-full h-full border-4 border-black/25 bg-black/10' : 'w-[34%] h-[34%] bg-black/20'}`} />}
            {piece && (
              <img
                src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`}
                draggable={piece.color === orientationRef.current && piece.color === turn}
                onDragStart={e => {
                  if (piece.color !== orientationRef.current || piece.color !== turn) return e.preventDefault();
                  e.dataTransfer.setData("fromSquare", coord);
                  selectSquare(coord);
                  setIsDragging(true);
                }}
                onDragEnd={() => setIsDragging(false)}
                className={`w-[90%] h-[90%] z-20 drop-shadow-xl transition-transform ${isSelected ? 'scale-110 -translate-y-1' : ''}`}
                alt=""
              />
            )}
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="relative w-[min(95vw,780px)] aspect-square flex items-center justify-center">
      {!isConnected && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2.5rem] text-gold font-black tracking-widest text-[10px] uppercase">
          Conectando...
        </div>
      )}
      <div className={`grid grid-cols-8 grid-rows-8 w-full h-full bg-zinc-900 overflow-hidden rounded-[2.5rem] border-[6px] border-zinc-950 shadow-2xl ${isDragging ? 'cursor-grabbing' : ''}`}>
        {renderBoard()}
      </div>
    </div>
  );
}