"use client";

import React, { useRef, useEffect, useState } from 'react';

interface GameHistoryOnlineProps {
  history: string[];
  status: string;
  isGameOver: boolean;
  gameStarted: boolean;
  orientation?: 'w' | 'b';
  socketRef: React.MutableRefObject<WebSocket | null>;
  onDrawOfferedFromChat?: () => void;
}

export default function GameHistoryOnline({ 
  history, 
  status, 
  isGameOver, 
  gameStarted, 
  orientation = 'w',
  socketRef,
  onDrawOfferedFromChat
}: GameHistoryOnlineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([
    "Sistema: ¡Bienvenido al chat de la partida!",
    "Sistema: Escribe /gg para rendirte o /draw para tablas",
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  
  // ESTADOS PARA BLOQUEAR COMANDOS
  const [hasUsedResign, setHasUsedResign] = useState(false);
  const [hasUsedDraw, setHasUsedDraw] = useState(false);

  // BLOQUEAR AMBOS COMANDOS CUANDO LA PARTIDA TERMINA
  useEffect(() => {
    if (isGameOver) {
      setHasUsedResign(true);
      setHasUsedDraw(true);
    }
  }, [isGameOver]);

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

  const rows: { moveNum: number; white: string; black: string | null }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ 
      moveNum: Math.floor(i / 2) + 1, 
      white: history[i], 
      black: history[i + 1] || null 
    });
  }

  const totalMoves = Math.ceil(history.length / 2);

  const handleResign = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || isGameOver) {
      return;
    }
    
    setHasUsedResign(true);
    socketRef.current.send(JSON.stringify({ action: "resign" }));
    setMessages(prev => [...prev, "Sistema: 🔴 Rendición enviada ✓"]);
  };

  const handleOfferDraw = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || isGameOver) {
      return;
    }
    
    setHasUsedDraw(true);
    socketRef.current.send(JSON.stringify({ action: "offer_draw" }));
    setMessages(prev => [...prev, "Sistema: ½ Oferta de tablas enviada ✓"]);
    onDrawOfferedFromChat?.();
  };

  const processCommand = (command: string) => {
    if (isProcessingCommand || isGameOver) return false;
    
    const trimmed = command.trim().toLowerCase();
    
    // /gg → Solo 1 vez O partida terminada
    if (trimmed === '/gg') {
      if (hasUsedResign || isGameOver) {
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
    
    // /draw → Solo 1 vez O partida terminada
    if (trimmed === '/draw') {
      if (hasUsedDraw || isGameOver) {
        setMessages(prev => [...prev, "Sistema: ❌ /draw ya usado"]);
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
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const message = newMessage.trim();
    
    if (!message) return;

    if (processCommand(message)) {
      return;
    }

    setMessages(prev => [...prev, `Tú: ${message}`]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as any);
    }
  };

  // Detectar victoria
  const isVictory = status.includes("GANAN") || 
                   status.includes("VICTORIA") || 
                   status.includes("¡HAS GANADO") ||
                   status.includes("MATE") && (
                     (orientation === 'w' && status.includes("BLANCAS")) ||
                     (orientation === 'b' && status.includes("NEGRAS"))
                   );

  return (
    <div className="bg-black/50 h-full flex flex-col border border-white/[0.07] rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.05] flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black tracking-[0.4em] text-zinc-500 uppercase">
            Movimientos
          </p>
          <p className={`text-sm font-bold mt-1 transition-colors duration-300 ${
            gameStarted 
              ? 'text-white/80' 
              : 'text-zinc-600'
          }`}>
            {totalMoves} {totalMoves === 1 ? 'jugada' : 'jugadas'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shadow-lg transition-all duration-500 ${
            gameStarted && !isGameOver
              ? 'bg-emerald-400 shadow-emerald-500/50 scale-110 animate-pulse'
              : 'bg-zinc-800'
          }`} />
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="group relative w-12 h-12 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 
                     flex items-center justify-center transition-all duration-300 hover:scale-110 
                     hover:shadow-lg hover:shadow-white/20 cursor-pointer"
            title={chatOpen ? "Ocultar chat" : "Mostrar chat"}
          >
            <span className={`text-lg transition-all duration-300 group-hover:scale-110 ${
              chatOpen ? 'text-emerald-400 scale-110' : 'text-zinc-400'
            }`}>
              💬
            </span>
            {messages.length > 2 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-[10px] font-bold 
                             flex items-center justify-center text-white shadow-lg animate-pulse border-2 border-black/50">
                {Math.max(0, messages.length - 2)}
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
          className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar bg-gradient-to-b from-black/20 to-black/50 pr-2 min-h-0"
        >
          {rows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-xl">📜</span>
              </div>
              <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest">Esperando primer movimiento</p>
            </div>
          ) : (
            rows.map((row, index) => (
              <div key={row.moveNum} className={`
                group grid grid-cols-[32px_1fr_1fr] gap-3 items-center
                px-4 py-3 rounded-2xl border border-transparent
                hover:bg-white/5 hover:border-white/20 hover:shadow-lg
                transition-all duration-200 cursor-default
                ${index === rows.length - 1 
                  ? 'bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/30 shadow-emerald-500/20 ring-1 ring-emerald-500/20'
                  : 'hover:shadow-md'
                }
              `}>
                <span className="font-mono text-[12px] font-black text-zinc-500 text-right tracking-tight">
                  {row.moveNum}.
                </span>
                <div className="bg-gradient-to-r from-white/8 to-white/3 rounded-xl py-2.5 px-4 
                  text-center text-white font-mono text-sm font-bold 
                  border border-white/10 shadow-inner backdrop-blur-sm
                  group-hover:shadow-white/20 group-hover:scale-[1.02]
                  transition-all duration-200">
                  {row.white}
                </div>
                <div className={`
                  rounded-xl py-2.5 px-4 text-center text-zinc-400 font-mono text-sm font-semibold
                  backdrop-blur-sm transition-all duration-200 group-hover:scale-[1.02]
                  ${row.black 
                    ? 'bg-zinc-900/50 border border-zinc-700/50 shadow-inner hover:shadow-zinc-600/30 hover:text-zinc-200'
                    : 'bg-zinc-950/30 border border-zinc-800/20 text-zinc-600 italic opacity-60'
                  }
                `}>
                  {row.black || "—"}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat DESPLEGABLE */}
        <div className={`
          ${chatOpen ? 'h-[320px] opacity-100' : 'h-0 opacity-0'}
          overflow-hidden transition-all duration-500 ease-out border-t border-white/[0.08]
          bg-gradient-to-b from-zinc-900/30 to-black/50 backdrop-blur-xl
        `}>
          {chatOpen && (
            <>
              <div ref={chatScrollRef} className="h-[230px] overflow-y-auto space-y-3 custom-scrollbar pr-2 p-5">
                {messages.map((msg, index) => (
                  <div key={index} className="flex gap-3 break-words animate-in slide-in-from-bottom-2 duration-200">
                    <span className={`font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wide min-w-[60px] text-center flex-shrink-0 ${
                      msg.startsWith('Tú:') 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : msg.includes('🔴') 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                        : msg.includes('½')
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 animate-pulse'
                        : 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/30'
                    }`}>
                      {msg.split(':')[0]}
                    </span>
                    <span className="text-sm leading-relaxed text-zinc-200 flex-1">
                      {msg.split(':').slice(1).join(':')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-black/50 backdrop-blur-sm border-t border-white/[0.15] shadow-2xl">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe aquí... (/gg /draw)"
                    className={`flex-1 bg-zinc-900/80 border rounded-2xl px-4 py-3.5 text-sm 
                              text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-400/80 
                              focus:ring-2 focus:ring-emerald-400/30 transition-all duration-200 shadow-2xl
                              hover:border-zinc-500/80 hover:shadow-zinc-900/30 hover:shadow-2xl
                              ${isProcessingCommand || isGameOver ? 'opacity-60 cursor-not-allowed' : ''}`}
                    maxLength={120}
                    autoComplete="off"
                    disabled={isProcessingCommand || isGameOver}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isProcessingCommand || isGameOver}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500/50 to-emerald-600/50 
                               border-2 border-emerald-500/70 hover:from-emerald-500/70 hover:to-emerald-600/70
                               flex items-center justify-center transition-all duration-200 hover:scale-105 
                               hover:shadow-emerald-500/60 hover:shadow-2xl disabled:opacity-50 
                               disabled:cursor-not-allowed disabled:hover:scale-100 group shadow-xl"
                  >
                    <span className="text-emerald-100 text-xl font-bold group-hover:text-white transition-all">→</span>
                  </button>
                </form>
                {isProcessingCommand && (
                  <p className="text-[10px] text-yellow-400 font-bold mt-1 text-center tracking-wider animate-pulse">
                    Enviando al servidor...
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* BANNER DE GAME OVER */}
      {isGameOver && (
        <div className={`px-6 py-4 border-t border-white/[0.12] flex-shrink-0 relative z-10 ${
          isVictory 
            ? 'bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 shadow-emerald-500/30' 
            : 'bg-gradient-to-r from-red-900/30 to-rose-900/20'
        }`}>
          <p className={`text-center text-[11px] font-black uppercase tracking-[0.3em] 
            px-4 py-2 rounded-2xl backdrop-blur-sm shadow-xl transition-all duration-500 ${
              isVictory
                ? 'bg-emerald-500/50 border-2 border-emerald-500/70 text-emerald-50 scale-110 animate-pulse shadow-2xl shadow-emerald-500/60'
                : 'bg-red-500/30 border border-red-500/50 text-red-200'
            }`}>
            {status}
          </p>
        </div>
      )}
    </div>
  );
}