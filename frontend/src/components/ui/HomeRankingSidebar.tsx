"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Modality = 'bullet' | 'blitz' | 'rapid';

interface PlayerFromAPI {
  id: string;
  username: string;
  elo_blitz: number;
  elo_rapid: number;
  elo_bullet: number;
  avatar: string | null;
}

export default function HomeRankingSidebar() {
  const [players, setPlayers] = useState<PlayerFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [modality, setModality] = useState<Modality>('blitz');

  useEffect(() => {
    const fetchTop = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `http://localhost:8000/api/users/leaderboard/?mode=${modality}&limit=3`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );
        if (response.ok) {
          const data: PlayerFromAPI[] = await response.json();
          setPlayers(data.slice(0, 3));
        }
      } catch (error) {
        console.error("Error Home Ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, [modality]);

  const getElo = (p: PlayerFromAPI) => p[`elo_${modality}` as keyof PlayerFromAPI] as number;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase text-gold tracking-[0.3em]">Top Maestros</h3>
          <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
        </div>
        <div className="flex gap-1 bg-black/40 in-[.light]:bg-black/5 p-1 rounded-lg border border-white/5 in-[.light]:border-black/5">
          {(['bullet', 'blitz', 'rapid'] as Modality[]).map((m) => (
            <button
              key={m}
              onClick={() => setModality(m)}
              className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-md transition-all cursor-pointer ${
                modality === m
                  ? 'bg-gold text-black shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300 in-[.light]:hover:text-zinc-700 hover:bg-white/5 in-[.light]:hover:bg-black/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 min-h-[220px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-zinc-700 animate-pulse text-[9px] uppercase tracking-[0.2em] pt-10">
            Sincronizando...
          </div>
        ) : players.length > 0 ? (
          players.map((p, i) => (
            <Link
              key={p.id || i}
              href="/ranking"
              className="flex items-center justify-between p-4 bg-white/3 in-[.light]:bg-white border border-white/5 in-[.light]:border-black/5 rounded-2xl hover:border-gold/40 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className={`font-serif italic text-xs ${i === 0 ? 'text-gold' : 'text-zinc-600'}`}>
                  {i + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-zinc-300 in-[.light]:text-zinc-800 group-hover:text-white in-[.light]:group-hover:text-black uppercase tracking-tighter">
                    {p.username}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-black text-gold bg-black/60 in-[.light]:bg-zinc-100 px-3 py-1.5 rounded-lg shadow-inner border border-gold/5">
                {getElo(p)}
              </span>
            </Link>
          ))
        ) : (
          <div className="text-center pt-10 text-zinc-600 text-[9px] uppercase">Sin datos</div>
        )}
      </div>
    </div>
  );
}