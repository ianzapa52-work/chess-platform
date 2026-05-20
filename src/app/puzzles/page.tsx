"use client";

import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import PuzzleBoard from '@/components/game/PuzzleBoard';
import AchievementToast from '@/components/ui/AchievementToast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ApiPuzzle {
  id: string;
  rating: number;
  themes: string[];
  initial_fen: string;
  blunder_move: string;
  solution: string[];
}

type PuzzleResult = 'solved' | 'failed';

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

async function fetchPuzzleById(id: string): Promise<ApiPuzzle> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/games/puzzles/${id}/`, { headers });
  if (!res.ok) return fetchRandomPuzzle();
  return res.json();
}

async function fetchRandomPuzzle(): Promise<ApiPuzzle> {
  const elo = getUserElo();
  const url = elo
    ? `${API_BASE}/api/games/puzzles/random/?elo=${elo}`
    : `${API_BASE}/api/games/puzzles/random/`;
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

async function submitPuzzleAttempt(lichessId: string, successful: boolean): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/games/puzzles/solve/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ lichess_id: lichessId, successful }),
    });
  } catch { /* silently fail */ }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="flex-1 h-px bg-white/5 in-[.light]:bg-gray-200" />
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 in-[.light]:text-gray-500">{label}</span>
      <div className="flex-1 h-px bg-white/5 in-[.light]:bg-gray-200" />
    </div>
  );
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-2xl font-black tabular-nums leading-none ${accent ? 'text-emerald-400' : 'text-white in-[.light]:text-gray-900'}`}>
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 in-[.light]:text-gray-500 font-black">{label}</span>
    </div>
  );
}

function ThemeBadge({ theme }: { theme: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider
      bg-emerald-950/50 in-[.light]:bg-emerald-50 border border-emerald-500/15 in-[.light]:border-emerald-300/50
      text-emerald-400/70 in-[.light]:text-emerald-700 hover:border-emerald-500/40 hover:text-emerald-300
      in-[.light]:hover:border-emerald-400 in-[.light]:hover:text-emerald-600 transition-colors duration-200">
      {theme}
    </span>
  );
}

