"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HomeFriendsSidebar from "@/components/ui/HomeFriendsSidebar";
import HomeRecentActivity from "@/components/ui/HomeRecentActivity";
import HomeRankingSidebar from "@/components/ui/HomeRankingSidebar";
import PingCounter from "@/components/ui/PingCounter";

const quotes = [
  { text: "El Ajedrez es algo más que un juego; es una diversión intelectual.", author: "J.R. Capablanca" },
  { text: "En el ajedrez, como en la vida, la mejor jugada es la que se realiza.", author: "S. Tarrasch" },
  { text: "El Ajedrez es la piedra de toque del intelecto.", author: "Goethe" },
  { text: "Ayudad a vuestras piezas, y ellas os ayudarán a vosotros.", author: "Paul Morphy" },
  { text: "El ajedrez es una tortura mental.", author: "Garry Kasparov" },
  { text: "Una mala jugada anula cuarenta buenas.", author: "Bernhard Horwitz" },
  { text: "El ajedrez, como el amor y la música, tiene el poder de hacer felices a los hombres.", author: "S. Tarrasch" }
];

interface UserStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  drawRate: number;
  elo_blitz: number;
  elo_bullet: number;
  elo_rapid: number;
  username: string;
  rank?: number;
}

export default function HomePage() {
  useEffect(() => {
    document.title = "WELIKECHESS | Home";
  }, []);

  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const quote = quotes[daysSinceEpoch % quotes.length];

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) { setStatsLoading(false); return; }
      try {
        const res = await fetch('http://localhost:8000/api/users/me/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const wins = data.wins || 0;
          const losses = data.losses || 0;
          const draws = data.draws || 0;
          const total = wins + losses + draws;
          setUserStats({
            total,
            wins,
            losses,
            draws,
            winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
            drawRate: total > 0 ? Math.round((draws / total) * 100) : 0,
            elo_blitz: data.elo_blitz || 1200,
            elo_bullet: data.elo_bullet || 1200,
            elo_rapid: data.elo_rapid || 1200,
            username: data.username || 'Maestro',
            rank: data.rank,
          });
        }
      } catch (e) {
        console.error("Error cargando stats:", e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const bestElo = userStats
    ? Math.max(userStats.elo_blitz, userStats.elo_bullet, userStats.elo_rapid)
    : null;

  return (
    <div className="flex flex-col bg-[#070707] [.light_&]:bg-[#f4f4f5] text-zinc-300 [.light_&]:text-zinc-800 font-sans h-[calc(100vh-80px)] md:h-[calc(100vh-96px)] overflow-hidden transition-colors duration-500">
      <div className="flex-grow grid grid-cols-12 overflow-hidden">

        {/* ── SIDEBAR IZQUIERDA ── */}
        <aside className="col-span-2 hidden xl:flex border-r border-[#d4af37]/10 bg-[#0a0a0a] [.light_&]:bg-white flex-col overflow-hidden">
          <HomeFriendsSidebar />
        </aside>

        {/* ── MAIN ── */}
        <main className="col-span-12 xl:col-span-8 flex flex-col overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#050505_100%)] [.light_&]:bg-[radial-gradient(circle_at_top,#ffffff_0%,#f4f4f5_100%)]">
          <section className="p-8 md:p-12 max-w-[1400px] mx-auto w-full pt-8 pb-16">

            <div className="mb-12 border-l-4 border-[#d4af37] pl-8 py-2 bg-gradient-to-r from-[#d4af37]/5 to-transparent rounded-r-xl">
              <p className="text-[11px] font-black uppercase text-[#d4af37]/70 tracking-[0.5em] mb-1">Nuestro Ajedrez</p>
              <h2 className="text-6xl font-light text-white [.light_&]:text-black italic tracking-tight leading-none font-['Cinzel']">
                ¿Cuál será<span className="text-[#d4af37] font-normal"> tu próximo movimiento?</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <GameCard href="/play-online" title="Jugar Online" subtitle="Arena Multiplayer" desc="Compite contra el mundo en tiempo real." stats="3,210 Jugadores activos" img="/pieces/w_queen.svg" online />
              <GameCard href="/play-ia" title="Desafiar IA" subtitle="Entrenamiento IA" desc="Stockfish v16 listo para ponerte a prueba." stats="Niveles 1-8 adaptativos" img="/pieces/w_king.svg" />
              <GameCard href="/play-local" title="Duelo Local" subtitle="En Persona" desc="Tablero virtual perfecto para jugar cara a cara." stats="Incluye reloj de torneo" img="/pieces/w_rook.svg" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <SectionBox title="Actividad Reciente">
                <HomeRecentActivity />
              </SectionBox>
              <SectionBox title="Desafío Táctico">
                <div className="flex gap-6 items-center flex-grow bg-[#d4af37]/5 [.light_&]:bg-[#d4af37]/10 rounded-2xl p-6 border border-[#d4af37]/10">
                  <div className="w-24 h-24 rounded-lg bg-black/40 [.light_&]:bg-white/50 border border-[#d4af37]/20 flex items-center justify-center text-5xl">🧩</div>
                  <div className="flex-grow">
                    <p className="text-[11px] text-[#d4af37]/70 font-black uppercase tracking-widest">Dificultad Media</p>
                    <h4 className="text-xl font-bold text-white [.light_&]:text-black uppercase tracking-tight mt-1 font-['Cinzel']">Ganan Blancas</h4>
                    <p className="text-xs text-zinc-400 [.light_&]:text-zinc-600 mt-1">Encuentra la secuencia de mate forzado.</p>
                  </div>
                  <Link href="/puzzles" className="px-6 py-3 bg-[#d4af37] text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white [.light_&]:hover:bg-black [.light_&]:hover:text-white transition-colors shadow-lg active:scale-95">
                    Resolver
                  </Link>
                </div>
              </SectionBox>
            </div>
          </section>
        </main>

        {/* ── SIDEBAR DERECHA ── */}
        <aside className="hidden xl:flex col-span-2 bg-[#0a0a0a] [.light_&]:bg-white border-l border-[#d4af37]/10 flex-col overflow-hidden relative">
          <div className="absolute left-0 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#d4af37]/20 to-transparent" />

          <div className="px-3 py-6 flex flex-col h-full overflow-y-auto custom-scrollbar gap-5 pb-4">

            {/* Ranking */}
            <div>
              <HomeRankingSidebar />
            </div>

            {/* Separador */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/15 to-transparent" />

            {/* Cita */}
            <div className="bg-gradient-to-br from-[#d4af37]/8 to-transparent rounded-2xl p-4 border border-[#d4af37]/10 relative overflow-hidden">
              <div className="absolute -top-3 -left-1 text-6xl text-[#d4af37]/8 font-serif leading-none select-none">"</div>
              <p className="text-[10px] font-black uppercase text-[#d4af37]/60 tracking-[0.3em] mb-2">Cita del maestro</p>
              <p className="text-[12px] italic text-zinc-300 [.light_&]:text-zinc-700 leading-relaxed font-serif relative z-10">"{quote.text}"</p>
              <p className="text-[9px] font-bold text-zinc-600 [.light_&]:text-zinc-400 uppercase tracking-widest mt-3">— {quote.author}</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/15 to-transparent" />

            {/* ── BLOQUE DE STATS REALES ── */}
            <div className="flex flex-col gap-3">
              {/* Header con username */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#d4af37] rounded-full" />
                  <p className="text-[10px] font-black uppercase text-zinc-400 [.light_&]:text-zinc-500 tracking-[0.25em]">
                    {userStats ? userStats.username : 'Tu Perfil'}
                  </p>
                </div>
                {!statsLoading && userStats?.rank && (
                  <span className="text-[9px] font-black text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/20 px-2 py-0.5 rounded-full tracking-widest">
                    #{userStats.rank}
                  </span>
                )}
              </div>

              {/* Grid principal de stats */}
              {statsLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : userStats ? (
                <>
                  {/* Partidas + Win Rate destacados */}
                  <div className="grid grid-cols-2 gap-2">
                    <BigStatCard
                      label="Partidas"
                      value={String(userStats.total)}
                      sub="jugadas"
                      color="#d4af37"
                    />
                    <BigStatCard
                      label="Win Rate"
                      value={`${userStats.winRate}%`}
                      sub="victorias"
                      color="#10b981"
                      accent
                    />
                  </div>

                  {/* Barra W/D/L visual */}
                  <WDLBar wins={userStats.wins} draws={userStats.draws} losses={userStats.losses} total={userStats.total} />

                  {/* Stats individuales V/T/D */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <MiniStat label="Victoria" value={userStats.wins} color="#10b981" />
                    <MiniStat label="Tablas"   value={userStats.draws} color="#f59e0b" />
                    <MiniStat label="Derrota"  value={userStats.losses} color="#ef4444" />
                  </div>

                  {/* ELO por modalidad */}
                  <div className="mt-1">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-2 px-1">Rating</p>
                    <div className="flex flex-col gap-1.5">
                      <EloRow mode="Bullet" elo={userStats.elo_bullet} color="#ef4444" icon="⚡" />
                      <EloRow mode="Blitz"  elo={userStats.elo_blitz}  color="#f59e0b" icon="⏱" />
                      <EloRow mode="Rapid"  elo={userStats.elo_rapid}  color="#10b981" icon="☕" />
                    </div>
                  </div>

                  {/* Link al perfil */}
                  <Link
                    href="/profile"
                    className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 hover:bg-[#d4af37]/10 hover:border-[#d4af37]/40 transition-all group"
                  >
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37]/70 group-hover:text-[#d4af37] transition-colors">
                      Ver perfil completo
                    </span>
                    <span className="text-[#d4af37]/40 group-hover:text-[#d4af37] transition-all group-hover:translate-x-0.5 text-xs">→</span>
                  </Link>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Sin sesión activa</p>
                  <Link href="/auth" className="text-[9px] text-[#d4af37]/60 hover:text-[#d4af37] transition-colors mt-1 block">
                    Iniciar sesión →
                  </Link>
                </div>
              )}
            </div>

            {/* Actividad comunidad */}
            <div className="flex flex-col gap-2">
              <ActivityBars />
              <p className="text-[9px] text-zinc-600 uppercase font-bold text-center tracking-widest">Actividad Comunidad</p>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/5 [.light_&]:border-black/5">
              <div className="px-1 flex items-center justify-between">
                <PingCounter />
                <LiveBadge />
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

// ── SUB-COMPONENTES ──────────────────────────────────────────────────────────

function BigStatCard({
  label, value, sub, color, accent = false
}: {
  label: string; value: string; sub: string; color: string; accent?: boolean;
}) {
  return (
    <div
      className="relative flex flex-col justify-between rounded-2xl p-3.5 border overflow-hidden"
      style={{
        background: `${color}08`,
        borderColor: `${color}20`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-12 h-12 rounded-full blur-2xl opacity-30"
        style={{ background: color }}
      />
      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">{label}</span>
      <div>
        <span
          className="text-2xl font-black font-['Cinzel'] leading-none block"
          style={{ color }}
        >
          {value}
        </span>
        <span className="text-[8px] text-zinc-600 uppercase tracking-wider">{sub}</span>
      </div>
    </div>
  );
}

function WDLBar({ wins, draws, losses, total }: { wins: number; draws: number; losses: number; total: number }) {
  if (total === 0) return null;
  const wPct = (wins / total) * 100;
  const dPct = (draws / total) * 100;
  const lPct = (losses / total) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-emerald-500 transition-all duration-1000 rounded-l-full"
          style={{ width: `${wPct}%` }}
        />
        <div
          className="h-full bg-amber-500 transition-all duration-1000"
          style={{ width: `${dPct}%` }}
        />
        <div
          className="h-full bg-red-500/70 transition-all duration-1000 flex-grow rounded-r-full"
          style={{ width: `${lPct}%` }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-[8px] text-emerald-500/70">{Math.round(wPct)}% V</span>
        <span className="text-[8px] text-amber-500/70">{Math.round(dPct)}% T</span>
        <span className="text-[8px] text-red-500/60">{Math.round(lPct)}% D</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-2.5 rounded-xl border"
      style={{ background: `${color}08`, borderColor: `${color}18` }}
    >
      <span className="text-base font-black font-['Cinzel']" style={{ color }}>{value}</span>
      <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-600">{label}</span>
    </div>
  );
}

function EloRow({ mode, elo, color, icon }: { mode: string; elo: number; color: string; icon: string }) {
  const pct = Math.min(100, Math.max(0, ((elo - 800) / (3200 - 800)) * 100));
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
      <span className="text-sm w-4 text-center">{icon}</span>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{mode}</span>
          <span className="text-[10px] font-black font-['Cinzel']" style={{ color }}>{elo}</span>
        </div>
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

function ActivityBars() {
  const heights = [35, 65, 45, 80, 55, 70, 40];
  return (
    <div className="h-16 w-full bg-black/30 [.light_&]:bg-white rounded-xl border border-white/5 [.light_&]:border-black/10 px-3 py-2 flex items-end gap-1">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-grow rounded-t-sm transition-all duration-700"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, #d4af37${Math.round(0.5 * 255).toString(16)}, #d4af37${Math.round(0.2 * 255).toString(16)})`,
          }}
        />
      ))}
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-green-500/5 px-2.5 py-1 rounded-full border border-green-500/20">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
      <span className="text-[9px] font-black text-green-500 uppercase">Live</span>
    </div>
  );
}

function GameCard({ href, title, subtitle, desc, stats, img, online = false }: any) {
  return (
    <Link
      href={href}
      className="group relative h-64 rounded-3xl border border-[#d4af37]/20 bg-black/40 [.light_&]:bg-white p-8 overflow-hidden flex flex-col justify-between hover:border-[#d4af37] hover:shadow-[0_0_50px_rgba(212,175,55,0.2)] hover:-translate-y-2 transition-all duration-500 shadow-xl"
    >
      <div className="absolute -top-10 -right-10 opacity-10 group-hover:opacity-30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
        <img src={img} className="w-48" alt="" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          {online && <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />}
          <span className="text-[#d4af37] text-xs font-black uppercase tracking-[0.4em]">{subtitle}</span>
        </div>
        <h3 className="text-3xl font-bold text-white [.light_&]:text-black uppercase tracking-tighter leading-tight group-hover:text-[#d4af37] transition-colors font-['Cinzel']">
          {title}
        </h3>
      </div>
      <div className="relative z-10 bg-black/50 [.light_&]:bg-zinc-100 backdrop-blur-sm p-4 rounded-xl border border-white/5 [.light_&]:border-black/5 mt-auto">
        <p className="text-sm text-zinc-300 [.light_&]:text-zinc-700">{desc}</p>
        <span className="text-[10px] text-zinc-500 [.light_&]:text-zinc-400 uppercase font-bold mt-2 block tracking-widest">{stats}</span>
      </div>
    </Link>
  );
}

function SectionBox({ title, children }: any) {
  return (
    <div className="bg-black/50 [.light_&]:bg-white border border-[#d4af37]/15 rounded-3xl p-8 relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-[#d4af37]/40 group">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5 [.light_&]:border-black/5">
          <h3 className="text-sm font-black uppercase text-[#d4af37] tracking-[0.3em] flex items-center gap-3">
            <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse" /> {title}
          </h3>
        </div>
        {children}
      </div>
    </div>
  );
}