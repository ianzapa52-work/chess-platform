"use client";

import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import PuzzleBoard from '@/components/game/PuzzleBoard';
import AchievementToast from '@/components/ui/AchievementToast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface ApiPuzzle {
  id: string;
  rating: number;
  themes: string[];
  initial_fen: string;
  blunder_move: string;
  solution: string[];
}

function getUserElo(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.elo_blitz ?? null;
  } catch {
    return null;
  }
}

async function fetchRandomPuzzle(): Promise<ApiPuzzle> {
  const elo = getUserElo();
  const url = elo
    ? `${API_BASE}/games/puzzles/random/?elo=${elo}`
    : `${API_BASE}/games/puzzles/random/`;
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="flex-1 h-px bg-white/5 [.light_&]:bg-gray-200" />
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 [.light_&]:text-gray-500">{label}</span>
      <div className="flex-1 h-px bg-white/5 [.light_&]:bg-gray-200" />
    </div>
  );
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-2xl font-black tabular-nums leading-none ${accent ? 'text-emerald-400' : 'text-white [.light_&]:text-gray-900'}`}>
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 [.light_&]:text-gray-500 font-black">{label}</span>
    </div>
  );
}

function ThemeBadge({ theme }: { theme: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider
      bg-emerald-950/50 [.light_&]:bg-emerald-50 border border-emerald-500/15 [.light_&]:border-emerald-300/50 text-emerald-400/70 [.light_&]:text-emerald-700 hover:border-emerald-500/40 [.light_&]:hover:border-emerald-400
      hover:text-emerald-300 [.light_&]:hover:text-emerald-600 transition-colors duration-200">
      {theme}
    </span>
  );
}

function Panel({ children, className = "", accent = false }: {
  children: ReactNode; className?: string; accent?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border bg-zinc-950/60 [.light_&]:bg-white backdrop-blur-xl overflow-hidden ${
      accent ? 'border-emerald-500/20 [.light_&]:border-emerald-300/50' : 'border-white/[0.06] [.light_&]:border-gray-200'
    } ${className}`}>
      {accent && (
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
      )}
      {children}
    </div>
  );
}