function Panel({ children, className = "", accent = false }: {
  children: ReactNode; className?: string; accent?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border bg-zinc-950/60 in-[.light]:bg-white backdrop-blur-xl overflow-hidden ${
      accent ? 'border-emerald-500/20 in-[.light]:border-emerald-300/50' : 'border-white/6 in-[.light]:border-gray-200'
    } ${className}`}>
      {accent && (
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-emerald-500/60 to-transparent" />
      )}
      {children}
    </div>
  );
}

// ── Session history trail ─────────────────────────────────────────────────────

function SessionTrail({ history }: { history: PuzzleResult[] }) {
  if (history.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-white/4 in-[.light]:border-gray-100">
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-600 in-[.light]:text-gray-500">
        Historial de sesión
      </p>
      <div className="flex flex-wrap gap-1">
        {history.map((r, i) => (
          <div
            key={i}
            title={r === 'solved' ? 'Resuelto' : 'Fallido'}
            className={`w-4 h-4 rounded-sm transition-all duration-300 ${
              r === 'solved'
                ? 'bg-emerald-500/70 shadow-[0_0_4px_rgba(16,185,129,0.4)]'
                : 'bg-red-500/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Left panel ────────────────────────────────────────────────────────────────

function LeftPanel({
  loading, error, feedback, objective, onNext,
  hasFailed, gaveUp, onGiveUp, totalSteps, currentSolved,
}: {
  loading: boolean;
  error: string | null;
  feedback: { text: string; color: string };
  objective: string;
  onNext: () => void;
  hasFailed: boolean;
  gaveUp: boolean;
  onGiveUp: () => void;
  totalSteps: number;
  currentSolved: boolean;
}) {
  const accentColor =
    feedback.color === 'text-emerald-400' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
    : feedback.color === 'text-red-500'   ? 'bg-red-400'
    : feedback.color === 'text-sky-400'   ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
    : 'bg-zinc-700 in-[.light]:bg-gray-300';

  return (
    <div className="flex flex-col gap-4">
      {/* Objetivo */}
      <Panel accent>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/70 in-[.light]:text-emerald-700">
              Objetivo
            </p>
            {totalSteps > 1 && !loading && (
              <span className="text-[9px] font-black text-zinc-600 in-[.light]:text-gray-400 uppercase tracking-widest">
                {totalSteps} jugadas
              </span>
            )}
          </div>
          <div className="rounded-xl bg-linear-to-br from-emerald-500/15 to-emerald-900/20 in-[.light]:from-emerald-50 in-[.light]:to-emerald-100/80
            border border-emerald-500/20 in-[.light]:border-emerald-300/60 px-4 py-5 flex items-center justify-center min-h-[72px]">
            {loading ? (
              <div className="flex gap-1.5">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            ) : (
              <p className="text-center font-black text-sm uppercase tracking-widest text-emerald-300 in-[.light]:text-emerald-700 leading-tight">
                {objective}
              </p>
            )}
          </div>
        </div>
      </Panel>

      {/* Estado */}
      <Panel>
        <div className="p-5 flex flex-col items-center gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 in-[.light]:text-gray-500">Estado</p>
          <div className="relative w-full flex items-center justify-center py-3">
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full transition-all duration-500 ${accentColor}`} />
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
                feedback.color === 'text-white' ? 'in-[.light]:text-gray-900' : ''
              } ${feedback.color}`}>
                {feedback.text}
              </h2>
            )}
          </div>
        </div>
      </Panel>

      {/* Botón rendirse — aparece tras el primer error */}
      {hasFailed && !gaveUp && !loading && (
        <button
          onClick={onGiveUp}
          className="w-full py-2.5 rounded-2xl border border-red-500/30 in-[.light]:border-red-300
            text-red-400/80 in-[.light]:text-red-600 font-black text-[9px] tracking-[0.25em] uppercase
            hover:bg-red-950/30 hover:border-red-500/60 hover:text-red-400
            in-[.light]:hover:bg-red-50 in-[.light]:hover:border-red-400
            transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          Rendirse · Ver solución
        </button>
      )}

      {/* Siguiente puzzle — only after solving */}
      {currentSolved && (
        <button
          onClick={onNext}
          disabled={loading}
          className="group relative w-full py-4 rounded-2xl overflow-hidden
            border border-emerald-500/40 bg-emerald-950/30 in-[.light]:bg-emerald-50 in-[.light]:border-emerald-300
            text-emerald-400 in-[.light]:text-emerald-700 font-black text-[10px] tracking-[0.3em] uppercase
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
      )}
    </div>
  );
}

// ── Right panel ───────────────────────────────────────────────────────────────

