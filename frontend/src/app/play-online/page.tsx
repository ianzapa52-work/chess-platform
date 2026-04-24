"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayOnline from '@/components/game/PlayOnline';
import { getTitleByElo } from '@/components/profile/ProfileForm';

interface TimeOption { n: string; m: number; i: number; mode: string; }
interface TimeCategory { label: string; options: TimeOption[]; }

const TIME_MODES: TimeCategory[] = [
  { label: "Bullet", options: [
    { n: "1+0", m: 60, i: 0, mode: "bullet" },
    { n: "1+1", m: 60, i: 1, mode: "bullet" },
    { n: "2+1", m: 120, i: 1, mode: "bullet" }
  ]},
  { label: "Blitz", options: [
    { n: "3+0", m: 180, i: 0, mode: "blitz" },
    { n: "3+2", m: 180, i: 2, mode: "blitz" },
    { n: "5+3", m: 300, i: 3, mode: "blitz" }
  ]},
  { label: "Rápidas", options: [
    { n: "10+0", m: 600, i: 0, mode: "rapid" },
    { n: "15+10", m: 900, i: 10, mode: "rapid" }
  ]},
];

const getEloForMode = (playerData: any, mode: string): string => {
  if (!playerData) return "1200";
  const eloKey = `elo_${mode}`;
  return String(playerData[eloKey] ?? playerData.elo_rapid ?? playerData.elo_blitz ?? 1200);
};

const searchAnimations = `
  @keyframes subtle-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.04); opacity: 0.8; }
  }
  .animate-pulse-subtle { animation: subtle-pulse 6s infinite ease-in-out; }
`;

function CapturedBar({ captured }: { captured: string[] }) {
  return (
    <div className="p-3 mt-3 rounded-2xl border border-black/30 shadow-inner min-h-[50px] flex items-center bg-gradient-to-br from-[#d2b48c] to-[#a68a64] relative z-10">
      <div className="flex flex-wrap gap-1 max-w-full">
        {captured.length > 0 ? (
          captured.map((img, i) => (
            <img key={i} src={img} className="w-5 h-5 object-contain drop-shadow-md" alt="piece" />
          ))
        ) : (
          <span className="text-[8px] uppercase tracking-[0.2em] text-black/40 font-black italic ml-1">Sin bajas</span>
        )}
      </div>
    </div>
  );
}

