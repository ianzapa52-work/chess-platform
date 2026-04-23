"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Square, Chess } from 'chess.js';

interface Piece { color: 'w' | 'b'; type: string; }
type BoardMatrix = Array<Array<Piece | null>>;

interface PlayOnlineProps {
  onGameStateChange: (status: string) => void;
  onMoveUpdate: (history: string[], lastMoveColor: 'w' | 'b' | null) => void;
  onGameData: (data: any, color: 'w' | 'b') => void;
  serverUrl: string;
}

const PIECE_MAP: Record<string, string> = {
  p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king"
};

export default function PlayOnline({ onGameStateChange, onMoveUpdate, onGameData, serverUrl }: PlayOnlineProps) {
  const chessRef = useRef(new Chess());
  const [board, setBoard] = useState<BoardMatrix>([]);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const orientationRef = useRef<'w' | 'b'>('w');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const socket = useRef<WebSocket | null>(null);

  const updateBoardFromChess = useCallback(() => {
    const chess = chessRef.current;
    const newBoard = chess.board();
    setBoard([...newBoard]);
    const currentTurn = chess.turn();
    setTurn(currentTurn);

    const historyVerbose = chess.history({ verbose: true });
    const lastMoveColor: 'w' | 'b' | null = historyVerbose.length > 0
      ? historyVerbose[historyVerbose.length - 1].color
      : null;

    onMoveUpdate(chess.history(), lastMoveColor);

    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const winner = currentTurn === 'w' ? 'NEGRAS' : 'BLANCAS';
        onGameStateChange(`JAQUE MATE - GANAN ${winner}`);
      } else if (chess.isDraw()) {
        onGameStateChange("TABLAS");
      } else {
        onGameStateChange("PARTIDA FINALIZADA");
      }
    } else {
      onGameStateChange(currentTurn === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS");
    }
  }, [onMoveUpdate, onGameStateChange]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const ws = new WebSocket(`${serverUrl}?token=${token}`);
    socket.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "game_state") {
        const chess = chessRef.current;
        if (msg.fen) chess.load(msg.fen);

        const serverColor: 'w' | 'b' = msg.color || 'w';
        orientationRef.current = serverColor;
        setOrientation(serverColor);

        onGameData(msg, serverColor);
        updateBoardFromChess();
      }

      if (msg.type === "game_update") {
        const chess = chessRef.current;
        chess.load(msg.fen);

        const history = chess.history({ verbose: true });
        if (history.length > 0) {
          const last = history[history.length - 1];
          setLastMove({ from: last.from, to: last.to });
        }

        setSelectedSquare(null);
        setLegalMoves([]);
        updateBoardFromChess();
      }

      if (msg.type === "move_error") {
        setSelectedSquare(null);
        setLegalMoves([]);
        updateBoardFromChess();
      }
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    return () => { ws.close(); };
  }, [serverUrl, onGameData, updateBoardFromChess]);

  const selectSquare = useCallback((coord: Square) => {
    const chess = chessRef.current;
    const moves = chess.moves({ square: coord, verbose: true });
    setSelectedSquare(coord);
    setLegalMoves(moves.map(m => m.to));
  }, []);

  const handleMove = useCallback((from: Square, to: Square) => {
    if (!isConnected || from === to) return;

    const chess = chessRef.current;
    const currentTurn = chess.turn();
    const myColor = orientationRef.current;

    if (currentTurn !== myColor) return;

    let moveResult = null;
    try {
      moveResult = chess.move({ from, to, promotion: 'q' });
    } catch {
      // movimiento ilegal
    }

    if (!moveResult) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Actualizar board optimistamente
    setBoard([...chess.board()]);
    setLastMove({ from, to });
    setSelectedSquare(null);
    setLegalMoves([]);

    // Enviar al servidor y deshacer local (esperamos game_update como confirmación oficial)
    socket.current?.send(JSON.stringify({ action: "make_move", move: from + to }));
    chess.undo();
  }, [isConnected]);

  const handleSquareClick = useCallback((coord: Square, piece: Piece | null) => {
    const myColor = orientationRef.current;
    const chess = chessRef.current;
    const currentTurn = chess.turn();

    if (selectedSquare) {
      if (selectedSquare === coord) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      if (piece && piece.color === myColor && piece.color === currentTurn) {
        selectSquare(coord);
        return;
      }
      handleMove(selectedSquare, coord);
    } else {
      if (piece && piece.color === myColor && piece.color === currentTurn) {
        selectSquare(coord);
      }
    }
  }, [selectedSquare, handleMove, selectSquare]);

  const renderBoard = () => {
    const squares = [];
    const rowRange = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const colRange = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    for (const rowIndex of rowRange) {
      for (const colIndex of colRange) {
        const piece = board[rowIndex] ? board[rowIndex][colIndex] : null;
        const coord = (String.fromCharCode(97 + colIndex) + (8 - rowIndex)) as Square;
        const isDark = (rowIndex + colIndex) % 2 === 1;
        const isSelected = selectedSquare === coord;
        const isLastMoveSquare = lastMove?.from === coord || lastMove?.to === coord;
        const isLegal = legalMoves.includes(coord);
        const isLeftEdge = orientation === 'w' ? colIndex === 0 : colIndex === 7;
        const isBottomEdge = orientation === 'w' ? rowIndex === 7 : rowIndex === 0;

        squares.push(
          <div
            key={coord}
            onClick={() => handleSquareClick(coord, piece)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = e.dataTransfer.getData("fromSquare") as Square;
              if (from) handleMove(from, coord);
              setIsDragging(false);
            }}
            className={`relative flex items-center justify-center select-none cursor-pointer
              ${isDark ? 'bg-[#b8860b]' : 'bg-[#f0e68c]'}
              ${isSelected ? '!bg-yellow-300/70' : ''}
              ${isLastMoveSquare && !isSelected ? 'after:absolute after:inset-0 after:bg-black/20 after:z-10' : ''}
              transition-colors duration-100`}
          >
            {isLeftEdge && (
              <span className={`absolute top-0.5 left-1 text-[9px] font-bold z-40 pointer-events-none
                ${isDark ? 'text-[#f0e68c]/60' : 'text-[#b8860b]/60'}`}>
                {8 - rowIndex}
              </span>
            )}
            {isBottomEdge && (
              <span className={`absolute bottom-0.5 right-1 text-[9px] font-bold uppercase z-40 pointer-events-none
                ${isDark ? 'text-[#f0e68c]/60' : 'text-[#b8860b]/60'}`}>
                {String.fromCharCode(97 + colIndex)}
              </span>
            )}

            {isLegal && (
              <div className={`absolute z-30 rounded-full pointer-events-none
                ${piece ? 'w-full h-full border-4 border-black/25 bg-black/10' : 'w-[34%] h-[34%] bg-black/20'}`}
              />
            )}

            {piece && (
              <img
                src={`/pieces/${piece.color}_${PIECE_MAP[piece.type]}.svg`}
                draggable={piece.color === orientationRef.current && piece.color === turn}
                onDragStart={(e) => {
                  if (piece.color !== orientationRef.current || piece.color !== turn) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData("fromSquare", coord);
                  e.dataTransfer.effectAllowed = "move";
                  selectSquare(coord);
                  setIsDragging(true);
                }}
                onDragEnd={() => setIsDragging(false)}
                className={`w-[90%] h-[90%] z-20 drop-shadow-xl transition-transform duration-100 pointer-events-auto
                  ${piece.color === orientationRef.current && piece.color === turn ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
                  ${isSelected ? 'scale-110 -translate-y-1' : ''}`}
                alt={`${piece.color}_${piece.type}`}
              />
            )}
          </div>
        );
      }
    }
    return squares;
  };

  if (board.length === 0) {
    return (
      <div className="p-20 text-gold animate-pulse font-black uppercase tracking-widest text-center w-full">
        Iniciando Partida...
      </div>
    );
  }

  return (
    <div className="p-1 bg-zinc-950 rounded-[2rem] border border-white/10 relative h-full w-full flex items-center justify-center">
      {!isConnected && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2rem] text-gold font-black tracking-widest text-[10px] uppercase">
          Conectando...
        </div>
      )}
      <div className={`grid grid-cols-8 grid-rows-8 w-full max-w-[700px] aspect-square bg-zinc-900 overflow-hidden rounded-xl border-[4px] border-black shadow-inner ${isDragging ? 'cursor-grabbing' : ''}`}>
        {renderBoard()}
      </div>
    </div>
  );
}