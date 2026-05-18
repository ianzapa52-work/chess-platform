"use client";

import { ReactNode, useState, useEffect } from 'react';
import { Camera, Activity, Globe, Zap, Timer, Target, Trophy, Skull, Handshake, TrendingUp, TrendingDown, Minus, Swords, Flame, BarChart3, CalendarDays } from 'lucide-react';

// ── Títulos por ELO ─────────────────────────────────────────────────────────
export interface ChessTitle {
  label: string;
  short: string;
  tier: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

export const getTitleByElo = (elo: number): ChessTitle => {
  if (elo >= 2500) return { label: "Gran Maestro",          short: "GM",  tier: "Nivel Máximo",    color: "text-yellow-400",  borderColor: "border-yellow-400/40",  bgColor: "bg-yellow-400/10" };
  if (elo >= 2400) return { label: "Maestro Internacional", short: "IM",  tier: "Internacional",   color: "text-orange-400",  borderColor: "border-orange-400/40",  bgColor: "bg-orange-400/10" };
  if (elo >= 2300) return { label: "Maestro FIDE",          short: "FM",  tier: "Avanzado",        color: "text-amber-400",   borderColor: "border-amber-400/40",   bgColor: "bg-amber-400/10"  };
  if (elo >= 2000) return { label: "Experto",               short: "EXP", tier: "Nacional",        color: "text-blue-400",    borderColor: "border-blue-400/40",    bgColor: "bg-blue-400/10"   };
  return                   { label: "Aficionado",           short: "AFI", tier: "Iniciación",      color: "text-zinc-400",    borderColor: "border-zinc-400/40",    bgColor: "bg-zinc-400/10"   };
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase();

const resultLabel = (game: any, user: any) => {
  const result = getResultType(game, user);
  if (result === "open") return { text: "En curso", color: "text-zinc-400", icon: <Minus size={12}/> };
  if (result === "draw") return { text: "Tablas", color: "text-amber-400", icon: <Minus size={12}/> };
  if (result === "win") return { text: "Victoria", color: "text-emerald-400", icon: <TrendingUp size={12}/> };
  return { text: "Derrota", color: "text-red-400", icon: <TrendingDown size={12}/> };
};

const eloChange = (game: any, user: any) => {
  const iWhite = game.white_player?.id === user.id || game.white_player === user.id || game.white_username === user.username;
  const change = iWhite ? game.white_elo_change : game.black_elo_change;
  if (!change) return null;
  const sign = change > 0 ? "+" : "";
  const color = change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-zinc-500";
  return <span className={`font-black text-[10px] ${color}`}>{sign}{change}</span>;
};

const modeIcon: Record<string, ReactNode> = {
  bullet: <Target size={16}/>,
  blitz:  <Zap size={16}/>,
  rapid:  <Timer size={16}/>,
};

const modeColor: Record<string, string> = {
  bullet: "text-red-400",
  blitz: "text-yellow-400",
  rapid: "text-emerald-400",
};

// ── Sub-componentes ──────────────────────────────────────────────────────────
function EloModeCard({ mode, elo }: { mode: string; elo: number }) {
  const title = getTitleByElo(elo);
  const color = modeColor[mode] || "text-zinc-400";
  const pct = Math.min(100, Math.max(0, ((elo - 800) / (3000 - 800)) * 100));

  return (
    <div className="group relative bg-black/50 [.light_&]:bg-zinc-50 border border-white/5 [.light_&]:border-zinc-200 rounded-[2rem] p-6 hover:border-white/10 [.light_&]:hover:border-zinc-300 transition-all duration-500 overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={color}>{modeIcon[mode]}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">{mode}</span>
          </div>
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${title.color} ${title.borderColor} ${title.bgColor}`}>
            {title.short}
          </span>
        </div>
        <p className={`text-3xl font-black tabular-nums tracking-tighter ${color}`}>{elo}</p>
        <p className="text-[8px] text-zinc-600 uppercase tracking-widest mt-0.5">{title.label}</p>
        <div className="mt-4 h-0.5 bg-white/5 [.light_&]:bg-zinc-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 bg-current ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[7px] text-zinc-700 [.light_&]:text-zinc-400">800</span>
          <span className="text-[7px] text-zinc-700 [.light_&]:text-zinc-400">3000</span>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color, icon }: any) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-black/40 [.light_&]:bg-zinc-100 border border-white/5 [.light_&]:border-zinc-200 rounded-2xl hover:border-white/10 [.light_&]:hover:border-zinc-300 transition-all">
      <div className="flex items-center gap-3">
        <span className={color}>{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
      <span className={`font-black text-lg tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function MetricCard({ label, value, detail, icon, color = "text-white [.light_&]:text-zinc-900" }: any) {
  return (
    <div className="bg-black/50 [.light_&]:bg-zinc-50 border border-white/5 [.light_&]:border-zinc-200 rounded-[1.5rem] p-5 min-h-[116px]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className={`text-3xl font-black tabular-nums tracking-tight ${color}`}>{value}</p>
      {detail && <p className="text-[9px] text-zinc-600 [.light_&]:text-zinc-500 font-bold uppercase tracking-wider mt-1">{detail}</p>}
    </div>
  );
}

function getResultType(game: any, user: any): 'win' | 'loss' | 'draw' | 'open' {
  const result = normalizeValue(game.result);
  const status = normalizeValue(game.status);
  const reason = normalizeValue(game.termination_reason);
  const isCompleted = status === "completed" || status.includes("finalizada") || status.includes("finished");

  if (["1/2-1/2", "1/2", "½-½", "0.5-0.5", "draw", "tablas"].includes(result)) return "draw";
  if (reason.includes("draw") || reason.includes("stalemate") || status.includes("draw") || status.includes("tablas")) return "draw";
  const iWhite = game.white_player?.id === user.id || game.white_player === user.id || game.white_username === user.username;
  if ((result === "1-0" && iWhite) || (result === "0-1" && !iWhite)) return "win";
  if (result === "1-0" || result === "0-1") return "loss";
  if (game.winner_username) return game.winner_username === user.username ? "win" : "loss";
  if (game.winner_username == null && isCompleted) return "draw";
  if (!result || result === "*") return "open";
  return "loss";
}

function isFinishedGame(game: any) {
  const result = normalizeValue(game.result);
  const status = normalizeValue(game.status);
  return status === "completed" || status.includes("finalizada") || status.includes("finished") || (!!result && result !== "*");
}

function getOpponentName(game: any, user: any) {
  if (game.white_username || game.black_username) {
    return game.white_username === user.username ? game.black_username : game.white_username;
  }
  const iWhite = game.white_player?.id === user.id || game.white_player === user.id;
  const opponent = iWhite ? game.black_player : game.white_player;
  return opponent?.username ?? "Oponente";
}

function getGameDate(game: any) {
  return game.created_at || game.ended_at || game.updated_at || "";
}

function FormStrip({ games, user }: { games: any[]; user: any }) {
  const sample = games.slice(0, 12);
  return (
    <div className="flex items-center gap-1.5">
      {sample.length > 0 ? sample.map((game) => {
        const result = getResultType(game, user);
        const cls = result === 'win'
          ? 'bg-emerald-500 text-black'
          : result === 'loss'
          ? 'bg-red-500 text-white'
          : result === 'draw'
          ? 'bg-amber-400 text-black'
          : 'bg-zinc-700 text-zinc-300';
        return (
          <div key={game.id} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${cls}`}>
            {result === 'win' ? 'V' : result === 'loss' ? 'D' : result === 'draw' ? 'T' : '-'}
          </div>
        );
      }) : (
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Sin partidas recientes</span>
      )}
    </div>
  );
}

function RecentGameRow({ game, user }: { game: any; user: any }) {
  const result = resultLabel(game, user);
  const opponent = getOpponentName(game, user);
  const change = eloChange(game, user);
  const date = getGameDate(game);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-black/35 [.light_&]:bg-zinc-100 border border-white/5 [.light_&]:border-zinc-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border border-white/5 [.light_&]:border-zinc-200 ${result.color}`}>
          {result.icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-white [.light_&]:text-zinc-900 uppercase tracking-wide truncate">
            vs {opponent}
          </p>
          <p className="text-[9px] text-zinc-600 [.light_&]:text-zinc-500 font-bold uppercase tracking-widest">
            {game.mode || "modo"} · {date ? formatDate(date) : "sin fecha"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-[10px] font-black uppercase tracking-wider ${result.color}`}>{result.text}</span>
        {change}
      </div>
    </div>
  );
}

export default function ProfileForm() {
  const [user, setUser] = useState<any>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [presence, setPresence] = useState('online');

  const fetchUserData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { window.location.assign("/auth"); return; }
    const settings = JSON.parse(localStorage.getItem("user_settings") || "{}");
    setPresence(settings.status || 'online');
    try {
      const [userRes, gamesRes] = await Promise.all([
        fetch('http://localhost:8000/api/users/me/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8000/api/games/my-games/', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (userRes.ok) {
        const dbData = await userRes.json();
        localStorage.setItem("user", JSON.stringify(dbData));
        setUser({ ...dbData, name: (dbData.username || "MAESTRO").toUpperCase() });
      }
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        const games = Array.isArray(gamesData) ? gamesData : (gamesData.results || []);
        setRecentGames(games);
      } else {
        const fallbackRes = await fetch('http://localhost:8000/api/games/?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setRecentGames(Array.isArray(fallbackData) ? fallbackData : (fallbackData.results || []));
        }
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    const onUpdate = () => fetchUserData();
    window.addEventListener('user-updated', onUpdate);
    return () => window.removeEventListener('user-updated', onUpdate);
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-black [.light_&]:bg-white text-yellow-400 animate-pulse uppercase tracking-[0.5em] font-black text-xs">
      Cargando perfil...
    </div>
  );
  if (!user) return null;

  const userId = user.id;
  const wins = user.wins || 0;
  const losses = user.losses || 0;
  const draws = user.draws || 0;
  const total = wins + losses + draws;

  const statusStyle = (() => {
    if (presence === 'online') return { color: 'bg-emerald-500 shadow-[0_0_10px_#10b981]', text: 'En Línea' };
    if (presence === 'away') return { color: 'bg-amber-500 shadow-[0_0_10px_#f59e0b]', text: 'Meditando' };
    return { color: 'bg-zinc-500', text: 'Incógnito' };
  })();

  const maxElo = Math.max(user.elo_bullet || 1200, user.elo_blitz || 1200, user.elo_rapid || 1200);
  const mainTitle = getTitleByElo(maxElo);

  const modeStats: Record<string, { w: number; l: number; d: number }> = {
    bullet: { w: 0, l: 0, d: 0 }, blitz: { w: 0, l: 0, d: 0 }, rapid: { w: 0, l: 0, d: 0 }
  };
  const completedGames = [...recentGames]
    .filter(isFinishedGame)
    .sort((a, b) => new Date(getGameDate(b)).getTime() - new Date(getGameDate(a)).getTime());
  const gamesWins = completedGames.filter(g => getResultType(g, user) === "win").length;
  const gamesDraws = completedGames.filter(g => getResultType(g, user) === "draw").length;
  const gamesLosses = completedGames.filter(g => getResultType(g, user) === "loss").length;
  const displayWins = completedGames.length > 0 ? gamesWins : wins;
  const displayDraws = completedGames.length > 0 ? gamesDraws : draws;
  const displayLosses = completedGames.length > 0 ? gamesLosses : losses;
  const displayTotal = completedGames.length > 0 ? completedGames.length : total;
  const displayWinRate = displayTotal > 0 ? Math.round((displayWins / displayTotal) * 100) : 0;
  const displayDrawRate = displayTotal > 0 ? Math.round((displayDraws / displayTotal) * 100) : 0;
  completedGames.forEach(g => {
    if (!g.result || !g.mode) return;
    const m = g.mode as keyof typeof modeStats;
    if (!modeStats[m]) return;
    const result = getResultType(g, user);
    if (result === "win") modeStats[m].w++;
    else if (result === "draw") modeStats[m].d++;
    else if (result === "loss") modeStats[m].l++;
  });
  const recentWins = gamesWins;
  const recentDraws = gamesDraws;
  const recentLosses = gamesLosses;
  const recentWinRate = completedGames.length > 0 ? Math.round((recentWins / completedGames.length) * 100) : 0;
  const recentEloDelta = completedGames.reduce((sum, g) => {
    const iWhite = g.white_player?.id === userId || g.white_player === userId || g.white_username === user.username;
    const change = iWhite ? g.white_elo_change : g.black_elo_change;
    return sum + (Number(change) || 0);
  }, 0);
  const currentStreak = (() => {
    if (completedGames.length === 0) return { type: "none", count: 0 };
    const first = getResultType(completedGames[0], user);
    if (first === "draw" || first === "open") return { type: first, count: 1 };
    let count = 0;
    for (const game of completedGames) {
      if (getResultType(game, user) !== first) break;
      count++;
    }
    return { type: first, count };
  })();
  const bestWinStreak = completedGames.reduce((acc, game) => {
    const current = getResultType(game, user) === "win" ? acc.current + 1 : 0;
    return { current, best: Math.max(acc.best, current) };
  }, { current: 0, best: 0 }).best;
  const modeEntries = (['bullet', 'blitz', 'rapid'] as const).map(mode => {
    const s = modeStats[mode];
    return { mode, total: s.w + s.l + s.d };
  });
  const favoriteMode = modeEntries.reduce((best, item) => item.total > best.total ? item : best, modeEntries[0]);
  const lastGameDate = completedGames[0] ? formatDate(getGameDate(completedGames[0])) : "—";
  const streakLabel = currentStreak.type === "win" ? "victorias" : currentStreak.type === "loss" ? "derrotas" : currentStreak.type === "draw" ? "tablas" : "sin racha";
  const eloDeltaLabel = `${recentEloDelta > 0 ? '+' : ''}${recentEloDelta}`;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-130px)] gap-6 w-full max-w-[1800px] mx-auto p-4 relative overflow-hidden">

      {/* ── PANEL IZQUIERDO ── */}
      <div className="flex flex-col w-full lg:w-72 xl:w-80 gap-4 shrink-0 h-full">
        <div className="chess-panel-gold !p-7 relative flex flex-col items-center">

          {/* Estado online */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 [.light_&]:bg-zinc-200/80 px-3 py-1 rounded-full border border-white/5 [.light_&]:border-zinc-300">
            <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.color} animate-pulse`} />
            <span className="text-[7px] text-white/60 [.light_&]:text-zinc-700 font-black uppercase tracking-widest">{statusStyle.text}</span>
          </div>

          {/* Avatar */}
          <div className="relative w-24 h-24 mb-4">
            <img src={user.avatar} className="w-full h-full rounded-[28px] border-2 border-yellow-400/40 object-cover shadow-[0_0_30px_rgba(212,175,55,0.15)]" alt="Avatar" />
            <button onClick={() => window.dispatchEvent(new Event('open-avatar'))} className="absolute -bottom-2 -right-2 bg-yellow-400 text-black p-2 rounded-xl hover:scale-110 transition-all shadow-xl cursor-pointer">
              <Camera size={14} strokeWidth={3} />
            </button>
          </div>

          {/* Nombre */}
          <h3 className="text-white [.light_&]:text-zinc-900 font-black text-base tracking-[0.15em] uppercase truncate mb-3 text-center">{user.name}</h3>

          {/* ── BLOQUE DE RANGO DESTACADO ── */}
          <div className={`w-full flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border mb-4 ${mainTitle.borderColor} ${mainTitle.bgColor}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black tracking-tight ${mainTitle.color}`}>{mainTitle.short}</span>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${mainTitle.color} opacity-60`}>·</span>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${mainTitle.color} opacity-60`}>{mainTitle.tier}</span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${mainTitle.color}`}>{mainTitle.label}</span>
          </div>

          {/* ELO máximo */}
          <div className="text-center mb-4">
            <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-0.5">Rating máximo</span>
            <span className="text-4xl font-black text-yellow-400 tabular-nums">{maxElo}</span>
          </div>

          {/* Partidas / Efectividad */}
          <div className="grid grid-cols-2 gap-2 w-full text-center">
            <div className="bg-white/5 [.light_&]:bg-zinc-200/60 rounded-2xl p-3 border border-white/5 [.light_&]:border-zinc-300">
              <p className="text-yellow-400 text-[7px] font-black uppercase tracking-wider mb-1">Partidas</p>
              <p className="text-white [.light_&]:text-zinc-900 font-black text-lg">{displayTotal}</p>
            </div>
            <div className="bg-white/5 [.light_&]:bg-zinc-200/60 rounded-2xl p-3 border border-white/5 [.light_&]:border-zinc-300">
              <p className="text-yellow-400 text-[7px] font-black uppercase tracking-wider mb-1">Efectividad</p>
              <p className="text-white [.light_&]:text-zinc-900 font-black text-lg">{displayWinRate}%</p>
            </div>
          </div>
        </div>

        {/* Rendimiento global */}
        <div className="bg-black/60 [.light_&]:bg-white border border-white/5 [.light_&]:border-zinc-200 rounded-[2rem] p-5">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">Rendimiento Global</p>
          <div className="space-y-3">
            <StatPill label="Victorias" value={displayWins}   color="text-emerald-400" icon={<Trophy size={14}/>} />
            <StatPill label="Tablas"    value={displayDraws}  color="text-amber-400"   icon={<Handshake size={14}/>} />
            <StatPill label="Derrotas"  value={displayLosses} color="text-red-400"     icon={<Skull size={14}/>} />
          </div>
          <div className="mt-4 h-2 bg-white/5 [.light_&]:bg-zinc-200 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${displayWinRate}%` }} />
            <div className="bg-amber-500 h-full transition-all duration-1000"   style={{ width: `${displayDrawRate}%` }} />
            <div className="bg-red-500/60 h-full flex-1" />
          </div>
          <div className="mt-5 pt-4 border-t border-white/5 [.light_&]:border-zinc-200">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-3">Resultados</p>
            <FormStrip games={completedGames} user={user} />
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div className="flex-grow flex flex-col gap-4 min-w-0 h-full overflow-hidden">
        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-6 pr-1">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-3 px-1">Rating por Modalidad</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['bullet', 'blitz', 'rapid'] as const).map(mode => (
                <EloModeCard key={mode} mode={mode} elo={user[`elo_${mode}`] || 1200} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-3 px-1">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Resumen reciente</p>
              <span className="text-[8px] text-zinc-600 [.light_&]:text-zinc-500 font-black uppercase tracking-widest">
                Basado en {completedGames.length} partidas cargadas
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <MetricCard label="Forma" value={`${recentWinRate}%`} detail={`${recentWins}V · ${recentDraws}T · ${recentLosses}D`} icon={<Activity size={15}/>} color="text-emerald-400" />
              <MetricCard label="Racha actual" value={currentStreak.count || "—"} detail={streakLabel} icon={<Flame size={15}/>} color={currentStreak.type === 'win' ? 'text-emerald-400' : currentStreak.type === 'loss' ? 'text-red-400' : 'text-amber-400'} />
              <MetricCard label="ELO reciente" value={eloDeltaLabel} detail="suma de partidas cargadas" icon={<TrendingUp size={15}/>} color={recentEloDelta >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              <MetricCard label="Última partida" value={lastGameDate} detail={favoriteMode.total > 0 ? `modo más jugado: ${favoriteMode.mode}` : "sin datos"} icon={<CalendarDays size={15}/>} color="text-blue-400" />
            </div>
            <div className="mt-3 bg-black/50 [.light_&]:bg-zinc-50 border border-white/5 [.light_&]:border-zinc-200 rounded-[1.5rem] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">Últimos resultados</p>
                <FormStrip games={completedGames} user={user} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-right">
                <div>
                  <p className="text-[8px] text-zinc-600 [.light_&]:text-zinc-500 font-black uppercase tracking-widest">Mejor racha V</p>
                  <p className="text-xl font-black text-emerald-400">{bestWinStreak}</p>
                </div>
                <div>
                  <p className="text-[8px] text-zinc-600 [.light_&]:text-zinc-500 font-black uppercase tracking-widest">Muestra</p>
                  <p className="text-xl font-black text-white [.light_&]:text-zinc-900">{completedGames.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-3 px-1">Rendimiento por Modalidad Reciente</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['bullet', 'blitz', 'rapid'] as const).map(mode => {
                const s = modeStats[mode];
                const t = s.w + s.l + s.d;
                const wr = t > 0 ? Math.round((s.w / t) * 100) : 0;
                return (
                  <div key={mode} className="bg-black/50 [.light_&]:bg-zinc-50 border border-white/5 [.light_&]:border-zinc-200 rounded-[1.5rem] p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={modeColor[mode]}>{modeIcon[mode]}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{mode}</span>
                      </div>
                      <span className="text-[8px] font-black text-zinc-600 [.light_&]:text-zinc-500">{t} partidas</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center mb-2">
                      <div><p className="text-emerald-400 font-black text-base">{s.w}</p><p className="text-[6px] text-zinc-700 [.light_&]:text-zinc-500">V</p></div>
                      <div><p className="text-amber-400 font-black text-base">{s.d}</p><p className="text-[6px] text-zinc-700 [.light_&]:text-zinc-500">T</p></div>
                      <div><p className="text-red-400 font-black text-base">{s.l}</p><p className="text-[6px] text-zinc-700 [.light_&]:text-zinc-500">D</p></div>
                    </div>
                    <div className="h-1 bg-white/5 [.light_&]:bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${wr}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard label="Total Partidas" value={displayTotal} detail={completedGames.length > 0 ? "historial cargado" : "estadística global"} icon={<Swords size={15}/>} color="text-yellow-400" />
            <MetricCard label="Win Rate Global" value={`${displayWinRate}%`} detail={`${displayWins}V · ${displayDraws}T · ${displayLosses}D`} icon={<BarChart3 size={15}/>} color="text-emerald-400" />
            <MetricCard label="Ranking" value={`#${user.rank || "—"}`} detail="según leaderboard" icon={<Globe size={15}/>} color="text-blue-400" />
          </div>

          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-3 px-1">Últimas partidas</p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {completedGames.slice(0, 6).length > 0 ? completedGames.slice(0, 6).map(game => (
                <RecentGameRow key={game.id} game={game} user={user} />
              )) : (
                <div className="col-span-full bg-black/50 [.light_&]:bg-zinc-50 border border-white/5 [.light_&]:border-zinc-200 rounded-[1.5rem] p-8 text-center text-[10px] uppercase tracking-widest text-zinc-600">
                  No hay partidas completadas para analizar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
