"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Activity, Award, Search, Loader2, Zap, Timer, Coffee, Crown, TrendingUp, Flame, Star, Sparkles, Gem, Crown as CrownIcon } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  elo: number;
  wins: number;
  avatar: string;
  tier: string;
  online?: boolean;
}

type Mode = 'bullet' | 'blitz' | 'rapid';

const MEDAL_COLORS = ['#d4af37', '#a8a8a8', '#cd7f32'] as const;
const MEDAL_LABELS = ['ORO', 'PLATA', 'BRONCE'] as const;

interface TierInfo {
  label: string;
  icon: string;
  color: string;
  glow?: string;
}

function getTier(elo: number): TierInfo {
  if (elo >= 3200) return { label: 'Oráculo',      icon: '✦', color: '#ef4444', glow: 'rgba(239,68,68,0.4)'   };
  if (elo >= 2500) return { label: 'GM',           icon: '♛', color: '#fb923c', glow: 'rgba(251,146,60,0.4)'  };
  if (elo >= 2400) return { label: 'IM',           icon: '♜', color: '#d4af37', glow: 'rgba(212,175,55,0.4)'  };
  if (elo >= 2300) return { label: 'FM',           icon: '♝', color: '#d4af37', glow: 'rgba(212,175,55,0.3)'  };
  if (elo >= 2000) return { label: 'Experto',      icon: '♞', color: '#a855f7', glow: 'rgba(168,85,247,0.3)'  };
  if (elo >= 1800) return { label: 'Aficionado A', icon: '♟', color: '#6366f1', glow: 'rgba(99,102,241,0.3)'  };
  if (elo >= 1400) return { label: 'Aficionado B', icon: '◆', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)'  };
  return                  { label: 'Novato',       icon: '◇', color: '#10b981', glow: 'rgba(16,185,129,0.2)'  };
}

const ELO_MILESTONES = [
  { elo: 3200, label: 'Oráculo',      icon: '✦', color: '#ef4444' },
  { elo: 2500, label: 'GM',           icon: '♛', color: '#fb923c' },
  { elo: 2400, label: 'IM',           icon: '♜', color: '#d4af37' },
  { elo: 2300, label: 'FM',           icon: '♝', color: '#d4af37' },
  { elo: 2000, label: 'Experto',      icon: '♞', color: '#a855f7' },
  { elo: 1800, label: 'Aficionado A', icon: '♟', color: '#6366f1' },
  { elo: 1400, label: 'Aficionado B', icon: '◆', color: '#3b82f6' },
  { elo: 0,    label: 'Novato',       icon: '◇', color: '#10b981' },
];

