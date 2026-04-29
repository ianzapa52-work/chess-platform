"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Swords, Check, X, UserPlus, MessageSquare, Users, Loader2, RefreshCw, UserMinus, Search, Zap, Shield, TrendingUp } from 'lucide-react';

interface Friend {
  id: string;
  username: string;
  avatar: string | null;
  elo_blitz: number;
  elo_rapid: number;
  elo_bullet: number;
}

interface PendingRequest {
  sender_username: string;
  sender_avatar: string | null;
  created_at: string;
}

interface ApiMe {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  elo_blitz: number;
  elo_rapid: number;
  elo_bullet: number;
  is_active: boolean;
  date_joined: string;
  friends: string[];
  recent_games: unknown[];
}

interface ApiPublicUser {
  id: string;
  username: string;
  avatar: string | null;
  elo_blitz: number;
  elo_rapid: number;
  elo_bullet: number;
  date_joined: string;
  friends: string[];
  recent_games: unknown[];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const avatarSrc = (src: string | null) => src ?? '/avatars/b_king_avatar.png';

function ConfirmDialog({ username, onConfirm, onCancel }: { username: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-[32px] p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <UserMinus size={28} className="text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-white font-serif font-bold text-xl tracking-widest uppercase mb-2">Eliminar amigo</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              ¿Seguro que quieres eliminar a <span className="text-gold font-bold">{username}</span> de tu lista?
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onConfirm} className="py-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl font-bold text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 cursor-pointer">
            ELIMINAR
          </button>
          <button onClick={onCancel} className="py-4 bg-white/5 text-zinc-400 rounded-2xl border border-white/10 hover:bg-white/10 hover:text-white transition-all text-xs tracking-widest cursor-pointer active:scale-95">
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FriendsForm() {
  const [search, setSearch] = useState('');
  const [me, setMe] = useState<ApiMe | null>(null);
  const [friendDetails, setFriendDetails] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Friend | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    setError(null);
    try {
      const [meData, pendingData] = await Promise.all([
        apiFetch<ApiMe>('/api/users/me/'),
        apiFetch<PendingRequest[]>('/api/users/pending_friend_requests/'),
      ]);

      // Solo actualiza si los datos cambiaron realmente
      setMe(prev => {
        if (JSON.stringify(prev) === JSON.stringify(meData)) return prev;
        return meData;
      });

      setRequests(prev => {
        if (JSON.stringify(prev) === JSON.stringify(pendingData)) return prev;
        return pendingData;
      });

      const profiles = await Promise.allSettled(
        meData.friends.map(u => apiFetch<ApiPublicUser>(`/api/users/${u}/`))
      );
      const resolved: Friend[] = profiles
        .filter((r): r is PromiseFulfilledResult<ApiPublicUser> => r.status === 'fulfilled')
        .map(({ value: u }) => ({
          id: u.id,
          username: u.username,
          avatar: u.avatar,
          elo_blitz: u.elo_blitz,
          elo_rapid: u.elo_rapid,
          elo_bullet: u.elo_bullet,
        }));

      setFriendDetails(prev => {
        if (JSON.stringify(prev) === JSON.stringify(resolved)) return prev;
        return resolved;
      });

    } catch (e: unknown) {
      // En refresco silencioso, no sobreescribir la UI si ya hay datos
      if (isInitial) setError(e instanceof Error ? e.message : 'Error cargando datos');
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(true);
    const interval = setInterval(() => fetchAll(false), 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const acceptRequest = async (req: PendingRequest) => {
    setActionLoading(req.sender_username);
    try {
      await apiFetch(`/api/users/${req.sender_username}/respond_friend_request/`, { method: 'POST', body: JSON.stringify({ action: 'accept' }) });
      showToast(`¡${req.sender_username} añadido como amigo!`);
      await fetchAll(false);
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', false); }
    finally { setActionLoading(null); }
  };

  const rejectRequest = async (req: PendingRequest) => {
    setActionLoading(req.sender_username);
    try {
      await apiFetch(`/api/users/${req.sender_username}/respond_friend_request/`, { method: 'POST', body: JSON.stringify({ action: 'reject' }) });
      setRequests(prev => prev.filter(r => r.sender_username !== req.sender_username));
      showToast('Solicitud rechazada.');
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', false); }
    finally { setActionLoading(null); }
  };

  const sendFriendRequest = async (username: string) => {
    setActionLoading(username);
    try {
      await apiFetch(`/api/users/${username}/send_friend_request/`, { method: 'POST' });
      showToast(`Solicitud enviada a ${username}.`);
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', false); }
    finally { setActionLoading(null); }
  };

  const removeFriend = async (friend: Friend) => {
    setActionLoading(friend.username);
    setConfirmDelete(null);
    try {
      await apiFetch(`/api/users/${friend.username}/remove_friend/`, { method: 'POST' });
      setFriendDetails(prev => prev.filter(f => f.id !== friend.id));
      showToast(`${friend.username} eliminado de tu lista.`);
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error al eliminar amigo', false); }
    finally { setActionLoading(null); }
  };

  const handleOpenChat = (friend: Friend) => {
    window.dispatchEvent(new CustomEvent('open-chat', { detail: { ...friend, status: 'offline' } }));
  };

  const filteredFriends = useMemo(() =>
    [...friendDetails].filter(f => f.username.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.elo_blitz - a.elo_blitz),
    [search, friendDetails]
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-130px)] gap-8 w-full max-w-[1800px] mx-auto p-4 relative font-sans overflow-hidden">

      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold tracking-widest uppercase shadow-2xl transition-all
            ${toast.ok ? 'bg-[#d4af37] text-black' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog username={confirmDelete.username} onConfirm={() => removeFriend(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
      )}

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col w-80 gap-5 shrink-0 h-full">

        {/* ══ PROFILE CARD ══ */}
        <div
          className="relative rounded-[36px] overflow-hidden shrink-0"
          style={{
            background: 'linear-gradient(160deg, #161208 0%, #0d0d0d 55%, #0a0a0a 100%)',
            border: '1px solid rgba(212,175,55,0.15)',
          }}
        >
          <div className="absolute top-0 left-0 w-20 h-px" style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }} />
          <div className="absolute top-0 left-0 w-px h-20" style={{ background: 'linear-gradient(180deg, #d4af37, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-20 h-px" style={{ background: 'linear-gradient(270deg, #d4af37, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-px h-20" style={{ background: 'linear-gradient(0deg, #d4af37, transparent)' }} />

          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)' }}
          />

          <div className="relative z-10 flex flex-col items-center px-6 pt-6 pb-6">

            <div className="flex items-center gap-3 mb-5 w-full justify-center">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25))' }} />
              <span className="text-[9px] text-gold/60 tracking-[0.55em] font-bold uppercase shrink-0">Mi Perfil</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.25), transparent)' }} />
            </div>

            <div className="relative mb-5">
              <div
                className="absolute -inset-[2px] rounded-[30px]"
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #7a5c1e 45%, #d4af37 100%)' }}
              />
              <div className="relative rounded-[28px] overflow-hidden w-28 h-28">
                <img
                  src={avatarSrc(me?.avatar ?? null)}
                  className="w-full h-full object-cover"
                  alt="Me"
                />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 z-10">
                <div
                  className="w-6 h-6 rounded-full border-[2.5px] border-[#0d0d0d] flex items-center justify-center"
                  style={{ background: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.55)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                </div>
              </div>
            </div>

            <h3 className="text-white font-serif font-bold text-xl tracking-[0.12em] uppercase truncate w-full text-center leading-tight mb-0.5">
              {me?.username ?? '· · ·'}
            </h3>
            <div className="flex items-center gap-1.5 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
              <span className="text-[9px] text-green-400/80 tracking-[0.4em] uppercase font-medium">En línea</span>
            </div>

            <div className="w-full h-px mb-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.18), transparent)' }} />

            <div className="w-full grid grid-cols-3 gap-2 mb-1">
              <MiniStat label="Amigos" value={friendDetails.length} icon={<Users size={12} />} />
              <MiniStat label="Blitz" value={me?.elo_blitz ?? '—'} icon={<Zap size={12} />} highlight />
              <MiniStat label="Rapid" value={me?.elo_rapid ?? '—'} icon={<Shield size={12} />} />
            </div>
          </div>
        </div>

        {/* ── ELO BARS ── */}
        <div className="chess-panel space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={12} className="text-gold/60" />
            <span className="text-[9px] text-zinc-600 font-bold tracking-[0.4em] uppercase">Rendimiento ELO</span>
          </div>
          <EloBar label="Blitz" value={me?.elo_blitz ?? 0} max={3000} color="#d4af37" />
          <EloBar label="Rapid" value={me?.elo_rapid ?? 0} max={3000} color="#8b7040" />
          <EloBar label="Bullet" value={me?.elo_bullet ?? 0} max={3000} color="#4a3a1e" />
        </div>

        {/* ── ACTIVITY LOG ── */}
        <div className="chess-panel flex-grow overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h4 className="chess-label italic cursor-default">Actividad</h4>
            <button onClick={() => fetchAll(false)} className="text-zinc-600 hover:text-gold transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5" title="Refrescar">
              <RefreshCw size={13} />
            </button>
          </div>
          <div className="overflow-y-auto h-[85%] space-y-3 pr-2 custom-scrollbar">
            <LogItem user="SISTEMA" action="Protocolo Seguro Activo" time="Ahora" type="system" />
            {requests.map(r => (
              <LogItem key={r.sender_username} user={r.sender_username} action="te envió solicitud" time="Pendiente" type="request" />
            ))}
          </div>
        </div>
      </div>

      {/* ── CENTER PANEL ── */}
      <div className="flex-grow flex flex-col gap-8 min-w-0 h-full">
        <div className="h-full flex flex-col chess-card overflow-hidden">
          <div className="px-10 py-7 border-b border-white/5 flex flex-wrap justify-between items-center shrink-0 gap-4">
            <div className="flex items-center gap-4 cursor-default">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Users className="text-gold" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black font-serif text-white tracking-[0.35em]">AMIGOS</h2>
                <p className="text-[10px] text-zinc-600 tracking-widest uppercase">
                  {friendDetails.length} contacto{friendDetails.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Buscar contacto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="chess-input pl-12 text-[11px] tracking-[0.3em] uppercase font-bold cursor-text"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar">
            {initialLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
                <Loader2 size={32} className="animate-spin text-gold" />
                <span className="text-xs tracking-widest uppercase">Cargando amigos...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-red-500 text-sm tracking-widest uppercase">{error}</p>
                <button onClick={() => fetchAll(true)} className="px-6 py-3 bg-gold/10 border border-gold/30 text-gold rounded-2xl text-xs tracking-widest hover:bg-gold hover:text-black transition-all cursor-pointer">
                  Reintentar
                </button>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-600">
                <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                  <Users size={36} strokeWidth={1} />
                </div>
                <p className="text-xs tracking-widest uppercase">{search ? 'Sin resultados' : 'Aún no tienes amigos'}</p>
                {!search && <p className="text-[10px] text-zinc-700 tracking-wider">Usa el panel de invitaciones para añadir</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend, i) => (
                  <FriendRow key={friend.id} friend={friend} rank={i + 1} onChat={() => handleOpenChat(friend)} onDelete={() => setConfirmDelete(friend)} actionLoading={actionLoading} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="hidden xl:flex flex-col w-96 gap-6 shrink-0 h-full overflow-hidden">
        <InvitePanel onSend={sendFriendRequest} actionLoading={actionLoading} />

        <div className="chess-panel flex-grow overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h4 className="chess-label italic cursor-default">Solicitudes</h4>
            {requests.length > 0 && (
              <span className="bg-gold text-black text-[10px] font-black px-2.5 py-1 rounded-full">{requests.length}</span>
            )}
          </div>
          <div className="flex-grow overflow-y-auto pr-1 space-y-4 custom-scrollbar">
            {requests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-700">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                  <UserPlus size={20} strokeWidth={1.5} />
                </div>
                <p className="text-xs tracking-widest uppercase text-center">Sin solicitudes pendientes</p>
              </div>
            )}
            {requests.map(req => (
              <RequestCard key={req.sender_username} req={req} onAccept={() => acceptRequest(req)} onReject={() => rejectRequest(req)} actionLoading={actionLoading} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mini stat chip ──
function MiniStat({ label, value, icon, highlight }: { label: string; value: string | number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 ${highlight ? 'bg-gold/8 border border-gold/15' : 'bg-white/[0.025] border border-white/5'}`}>
      <span className={`${highlight ? 'text-gold' : 'text-zinc-600'}`}>{icon}</span>
      <span className={`text-base font-black font-serif leading-none ${highlight ? 'text-gold' : 'text-zinc-300'}`}>{value}</span>
      <span className="text-[8px] text-zinc-600 tracking-[0.3em] uppercase font-bold">{label}</span>
    </div>
  );
}

// ── ELO bar ──
function EloBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, value > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[9px] text-zinc-600 tracking-[0.35em] uppercase font-bold">{label}</span>
        <span className="text-sm font-black font-serif" style={{ color }}>{value || '—'}</span>
      </div>
      <div className="h-0.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Invite Panel ──
function InvitePanel({ onSend, actionLoading }: { onSend: (u: string) => void; actionLoading: string | null }) {
  const [username, setUsername] = useState('');
  const [focused, setFocused] = useState(false);
  const submit = () => { const t = username.trim(); if (!t) return; onSend(t); setUsername(''); };

  return (
    <div className="chess-panel relative overflow-hidden shrink-0">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }} />
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <UserPlus size={16} className="text-gold" />
        </div>
        <div>
          <h4 className="text-white font-serif font-bold text-sm tracking-widest uppercase">Invitar amigo</h4>
          <p className="text-[10px] text-zinc-600 tracking-wider">Envía una solicitud de amistad</p>
        </div>
      </div>
      <div className={`transition-all duration-200 ${focused ? 'ring-1 ring-gold/40 rounded-2xl' : ''}`}>
        <input
          type="text" value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Nombre de usuario..."
          className="chess-input text-[11px] tracking-[0.2em] uppercase font-bold w-full mb-3"
        />
      </div>
      <button onClick={submit} disabled={!username.trim() || !!actionLoading}
        className="w-full py-4 bg-gold text-black rounded-2xl font-black text-xs tracking-[0.3em] uppercase hover:bg-white transition-all active:scale-95 shadow-lg shadow-gold/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer">
        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} strokeWidth={2.5} />Enviar invitación</>}
      </button>
    </div>
  );
}

// ── Request Card ──
function RequestCard({ req, onAccept, onReject, actionLoading }: { req: PendingRequest; onAccept: () => void; onReject: () => void; actionLoading: string | null }) {
  const isLoading = actionLoading === req.sender_username;
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-[28px] p-5 hover:border-gold/20 transition-all animate-fadeIn">
      <div className="flex items-center gap-3 mb-4 cursor-default">
        <img src={avatarSrc(req.sender_avatar)} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
        <div className="min-w-0 flex-grow">
          <p className="text-white font-serif text-sm font-bold truncate tracking-wide">{req.sender_username}</p>
          <p className="text-zinc-600 text-[10px] tracking-widest uppercase">{new Date(req.created_at).toLocaleDateString('es-ES')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={onAccept} disabled={isLoading}
          className="py-3 bg-gold text-black rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 font-bold text-xs tracking-wider active:scale-95 cursor-pointer disabled:opacity-50">
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} strokeWidth={3} /> Aceptar</>}
        </button>
        <button onClick={onReject} disabled={isLoading}
          className="py-3 bg-white/[0.03] text-zinc-500 rounded-xl border border-white/8 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 text-xs tracking-wider cursor-pointer disabled:opacity-50">
          <X size={14} /> Rechazar
        </button>
      </div>
    </div>
  );
}

// ── Friend Row ──
function FriendRow({ friend, rank, onChat, onDelete, actionLoading }: { friend: Friend; rank: number; onChat: () => void; onDelete: () => void; actionLoading: string | null }) {
  const isDeleting = actionLoading === friend.username;
  return (
    <div className="friend-row group cursor-default relative animate-fadeIn">
      <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:border-gold/20 transition-colors">
        <span className="text-[10px] text-zinc-600 font-bold group-hover:text-gold/60 transition-colors">{rank}</span>
      </div>
      <div className="avatar-container group-hover:scale-105 shrink-0 w-14 h-14">
        <img src={friend.avatar ?? '/avatars/b_king_avatar.png'} className="avatar-img border-gold shadow-gold/20 w-14 h-14" alt="" />
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="text-white font-serif font-bold text-2xl tracking-widest uppercase truncate group-hover:text-gold transition-colors">{friend.username}</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gold font-bold tracking-widest flex items-center gap-1"><Zap size={12} /> {friend.elo_blitz} Blitz</span>
          <span className="text-xs text-zinc-600 italic">{friend.elo_rapid} Rapid · {friend.elo_bullet} Bullet</span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-200">
        <button title="Retar" className="p-3.5 bg-gold/10 text-gold border border-gold/30 rounded-xl hover:bg-gold hover:text-black transition-all active:scale-90 cursor-pointer">
          <Swords size={18} strokeWidth={2.5} />
        </button>
        <button title="Mensaje" onClick={e => { e.stopPropagation(); onChat(); }}
          className="p-3.5 bg-white/5 text-zinc-400 rounded-xl hover:bg-gold hover:text-black transition-all border border-white/5 active:scale-90 cursor-pointer hover:border-gold">
          <MessageSquare size={18} strokeWidth={2.5} />
        </button>
        <button title="Eliminar amigo" onClick={e => { e.stopPropagation(); onDelete(); }} disabled={isDeleting}
          className="p-3.5 bg-white/[0.03] text-zinc-600 rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all border border-white/5 active:scale-90 cursor-pointer disabled:opacity-50">
          {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <UserMinus size={18} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}

function LogItem({ user, action, time, type = 'default' }: { user: string; action: string; time: string; type?: 'system' | 'request' | 'default' }) {
  const dotColor = type === 'system' ? 'bg-green-500' : type === 'request' ? 'bg-gold' : 'bg-zinc-600';
  return (
    <div className="log-item cursor-default group animate-fadeIn">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
        <p className="truncate">
          <span className="text-zinc-300 group-hover:text-white transition-colors">{user}</span>{' '}
          <span className="text-zinc-600 font-normal lowercase">{action}</span>
        </p>
      </div>
      <span className="shrink-0">{time}</span>
    </div>
  );
}