function LeftPanel({
  loading, error, feedback, objective, onNext,
}: {
  loading: boolean;
  error: string | null;
  feedback: { text: string; color: string };
  objective: string;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Panel accent>
        <div className="p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/70 [.light_&]:text-emerald-700 mb-3">
            Objetivo
          </p>
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-900/20 [.light_&]:from-emerald-50 [.light_&]:to-emerald-100/80
            border border-emerald-500/20 [.light_&]:border-emerald-300/60 px-4 py-5 flex items-center justify-center min-h-[72px]">
            {loading ? (
              <div className="flex gap-1.5">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            ) : (
              <p className="text-center font-black text-sm uppercase tracking-widest text-emerald-300 [.light_&]:text-emerald-700 leading-tight">
                {objective}
              </p>
            )}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="p-5 flex flex-col items-center gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 [.light_&]:text-gray-500">Estado</p>
          <div className="relative w-full flex items-center justify-center py-3">
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full transition-all duration-500 ${
              feedback.color === 'text-emerald-400' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              : feedback.color === 'text-red-500'   ? 'bg-red-400'
              : 'bg-zinc-700 [.light_&]:bg-gray-300'
            }`} />
            {loading ? (
              <div className="flex gap-1.5">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            ) : error ? (
              <p className="text-red-400 font-black text-xs text-center">{error}</p>
            ) : (
              <h2 className={`text-2xl font-black italic tracking-tighter transition-all duration-300 ${
                feedback.color === 'text-white' ? '[.light_&]:text-gray-900' : ''
              } ${feedback.color}`}>
                {feedback.text}
              </h2>
            )}
          </div>
        </div>
      </Panel>

      <button
        onClick={onNext}
        disabled={loading}
        className="group relative w-full py-4 rounded-2xl overflow-hidden
          border border-emerald-500/40 bg-emerald-950/30 [.light_&]:bg-emerald-50 [.light_&]:border-emerald-300
          text-emerald-400 [.light_&]:text-emerald-700 font-black text-[10px] tracking-[0.3em] uppercase
          transition-all duration-200
          hover:bg-emerald-500 hover:text-black hover:border-emerald-400
          hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(16,185,129,0.25)]
          active:scale-[0.98] active:translate-y-0
          disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
              <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
              <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
            </>
          ) : (
            <>
              Siguiente puzzle
              <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </span>
      </button>
    </div>
  );
}

function RightPanel({ solvedCount, failedCount, puzzle }: { solvedCount: number; failedCount: number; puzzle: ApiPuzzle | null }) {
  const themes = puzzle?.themes?.filter(Boolean) ?? [];
  const ratingLevel = !puzzle ? null
    : puzzle.rating < 1200 ? { label: "Principiante", color: "text-sky-400" }
    : puzzle.rating < 1600 ? { label: "Intermedio",   color: "text-emerald-400" }
    : puzzle.rating < 2000 ? { label: "Avanzado",     color: "text-amber-400" }
    :                        { label: "Experto",       color: "text-red-400" };

  return (
    <div className="flex flex-col gap-4">
      <Panel accent>
        <div className="p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/70 [.light_&]:text-emerald-700 mb-4">
            Sesión actual
          </p>
          <div className="flex justify-around items-center py-2">
            <Stat value={solvedCount} label="Resueltos" accent />
            <div className="w-px h-10 bg-white/5 [.light_&]:bg-gray-200" />
            <Stat value={solvedCount + failedCount > 0 ? `${Math.round((solvedCount / (solvedCount + failedCount)) * 100)}%` : "—"} label="Aciertos" />
          </div>
          {solvedCount > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.04] [.light_&]:border-gray-100">
              <div className="flex justify-between mb-2">
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 [.light_&]:text-gray-500 font-black">Racha</span>
                <span className="text-[9px] font-black text-emerald-400 [.light_&]:text-emerald-600">{solvedCount} seguidos</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-900 [.light_&]:bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, solvedCount * 10)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Panel>

      {puzzle && (
        <Panel>
          <div className="p-5 flex flex-col gap-4">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 [.light_&]:text-gray-500">
              Puzzle actual
            </p>
            <div className="rounded-xl bg-black/30 [.light_&]:bg-gray-50 border border-white/[0.04] [.light_&]:border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white [.light_&]:text-gray-900 tabular-nums leading-none">
                  {puzzle.rating}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500 [.light_&]:text-gray-500 font-black mt-1">
                  Elo del puzzle
                </p>
              </div>
              {ratingLevel && (
                <div className="text-right">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${ratingLevel.color}`}>
                    {ratingLevel.label}
                  </span>
                  <div className="flex gap-0.5 mt-2 justify-end">
                    {[1200, 1600, 2000, 2400].map((threshold, idx) => (
                      <div key={idx} className={`w-4 h-1 rounded-full transition-colors ${
                        puzzle.rating >= threshold ? ratingLevel.color.replace('text-', 'bg-') : 'bg-zinc-800 [.light_&]:bg-gray-200'
                      }`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Divider label="Temas" />

            {themes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {themes.slice(0, 6).map(t => <ThemeBadge key={t} theme={t} />)}
              </div>
            ) : (
              <p className="text-zinc-600 [.light_&]:text-gray-400 text-[10px] italic">Sin temas asignados</p>
            )}

            <Divider label="Info" />

            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 [.light_&]:text-gray-500 font-black">ID Lichess</span>
              <a
                href={`https://lichess.org/training/${puzzle.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black text-zinc-400 [.light_&]:text-gray-600 hover:text-emerald-400 [.light_&]:hover:text-emerald-600 transition-colors
                  flex items-center gap-1 group"
              >
                {puzzle.id}
                <svg className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

const API_BASE_PUZZLES = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function submitPuzzleAttempt(lichessId: string, successful: boolean): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) return;
  try {
    await fetch(`${API_BASE_PUZZLES}/games/puzzles/solve/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ lichess_id: lichessId, successful }),
    });
  } catch { /* silently fail */ }
}

