"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Eye, Swords, Check, X, UserPlus, MessageSquare, Users } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  elo: number;
  avatar: string;
  online: boolean;
  statusText: string;
  isWatching: boolean;
  currentGame?: string;
  viewers?: number;
  timeElapsed?: string;
}

const INITIAL_FRIENDS: Friend[] = [
  { id: "1", name: "MAGNUS_FAN", elo: 2850, avatar: "/avatars/w_king_avatar.png", online: true, statusText: "En partida vs IA", isWatching: true, currentGame: "Blitz 3+2 • vs Stockfish", viewers: 142, timeElapsed: "04:12" },
  { id: "2", name: "GAMBITO_DE_DAMA", elo: 1920, avatar: "/avatars/w_queen_avatar.png", online: true, statusText: "Disponible", isWatching: false },
  { id: "3", name: "CHESS_MASTER_99", elo: 2100, avatar: "/avatars/w_rook_avatar.png", online: true, statusText: "En partida Blitz", isWatching: true, currentGame: "Bullet 1+0 • vs Bot_Master", viewers: 28, timeElapsed: "01:45" },
  { id: "4", name: "PEON_AVANZADO", elo: 1450, avatar: "/avatars/w_pawn_avatar.png", online: true, statusText: "Disponible", isWatching: false },
  { id: "5", name: "HIKARU_FAN", elo: 2780, avatar: "/avatars/b_king_avatar.png", online: true, statusText: "Jugando", isWatching: true, currentGame: "Bullet 1+0 • Nakamura", viewers: 1205, timeElapsed: "00:30" },
  { id: "6", name: "GOTHAM_FAN", elo: 2350, avatar: "/avatars/b_bishop_avatar.png", online: true, statusText: "En directo", isWatching: true, currentGame: "Blitz 3+2 • vs Levy", viewers: 89, timeElapsed: "08:20" },
];

