"use client";

import { useState, useEffect, useRef } from 'react';
import PlayLocal from '@/components/game/PlayLocal';
import GameHistory from '@/components/ui/GameHistory';
import GameOverModal, { type GameResult } from '@/components/ui/GameOverModal';
import { useTheme } from '@/hooks/useTheme';

const TIME_MODES = [
  { label: "Bullet", options: [{ n: "1+0", m: 60, i: 0 }, { n: "1+1", m: 60, i: 1 }, { n: "2+1", m: 120, i: 1 }] },
  { label: "Blitz", options: [{ n: "3+0", m: 180, i: 0 }, { n: "3+2", m: 180, i: 2 }, { n: "5+3", m: 300, i: 3 }] },
  { label: "Rápidas", options: [{ n: "10+0", m: 600, i: 0 }, { n: "15+10", m: 900, i: 10 }] },
];

function PlayerBox({ name, captured, isActive, seconds, isNoTimeMode, isTimedOut, isLight }: any) {
  const formatTime = (s: number) => {
    if (isNoTimeMode) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-5 rounded-4xl border transition-all duration-500 relative overflow-hidden ${
      isTimedOut
        ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
        : isActive
          ? isLight
            ? 'bg-blue-50 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02] z-10'
            : 'bg-gold/20 border-gold shadow-[0_0_40px_rgba(212,175,55,0.25)] scale-[1.02] z-10'
          : isLight
            ? 'bg-white border-gray-200'
            : 'bg-zinc-900/40 border-white/10 opacity-80 backdrop-blur-xl'
    }`}>
      {isTimedOut && <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />}

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            isTimedOut ? 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
              : isActive ? isLight ? 'bg-blue-400 animate-pulse' : 'bg-gold animate-pulse shadow-[0_0_10px_#d4af37]'
              : isLight ? 'bg-gray-300' : 'bg-zinc-700'
          }`} />
          <h4 className={`font-black text-[11px] uppercase tracking-widest leading-none ${
            isTimedOut ? 'text-red-400' : isLight ? 'text-gray-900' : 'text-white'
          }`}>
            {isTimedOut ? '¡Tiempo!' : name}
          </h4>
        </div>
        <div className={`px-4 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all ${
          isTimedOut
            ? 'bg-red-500/20 border-red-500/50 text-red-300'
            : isActive && !isNoTimeMode
              ? isLight ? 'bg-red-50 border-red-300 text-red-500' : 'bg-red-500/40 border-red-500/50 text-red-200'
              : isLight ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-black/60 border-white/10 text-white/60'
        }`}>
          {formatTime(seconds)}
        </div>
      </div>

      <div className="p-3 rounded-2xl border border-black/30 shadow-inner min-h-[65px] flex items-center bg-linear-to-br from-[#d2b48c] to-[#a68a64] relative z-10">
        <div className="flex flex-wrap gap-1 max-w-full">
          {captured.length > 0 ? (
            captured.map((img: string, i: number) => (
              <img key={i} src={img} className="w-5 h-5 object-contain drop-shadow-md" alt="piece" />
            ))
          ) : (
            <span className="text-[8px] uppercase tracking-[0.2em] text-black/40 font-black italic ml-1">Sin bajas</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeoutOverlay({ loser, onReset }: { loser: 'w' | 'b'; onReset: () => void }) {
  const winner = loser === 'w' ? 'Usuario Local 2' : 'Usuario Local 1';
  const loserName = loser === 'w' ? 'Usuario Local 1' : 'Usuario Local 2';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-linear-to-b from-red-900/20 to-transparent" />
      <div className="relative flex flex-col items-center gap-6 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50
          flex items-center justify-center
          shadow-[0_0_60px_rgba(239,68,68,0.4),0_0_120px_rgba(239,68,68,0.15)]">
          <span className="text-4xl">⏱</span>
        </div>
        <div className="space-y-2">
          <p className="text-red-300 font-black text-2xl uppercase tracking-[0.15em] leading-none drop-shadow-lg">
            Tiempo agotado
          </p>
          <p className="text-zinc-300 text-[11px] font-bold uppercase tracking-[0.25em]">
            {loserName} pierde por tiempo
          </p>
          <p className="text-gold text-[13px] font-black uppercase tracking-[0.2em] mt-1">
            🏆 {winner} gana
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-8 py-3.5 rounded-2xl font-black text-[11px] tracking-[0.25em] uppercase
            bg-white text-black border border-transparent hover:bg-gold
            transition-colors duration-200 cursor-pointer
            shadow-[0_0_30px_rgba(255,255,255,0.12)]"
        >
          Nueva partida
        </button>
      </div>
    </div>
  );
}

export default function LocalPremiumPage() {
  useEffect(() => {
    document.title = "WELIKECHESS | Jugar Local";
  }, []);

  const { isLight } = useTheme();

  const [boardOrientation, setBoardOrientation] = useState<'w' | 'b'>('w');
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("TURNO BLANCAS");
  const [capturedW, setCapturedW] = useState<string[]>([]);
  const [capturedB, setCapturedB] = useState<string[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [currentMode, setCurrentMode] = useState({ n: "10+0", m: 600, i: 0 });
  const [timeW, setTimeW] = useState(600);
  const [timeB, setTimeB] = useState(600);
  const [isNoTimeMode, setIsNoTimeMode] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timedOutPlayer, setTimedOutPlayer] = useState<'w' | 'b' | null>(null);
  const [gameResult, setGameResult]   = useState<GameResult | null>(null);
  const [gameWinner, setGameWinner]   = useState<'w' | 'b' | null>(null);

  useEffect(() => {
    if (isNoTimeMode || !gameStarted || status.includes("MATE") || status.includes("TABLAS") || timedOutPlayer) return;
    const timer = setInterval(() => {
      if (status.includes("BLANCAS")) {
        setTimeW(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) setTimedOutPlayer('w');
          return next;
        });
      } else if (status.includes("NEGRAS")) {
        setTimeB(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) setTimedOutPlayer('b');
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status, gameStarted, isNoTimeMode, timedOutPlayer]);

  const selectMode = (mode: any) => {
    if (gameStarted) return;
    setCurrentMode(mode);
    setTimeW(mode.m);
    setTimeB(mode.m);
    setIsNoTimeMode(false);
  };

  const handleMove = (newHistory: string[], cw: string[], cb: string[]) => {
    if (!isNoTimeMode && gameStarted) {
      if (status.includes("BLANCAS")) setTimeW(prev => prev + currentMode.i);
      else if (status.includes("NEGRAS")) setTimeB(prev => prev + currentMode.i);
    }
    if (!gameStarted) setGameStarted(true);
    setHistory(newHistory);
    setCapturedW(cw);
    setCapturedB(cb);
  };

  const handleGameOver = (winner: 'w' | 'b' | 'draw') => {
    if (winner === 'draw') {
      setGameResult('draw');
      setGameWinner(null);
    } else {
      setGameResult('win');
      setGameWinner(winner);
    }
  };

  // Timeout: the timed-out player loses, the other wins
  useEffect(() => {
    if (timedOutPlayer) {
      setGameResult('win');
      setGameWinner(timedOutPlayer === 'w' ? 'b' : 'w');
    }
  }, [timedOutPlayer]);

  const resetGame = () => {
    setResetKey(k => k + 1);
    setHistory([]);
    setCapturedW([]);
    setCapturedB([]);
    setTimeW(currentMode.m);
    setTimeB(currentMode.m);
    setGameStarted(false);
    setTimedOutPlayer(null);
    setGameResult(null);
    setGameWinner(null);
    setStatus("TURNO BLANCAS");
  };

  const gameOverStatus = status.includes("MATE") || status.includes("TABLAS") || timedOutPlayer ? status : "";

  const panel = isLight ? 'bg-white border-gray-200' : 'bg-zinc-950/60 border-white/10';
  const labelText = isLight ? 'text-gray-700' : 'text-white';
  const subText = isLight ? 'text-gray-500' : 'text-zinc-400';

  return (
    <main className={`min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-6rem)] xl:h-[calc(100vh-6rem)] ${isLight ? 'bg-[#f5f9ff]' : 'bg-[#020202]'} text-zinc-400 pt-3 px-4 pb-6 sm:px-6 xl:pt-5 xl:px-10 xl:pb-10 font-sans selection:bg-gold/30 relative overflow-y-auto xl:overflow-hidden`}>
      <div className="fixed inset-0 z-0 transition-opacity duration-500 opacity-100">
        <div className={`absolute inset-0 ${isLight ? 'bg-[#f5f9ff]' : 'bg-[#00050a]'}`} />
        <div className={`absolute top-[-30%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] blur-[200px] rounded-full animate-pulse ${isLight ? 'bg-sky-200/55' : 'bg-blue-600/25'}`} />
        <div className={`absolute bottom-[-30%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] blur-[200px] rounded-full animate-pulse [animation-delay:2s] ${isLight ? 'bg-blue-100/70' : 'bg-blue-900/30'}`} />
        <div className={`absolute inset-0 bg-size-[32px_32px] ${isLight ? 'opacity-[0.22] bg-[radial-gradient(rgba(37,99,235,0.42)_1.5px,transparent_1.5px)]' : 'opacity-[0.2] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)]'}`} />
        <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${isLight ? 'opacity-[0.14] mix-blend-multiply' : 'opacity-[0.25] mix-blend-overlay'}`} />
      </div>

      <div className="relative z-10 max-w-425 mx-auto grid grid-cols-12 gap-4 xl:gap-8 items-start">
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-2 order-2 xl:order-1">
          <PlayerBox
            name="Usuario Local 2" captured={capturedW}
            isActive={gameStarted && status.includes("NEGRAS") && !timedOutPlayer}
            seconds={timeB} isNoTimeMode={isNoTimeMode}
            isTimedOut={timedOutPlayer === 'b'}
            isLight={isLight}
          />

          <div className={`${panel} border rounded-4xl p-6 shadow-2xl backdrop-blur-xl`}>
            <div className="mb-6">
              <p className={`text-[10px] font-black tracking-[0.25em] ${labelText} uppercase mb-3 px-1`}>Elegir Bando</p>
              <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-2xl border ${
                isLight ? 'bg-gray-100 border-gray-200' : 'bg-black/40 border-white/5'
              }`}>
                <button
                  disabled={gameStarted}
                  onClick={() => setBoardOrientation('w')}
                  className={`
                    py-2 rounded-xl text-[9px] font-black transition-colors duration-200 border-2
                    ${gameStarted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    ${boardOrientation === 'w'
                      ? 'bg-zinc-100 text-black border-transparent shadow-lg'
                      : isLight ? 'text-gray-500 border-transparent hover:bg-gray-200' : 'text-zinc-500 border-transparent hover:bg-white/5'
                    }
                  `}
                >
                  BLANCAS
                </button>
                <button
                  disabled={gameStarted}
                  onClick={() => setBoardOrientation('b')}
                  className={`
                    py-2 rounded-xl text-[9px] font-black transition-colors duration-200 border-2
                    ${gameStarted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    ${boardOrientation === 'b'
                      ? 'bg-zinc-800 text-white shadow-lg border-white/10'
                      : isLight ? 'text-gray-500 border-transparent hover:bg-gray-200' : 'text-zinc-500 border-transparent hover:bg-white/5'
                    }
                  `}
                >
                  NEGRAS
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className={`text-[10px] font-black tracking-[0.25em] ${labelText} uppercase mb-3 px-1`}>Configuración</p>
              <button
                disabled={gameStarted}
                onClick={() => setIsNoTimeMode(!isNoTimeMode)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-colors duration-200
                  ${gameStarted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${isNoTimeMode
                    ? 'bg-gold/10 border-gold text-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                    : isLight ? 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'
                  }
                `}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Modo Sin Tiempo</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isNoTimeMode ? 'bg-gold' : isLight ? 'bg-gray-300' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isNoTimeMode ? 'left-6' : 'left-1'}`} />
                </div>
              </button>
            </div>

            <div className={`grid grid-cols-1 gap-3 transition-opacity duration-300 ${isNoTimeMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
              {TIME_MODES.map((category) => (
                <div key={category.label} className={`flex items-center justify-between gap-3 p-3 rounded-2xl border ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/50 border-white/6'
                }`}>
                  <span className={`text-[9px] uppercase font-black tracking-tight w-12 ${subText}`}>{category.label}</span>
                  <div className="flex gap-1.5">
                    {category.options.map((opt) => (
                      <button
                        key={opt.n}
                        disabled={gameStarted}
                        onClick={() => selectMode(opt)}
                        className={`
                          px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors duration-200 border
                          ${gameStarted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                          ${currentMode.n === opt.n && !isNoTimeMode
                            ? 'bg-gold text-black border-gold'
                            : isLight
                              ? 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                              : 'bg-zinc-800 border-white/10 hover:border-white/30 text-zinc-400'
                          }
                        `}
                      >
                        {opt.n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PlayerBox
            name="Usuario Local 1" captured={capturedB}
            isActive={gameStarted && status.includes("BLANCAS") && !timedOutPlayer}
            seconds={timeW} isNoTimeMode={isNoTimeMode}
            isTimedOut={timedOutPlayer === 'w'}
            isLight={isLight}
          />
        </div>

        <div className="col-span-12 xl:col-span-6 flex justify-center order-1 xl:order-2">
          <div className="relative">
            <PlayLocal
              resetSignal={resetKey} onGameStateChange={setStatus}
              onMove={handleMove} orientation={boardOrientation}
              onGameOver={handleGameOver}
            />
            {timedOutPlayer && (
              <TimeoutOverlay loser={timedOutPlayer} onReset={resetGame} />
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 h-[min(85vw,785px)] order-3">
          <GameHistory
            history={history}
            status={gameOverStatus}
            isGameOver={!!gameOverStatus || !!timedOutPlayer}
            gameStarted={gameStarted}
            onReset={resetGame}
            orientation={boardOrientation}
          />
        </div>
      </div>

      <GameOverModal
        result={gameResult}
        title={
          gameResult === 'draw' ? 'TABLAS' :
          gameWinner === 'w'    ? '¡BLANCAS GANAN!' : '¡NEGRAS GANAN!'
        }
        subtitle={
          gameResult === 'draw'          ? 'La partida termina en empate' :
          timedOutPlayer !== null        ? `${gameWinner === 'w' ? 'Usuario Local 2' : 'Usuario Local 1'} gana por tiempo` :
          gameWinner === 'w'             ? 'Usuario Local 2 vence a Usuario Local 1' :
                                           'Usuario Local 1 vence a Usuario Local 2'
        }
        moveCount={history.length}
        onReset={resetGame}
      />
    </main>
  );
}
