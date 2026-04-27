"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GameFromAPI {
  id: string;
  mode: string;
  status: string;
  result: string;
  created_at: string;
  white_username: string;
  black_username: string;
  winner_username: string | null;
}

export default function HomeRecentActivity() {
  const [recentGames, setRecentGames] = useState<GameFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRecent = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const meRes = await fetch("http://localhost:8000/api/users/me/", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setMyUsername(meData.username);
        }

        const response = await fetch("http://localhost:8000/api/games/my-history/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data: GameFromAPI[] = await response.json();
          setRecentGames(data.slice(0, 3));
        }
      } catch (error) {
        console.error("Error Home Recent Activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  // ✅ Lógica idéntica a HistoryForm
  const getResultType = (game: GameFromAPI) => {
    if (game.status === 'in_progress') return "live";        // ← estaba ausente
    if (game.result === "1/2-1/2") return "draw";
    if (game.winner_username === myUsername) return "win";
    if (game.winner_username === null && game.result !== "*") return "draw";
    return "loss";                                           // ← ahora sí es alcanzable
  };

  const handleAction = (game: GameFromAPI) => {
    if (game.status === 'in_progress') {
      router.push(`/play-online?gameId=${game.id}`);
    } else {
      router.push(`/analysis/${game.id}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-gold text-[10px] tracking-widest font-bold animate-pulse uppercase">
        Sincronizando...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentGames.length > 0 ? (
        recentGames.map((game) => {
          const resType = getResultType(game);
          const isLive = resType === "live";
          const opponent =
            game.white_username === myUsername
              ? game.black_username
              : game.white_username;

          return (
            <div
              key={game.id}
              className={`flex items-center justify-between py-3 px-3 -mx-1 rounded-xl transition-all duration-700 group/item border ${
                isLive
                  ? 'border-[#ff1744]/30 bg-[#ff1744]/5 opacity-90'
                  : 'border-transparent hover:bg-white/5 [.light_&]:hover:bg-black/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-[9px] font-black px-2 py-1 rounded border transition-opacity duration-1000 ${
                  isLive
                    ? 'text-[#ff1744] border-[#ff1744]/40 bg-[#ff1744]/10 animate-[pulse_3s_infinite]'
                    : resType === 'win'
                    ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                    : resType === 'loss'
                    ? 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                    : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5'
                }`}>
                  {isLive ? 'EN CURSO'
                    : resType === 'win' ? 'VICTORIA'
                    : resType === 'loss' ? 'DERROTA'
                    : 'TABLAS'}
                </div>

                <div>
                  <p className="text-xs font-bold text-white [.light_&]:text-zinc-800 uppercase tracking-tight group-hover/item:text-gold transition-colors">
                    vs. {opponent || "Oponente"}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {game.mode} • {isLive ? 'LIVE' : game.result}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAction(game)}
                className={`px-4 py-1.5 rounded text-[10px] font-black transition-all transform active:scale-95 cursor-pointer uppercase tracking-widest border ${
                  isLive
                    ? 'bg-white [.light_&]:bg-zinc-800 text-black [.light_&]:text-white border-white shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:bg-[#ff1744] hover:text-white hover:border-[#ff1744]'
                    : 'bg-black [.light_&]:bg-white border-gold/20 text-gold hover:bg-gold hover:text-black'
                }`}
              >
                {isLive ? 'VER' : 'ANALIZAR'}
              </button>
            </div>
          );
        })
      ) : (
        <p className="text-center py-4 text-zinc-600 text-[10px] uppercase tracking-widest">
          Sin actividad reciente
        </p>
      )}
    </div>
  );
}