function RightPanel({
  solvedCount, failedCount, puzzle, sessionHistory,
}: {
  solvedCount: number;
  failedCount: number;
  puzzle: ApiPuzzle | null;
  sessionHistory: PuzzleResult[];
}) {
  const themes = puzzle?.themes?.filter(Boolean) ?? [];
  const ratingLevel = !puzzle ? null
    : puzzle.rating < 1200 ? { label: "Principiante", color: "text-sky-400" }
    : puzzle.rating < 1600 ? { label: "Intermedio",   color: "text-emerald-400" }
    : puzzle.rating < 2000 ? { label: "Avanzado",     color: "text-amber-400" }
    :                        { label: "Experto",       color: "text-red-400" };

  const total    = solvedCount + failedCount;
  const accuracy = total > 0 ? `${Math.round((solvedCount / total) * 100)}%` : "—";

  return (
    <div className="flex flex-col gap-4">
      <Panel accent>
        <div className="p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/70 in-[.light]:text-emerald-700 mb-4">
            Sesión actual
          </p>
          <div className="flex justify-around items-center py-2">
            <Stat value={solvedCount} label="Resueltos" accent />
            <div className="w-px h-10 bg-white/5 in-[.light]:bg-gray-200" />
            <Stat value={accuracy} label="Aciertos" />
            <div className="w-px h-10 bg-white/5 in-[.light]:bg-gray-200" />
            <Stat value={failedCount} label="Fallidos" />
          </div>
          {total > 0 && (
            <div className="mt-4 pt-4 border-t border-white/4 in-[.light]:border-gray-100">
              {/* W/L bar */}
              <div className="h-1.5 w-full bg-zinc-900 in-[.light]:bg-gray-200 rounded-full overflow-hidden flex mb-3">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full"
                  style={{ width: `${(solvedCount / total) * 100}%` }}
                />
                <div
                  className="h-full bg-red-500/60 transition-all duration-700 rounded-r-full"
                  style={{ width: `${(failedCount / total) * 100}%` }}
                />
              </div>
              <SessionTrail history={sessionHistory} />
            </div>
          )}
        </div>
      </Panel>

      {puzzle && (
        <Panel>
          <div className="p-5 flex flex-col gap-4">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 in-[.light]:text-gray-500">
              Puzzle actual
            </p>
            <div className="rounded-xl bg-black/30 in-[.light]:bg-gray-50 border border-white/4 in-[.light]:border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white in-[.light]:text-gray-900 tabular-nums leading-none">
                  {puzzle.rating}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500 in-[.light]:text-gray-500 font-black mt-1">
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
                        puzzle.rating >= threshold ? ratingLevel.color.replace('text-', 'bg-') : 'bg-zinc-800 in-[.light]:bg-gray-200'
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
              <p className="text-zinc-600 in-[.light]:text-gray-400 text-[10px] italic">Sin temas asignados</p>
            )}

            <Divider label="Info" />

            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 in-[.light]:text-gray-500 font-black">ID Lichess</span>
              <a
                href={`https://lichess.org/training/${puzzle.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black text-zinc-400 in-[.light]:text-gray-600 hover:text-emerald-400 in-[.light]:hover:text-emerald-600 transition-colors flex items-center gap-1 group"
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PuzzlesPremiumPage() {
  useEffect(() => { document.title = "WELIKECHESS | Puzzles"; }, []);

  const [puzzle, setPuzzle]             = useState<ApiPuzzle | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [solvedCount, setSolvedCount]   = useState(0);
  const [failedCount, setFailedCount]   = useState(0);
  const [feedback, setFeedback]         = useState({ text: "TU TURNO", color: "text-white" });
  const [wrongMoveCount, setWrongMoveCount] = useState(0);
  const [gaveUp, setGaveUp]             = useState(false);
  const [currentSolved, setCurrentSolved] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<PuzzleResult[]>([]);

  const currentPuzzleRef   = useRef<ApiPuzzle | null>(null);
  const puzzleSolvedRef    = useRef(false);
  const wrongMoveCountRef  = useRef(0);
  const gaveUpRef          = useRef(false);
  const initialLoadDone    = useRef(false);

  useEffect(() => { currentPuzzleRef.current = puzzle; }, [puzzle]);

  // ── Load puzzle ─────────────────────────────────────────────────────────────
  const loadPuzzle = useCallback(async (specificId?: string) => {
    // Commit result of the previous puzzle to session history
    if (currentPuzzleRef.current) {
      if (puzzleSolvedRef.current) {
        setSessionHistory(h => [...h, 'solved']);
      } else if (wrongMoveCountRef.current > 0 && !gaveUpRef.current) {
        // Skipped after failing without giving up explicitly → record failure now
        submitPuzzleAttempt(currentPuzzleRef.current.id, false);
        setFailedCount(c => c + 1);
        setSessionHistory(h => [...h, 'failed']);
      } else if (gaveUpRef.current) {
        // Already submitted + recorded in handleGiveUp; just add to history
        setSessionHistory(h => [...h, 'failed']);
      }
    }

    // Reset per-puzzle state
    puzzleSolvedRef.current   = false;
    wrongMoveCountRef.current = 0;
    gaveUpRef.current         = false;
    setWrongMoveCount(0);
    setGaveUp(false);
    setCurrentSolved(false);
    setLoading(true);
    setError(null);
    setFeedback({ text: "TU TURNO", color: "text-white" });

    try {
      const data = specificId ? await fetchPuzzleById(specificId) : await fetchRandomPuzzle();
      setPuzzle(data);
    } catch (err: any) {
      setError(err.message ?? "Error al cargar el puzzle");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load (respects ?id= param + sessionStorage preload)
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
      const stored = sessionStorage.getItem('puzzle_preload');
      sessionStorage.removeItem('puzzle_preload');
      if (stored) {
        try {
          const parsed: ApiPuzzle = JSON.parse(stored);
          if (parsed.id === id) { setPuzzle(parsed); setLoading(false); return; }
        } catch { /* fall through */ }
      }
    }

    loadPuzzle(id ?? undefined);
  }, [loadPuzzle]);

  // ── Callbacks ───────────────────────────────────────────────────────────────
  const handleFeedback = useCallback((text: string, color: string) => {
    const tailwindColor =
      color === "#2ecc71" ? "text-emerald-400"
      : color === "#ffffff" ? "text-white"
      : "text-red-500";
    setFeedback({ text, color: tailwindColor });
  }, []);

  const handleSuccess = useCallback(() => {
    setSolvedCount(c => c + 1);
    puzzleSolvedRef.current = true;
    setCurrentSolved(true);
    if (currentPuzzleRef.current) {
      submitPuzzleAttempt(currentPuzzleRef.current.id, true);
    }
  }, []);

  const handleWrongMove = useCallback(() => {
    wrongMoveCountRef.current += 1;
    setWrongMoveCount(c => c + 1);
  }, []);

  const handleGiveUp = useCallback(() => {
    if (!currentPuzzleRef.current || puzzleSolvedRef.current || gaveUpRef.current) return;
    gaveUpRef.current = true;
    setGaveUp(true);
    setFeedback({ text: "SOLUCIÓN", color: "text-sky-400" });
    submitPuzzleAttempt(currentPuzzleRef.current.id, false);
    setFailedCount(c => c + 1);
  }, []);

  const handleGiveUpDone = useCallback(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  const totalSteps = puzzle ? Math.ceil(puzzle.solution.length / 2) : 0;
  const rawTheme   = puzzle?.themes?.filter(Boolean)[0];
  const objective  = rawTheme
    ? rawTheme.replace(/([A-Z])/g, ' $1').replace(/(\d+)/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())
    : "Encuentra la jugada";

  return (
    <main className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] bg-[#020202] in-[.light]:bg-[#f3fff8] text-zinc-400 pt-2 px-4 pb-4 xl:pt-4 xl:px-10 xl:pb-10 font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#050508] in-[.light]:bg-[#f3fff8]" />
        <div className="absolute inset-0 opacity-[0.15] in-[.light]:opacity-[0.14] mix-blend-overlay in-[.light]:mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] bg-emerald-600/45 in-[.light]:bg-emerald-200/60 blur-[200px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-30%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] bg-emerald-500/30 in-[.light]:bg-green-100/80 blur-[200px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="absolute inset-0 opacity-[0.18] in-[.light]:opacity-[0.22] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] in-[.light]:bg-[radial-gradient(rgba(5,150,105,0.42)_1.5px,transparent_1.5px)] bg-size-[32px_32px]" />
      </div>

      <div className="relative z-10 max-w-425 mx-auto grid grid-cols-12 gap-6 xl:gap-8 items-start">
        <div className="col-span-12 xl:col-span-3">
          <LeftPanel
            loading={loading}
            error={error}
            feedback={feedback}
            objective={objective}
            onNext={() => loadPuzzle()}
            hasFailed={wrongMoveCount > 0 && !currentSolved}
            gaveUp={gaveUp}
            onGiveUp={handleGiveUp}
            totalSteps={totalSteps}
            currentSolved={currentSolved}
          />
        </div>

        <div className="col-span-12 xl:col-span-6 flex justify-center">
          {loading && (
            <div className="w-[min(95vw,780px)] h-[min(95vw,780px)] rounded-2xl bg-zinc-900/40 in-[.light]:bg-gray-100
              border border-white/6 in-[.light]:border-gray-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce"
                      style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 in-[.light]:text-gray-400 font-black">
                  Cargando puzzle...
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="w-[min(95vw,780px)] h-[min(95vw,780px)] rounded-2xl bg-zinc-900/40 in-[.light]:bg-gray-100
              border border-red-500/10 in-[.light]:border-red-200 flex flex-col items-center justify-center gap-5">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-400 font-black text-sm">{error}</p>
              <button
                onClick={() => loadPuzzle()}
                className="py-2.5 px-6 rounded-xl border border-emerald-500/30 in-[.light]:border-emerald-400 text-emerald-400 in-[.light]:text-emerald-700
                  font-black text-[10px] uppercase tracking-widest hover:bg-emerald-950/50 in-[.light]:hover:bg-emerald-50 transition-colors"
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
              onWrongMove={handleWrongMove}
              giveUp={gaveUp}
              onGiveUpDone={handleGiveUpDone}
            />
          )}
        </div>

        <div className="col-span-12 xl:col-span-3">
          <RightPanel
            solvedCount={solvedCount}
            failedCount={failedCount}
            puzzle={!loading ? puzzle : null}
            sessionHistory={sessionHistory}
          />
        </div>
      </div>

      <AchievementToast />
    </main>
  );
}
