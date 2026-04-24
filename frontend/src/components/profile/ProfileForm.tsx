"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Activity, Globe, Zap, Timer, Target, Trophy, Skull, Handshake, TrendingUp, TrendingDown, Minus, Swords } from 'lucide-react';

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

const resultLabel = (game: any, userId: string) => {
  if (!game.result || game.result === "*") return { text: "En curso", color: "text-zinc-400", icon: <Minus size={12}/> };
  const iWhite = game.white_player?.id === userId;
  if (game.result === "1/2-1/2") return { text: "Tablas", color: "text-amber-400", icon: <Minus size={12}/> };
  if ((game.result === "1-0" && iWhite) || (game.result === "0-1" && !iWhite))
    return { text: "Victoria", color: "text-emerald-400", icon: <TrendingUp size={12}/> };
  return { text: "Derrota", color: "text-red-400", icon: <TrendingDown size={12}/> };
};

const eloChange = (game: any, userId: string) => {
  const iWhite = game.white_player?.id === userId;
  const change = iWhite ? game.white_elo_change : game.black_elo_change;
  if (!change) return null;
  const sign = change > 0 ? "+" : "";
  const color = change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-zinc-500";
  return <span className={`font-black text-[10px] ${color}`}>{sign}{change}</span>;
};

const modeIcon: Record<string, React.ReactNode> = {
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
    <div className="group relative bg-black/50 border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition-all duration-500 overflow-hidden">
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
        <div className="mt-4 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 bg-current ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[7px] text-zinc-700">800</span>
          <span className="text-[7px] text-zinc-700">3000</span>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color, icon }: any) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
      <div className="flex items-center gap-3">
        <span className={color}>{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
      <span className={`font-black text-lg tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function GameRow({ game, userId }: { game: any; userId: string }) {
  const res = resultLabel(game, userId);
  const iWhite = game.white_player?.id === userId;
  const opponent = iWhite ? game.black_player : game.white_player;
  const myColor = iWhite ? "♔" : "♚";
  const mode = game.mode || "rapid";

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 rounded-2xl border border-white/5 hover:border-white/10 bg-black/30 hover:bg-black/50 transition-all group">
      <span className={`text-base ${modeColor[mode] || 'text-zinc-400'}`}>{modeIcon[mode]}</span>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-zinc-600">{myColor}</span>
          <span className="text-white font-black text-[11px] uppercase tracking-wider">{opponent?.username || "—"}</span>
        </div>
        <span className="text-[8px] text-zinc-600 uppercase tracking-widest">{formatDate(game.finished_at || game.created_at)}</span>
      </div>
      <div className="text-center hidden sm:block">
        <span className="text-[8px] text-zinc-600 uppercase tracking-widest font-black">{game.termination_reason?.replace("_", " ") || "—"}</span>
      </div>
      <div className={`flex items-center gap-1 ${res.color} font-black text-[10px] uppercase tracking-wider`}>
        {res.icon}<span>{res.text}</span>
      </div>
      <div className="text-right w-10">{eloChange(game, userId)}</div>
    </div>
  );
}

export default function ProfileForm() {
  const [user, setUser] = useState<any>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [presence, setPresence] = useState('online');
  const [activeTab, setActiveTab] = useState<'overview' | 'games'>('overview');

  const fetchUserData = async () => {
    const token = localStorage.getItem("access");
    if (!token) { window.location.assign("/auth"); return; }
    const settings = JSON.parse(localStorage.getItem("user_settings") || "{}");
    setPresence(settings.status || 'online');
    try {
      const [userRes, gamesRes] = await Promise.all([
        fetch('http://localhost:8000/api/users/me/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8000/api/games/?limit=20', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (userRes.ok) {
        const dbData = await userRes.json();
        localStorage.setItem("user", JSON.stringify(dbData));
        setUser({ ...dbData, name: (dbData.username || "MAESTRO").toUpperCase() });
      }
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setRecentGames(Array.isArray(gamesData) ? gamesData : (gamesData.results || []));
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
    <div className="flex h-screen items-center justify-center bg-black text-yellow-400 animate-pulse uppercase tracking-[0.5em] font-black text-xs">
      Cargando perfil...
    </div>
  );
  if (!user) return null;

  const userId = user.id;
  const wins = user.wins || 0;
  const losses = user.losses || 0;
  const draws = user.draws || 0;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const drawRate = total > 0 ? Math.round((draws / total) * 100) : 0;

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
  recentGames.forEach(g => {
    if (g.status !== "completed" || !g.result || !g.mode) return;
    const m = g.mode as keyof typeof modeStats;
    if (!modeStats[m]) return;
    const iWhite = g.white_player?.id === userId;
    if (g.result === "1/2-1/2") modeStats[m].d++;
    else if ((g.result === "1-0" && iWhite) || (g.result === "0-1" && !iWhite)) modeStats[m].w++;
    else modeStats[m].l++;
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] gap-6 w-full max-w-[1800px] mx-auto p-4 relative overflow-hidden">

      {/* ── PANEL IZQUIERDO ── */}
      <div className="flex flex-col w-full lg:w-72 xl:w-80 gap-4 shrink-0 h-full">
        <div className="chess-panel-gold !p-7 relative flex flex-col items-center">

          {/* Estado online */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.color} animate-pulse`} />
            <span className="text-[7px] text-white/60 font-black uppercase tracking-widest">{statusStyle.text}</span>
          </div>

          {/* Avatar */}
          <div className="relative w-24 h-24 mb-4">
            <img src={user.avatar} className="w-full h-full rounded-[28px] border-2 border-yellow-400/40 object-cover shadow-[0_0_30px_rgba(212,175,55,0.15)]" alt="Avatar" />
            <button onClick={() => window.dispatchEvent(new Event('open-avatar'))} className="absolute -bottom-2 -right-2 bg-yellow-400 text-black p-2 rounded-xl hover:scale-110 transition-all shadow-xl cursor-pointer">
              <Camera size={14} strokeWidth={3} />
            </button>
          </div>

          {/* Nombre */}
          <h3 className="text-white font-black text-base tracking-[0.15em] uppercase truncate mb-3 text-center">{user.name}</h3>

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
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <p className="text-yellow-400 text-[7px] font-black uppercase tracking-wider mb-1">Partidas</p>
              <p className="text-white font-black text-lg">{total}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <p className="text-yellow-400 text-[7px] font-black uppercase tracking-wider mb-1">Efectividad</p>
              <p className="text-white font-black text-lg">{winRate}%</p>
            </div>
          </div>
        </div>

        {/* Rendimiento global */}
        <div className="bg-black/60 border border-white/5 rounded-[2rem] p-5">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">Rendimiento Global</p>
          <div className="space-y-3">
            <StatPill label="Victorias" value={wins}   color="text-emerald-400" icon={<Trophy size={14}/>} />
            <StatPill label="Tablas"    value={draws}  color="text-amber-400"   icon={<Handshake size={14}/>} />
            <StatPill label="Derrotas"  value={losses} color="text-red-400"     icon={<Skull size={14}/>} />
          </div>
          <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${winRate}%` }} />
            <div className="bg-amber-500 h-full transition-all duration-1000"   style={{ width: `${drawRate}%` }} />
            <div className="bg-red-500/60 h-full flex-1" />
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div className="flex-grow flex flex-col gap-4 min-w-0 h-full overflow-hidden">
        <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-2xl p-1 w-fit">
          {(['overview', 'games'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-yellow-400 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {tab === 'overview' ? 'Estadísticas' : 'Historial'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
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
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-3 px-1">Rendimiento por Modalidad</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['bullet', 'blitz', 'rapid'] as const).map(mode => {
                  const s = modeStats[mode];
                  const t = s.w + s.l + s.d;
                  const wr = t > 0 ? Math.round((s.w / t) * 100) : 0;
                  return (
                    <div key={mode} className="bg-black/50 border border-white/5 rounded-[1.5rem] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={modeColor[mode]}>{modeIcon[mode]}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{mode}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center mb-2">
                        <div><p className="text-emerald-400 font-black text-base">{s.w}</p><p className="text-[6px] text-zinc-700">V</p></div>
                        <div><p className="text-amber-400 font-black text-base">{s.d}</p><p className="text-[6px] text-zinc-700">T</p></div>
                        <div><p className="text-red-400 font-black text-base">{s.l}</p><p className="text-[6px] text-zinc-700">D</p></div>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${wr}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-black/50 border border-white/5 rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2 mb-1"><Swords size={14} className="text-yellow-400"/><span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Total Partidas</span></div>
                <p className="text-3xl font-black text-white">{total}</p>
              </div>
              <div className="bg-black/50 border border-white/5 rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2 mb-1"><Activity size={14} className="text-emerald-400"/><span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Win Rate</span></div>
                <p className="text-3xl font-black text-white">{winRate}%</p>
              </div>
              <div className="bg-black/50 border border-white/5 rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2 mb-1"><Globe size={14} className="text-blue-400"/><span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Ranking</span></div>
                <p className="text-3xl font-black text-white">#{user.rank || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
            {recentGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                <Swords size={32} className="mb-3 opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sin partidas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentGames.map((game, i) => <GameRow key={game.id || i} game={game} userId={userId} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}