function OpponentBox({ name, elo, isActive, seconds, visible, captured }: any) {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const title = getTitleByElo(Number(elo) || 1200);

  return (
    <div className={`p-5 rounded-[2rem] border transition-all duration-1000 backdrop-blur-xl ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
    } ${
      isActive ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'bg-zinc-900/40 border-white/5'
    }`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder con inicial */}
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 font-black text-sm">
            {name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            {/* Nombre + badge de rango en la misma línea */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-white font-black text-[11px] uppercase tracking-widest">{name}</h4>
              <span className={`px-1.5 py-0.5 text-[7px] font-black rounded-md uppercase tracking-tight border ${title.color} ${title.borderColor} ${title.bgColor}`}>
                {title.short}
              </span>
            </div>
            {/* Título completo + ELO */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[8px] font-black uppercase tracking-wider ${title.color}`}>{title.label}</span>
              <span className="text-[8px] text-zinc-600">·</span>
              <span className="text-[8px] text-zinc-500 font-bold">ELO {elo}</span>
            </div>
          </div>
        </div>
        <div className={`font-mono text-xl font-black ${isActive ? 'text-red-400' : 'text-white/80'}`}>
          {formatTime(seconds)}
        </div>
      </div>
      <CapturedBar captured={captured} />
    </div>
  );
}

function MyPlayerBox({ name, elo, isActive, seconds, captured }: any) {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const title = getTitleByElo(Number(elo) || 1200);

  return (
    <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-700 relative overflow-hidden ${
      isActive
        ? 'bg-zinc-950 border-gold shadow-[0_0_50px_rgba(212,175,55,0.15)] scale-[1.03]'
        : 'bg-zinc-950 border-white/10 shadow-2xl'
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[50px] -z-10" />
      <div className="flex justify-between items-end relative z-10">
        <div className="space-y-1.5">
          {/* Fila: badge de rango + nombre */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[8px] font-black rounded-md uppercase tracking-tighter border ${title.color} ${title.borderColor} ${title.bgColor}`}>
              {title.short}
            </span>
            <h4 className="text-white font-black text-sm uppercase tracking-wider">{name}</h4>
          </div>
          {/* Fila: título completo + ELO */}
          <div className="flex items-baseline gap-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${title.color}`}>{title.label}</span>
            <span className="text-[10px] text-zinc-600">·</span>
            <span className="text-2xl font-black text-gold tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">{elo}</span>
          </div>
          {/* Tier badge */}
          <span className={`inline-block text-[7px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border ${title.borderColor} ${title.bgColor} ${title.color}`}>
            {title.tier}
          </span>
        </div>
        <div className={`px-5 py-3 rounded-2xl border-2 font-mono text-2xl font-black transition-all duration-700 ${
          isActive
            ? 'bg-gold border-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
            : 'bg-black/40 border-white/10 text-white/40'
        }`}>
          {formatTime(seconds)}
        </div>
      </div>
      <CapturedBar captured={captured} />
    </div>
  );
}

// Banner de oferta de tablas
function DrawOfferBanner({ sender, onAccept, onDecline }: { sender: string; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-zinc-950 border border-gold/40 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500">
      <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
        <span className="text-gold">{sender}</span> ofrece tablas
      </span>
      <button onClick={onAccept} className="px-4 py-1.5 bg-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer">
        Aceptar
      </button>
      <button onClick={onDecline} className="px-4 py-1.5 bg-zinc-800 border border-white/10 text-white/60 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all cursor-pointer">
        Rechazar
      </button>
    </div>
  );
}

export default function OnlinePremiumPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [gameJoined, setGameJoined] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("ESPERANDO JUGADOR");
  const [currentMode, setCurrentMode] = useState(TIME_MODES[2].options[0]);

  const [timeW, setTimeW] = useState(600);
  const [timeB, setTimeB] = useState(600);
  const [capturedW, setCapturedW] = useState<string[]>([]);
  const [capturedB, setCapturedB] = useState<string[]>([]);
  const [myColor, setMyColor] = useState<'w' | 'b'>('w');
  const [myData, setMyData] = useState<any>(null);
  const [opponent, setOpponent] = useState({ name: "Rival", elo: "????" });

  const [drawOfferSender, setDrawOfferSender] = useState<string | null>(null);
  const [hasOfferedDraw, setHasOfferedDraw] = useState(false);

  const statusRef = useRef(status);
  const currentModeRef = useRef(currentMode);
  const matchmakingSocket = useRef<WebSocket | null>(null);
  const gameSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { currentModeRef.current = currentMode; }, [currentMode]);

  useEffect(() => {
    if (!gameJoined) return;
    const timer = setInterval(() => {
      const s = statusRef.current;
      if (s.includes("FINALIZADA") || s.includes("MATE") || s.includes("TABLAS") ||
          s.includes("COMPLETED") || s.includes("GANAN") || s.includes("¡HAS GANADO")) return;
      if (s === "TURNO BLANCAS") setTimeW(prev => Math.max(0, prev - 1));
      else if (s === "TURNO NEGRAS") setTimeB(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameJoined]);

  const startSearch = () => {
    const token = localStorage.getItem("access");
    if (!token) return alert("No hay token de sesión.");
    setIsSearching(true);
    setStatus("BUSCANDO RIVAL...");
    const ws = new WebSocket(`ws://localhost:8000/ws/matchmaking/?token=${token}`);
    matchmakingSocket.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: "search_game",
        mode: currentModeRef.current.mode,
        initial_time: currentModeRef.current.m,
        increment: currentModeRef.current.i
      }));
    };
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "match_found") {
        setGameId(data.game_id);
        setGameJoined(true);
        setIsSearching(false);
        ws.close();
      }
    };
    ws.onclose = () => setIsSearching(false);
    ws.onerror = () => { setIsSearching(false); setStatus("ERROR DE CONEXIÓN"); };
  };

  const cancelSearch = () => {
    matchmakingSocket.current?.close();
    matchmakingSocket.current = null;
    setIsSearching(false);
    setStatus("ESPERANDO JUGADOR");
  };

  const resetGame = () => {
    setGameJoined(false);
    setGameId(null);
    setHistory([]);
    setCapturedW([]);
    setCapturedB([]);
    setMyData(null);
    setDrawOfferSender(null);
    setHasOfferedDraw(false);
    setStatus("ESPERANDO JUGADOR");
    setTimeW(currentModeRef.current.m);
    setTimeB(currentModeRef.current.m);
  };

  const handleResign = () => {
    if (!gameSocketRef.current || gameSocketRef.current.readyState !== WebSocket.OPEN) return;
    gameSocketRef.current.send(JSON.stringify({ action: "resign" }));
  };

  const handleOfferDraw = () => {
    if (!gameSocketRef.current || gameSocketRef.current.readyState !== WebSocket.OPEN) return;
    if (hasOfferedDraw) return;
    gameSocketRef.current.send(JSON.stringify({ action: "offer_draw" }));
    setHasOfferedDraw(true);
  };

  const handleAcceptDraw = () => {
    if (!gameSocketRef.current || gameSocketRef.current.readyState !== WebSocket.OPEN) return;
    gameSocketRef.current.send(JSON.stringify({ action: "accept_draw" }));
    setDrawOfferSender(null);
  };

  const handleDeclineDraw = () => setDrawOfferSender(null);

  const handleMoveUpdate = useCallback((newHistory: string[], lastMoveColor: 'w' | 'b' | null, serverTimes?: {w: number, b: number}) => {
    setHistory(newHistory);
    if (serverTimes) { setTimeW(serverTimes.w); setTimeB(serverTimes.b); return; }
    if (newHistory.length === 0 || lastMoveColor === null) return;
    const inc = currentModeRef.current.i;
    if (inc > 0) {
      if (lastMoveColor === 'w') setTimeW(prev => prev + inc);
      else setTimeB(prev => prev + inc);
    }
  }, []);

  const handleGameData = useCallback((data: any, color: 'w' | 'b') => {
    setMyColor(color);
    if (data.capturedW) setCapturedW(data.capturedW);
    if (data.capturedB) setCapturedB(data.capturedB);
    const mode = currentModeRef.current.mode;
    if (color === 'w') {
      if (data.white_player) setMyData(data.white_player);
      if (data.black_player) setOpponent({ name: data.black_player.username, elo: getEloForMode(data.black_player, mode) });
    } else {
      if (data.black_player) setMyData(data.black_player);
      if (data.white_player) setOpponent({ name: data.white_player.username, elo: getEloForMode(data.white_player, mode) });
    }
    if (data.time_white !== undefined && data.time_black !== undefined) {
      setTimeW(data.time_white); setTimeB(data.time_black);
    } else if (data.initial_time) {
      setTimeW(data.initial_time); setTimeB(data.initial_time);
    }
  }, []);

  const handleGameStateChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  }, []);

  const handleGameEnded = useCallback((data: { result: string; termination_reason: string }) => {
    const resultLabels: Record<string, string> = { "1-0": "VICTORIA BLANCAS", "0-1": "VICTORIA NEGRAS", "1/2-1/2": "TABLAS" };
    const reasonLabels: Record<string, string> = { "resignation": "por abandono", "timeout": "por tiempo", "checkmate": "por jaque mate", "agreed_draw": "acordadas", "draw": "técnicas" };
    const label = resultLabels[data.result] || "PARTIDA FINALIZADA";
    const reason = reasonLabels[data.termination_reason] || "";
    setStatus(`${label}${reason ? ` (${reason})` : ""}`);
  }, []);

  const handleDrawOffered = useCallback((sender: string) => setDrawOfferSender(sender), []);

  const opponentColor: 'w' | 'b' = myColor === 'w' ? 'b' : 'w';
  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ moveNum: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] || null });
  }

  const isGameOver = status.includes("MATE") || status.includes("TABLAS") ||
    status.includes("FINALIZADA") || status.includes("GANAN") || status.includes("VICTORIA") || status.includes("¡HAS GANADO");

  const myElo = myData ? getEloForMode(myData, currentMode.mode) : "????";
  const myName = myData?.username || "Tu Perfil";

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-6 xl:p-10 font-sans selection:bg-gold/30 relative overflow-hidden">
      <style>{searchAnimations}</style>
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#070502]" />
        <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-gold/20 blur-[140px] rounded-full animate-pulse" />
      </div>

      {drawOfferSender && (
        <DrawOfferBanner sender={drawOfferSender} onAccept={handleAcceptDraw} onDecline={handleDeclineDraw} />
      )}

      <div className="relative z-10 max-w-[1700px] mx-auto grid grid-cols-12 gap-8 items-stretch">

        <div className="col-span-12 xl:col-span-3 flex flex-col justify-between py-2">
          <OpponentBox
            name={opponent.name}
            elo={opponent.elo}
            isActive={status === (opponentColor === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS")}
            seconds={opponentColor === 'w' ? timeW : timeB}
            visible={gameJoined || isSearching}
            captured={opponentColor === 'w' ? capturedB : capturedW}
          />

          <div className="bg-zinc-950/60 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl my-6 min-h-[400px] flex flex-col justify-center relative overflow-hidden">
            {!gameJoined ? (
              <div className="w-full">
                <div className={`transition-all duration-700 ${isSearching ? 'opacity-30 pointer-events-none scale-95 blur-sm' : 'opacity-100'}`}>
                  <p className="text-[10px] font-black tracking-[0.3em] text-gold uppercase mb-6 text-center">Configurar Duelo</p>
                  <div className="space-y-4">
                    {TIME_MODES.map((category) => (
                      <div key={category.label} className="space-y-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-black ml-1">{category.label}</span>
                        <div className="grid grid-cols-3 gap-2">
                          {category.options.map((opt) => (
                            <button
                              key={opt.n}
                              onClick={() => { setCurrentMode(opt); currentModeRef.current = opt; setTimeW(opt.m); setTimeB(opt.m); }}
                              className={`py-2 rounded-xl text-[10px] font-black transition-all duration-500 border cursor-pointer ${
                                currentMode.n === opt.n ? 'bg-gold text-black border-gold' : 'bg-zinc-900 border-white/5 hover:border-white/20'
                              }`}
                            >
                              {opt.n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={isSearching ? cancelSearch : startSearch}
                  className={`w-full mt-8 py-5 rounded-[1.5rem] font-black text-[11px] tracking-[0.3em] uppercase transition-all duration-500 relative overflow-hidden ${
                    isSearching
                      ? 'bg-zinc-800 text-red-400 border border-red-500/50 cursor-pointer hover:bg-red-950/40'
                      : 'bg-white text-black hover:bg-gold hover:scale-[1.02]'
                  }`}
                >
                  <span className="relative z-10">{isSearching ? 'Cancelar Búsqueda' : 'Jugar Ahora'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center animate-in zoom-in duration-500 w-full px-4">
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em]">Servidor Activo</span>
                  </div>
                </div>
                <div className="relative group">
                  <div className={`absolute inset-0 blur-2xl opacity-20 transition-colors duration-1000 ${status.includes("BLANCAS") ? 'bg-white' : 'bg-gold'}`} />
                  <div className="relative bg-black/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-md">
                    <div className="w-16 h-16 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-white/10 shadow-xl">
                      <span className={`text-3xl transition-transform duration-500 ${isGameOver ? 'scale-110' : 'animate-bounce'}`}>
                        {isGameOver ? '🏆' : '⚔️'}
                      </span>
                    </div>
                    <h2 className="text-zinc-500 font-black text-[10px] tracking-[0.4em] uppercase mb-1">
                      {isGameOver ? 'Resultado Final' : 'Estado del Duelo'}
                    </h2>
                    <p className={`text-xl font-black tracking-tighter uppercase transition-all duration-500 ${
                      status.includes("MATE") || status.includes("GANAN") || status.includes("VICTORIA") ? 'text-green-400 scale-110' : 'text-white'
                    }`}>
                      {status}
                    </p>
                  </div>
                </div>

                {!isGameOver && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleOfferDraw}
                      disabled={hasOfferedDraw}
                      className={`flex-1 py-3 rounded-2xl font-black text-[9px] tracking-[0.2em] uppercase transition-all duration-300 border ${
                        hasOfferedDraw
                          ? 'bg-zinc-900 border-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-zinc-800 border-white/10 text-white/60 hover:bg-zinc-700 hover:border-white/20 cursor-pointer'
                      }`}
                    >
                      {hasOfferedDraw ? '½ Ofrecidas' : '½ Tablas'}
                    </button>
                    <button
                      onClick={handleResign}
                      className="flex-1 py-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-2xl font-black text-[9px] tracking-[0.2em] uppercase hover:bg-red-950/50 hover:border-red-500/40 transition-all duration-300 cursor-pointer"
                    >
                      Rendirse
                    </button>
                  </div>
                )}

                {isGameOver && (
                  <button
                    onClick={resetGame}
                    className="mt-8 w-full py-4 bg-gold text-black rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-500 cursor-pointer"
                  >
                    Nueva Partida
                  </button>
                )}
              </div>
            )}
          </div>

          <MyPlayerBox
            name={myName}
            elo={myElo}
            isActive={status === (myColor === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS")}
            seconds={myColor === 'w' ? timeW : timeB}
            captured={myColor === 'w' ? capturedB : capturedW}
          />
        </div>

        <div className="col-span-12 xl:col-span-6 flex items-center justify-center">
          <div className="w-full flex justify-center">
            {gameJoined && gameId ? (
              <PlayOnline
                serverUrl={`ws://localhost:8000/ws/games/${gameId}/`}
                onGameStateChange={handleGameStateChange}
                onMoveUpdate={handleMoveUpdate}
                onGameData={handleGameData}
                onGameEnded={handleGameEnded}
                onDrawOffered={handleDrawOffered}
                socketRef={gameSocketRef}
              />
            ) : (
              <div className="w-[min(95vw,780px)] aspect-square bg-zinc-950/40 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center transition-all duration-1000">
                <div className="relative w-94 h-94 flex items-center justify-center">
                  <div className={`absolute inset-0 transition-opacity duration-1000 ${isSearching ? 'animate-pulse-subtle opacity-100' : 'opacity-40'}`}>
                    <div className="w-full h-full rounded-full border-4 border-dashed border-gold animate-[spin_20s_linear_infinite]" />
                  </div>
                  <div className="relative text-center z-10">
                    <span className={`text-6xl mb-4 block ${isSearching ? 'animate-bounce' : ''}`}>♟️</span>
                    <h3 className="text-white font-black tracking-[0.5em] uppercase text-xl">
                      {isSearching ? 'Buscando...' : 'WELIKECHESS'}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3">
          <div className="bg-zinc-950/80 h-full flex flex-col border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
              <span className="text-gold/90 text-[10px] font-black tracking-[0.4em] uppercase">Movimientos</span>
              <div className={`w-2 h-2 rounded-full ${gameJoined ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`} />
            </div>
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-black/20">
              {rows.map((row) => (
                <div key={row.moveNum} className="grid grid-cols-[40px_1fr_1fr] gap-2 mb-2 p-1 animate-in slide-in-from-left-2 duration-300">
                  <span className="font-mono text-[10px] text-zinc-700 self-center">{row.moveNum}.</span>
                  <div className="bg-zinc-900 border border-white/5 py-2 px-3 rounded-lg text-white font-mono text-sm text-center">{row.white}</div>
                  {row.black && <div className="bg-zinc-800/40 border border-white/5 py-2 px-3 rounded-lg text-zinc-400 font-mono text-sm text-center">{row.black}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}