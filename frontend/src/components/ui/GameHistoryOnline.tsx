"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface GameHistoryOnlineProps {
  history: string[];
  status: string;
  isGameOver: boolean;
  gameStarted: boolean;
  orientation?: 'w' | 'b';
  socketRef: React.MutableRefObject<WebSocket | null>;
  hasOfferedDraw: boolean;
  onDrawOfferedFromChat?: () => void;
  incomingChat?: { username: string; message: string } | null;
  onIncomingChatConsumed?: () => void;
  myUsername?: string | null;
}

export default function GameHistoryOnline({
  history,
  status,
  isGameOver,
  gameStarted,
  orientation = 'w',
  socketRef,
  hasOfferedDraw,
  onDrawOfferedFromChat,
  incomingChat,
  onIncomingChatConsumed,
  myUsername,
}: GameHistoryOnlineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [hasUsedResign, setHasUsedResign] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const gameState = useMemo(() => ({
    isGameOver,
    gameStarted,
    isVictory: status.includes("GANAN") ||
               status.includes("VICTORIA") ||
               status.includes("¡HAS GANADO") ||
               (status.includes("MATE") && (
                 (orientation === 'w' && status.includes("BLANCAS")) ||
                 (orientation === 'b' && status.includes("NEGRAS"))
               ))
  }), [status, isGameOver, gameStarted, orientation]);

  useEffect(() => {
    if (gameStarted) {
      setMessages([
        "Sistema: ¡Nueva partida iniciada!",
        "Sistema: Escribe /gg para rendirte o /draw para tablas",
      ]);
      setUnreadCount(0);
      setChatOpen(false);
      setHasUsedResign(false);
      setNewMessage("");
      setIsProcessingCommand(false);
    }
  }, [gameStarted]);

  useEffect(() => {
    if (gameState.isGameOver) {
      setHasUsedResign(true);
    }
  }, [gameState.isGameOver]);

  const handleIncomingChat = useCallback(() => {
    if (!incomingChat) return;

    if (myUsername && incomingChat.username === myUsername) {
      onIncomingChatConsumed?.();
      return;
    }

    setMessages(prev => [...prev, `${incomingChat.username}: ${incomingChat.message}`]);
    if (!chatOpen) setUnreadCount(prev => prev + 1);
    onIncomingChatConsumed?.();
  }, [incomingChat, myUsername, chatOpen, onIncomingChatConsumed]);

  useEffect(() => {
    handleIncomingChat();
  }, [handleIncomingChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const rows = useMemo(() => {
    const result: { moveNum: number; white: string; black: string | null }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      result.push({
        moveNum: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1] || null
      });
    }
    return result;
  }, [history]);

  const totalMoves = useMemo(() => Math.ceil(history.length / 2), [history.length]);

  const handleResign = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || gameState.isGameOver) return;
    setHasUsedResign(true);
    socketRef.current.send(JSON.stringify({ action: "resign" }));
    setMessages(prev => [...prev, "Sistema: 🔴 Rendición enviada ✓"]);
  }, [socketRef, gameState.isGameOver]);

  const handleOfferDraw = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || gameState.isGameOver || hasOfferedDraw) return;
    socketRef.current.send(JSON.stringify({ action: "offer_draw" }));
    setMessages(prev => [...prev, "Sistema: ½ Oferta de tablas enviada ✓"]);
    onDrawOfferedFromChat?.();
  }, [socketRef, gameState.isGameOver, hasOfferedDraw, onDrawOfferedFromChat]);

  const processCommand = useCallback((command: string): boolean => {
    if (isProcessingCommand || gameState.isGameOver) return false;
    const trimmed = command.trim().toLowerCase();

    if (trimmed === '/gg') {
      if (hasUsedResign) {
        setMessages(prev => [...prev, "Sistema: ❌ /gg ya usado"]);
        setNewMessage("");
        return true;
      }
      setIsProcessingCommand(true);
      handleResign();
      setTimeout(() => setIsProcessingCommand(false), 2000);
      setNewMessage("");
      return true;
    }

    if (trimmed === '/draw') {
      if (hasOfferedDraw) {
        setMessages(prev => [...prev, "Sistema: ❌ /draw ya usado esta partida"]);
        setNewMessage("");
        return true;
      }
      setIsProcessingCommand(true);
      handleOfferDraw();
      setTimeout(() => setIsProcessingCommand(false), 2000);
      setNewMessage("");
      return true;
    }

    return false;
  }, [isProcessingCommand, gameState.isGameOver, hasUsedResign, hasOfferedDraw, handleResign, handleOfferDraw]);

  const sendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const message = newMessage.trim();
    if (!message) return;

    if (processCommand(message)) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "chat_message", message }));
    }

    setMessages(prev => [...prev, `Tú: ${message}`]);
    setNewMessage("");
  }, [newMessage, processCommand, socketRef]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as any);
    }
  }, [sendMessage]);

  const toggleChat = useCallback(() => {
    const newState = !chatOpen;
    setChatOpen(newState);
    if (newState) {
      setUnreadCount(0);
    }
  }, [chatOpen]);

  return (
    <div className="bg-black/50 [.light_&]:bg-white h-full flex flex-col border border-white/[0.07] [.light_&]:border-gray-200 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.05] [.light_&]:border-gray-100 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black tracking-[0.4em] text-zinc-500 [.light_&]:text-gray-500 uppercase">
            Movimientos
          </p>
          <p className={`text-sm font-bold mt-1 transition-colors duration-200 ${
            gameStarted ? 'text-white/80 [.light_&]:text-gray-900' : 'text-zinc-600 [.light_&]:text-gray-400'
          }`}>
            {totalMoves} {totalMoves === 1 ? 'jugada' : 'jugadas'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shadow-lg transition-all duration-300 ${
            gameStarted && !gameState.isGameOver
              ? 'bg-emerald-400 shadow-emerald-500/50 scale-110 animate-pulse'
              : 'bg-zinc-800 [.light_&]:bg-gray-300'
          }`} />
          <button
            onClick={toggleChat}
            className="group relative w-12 h-12 rounded-2xl bg-white/10 [.light_&]:bg-gray-100 border border-white/20 [.light_&]:border-gray-300 hover:bg-white/20 [.light_&]:hover:bg-gray-200
                       flex items-center justify-center transition-all duration-200 hover:scale-105
                       hover:shadow-lg hover:shadow-white/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                       data-[open=true]:bg-emerald-500/30 data-[open=true]:border-emerald-500/50 data-[open=true]:shadow-emerald-500/30
                       data-[open=true]:scale-110 data-[open=true]:ring-2 data-[open=true]:ring-emerald-400/50"
            data-open={chatOpen}
            title={chatOpen ? "Ocultar chat" : "Mostrar chat"}
            disabled={gameState.isGameOver}
          >
            <span className={`text-lg transition-all duration-200 group-hover:scale-110 ${
              chatOpen
                ? 'text-emerald-400 scale-110 rotate-12'
                : 'text-zinc-400 [.light_&]:text-gray-500'
            }`}>
              💬
            </span>
            {unreadCount > 0 && !chatOpen && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-[10px] font-bold
                             flex items-center justify-center text-white shadow-lg animate-pulse border-2 border-black/50">
                {unreadCount}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Historial de movimientos */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar bg-gradient-to-b from-black/20 to-black/50 [.light_&]:from-gray-50 [.light_&]:to-gray-100/50 pr-2 min-h-0"
        >
          {rows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 [.light_&]:bg-gray-100 border border-white/10 [.light_&]:border-gray-200 flex items-center justify-center">
                <span className="text-xl">📜</span>
              </div>
              <p className="text-[11px] text-zinc-600 [.light_&]:text-gray-400 font-bold uppercase tracking-widest">Esperando primer movimiento</p>
            </div>
          ) : (
            rows.map((row, index) => (
              <div key={row.moveNum} className={`
                group grid grid-cols-[32px_1fr_1fr] gap-3 items-center
                px-4 py-3 rounded-2xl border border-transparent
                hover:bg-white/5 [.light_&]:hover:bg-gray-50 hover:border-white/20 [.light_&]:hover:border-gray-200 hover:shadow-lg
                transition-all duration-150 cursor-default
                ${index === rows.length - 1
                  ? 'bg-gradient-to-r from-emerald-500/5 to-transparent [.light_&]:from-emerald-50 [.light_&]:to-white border-emerald-500/30 [.light_&]:border-emerald-200 shadow-emerald-500/20 ring-1 ring-emerald-500/20 [.light_&]:ring-emerald-300/40'
                  : 'hover:shadow-md'
                }
              `}>
                <span className="font-mono text-[12px] font-black text-zinc-500 [.light_&]:text-gray-500 text-right tracking-tight">
                  {row.moveNum}.
                </span>
                <div className="bg-gradient-to-r from-white/8 to-white/3 [.light_&]:from-gray-100 [.light_&]:to-gray-50 rounded-xl py-2.5 px-4
                  text-center text-white [.light_&]:text-gray-900 font-mono text-sm font-bold
                  border border-white/10 [.light_&]:border-gray-200 shadow-inner backdrop-blur-sm
                  group-hover:shadow-white/20 group-hover:scale-[1.02]
                  transition-all duration-150">
                  {row.white}
                </div>
                <div className={`
                  rounded-xl py-2.5 px-4 text-center font-mono text-sm font-semibold
                  backdrop-blur-sm transition-all duration-150 group-hover:scale-[1.02]
                  ${row.black
                    ? 'bg-zinc-900/50 [.light_&]:bg-gray-100 border border-zinc-700/50 [.light_&]:border-gray-200 shadow-inner text-zinc-400 [.light_&]:text-gray-600 hover:shadow-zinc-600/30 hover:text-zinc-200 [.light_&]:hover:text-gray-900'
                    : 'bg-zinc-950/30 [.light_&]:bg-gray-50 border border-zinc-800/20 [.light_&]:border-gray-100 text-zinc-600 [.light_&]:text-gray-400 italic opacity-60'
                  }
                `}>
                  {row.black || "—"}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat */}
        <div className={`
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden border-t border-white/[0.08] [.light_&]:border-gray-100
          bg-gradient-to-b from-zinc-900/30 to-black/50 [.light_&]:from-gray-50 [.light_&]:to-gray-100 backdrop-blur-xl
          ${chatOpen
            ? 'h-[320px] opacity-100 shadow-2xl shadow-black/50'
            : 'h-0 opacity-0 pointer-events-none'
          }
        `}>
          {chatOpen && (
            <>
              <div ref={chatScrollRef} className="h-[230px] overflow-y-auto space-y-3 custom-scrollbar pr-2 p-5">
                {messages.map((msg, index) => (
                  <div key={`${index}-${msg}`} className="flex gap-3 break-words animate-in slide-in-from-bottom-2 duration-150">
                    <span className={`font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wide min-w-[60px] text-center flex-shrink-0 ${
                      msg.startsWith('Tú:')
                        ? 'bg-emerald-500/20 text-emerald-300 [.light_&]:text-emerald-700 border border-emerald-500/30 [.light_&]:border-emerald-400/40'
                        : msg.includes('🔴')
                        ? 'bg-red-500/20 text-red-300 [.light_&]:text-red-700 border border-red-500/30 animate-pulse'
                        : msg.includes('½')
                        ? 'bg-yellow-500/20 text-yellow-300 [.light_&]:text-yellow-700 border border-yellow-500/30 animate-pulse'
                        : 'bg-zinc-700/40 [.light_&]:bg-gray-200 text-zinc-300 [.light_&]:text-gray-600 border border-zinc-600/30 [.light_&]:border-gray-300'
                    }`}>
                      {msg.split(':')[0]}
                    </span>
                    <span className="text-sm leading-relaxed text-zinc-200 [.light_&]:text-gray-700 flex-1">
                      {msg.split(':').slice(1).join(':')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-black/50 [.light_&]:bg-gray-100 backdrop-blur-sm border-t border-white/[0.15] [.light_&]:border-gray-200 shadow-2xl">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe aquí... (/gg /draw)"
                    className={`flex-1 bg-zinc-900/80 [.light_&]:bg-white border rounded-2xl px-4 py-3.5 text-sm
                              text-white [.light_&]:text-gray-900 placeholder-zinc-400 [.light_&]:placeholder-gray-400 focus:outline-none focus:border-emerald-400/80
                              focus:ring-2 focus:ring-emerald-400/30 transition-all duration-150 shadow-2xl
                              hover:border-zinc-500/80 [.light_&]:hover:border-gray-400 hover:shadow-zinc-900/30 hover:shadow-2xl
                              ${isProcessingCommand
                                ? 'opacity-60 cursor-not-allowed border-zinc-700/50 [.light_&]:border-gray-300'
                                : 'border-zinc-700/50 [.light_&]:border-gray-300'}`}
                    maxLength={120}
                    autoComplete="off"
                    disabled={isProcessingCommand}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isProcessingCommand}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500/50 to-emerald-600/50
                               border-2 border-emerald-500/70 hover:from-emerald-500/70 hover:to-emerald-600/70
                               flex items-center justify-center transition-all duration-150 hover:scale-105
                               hover:shadow-emerald-500/60 hover:shadow-2xl disabled:opacity-50
                               disabled:cursor-not-allowed disabled:hover:scale-100 group shadow-xl cursor-pointer"
                  >
                    <span className="text-emerald-100 text-xl font-bold group-hover:text-white transition-all">→</span>
                  </button>
                </form>
                {isProcessingCommand && (
                  <p className="text-[10px] text-yellow-400 [.light_&]:text-yellow-600 font-bold mt-1 text-center tracking-wider animate-pulse">
                    Enviando al servidor...
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Banner de game over */}
      {gameState.isGameOver && (
        <div className={`px-6 py-4 border-t border-white/[0.12] [.light_&]:border-gray-100 flex-shrink-0 relative z-10 ${
          gameState.isVictory
            ? 'bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 [.light_&]:from-emerald-50 [.light_&]:to-emerald-100/80 shadow-emerald-500/30'
            : 'bg-gradient-to-r from-red-900/30 to-rose-900/20 [.light_&]:from-red-50 [.light_&]:to-rose-50'
        }`}>
          <p className={`text-center text-[11px] font-black uppercase tracking-[0.3em]
            px-4 py-2 rounded-2xl backdrop-blur-sm shadow-xl transition-all duration-300 ${
              gameState.isVictory
                ? 'bg-emerald-500/50 [.light_&]:bg-emerald-500 border-2 border-emerald-500/70 [.light_&]:border-emerald-600 text-emerald-50 scale-110 animate-pulse shadow-2xl shadow-emerald-500/60'
                : 'bg-red-500/30 [.light_&]:bg-red-100 border border-red-500/50 [.light_&]:border-red-300 text-red-200 [.light_&]:text-red-700'
            }`}>
            {status}
          </p>
        </div>
      )}
    </div>
  );
}
