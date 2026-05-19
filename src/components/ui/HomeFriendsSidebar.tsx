"use client";

import { useState, useEffect, useCallback } from 'react';

interface Friend {
  id: string;
  username: string;
  avatar: string | null;
  elo_blitz: number;
  elo_rapid: number;
  elo_bullet: number;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }
  
  return res.json() as Promise<T>;
}

const avatarSrc = (src: string | null) => src ?? '/avatars/b_king_avatar.png';

export default function HomeFriendsSidebar() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    try {
      // ✅ SOLUCIÓN: Verificar token ANTES de API call
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // 1. Obtener mi perfil con la lista de usernames de amigos
      const me = await apiFetch<{ friends: string[] }>('/api/users/me/');

      // 2. Obtener el perfil de cada amigo en paralelo
      const profiles = await Promise.allSettled(
        me.friends.map(u =>
          apiFetch<{
            id: string;
            username: string;
            avatar: string | null;
            elo_blitz: number;
            elo_rapid: number;
            elo_bullet: number;
          }>(`/api/users/${u}/`)
        )
      );

      const resolved: Friend[] = profiles
        .filter((r): r is PromiseFulfilledResult<Friend> => r.status === 'fulfilled')
        .map(({ value }) => value)
        .sort((a, b) => b.elo_blitz - a.elo_blitz);

      setFriends(resolved);
    } catch (e) {
      console.error('HomeFriendsSidebar:', e);
      setFriends([]); // ← LIMPIAR EN ERROR
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    const interval = setInterval(fetchFriends, 10_000);
    return () => clearInterval(interval);
  }, [fetchFriends]);

  useEffect(() => {
    const onUpdate = () => fetchFriends();
    window.addEventListener('social-update', onUpdate);
    return () => window.removeEventListener('social-update', onUpdate);
  }, [fetchFriends]);

  return (
    <div className="flex flex-col h-full bg-black/20 in-[.light]:bg-black/3">
      <div className="p-6 border-b border-gold/10 in-[.light]:border-gray-100 flex justify-between items-center">
        <h3 className="chess-label">Amigos</h3>
        <span className="text-[10px] text-gold font-black bg-gold/10 px-2 py-1 rounded-md">
          {loading ? '···' : `${friends.length} AMIGOS`}
        </span>
      </div>

      <div className="grow overflow-y-auto custom-scrollbar p-3 space-y-2">
        {loading ? (
          <div className="py-10 text-center chess-label opacity-20 animate-pulse">
            Cargando...
          </div>
        ) : friends.length > 0 ? (
          friends.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('open-chat', {
                    detail: { ...f, status: 'offline' },
                  })
                )
              }
              className="w-full flex items-center gap-4 p-3 rounded-2xl transition-all border border-transparent hover:bg-gold/5 in-[.light]:hover:bg-black/5 hover:border-gold/10 group cursor-pointer"
            >
              <div className="relative shrink-0">
                <img
                  src={avatarSrc(f.avatar)}
                  className="w-13 h-13 rounded-xl border border-white/10 in-[.light]:border-gray-200 group-hover:border-gold/30 object-cover"
                  alt=""
                />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold uppercase tracking-widest text-white in-[.light]:text-zinc-800 group-hover:text-gold truncate font-['Cinzel']">
                    {f.username}
                  </span>
                  <span className="text-[11px] text-gold/50 font-black font-['Cinzel']">
                    {f.elo_blitz}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 in-[.light]:text-zinc-400 italic truncate tracking-tight">
                  {f.elo_rapid} Rapid · {f.elo_bullet} Bullet
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="py-10 text-center chess-label opacity-20">
            Sin contactos
          </div>
        )}
      </div>
    </div>
  );
}