export default function RankingForm() {
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('blitz');

  const fetchGlobalRanking = async (selectedMode: Mode) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/users/global_ranking/?type=${selectedMode}`);
      if (!response.ok) throw new Error('Error en servidor');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error cargando ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGlobalRanking(mode); }, [mode]);

  const filteredPlayers = useMemo(() =>
    players.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.elo - a.elo),
    [search, players]
  );

  const topThree = useMemo(() => players.slice(0, 3), [players]);
  const leader = topThree[0];

  // Estadísticas calculadas
  const averageElo = useMemo(() => {
    if (players.length === 0) return 0;
    return Math.round(players.reduce((sum, p) => sum + p.elo, 0) / players.length);
  }, [players]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-130px)] gap-6 w-full max-w-[1800px] mx-auto p-4 relative font-['Outfit'] text-[1.1rem]">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col w-80 gap-3 shrink-0 overflow-hidden">

        {/* Leader card */}
        <div
          className="relative rounded-[36px] overflow-hidden shrink-0"
          style={{
            background: 'linear-gradient(160deg, #161208 0%, #0d0d0d 55%, #090909 100%)',
            border: '1px solid rgba(212,175,55,0.15)',
          }}
        >
          <div className="absolute top-0 left-0 w-20 h-px" style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }} />
          <div className="absolute top-0 left-0 w-px h-20" style={{ background: 'linear-gradient(180deg, #d4af37, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-20 h-px" style={{ background: 'linear-gradient(270deg, #d4af37, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-px h-20" style={{ background: 'linear-gradient(0deg, #d4af37, transparent)' }} />

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />

          <div className="relative z-10 flex flex-col items-center px-6 pt-6 pb-6">
            <div className="flex items-center gap-3 mb-5 w-full justify-center">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25))' }} />
              <span className="text-sm text-gold/60 tracking-[0.5em] font-black uppercase shrink-0">Líder {mode}</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.25), transparent)' }} />
            </div>

            <div className="relative mb-5">
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center z-20"
                style={{ background: '#d4af37', boxShadow: '0 0 14px rgba(212,175,55,0.5)' }}
              >
                <Crown size={15} className="text-black" strokeWidth={2.5} />
              </div>

              <div className="absolute -inset-[2px] rounded-[30px]"
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #7a5c1e 45%, #d4af37 100%)' }} />
              <div className="relative rounded-[28px] overflow-hidden w-28 h-28">
                {leader ? (
                  <img src={`/avatars/${leader.avatar}`} className="w-full h-full object-cover" alt="Líder" />
                ) : (
                  <div className="w-full h-full bg-zinc-900/80 flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-700" size={22} />
                  </div>
                )}
              </div>

              {leader?.online && (
                <div className="absolute -bottom-1.5 -right-1.5 z-10">
                  <div className="w-6 h-6 rounded-full border-[2.5px] border-[#0d0d0d]"
                    style={{ background: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.55)' }} />
                </div>
              )}
            </div>

            <h3 className="text-white font-['Cinzel'] font-bold text-xl tracking-[0.12em] uppercase truncate w-full text-center leading-tight mb-1">
              {leader?.name ?? '· · ·'}
            </h3>
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={13} style={{ color: '#d4af37' }} />
              <span className="text-base font-black" style={{ color: '#d4af37' }}>
                {leader?.elo ?? '—'} ELO
              </span>
            </div>
            {leader && (() => {
              const t = getTier(leader.elo);
              return (
                <div className="flex items-center gap-1 mb-5">
                  <span className="text-lg" style={{ color: t.color }}>{t.icon}</span>
                  <span className="text-sm font-black tracking-[0.3em] uppercase" style={{ color: t.color }}>{t.label}</span>
                </div>
              );
            })()}

            <div className="w-full h-px mb-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.18), transparent)' }} />

            <div className="w-full grid grid-cols-2 gap-2">
              <LeaderStat label="Victorias" value={leader?.wins ?? '—'} icon={<Trophy size={14} />} />
              <LeaderStat label="Categoría" value={leader ? getTier(leader.elo).label : '—'} icon={<Award size={14} />} highlight />
            </div>
          </div>
        </div>

        {/* ── PANEL COMPLETO SIMPLIFICADO ── */}
        <div className="chess-panel border border-white/5 rounded-3xl flex-1 min-h-0 flex flex-col overflow-hidden bg-gradient-to-br from-black/10 via-transparent to-purple-900/5">

          {/* MODO ACTIVO - INTEGRADO */}
          <div className="p-6 border-b border-white/5 shrink-0 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-gold/60 rounded-full" />
              <span className="text-sm text-gold/80 font-bold tracking-[0.4em] uppercase">Modo activo</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-black/20 rounded-2xl border border-gold/20">
              <Activity size={20} className="text-gold/70 shrink-0" />
              <span className="text-xl font-black font-['Cinzel'] text-gold tracking-wider uppercase">
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </span>
            </div>

            {/* TOTAL DE JUGADORES - JUSTO DEBAJO DEL MODO */}
            <div className="flex flex-col items-center justify-center mt-6 mb-2 mx-6 space-y-1">
              <div className="text-center">
                <span className="text-gold/60 text-xs font-light tracking-widest uppercase">Total</span>
                <div className="text-3xl font-black bg-gradient-to-r from-gold via-gold/90 to-amber-400 bg-clip-text text-transparent drop-shadow-lg mt-0.5">
                  50
                </div>
                <span className="text-gold/50 text-xs font-light tracking-wide">jugadores</span>
              </div>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent rounded-full blur-sm mt-1" />
            </div>
          </div>

          {/* SEPARADOR DORADO */}
          <div className="w-full h-px my-6 mx-6 bg-gradient-to-r from-transparent via-gold/30 to-transparent relative self-start">
            <div className="absolute inset-0 h-px bg-gradient-to-r from-gold/50 via-gold/20 to-gold/50 rounded-full blur-sm opacity-70" />
          </div>

          {/* LÍNEA DORADA DECORATIVA - FIJA AL FINAL */}
          <div className="absolute inset-x-0 bottom-6 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent rounded-full relative overflow-hidden mx-auto"
              style={{ 
                boxShadow: '0 0 20px rgba(212,175,55,0.25)',
                filter: 'blur(0.3px)'
              }}>
              <div className="absolute inset-0 bg-gradient-to-r from-gold/70 via-gold/30 to-gold/70 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
          </div>

        </div>

      </div>

      {/* ── CENTER PANEL ── */}
      <div className="flex-grow flex flex-col bg-white/[0.02] border border-white/8 rounded-[48px] overflow-hidden backdrop-blur-xl shadow-2xl relative">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/5 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <h2 className="text-4xl font-black font-['Cinzel'] text-white tracking-[0.25em] leading-tight">TABLERO</h2>
              <p className="text-sm text-zinc-600 tracking-[0.5em] uppercase font-bold mt-0.5">Clasificación global</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="Buscar jugador..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-black/40 border border-white/8 rounded-2xl pl-12 pr-6 py-4 text-white tracking-[0.25em] outline-none focus:border-gold/40 w-full transition-all text-base uppercase font-bold"
              />
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/5 self-start mt-5 w-fit">
            <ModeTab active={mode === 'bullet'} onClick={() => setMode('bullet')} label="Bullet" icon={<Zap size={15} />} />
            <ModeTab active={mode === 'blitz'} onClick={() => setMode('blitz')} label="Blitz" icon={<Timer size={15} />} />
            <ModeTab active={mode === 'rapid'} onClick={() => setMode('rapid')} label="Rapid" icon={<Coffee size={15} />} />
          </div>
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto custom-scrollbar px-4 md:px-8 py-4 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="text-gold animate-spin" size={40} />
                <span className="text-sm text-zinc-500 tracking-widest uppercase">Sincronizando...</span>
              </div>
            </div>
          )}
          {filteredPlayers.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-700 py-20">
              <Trophy size={44} strokeWidth={1} />
              <p className="text-sm tracking-widest uppercase">Sin resultados</p>
            </div>
          )}
          {filteredPlayers.map((player, index) => (
            <PlayerRow key={player.id} player={player} rank={index + 1} />
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="hidden xl:flex flex-col w-96 gap-5 shrink-0 overflow-hidden">

        {/* Podium */}
        <div
          className="relative rounded-[36px] overflow-hidden shrink-0"
          style={{
            background: 'linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }} />
          <div className="px-6 pt-6 pb-6">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-sm text-zinc-500 tracking-[0.5em] font-black uppercase">Círculo Élite</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-7">
              {topThree.map((p, i) => (
                <PodiumRow key={p.id} player={p} position={i + 1} color={MEDAL_COLORS[i]} medal={MEDAL_LABELS[i]} />
              ))}
              {topThree.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-zinc-700" size={22} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ELO Milestones */}
        <div className="chess-panel flex-grow overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-5 shrink-0">
            <TrendingUp size={14} className="text-gold/60" />
            <span className="text-sm text-zinc-600 font-bold tracking-[0.4em] uppercase">Hitos ELO</span>
          </div>
          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-grow pr-1">
            {ELO_MILESTONES.map(({ elo, label, icon, color }) => {
              const playersAbove = elo === 0
                ? players.filter(p => p.elo < 1400).length
                : players.filter(p => p.elo >= elo).length;
              const displayElo = elo === 0 ? '< 1400' : elo.toString();
              return (
                <div key={elo} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group cursor-default">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                    {icon}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-zinc-400 font-bold tracking-widest uppercase truncate group-hover:text-white transition-colors">{label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-black font-['Cinzel']" style={{ color }}>{displayElo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ... resto de componentes (sin cambios)
function PodiumRow({ player, position, color, medal }: { player: Player; position: number; color: string; medal: string }) {
  const tier = getTier(player.elo);
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className="relative shrink-0">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-3xl font-['Cinzel'] font-black opacity-[0.06]" style={{ color }}>
          {position}
        </span>
        <div className="relative">
          <div className="absolute -inset-[1.5px] rounded-[14px]" style={{ background: `linear-gradient(135deg, ${color}60, transparent, ${color}30)` }} />
          <img src={`/avatars/${player.avatar}`} className="relative w-14 h-14 rounded-2xl object-cover bg-zinc-900" alt="" />
        </div>
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-white font-['Cinzel'] text-base tracking-widest font-bold uppercase truncate group-hover:text-gold transition-colors">
          {player.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-black px-1.5 py-0.5 rounded-md" style={{ color, background: `${color}18` }}>
            {medal}
          </span>
          <span className="text-sm font-black" style={{ color: tier.color }}>{tier.icon} {tier.label}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-xl font-black font-['Cinzel']" style={{ color }}>{player.elo}</span>
      </div>
    </div>
  );
}

function LeaderStat({ label, value, icon, highlight }: { label: string; value: string | number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 ${highlight ? 'bg-gold/8 border border-gold/15' : 'bg-white/[0.025] border border-white/5'}`}>
      <span className={`${highlight ? 'text-gold' : 'text-zinc-600'}`}>{icon}</span>
      <span className={`text-base font-black font-['Cinzel'] leading-none ${highlight ? 'text-gold' : 'text-zinc-300'}`}>{value}</span>
      <span className="text-sm text-zinc-600 tracking-[0.3em] uppercase font-bold">{label}</span>
    </div>
  );
}