export default function PuzzlesPremiumPage() {
  useEffect(() => {
    document.title = "WELIKECHESS | Puzzles";
  }, []);

  const [puzzle, setPuzzle]   = useState<ApiPuzzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [feedback, setFeedback] = useState({ text: "TU TURNO", color: "text-white" });

  const currentPuzzleRef  = useRef<ApiPuzzle | null>(null);
  const puzzleSolvedRef   = useRef(false);
  const puzzleAttemptedRef = useRef(false);

  useEffect(() => { currentPuzzleRef.current = puzzle; }, [puzzle]);

  const loadPuzzle = useCallback(async () => {
    // Si el puzzle actual fue intentado pero no resuelto, registrar como fallido
    if (currentPuzzleRef.current && !puzzleSolvedRef.current && puzzleAttemptedRef.current) {
      submitPuzzleAttempt(currentPuzzleRef.current.id, false);
      setFailedCount(c => c + 1);
    }
    puzzleSolvedRef.current   = false;
    puzzleAttemptedRef.current = false;

    setLoading(true);
    setError(null);
    setFeedback({ text: "TU TURNO", color: "text-white" });
    try {
      const data = await fetchRandomPuzzle();
      setPuzzle(data);
    } catch (err: any) {
      setError(err.message ?? "Error al cargar el puzzle");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPuzzle(); }, [loadPuzzle]);

  const handleFeedback = useCallback((text: string, color: string) => {
    if (text === "INTÉNTALO DE NUEVO") {
      puzzleAttemptedRef.current = true;
    }
    const tailwindColor =
      color === "#2ecc71" ? "text-emerald-400"
      : text === "TU TURNO" ? "text-white"
      : "text-red-500";
    setFeedback({ text, color: tailwindColor });
  }, []);

  const handleSuccess = useCallback(() => {
    setSolvedCount(c => c + 1);
    puzzleSolvedRef.current = true;
    if (currentPuzzleRef.current) {
      submitPuzzleAttempt(currentPuzzleRef.current.id, true);
    }
  }, []);

  const objective = puzzle?.themes?.filter(Boolean)[0] ?? "Encuentra la jugada";

  return (
    <main className="min-h-screen bg-[#020202] [.light_&]:bg-[#f3fff8] text-zinc-400 pt-2 px-4 pb-4 xl:pt-4 xl:px-10 xl:pb-10 font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#050508] [.light_&]:bg-[#f3fff8]" />
        <div className="absolute inset-0 opacity-[0.15] [.light_&]:opacity-[0.14] mix-blend-overlay [.light_&]:mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] bg-emerald-600/45 [.light_&]:bg-emerald-200/60 blur-[200px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-30%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] bg-emerald-500/30 [.light_&]:bg-green-100/80 blur-[200px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="absolute inset-0 opacity-[0.18] [.light_&]:opacity-[0.22] [background-image:radial-gradient(#ffffff_1.5px,transparent_1.5px)] [.light_&]:[background-image:radial-gradient(rgba(5,150,105,0.42)_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto grid grid-cols-12 gap-6 xl:gap-8 items-start">
        <div className="col-span-12 xl:col-span-3">
          <LeftPanel
            loading={loading}
            error={error}
            feedback={feedback}
            objective={objective}
            onNext={loadPuzzle}
          />
        </div>

        <div className="col-span-12 xl:col-span-6 flex justify-center">
          {loading && (
            <div className="w-[min(95vw,780px)] h-[min(95vw,780px)] rounded-2xl bg-zinc-900/40 [.light_&]:bg-gray-100
              border border-white/[0.06] [.light_&]:border-gray-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce"
                      style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 [.light_&]:text-gray-400 font-black">
                  Cargando puzzle...
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="w-[min(95vw,780px)] h-[min(95vw,780px)] rounded-2xl bg-zinc-900/40 [.light_&]:bg-gray-100
              border border-red-500/10 [.light_&]:border-red-200 flex flex-col items-center justify-center gap-5">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20
                flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-400 font-black text-sm">{error}</p>
              <button
                onClick={loadPuzzle}
                className="py-2.5 px-6 rounded-xl border border-emerald-500/30 [.light_&]:border-emerald-400 text-emerald-400 [.light_&]:text-emerald-700
                  font-black text-[10px] uppercase tracking-widest hover:bg-emerald-950/50 [.light_&]:hover:bg-emerald-50 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && puzzle && (
            <PuzzleBoard
              key={puzzle.id}
              puzzle={puzzle}
              onSuccess={handleSuccess}
              onFeedback={handleFeedback}
            />
          )}
        </div>

        <div className="col-span-12 xl:col-span-3">
          <RightPanel solvedCount={solvedCount} failedCount={failedCount} puzzle={!loading ? puzzle : null} />
        </div>
      </div>

      <AchievementToast />
    </main>
  );
}
