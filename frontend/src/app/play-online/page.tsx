"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayOnline from '@/components/game/PlayOnline';

interface TimeOption { n: string; m: number; i: number; }
interface TimeCategory { label: string; options: TimeOption[]; }

const TIME_MODES: TimeCategory[] = [
  { label: "Bullet", options: [{ n: "1+0", m: 60, i: 0 }, { n: "1+1", m: 60, i: 1 }, { n: "2+1", m: 120, i: 1 }] },
  { label: "Blitz", options: [{ n: "3+0", m: 180, i: 0 }, { n: "3+2", m: 180, i: 2 }, { n: "5+3", m: 300, i: 3 }] },
  { label: "Rápidas", options: [{ n: "10+0", m: 600, i: 0 }, { n: "15+10", m: 900, i: 10 }] },
];

const searchAnimations = `
  @keyframes subtle-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.04); opacity: 0.8; }
  }
  .animate-pulse-subtle { animation: subtle-pulse 6s infinite ease-in-out; }
`;

function OpponentBox({ name, elo, isActive, seconds, visible }: any) {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-5 rounded-[2rem] border transition-all duration-1000 backdrop-blur-xl ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
    } ${
      isActive ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'bg-zinc-900/40 border-white/5'
    }`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500">
            <span className="text-xs">VS</span>
          </div>
          <div>
            <h4 className="text-white font-black text-[11px] uppercase tracking-widest">{name}</h4>
            <span className="text-[9px] text-zinc-500 font-bold italic">ELO {elo}</span>
          </div>
        </div>
        <div className={`font-mono text-xl font-black ${isActive ? 'text-red-400' : 'text-white/80'}`}>
          {formatTime(seconds)}
        </div>
      </div>
    </div>
  );
}

function MyPlayerBox({ name, elo, isActive, seconds }: any) {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-700 relative overflow-hidden ${
      isActive ? 'bg-zinc-950 border-gold shadow-[0_0_50px_rgba(212,175,55,0.15)] scale-[1.03]' : 'bg-zinc-950 border-white/10 shadow-2xl'
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[50px] -z-10"></div>
      <div className="flex justify-between items-end relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-gold text-black text-[8px] font-black rounded-md uppercase tracking-tighter">Pro User</span>
            <h4 className="text-white font-black text-sm uppercase tracking-wider">{name}</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Rating</span>
            <span className="text-2xl font-black text-gold tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">{elo}</span>
          </div>
        </div>
        <div className={`px-5 py-3 rounded-2xl border-2 font-mono text-2xl font-black transition-all duration-700 ${
          isActive ? 'bg-gold border-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-black/40 border-white/10 text-white/40'
        }`}>
          {formatTime(seconds)}
        </div>
      </div>
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
  const [myColor, setMyColor] = useState<'w' | 'b'>('w');
  const [opponent, setOpponent] = useState({ name: "Rival", elo: "????" });

  // Refs para acceder a valores actuales en el intervalo sin stale closures
  const statusRef = useRef(status);
  const gameJoinedRef = useRef(gameJoined);
  const historyLengthRef = useRef(0);
  const currentModeRef = useRef(currentMode);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { gameJoinedRef.current = gameJoined; }, [gameJoined]);
  useEffect(() => { currentModeRef.current = currentMode; }, [currentMode]);

  const matchmakingSocket = useRef<WebSocket | null>(null);

  // Timer: usa refs para no capturar valores stale. Solo depende de gameJoined.
  useEffect(() => {
    if (!gameJoined) return;

    const timer = setInterval(() => {
      if (historyLengthRef.current === 0) return; // esperar primer movimiento
      const s = statusRef.current;
      if (s.includes("FINALIZADA") || s.includes("MATE") || s.includes("TABLAS") ||
          s.includes("COMPLETED") || s.includes("GANAN")) return;

      if (s === "TURNO BLANCAS") {
        setTimeW(prev => Math.max(0, prev - 1));
      } else if (s === "TURNO NEGRAS") {
        setTimeB(prev => Math.max(0, prev - 1));
      }
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
        mode: "rapid",
        initial_time: currentMode.m,
        increment: currentMode.i
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
    ws.onerror = () => {
      setIsSearching(false);
      setStatus("ERROR DE CONEXIÓN");
    };
  };

  const cancelSearch = () => {
    matchmakingSocket.current?.close();
    setIsSearching(false);
    setStatus("ESPERANDO JUGADOR");
  };

  const resetGame = () => {
    setGameJoined(false);
    setGameId(null);
    setHistory([]);
    historyLengthRef.current = 0;
    setStatus("ESPERANDO JUGADOR");
    setTimeW(currentModeRef.current.m);
    setTimeB(currentModeRef.current.m);
  };

  // Recibe historial y el color del jugador que acaba de mover (para el incremento)
  const handleMoveUpdate = useCallback((newHistory: string[], lastMoveColor: 'w' | 'b' | null) => {
    setHistory(newHistory);
    historyLengthRef.current = newHistory.length;

    if (newHistory.length === 0 || lastMoveColor === null) return;

    const increment = currentModeRef.current.i;
    if (increment === 0) return;

    // Aplicar incremento al jugador que acaba de mover
    if (lastMoveColor === 'w') {
      setTimeW(prev => prev + increment);
    } else {
      setTimeB(prev => prev + increment);
    }
  }, []);

  // Recibe los datos de la partida del servidor (color, jugadores, tiempo)
  const handleGameData = useCallback((data: any, color: 'w' | 'b') => {
    setMyColor(color);

    // El servidor ahora envía white_player y black_player completos
    if (color === 'w') {
      setOpponent({
        name: data.black_player?.username || "Oponente",
        elo: data.black_player?.elo_rapid || data.black_player?.elo_blitz || "1200"
      });
    } else {
      setOpponent({
        name: data.white_player?.username || "Oponente",
        elo: data.white_player?.elo_rapid || data.white_player?.elo_blitz || "1200"
      });
    }

    // El servidor envía initial_time: usarlo para inicializar relojes
    if (data.initial_time) {
      setTimeW(data.initial_time);
      setTimeB(data.initial_time);
    }
  }, []);

  const handleGameStateChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  }, []);

  const opponentColor: 'w' | 'b' = myColor === 'w' ? 'b' : 'w';

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ moveNum: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] || null });
  }

  const isGameOver = status.includes("MATE") || status.includes("TABLAS") ||
    status.includes("FINALIZADA") || status.includes("GANAN");

  return (
    <main className="min-h-screen bg-[#020202] text-zinc-400 p-6 xl:p-10 font-sans selection:bg-gold/30 relative overflow-hidden">
      <style>{searchAnimations}</style>
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#070502]"></div>
        <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-gold/20 blur-[140px] rounded-full animate-pulse"></div>
      </div>
      <div className="relative z-10 max-w-[1700px] mx-auto grid grid-cols-12 gap-8 items-stretch">

        {/* Columna izquierda */}
        <div className="col-span-12 xl:col-span-3 flex flex-col justify-between py-2">
          <OpponentBox
            name={opponent.name}
            elo={opponent.elo}
            isActive={status === (opponentColor === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS")}
            seconds={opponentColor === 'w' ? timeW : timeB}
            visible={gameJoined || isSearching}
          />

          <div className="bg-zinc-950/60 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl my-6 min-h-[400px] flex flex-col justify-center relative overflow-hidden">
            {!gameJoined ? (
              <div className={`transition-all duration-1000 ${isSearching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <p className="text-[10px] font-black tracking-[0.3em] text-gold uppercase mb-6 text-center">Configurar Duelo</p>
                <div className="space-y-4">
                  {TIME_MODES.map((category) => (
                    <div key={category.label} className="space-y-2">
                      <span className="text-[9px] text-zinc-500 uppercase font-black ml-1">{category.label}</span>
                      <div className="grid grid-cols-3 gap-2">
                        {category.options.map((opt) => (
                          <button
                            key={opt.n}
                            onClick={() => {
                              setCurrentMode(opt);
                              currentModeRef.current = opt;
                              setTimeW(opt.m);
                              setTimeB(opt.m);
                            }}
                            className={`py-2 rounded-xl text-[10px] font-black transition-all duration-500 border cursor-pointer ${
                              currentMode.n === opt.n
                                ? 'bg-gold text-black border-gold'
                                : 'bg-zinc-900 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {opt.n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={isSearching ? cancelSearch : startSearch}
                  className={`w-full mt-8 py-5 rounded-[1.5rem] font-black text-[11px] tracking-[0.3em] uppercase transition-all duration-500 ${
                    isSearching
                      ? 'bg-zinc-800 text-red-400 border border-red-500/50 cursor-pointer hover:bg-red-950/40'
                      : 'bg-white text-black hover:bg-gold hover:scale-[1.02]'
                  }`}
                >
                  {isSearching ? 'Cancelar Búsqueda' : 'Jugar Ahora'}
                </button>
              </div>
            ) : (
              <div className="text-center animate-in zoom-in duration-500">
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-4 mx-auto border border-gold/20">
                  <div className={`w-2 h-2 rounded-full ${isGameOver ? 'bg-red-400' : 'bg-gold animate-ping'}`}></div>
                </div>
                <h2 className="text-white font-black text-xs tracking-widest uppercase mb-2">
                  {isGameOver ? 'Partida Finalizada' : 'Partida en curso'}
                </h2>
                <p className="text-gold text-[10px] font-bold tracking-widest uppercase">{status}</p>
                {isGameOver && (
                  <button
                    onClick={resetGame}
                    className="mt-6 px-6 py-3 bg-gold text-black rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 transition-transform"
                  >
                    Nueva Partida
                  </button>
                )}
              </div>
            )}
          </div>

          <MyPlayerBox
            name="Tu Perfil"
            elo="2185"
            isActive={status === (myColor === 'w' ? "TURNO BLANCAS" : "TURNO NEGRAS")}
            seconds={myColor === 'w' ? timeW : timeB}
          />
        </div>

        {/* Tablero */}
        <div className="col-span-12 xl:col-span-6 flex items-center justify-center">
          <div className="w-full aspect-square max-w-[785px] relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-950/40 backdrop-blur-xl">
            {gameJoined && gameId ? (
              <PlayOnline
                serverUrl={`ws://localhost:8000/ws/games/${gameId}/`}
                onGameStateChange={handleGameStateChange}
                onMoveUpdate={handleMoveUpdate}
                onGameData={handleGameData}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000">
                <div className="relative w-80 h-80 flex items-center justify-center">
                  <div className={`absolute inset-0 transition-opacity duration-1000 ${isSearching ? 'animate-pulse-subtle opacity-100' : 'opacity-40'}`}>
                    <div className="w-full h-full rounded-full border-4 border-dashed border-gold animate-[spin_20s_linear_infinite]"></div>
                  </div>
                  <div className="relative text-center z-10">
                    <span className={`text-6xl mb-4 block ${isSearching ? 'animate-bounce' : ''}`}>♟️</span>
                    <h3 className="text-white font-black tracking-[0.5em] uppercase text-xl">
                      {isSearching ? 'En la cola...' : 'WELIKECHESS'}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel de movimientos */}
        <div className="col-span-12 xl:col-span-3">
          <div className="bg-zinc-950/80 h-full flex flex-col border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
              <span className="text-gold/90 text-[10px] font-black tracking-[0.4em] uppercase">Movimientos</span>
              <div className={`w-2 h-2 rounded-full ${gameJoined ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}></div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-black/20">
              {rows.length === 0 && gameJoined && (
                <p className="text-zinc-700 text-[10px] text-center mt-8 font-bold uppercase tracking-widest">
                  Esperando primer movimiento...
                </p>
              )}
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