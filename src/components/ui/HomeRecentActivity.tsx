"use client";
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchRecent = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const meRes = await fetch(`${API_BASE}/api/users/me/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setMyUsername(meData.username);
        }

        const response = await fetch(`${API_BASE}/api/games/my-games/`, {
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

  const getResultType = (game: GameFromAPI) => {
    if (game.result === "1/2-1/2") return "draw";
    if (game.winner_username === myUsername) return "win";
    if (game.winner_username === null && game.result !== "*") return "draw";
    return "loss";
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
          const opponent =
            game.white_username === myUsername
              ? game.black_username
              : game.white_username;

          return (
            <div
              key={game.id}
              className="flex items-center justify-between py-3 px-3 -mx-1 rounded-xl transition-all duration-700 group/item border border-transparent hover:bg-white/5 in-[.light]:hover:bg-black/5"
            >
              <div className="flex items-center gap-4">
                <div className={`text-[9px] font-black px-2 py-1 rounded border ${
                  resType === 'win'
                    ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                    : resType === 'loss'
                    ? 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                    : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5'
                }`}>
                  {resType === 'win' ? 'VICTORIA' : resType === 'loss' ? 'DERROTA' : 'TABLAS'}
                </div>

                <div>
                  <p className="text-xs font-bold text-white in-[.light]:text-zinc-800 tracking-tight group-hover/item:text-gold transition-colors">
                    vs. {opponent || "Oponente"}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {game.mode} • {game.result}
                  </p>
                </div>
              </div>
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