function ModeTab({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all cursor-pointer ${active ? 'bg-gold text-black shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
      style={active ? { boxShadow: '0 0 16px rgba(212,175,55,0.25)' } : {}}>
      {icon} {label}
    </button>
  );
}

function PlayerRow({ player, rank }: { player: Player; rank: number }) {
  const isTop3 = rank <= 3;
  const medalColor = rank === 1 ? '#d4af37' : rank === 2 ? '#a8a8a8' : rank === 3 ? '#cd7f32' : null;
  const tier = getTier(player.elo);

  return (
    <div className="group flex items-center gap-6 px-6 py-5 mb-2 hover:bg-white/[0.025] rounded-[28px] transition-all duration-300 border border-transparent hover:border-white/5 relative cursor-pointer">

      <div
        className="absolute left-0 top-4 bottom-4 w-[2px] rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500"
        style={{ background: medalColor ?? tier.color, boxShadow: `0 0 10px ${medalColor ?? tier.color}` }}
      />

      <div className="w-10 shrink-0 flex items-center justify-center">
        {isTop3 && medalColor ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${medalColor}18`, border: `1px solid ${medalColor}40` }}>
            <span className="text-base font-['Cinzel'] font-black" style={{ color: medalColor }}>{rank}</span>
          </div>
        ) : (
          <span className="text-2xl font-['Cinzel'] font-black text-zinc-800 group-hover:text-zinc-500 transition-colors">
            {rank < 10 ? `0${rank}` : rank}
          </span>
        )}
      </div>

      <div className="relative shrink-0">
        <img
          src={`/avatars/${player.avatar}`}
          className="w-14 h-14 rounded-[20px] object-cover bg-zinc-900 transition-all duration-300"
          style={{ border: isTop3 && medalColor ? `2px solid ${medalColor}50` : '1px solid rgba(255,255,255,0.06)' }}
          alt=""
        />
        {player.online && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"
            style={{ boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
        )}
      </div>

      <div className="flex-grow min-w-0">
        <h3 className="text-white font-['Cinzel'] font-bold text-xl md:text-2xl tracking-[0.08em] uppercase group-hover:text-gold truncate transition-colors">
          {player.name}
        </h3>
        <div className="flex items-center gap-3 mt-0.5">
          <span
            className="text-sm font-black tracking-widest uppercase px-2 py-0.5 rounded-md flex items-center gap-1"
            style={{ color: tier.color, background: `${tier.color}18` }}
          >
            <span>{tier.icon}</span>
            <span>{tier.label}</span>
          </span>
          <span className="hidden md:inline text-sm text-zinc-600 font-bold tracking-widest uppercase">
            {player.wins} victorias
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-3xl md:text-5xl font-black font-['Cinzel'] text-white leading-none tracking-tighter group-hover:text-gold transition-colors">
          {player.elo}
        </div>
        <div className="text-sm text-zinc-700 tracking-widest uppercase font-bold mt-0.5">ELO</div>
      </div>      
    </div>
  );
}