export default function FriendsForm() {
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [currentUser] = useState({ name: "USUARIO_ELITE", avatar: "/avatars/w_king_avatar.png" });
  const [requests, setRequests] = useState([
    { id: "req1", name: "KASPAROV_JR", elo: 1600, avatar: "/avatars/b_bishop_avatar.png" },
    { id: "req2", name: "BOBBY_F", elo: 2450, avatar: "/avatars/w_horse_avatar.png" },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('chess_friends');
    if (saved) setFriends(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('chess_friends', JSON.stringify(friends));
    window.dispatchEvent(new Event('social-update'));
  }, [friends]);

  const filteredFriends = useMemo(() => {
    return [...friends]
      .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.online === b.online ? b.elo - a.elo : a.online ? -1 : 1));
  }, [search, friends]);

  const liveGames = useMemo(() => friends.filter(f => f.isWatching && f.currentGame), [friends]);

  const handleOpenChat = (friend: Friend) => {
    window.dispatchEvent(new CustomEvent('open-chat', { 
      detail: { 
        ...friend,
        status: friend.online ? 'online' : 'offline'
      } 
    }));
  };

  const acceptRequest = (req: any) => {
    const newFriend: Friend = { 
      id: req.id, name: req.name, elo: req.elo, avatar: req.avatar, 
      online: true, statusText: "¡Nuevo amigo!", isWatching: false 
    };
    setFriends(prev => [...prev, newFriend]);
    setRequests(prev => prev.filter(r => r.id !== req.id));
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] gap-8 w-full max-w-[1800px] mx-auto p-4 relative font-sans overflow-hidden">
      <div className="hidden lg:flex flex-col w-80 gap-6 shrink-0 h-full">
        <div className="chess-panel-gold">
          <p className="chess-label justify-center mb-6 cursor-default">User_Core</p>
          <div className="relative w-28 h-28 mx-auto mb-6">
             <img src={currentUser.avatar} className="w-full h-full rounded-[32px] border-2 border-gold object-cover shadow-lg" alt="Me" />
             <div className="status-dot bg-green-500 -bottom-1 -right-1 border-4" />
          </div>
          <h3 className="text-white font-serif font-bold text-xl tracking-widest uppercase truncate cursor-default">{currentUser.name}</h3>
        </div>
        <div className="chess-panel space-y-6">
          <StatItem label="TOTAL AMIGOS" value={friends.length} />
          <div className="h-px bg-white/5 w-full" />
          <StatItem label="PARTIDAS VIVO" value={liveGames.length} />
        </div>
        <div className="chess-panel flex-grow overflow-hidden">
           <h4 className="chess-label italic mb-6 cursor-default">Log_Actividad</h4>
           <div className="overflow-y-auto h-[90%] space-y-5 pr-2 custom-scrollbar">
              <LogItem user="SISTEMA" action="Protocolo Seguro Activo" time="Ahora" />
              {liveGames.map(g => <LogItem key={g.id} user={g.name} action="en arena" time="Reciente" />)}
           </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-8 min-w-0 h-full">
        <div className="h-[80%] flex flex-col chess-card overflow-hidden">
          <div className="px-10 py-8 border-b border-white/5 flex flex-wrap justify-between items-center shrink-0 gap-4">
            <div className="flex items-center gap-4 cursor-default">
               <Users className="text-gold" size={28} />
               <h2 className="text-3xl font-black font-serif text-white tracking-[0.4em]">SOCIAL</h2>
            </div>
            <div className="relative flex-grow max-w-md">
              <input 
                type="text" placeholder="FILTRAR CONTACTO..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="chess-input pl-6 uppercase font-bold text-xs cursor-text"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar">
            {filteredFriends.map((friend) => (
              <FriendRow 
                key={friend.id} 
                friend={friend} 
                onChat={() => handleOpenChat(friend)}
              />
            ))}
          </div>
        </div>
        <div className="h-[45%] flex flex-col bg-gold/5 border border-gold/20 rounded-[56px] overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="px-10 py-6 border-b border-gold/10 flex items-center bg-black/20 shrink-0 cursor-default">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_red]" />
                    <h3 className="text-gold font-serif text-sm font-bold tracking-[0.5em] uppercase">Partidas En Curso</h3>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-10 space-y-4 custom-scrollbar">
                {liveGames.map(game => (
                    <div key={game.id} className="w-full bg-black/60 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:border-gold/40 transition-all group shrink-0">
                        <div className="flex items-center gap-6 min-w-0">
                            <div className="relative shrink-0">
                                <img src={game.avatar} className="w-16 h-16 rounded-2xl object-cover border border-white/10" alt="" />
                                <div className="absolute -top-2 -left-2 bg-red-600 text-[9px] font-black px-2 py-1 rounded-md text-white border border-black uppercase">Live</div>
                            </div>
                            <div className="min-w-0 cursor-default">
                                <p className="text-white text-lg font-bold font-serif truncate tracking-wider">{game.name}</p>
                                <p className="text-xs text-gold truncate uppercase font-bold opacity-80">{game.currentGame}</p>
                            </div>
                        </div>
                        <button className="bg-gold text-black w-14 h-14 rounded-2xl hover:bg-white transition-all flex items-center justify-center shrink-0 cursor-pointer">
                            <Eye size={24} strokeWidth={3} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="hidden xl:flex flex-col w-96 gap-6 shrink-0 h-full overflow-hidden">
        <div className="chess-panel flex-grow overflow-hidden relative">
          <h4 className="chess-label italic mb-8 justify-center cursor-default">Invitaciones</h4>
          <div className="flex-grow overflow-y-auto pr-2 space-y-5 mb-6 custom-scrollbar">
            {requests.map((req) => (
              <div key={req.id} className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 hover:border-gold/30 transition-all shrink-0">
                <div className="flex items-center gap-4 mb-6 cursor-default">
                  <img src={req.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                  <div className="min-w-0">
                    <p className="text-white font-serif text-base font-bold truncate tracking-wide">{req.name}</p>
                    <p className="text-gold font-black text-sm italic">{req.elo} ELO</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => acceptRequest(req)} className="py-3 bg-gold text-black rounded-2xl hover:bg-white transition-all flex justify-center active:scale-95 shadow-lg cursor-pointer">
                    <Check size={20} strokeWidth={3}/>
                  </button>
                  <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="py-3 bg-white/5 text-zinc-500 rounded-2xl border border-white/10 hover:text-red-500 transition-all flex justify-center active:scale-95 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-invite'))}
            className="btn-gold py-6 !rounded-[28px] gap-3 cursor-pointer"
          >
            <UserPlus size={20} strokeWidth={3} /> INVITAR
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: any) {
  return (
    <div className="flex justify-between items-center group cursor-default">
      <span className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase group-hover:text-zinc-300 transition-colors">{label}</span>
      <span className="text-3xl text-gold font-black font-serif">{value}</span>
    </div>
  );
}

function LogItem({ user, action, time }: any) {
  return (
    <div className="log-item cursor-default">
      <p>{user} <span className="text-zinc-500 font-normal lowercase">{action}</span></p>
      <span>{time}</span>
    </div>
  );
}

function FriendRow({ friend, onChat }: { friend: Friend, onChat: () => void }) {
  return (
    <div className={`friend-row group cursor-default ${!friend.online ? 'offline' : ''}`}>
      <div className="avatar-container group-hover:scale-105">
        <img src={friend.avatar} className={`avatar-img ${friend.online ? 'border-gold shadow-gold/20' : 'border-zinc-800'}`} alt="" />
        <div className={`status-dot ${friend.online ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-zinc-700'}`} />
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="text-white font-serif font-bold text-xl tracking-widest uppercase truncate group-hover:text-gold transition-colors">{friend.name}</h3>
        <p className="text-xs text-gold font-bold tracking-widest">{friend.elo} ELO <span className="text-zinc-500 ml-3 font-normal uppercase italic">• {friend.statusText}</span></p>
      </div>
      <div className="flex gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
        <button className="p-4 bg-gold/10 text-gold border border-gold/30 rounded-2xl hover:bg-gold hover:text-black transition-all active:scale-90 shadow-lg cursor-pointer">
            <Swords size={22} strokeWidth={2.5} />
        </button>
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onChat();
            }} 
            className="p-4 bg-white/5 text-gold rounded-2xl hover:bg-gold hover:text-black transition-all border border-white/5 active:scale-90 shadow-lg cursor-pointer"
        >
            <MessageSquare size={22} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}