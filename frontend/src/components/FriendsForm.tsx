import React, { useState, useMemo, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import { Eye, Swords, Check, X, UserPlus, MessageSquare, Users, Clock } from 'lucide-react';

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
  { id: "4", name: "PEON_AVANZADO", elo: 1450, avatar: "/avatars/w_pawn_avatar.png", online: false, statusText: "Visto hace 2h", isWatching: false },
  { id: "5", name: "HIKARU_FAN", elo: 2780, avatar: "/avatars/b_king_avatar.png", online: true, statusText: "Jugando", isWatching: true, currentGame: "Bullet 1+0 • Nakamura", viewers: 1205, timeElapsed: "00:30" },
  { id: "6", name: "GOTHAM_FAN", elo: 2350, avatar: "/avatars/b_bishop_avatar.png", online: true, statusText: "En directo", isWatching: true, currentGame: "Blitz 3+2 • vs Levy", viewers: 89, timeElapsed: "08:20" },
];

export default function FriendsForm() {
  const [search, setSearch] = useState('');
  
  // CORRECCIÓN F5: Inicializamos intentando leer de localStorage inmediatamente
  const [friends, setFriends] = useState<Friend[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chess_friends');
      return saved ? JSON.parse(saved) : INITIAL_FRIENDS;
    }
    return INITIAL_FRIENDS;
  });

  const [currentUser] = useState({ name: "USUARIO_ELITE", avatar: "/avatars/w_king_avatar.png" });
  const [requests, setRequests] = useState([
    { id: "req1", name: "KASPAROV_JR", elo: 1600, avatar: "/avatars/b_bishop_avatar.png" },
    { id: "req2", name: "BOBBY_F", elo: 2450, avatar: "/avatars/w_horse_avatar.png" },
    { id: "req3", name: "CHESS_GIRL", elo: 1200, avatar: "/avatars/b_pawn_avatar.png" },
    { id: "req4", name: "TAL_GENIUS", elo: 2600, avatar: "/avatars/w_bishop_avatar.png" },
  ]);

  // Sincronizar con localStorage cada vez que cambie la lista
  useEffect(() => {
    localStorage.setItem('chess_friends', JSON.stringify(friends));
  }, [friends]);

  // FILTRADO Y ORDENACIÓN (Online primero, luego ELO)
  const filteredFriends = useMemo(() => {
    return [...friends] // Hacemos copia para no mutar
      .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        // 1. Prioridad: Conectados arriba, Desconectados abajo
        if (a.online !== b.online) return a.online ? -1 : 1;
        // 2. Sub-prioridad: Mayor ELO arriba
        return b.elo - a.elo;
      });
  }, [search, friends]);

  const liveGames = useMemo(() => friends.filter(f => f.isWatching && f.currentGame), [friends]);

  const handleOpenChat = (name: string, online: boolean) => {
    window.dispatchEvent(new CustomEvent('open-chat', { 
      detail: { name, status: online ? 'online' : 'offline' } 
    }));
  };

  const acceptRequest = (req: any) => {
    // CORRECCIÓN: Evitar añadir si ya existe el ID
    if (friends.some(f => f.id === req.id)) {
      setRequests(prev => prev.filter(r => r.id !== req.id));
      return;
    }

    const newFriend: Friend = {
      id: req.id,
      name: req.name,
      elo: req.elo,
      avatar: req.avatar,
      online: true,
      statusText: "¡Nuevo amigo!",
      isWatching: false
    };
    setFriends(prev => [...prev, newFriend]);
    setRequests(prev => prev.filter(r => r.id !== req.id));
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] gap-8 w-full max-w-[1800px] mx-auto p-4 relative font-['Outfit'] text-base overflow-hidden">
      <ChatWindow />

      {/* IZQUIERDA: PERFIL Y ACTIVIDAD */}
      <div className="hidden lg:flex flex-col w-80 gap-6 shrink-0 h-full overflow-hidden">
        <div className="bg-gradient-to-b from-[#d4af37]/20 to-black/40 border border-[#d4af37]/30 rounded-[32px] p-6 shrink-0">
          <p className="text-[#d4af37] text-sm tracking-[0.4em] font-black mb-4 uppercase text-center cursor-default font-sans">MI PERFIL</p>
          <div className="relative w-24 h-24 mx-auto mb-4 cursor-pointer hover:scale-105 transition-transform">
             <img src={currentUser.avatar} className="w-full h-full rounded-2xl border-2 border-[#d4af37] shadow-lg object-cover" alt="Me" />
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          <h3 className="text-white font-['Cinzel'] text-center font-bold text-xl tracking-widest uppercase truncate cursor-default">
            {currentUser.name}
          </h3>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[32px] p-6 space-y-4 backdrop-blur-md shrink-0">
          <StatItem label="AMIGOS" value={friends.length.toString()} />
          <StatItem label="EN VIVO" value={liveGames.length.toString()} />
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[32px] p-6 flex-grow flex flex-col min-h-0 overflow-hidden relative backdrop-blur-md">
           <h4 className="text-[#d4af37] font-['Cinzel'] text-sm tracking-[0.4em] mb-4 uppercase shrink-0 cursor-default">Actividad</h4>
           <div className="overflow-y-auto custom-scrollbar space-y-4 pr-2">
              <LogItem user="SISTEMA" action="Conectado al servidor" time="Ahora" />
              {liveGames.map(g => (
                <LogItem key={g.id} user={g.name} action="está jugando" time="Reciente" />
              ))}
           </div>
        </div>
      </div>

      {/* CENTRAL: SOCIAL Y DIRECTOS */}
      <div className="flex-grow flex flex-col gap-6 min-w-0 h-full overflow-hidden">
        <div className="h-[55%] flex flex-col bg-white/[0.02] border border-white/10 rounded-[48px] overflow-hidden backdrop-blur-xl shadow-2xl shrink-0">
          <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
            <h2 className="text-3xl font-black font-['Cinzel'] text-white tracking-[0.3em] cursor-default">SOCIAL</h2>
            <input 
              type="text" placeholder="BUSCAR..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-white outline-none focus:border-[#d4af37]/50 w-64 text-sm tracking-widest cursor-text"
            />
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar px-6 py-4">
            {filteredFriends.map((friend) => (
              <FriendRow key={friend.id} friend={friend} onChat={() => handleOpenChat(friend.name, friend.online)} />
            ))}
          </div>
        </div>

        <div className="flex-grow flex flex-col bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-[40px] overflow-hidden backdrop-blur-md min-h-0">
            <div className="px-8 py-5 border-b border-[#d4af37]/10 flex items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                    <h3 className="text-[#d4af37] font-['Cinzel'] text-base font-bold tracking-[0.3em] uppercase cursor-default">En directo</h3>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
                {liveGames.map(game => (
                    <div key={game.id} className="w-full bg-black/60 border border-white/5 rounded-3xl p-5 flex items-center justify-between hover:border-[#d4af37]/40 transition-all group shrink-0">
                        <div className="flex items-center gap-5 min-w-0">
                            <div className="relative cursor-pointer hover:scale-105 transition-transform shrink-0">
                                <img src={game.avatar} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="" />
                                <div className="absolute -bottom-2 -right-2 bg-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md text-white border border-black uppercase font-sans">Live</div>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <p className="text-white text-lg font-bold font-['Cinzel'] truncate cursor-pointer hover:text-[#d4af37] transition-colors tracking-wide">{game.name}</p>
                                    <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-zinc-400 font-bold border border-white/10 uppercase font-sans">Blitz</span>
                                </div>
                                <p className="text-sm text-zinc-400 truncate mb-3 tracking-wide cursor-default font-sans">{game.currentGame}</p>
                                <div className="flex items-center gap-5 text-zinc-500">
                                    <div className="flex items-center gap-2"><Users size={14} className="text-[#d4af37]" /><span className="text-xs font-bold font-sans">{game.viewers}</span></div>
                                    <div className="flex items-center gap-2"><Clock size={14} /><span className="text-xs font-bold font-sans">{game.timeElapsed}</span></div>
                                </div>
                            </div>
                        </div>
                        <button className="bg-[#d4af37] text-black w-14 h-14 rounded-2xl hover:bg-white transition-all shadow-lg flex items-center justify-center group-hover:scale-105 cursor-pointer active:scale-95">
                            <Eye size={24} strokeWidth={3} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* DERECHA: SOLICITUDES */}
      <div className="hidden xl:flex flex-col w-96 gap-6 shrink-0 h-full overflow-hidden">
        <div className="bg-black/40 border border-white/5 rounded-[48px] p-8 flex-grow flex flex-col min-h-0 overflow-hidden backdrop-blur-md">
          <h4 className="text-[#d4af37] font-['Cinzel'] text-sm tracking-[0.5em] mb-6 text-center uppercase font-black italic cursor-default shrink-0">Solicitudes</h4>
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4 mb-4">
            {requests.length > 0 ? requests.map((req) => (
              <div key={req.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:border-white/20 transition-all group shrink-0">
                <div className="flex items-center gap-4 mb-4">
                  <img src={req.avatar} className="w-12 h-12 rounded-xl object-cover cursor-pointer hover:scale-105 transition-transform" alt="" />
                  <div className="min-w-0">
                    <p className="text-white font-['Cinzel'] text-base font-bold truncate w-32 cursor-pointer hover:text-[#d4af37] transition-colors tracking-wide">{req.name}</p>
                    <p className="text-[#d4af37] font-black text-base tracking-tighter font-sans">{req.elo} ELO</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => acceptRequest(req)} className="py-2.5 bg-[#d4af37] text-black rounded-xl hover:bg-white transition-all flex justify-center cursor-pointer shadow-md active:scale-95"><Check size={20} strokeWidth={3} /></button>
                  <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="py-2.5 bg-white/5 text-zinc-500 rounded-xl hover:text-red-500 border border-white/5 flex justify-center cursor-pointer active:scale-95"><X size={20} /></button>
                </div>
              </div>
            )) : (
              <p className="text-zinc-600 text-xs text-center py-10 uppercase tracking-widest italic font-sans">Sin solicitudes</p>
            )}
          </div>
          <button className="w-full py-5 bg-[#d4af37] text-black rounded-3xl text-sm tracking-[0.3em] font-black uppercase flex items-center justify-center gap-3 shadow-lg hover:bg-white transition-all cursor-pointer shrink-0 active:scale-95"><UserPlus size={20} strokeWidth={3} /> INVITAR</button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

function StatItem({ label, value }: any) {
  return (
    <div className="flex justify-between items-center cursor-default group">
      <span className="text-xs text-zinc-500 font-bold tracking-[0.2em] uppercase group-hover:text-zinc-300 transition-colors font-sans">{label}</span>
      <span className="text-2xl text-[#d4af37] font-black font-['Cinzel']">{value}</span>
    </div>
  );
}

function LogItem({ user, action, time }: any) {
  return (
    <div className="flex flex-col border-l-2 border-[#d4af37]/30 pl-4 py-2 hover:bg-white/5 transition-all cursor-pointer group">
      <p className="text-xs text-white font-bold tracking-tight uppercase truncate font-sans">{user} <span className="text-zinc-500 font-normal lowercase group-hover:text-zinc-400">{action}</span></p>
      <span className="text-[10px] text-[#d4af37]/50 mt-1 font-sans">{time}</span>
    </div>
  );
}

function FriendRow({ friend, onChat }: any) {
  return (
    <div className={`group flex items-center gap-6 p-4 mb-2 hover:bg-white/[0.04] rounded-[24px] transition-all border border-transparent hover:border-white/5 relative shrink-0 ${!friend.online ? 'opacity-50 hover:opacity-100' : ''}`}>
      <div className="relative shrink-0 cursor-pointer hover:scale-105 transition-transform">
        <img src={friend.avatar} className={`w-16 h-16 rounded-xl object-cover border-2 ${friend.online ? 'border-[#d4af37]' : 'border-zinc-800'}`} alt="" />
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#050505] ${friend.online ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-zinc-700'}`}></div>
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="text-white font-['Cinzel'] font-bold text-lg tracking-widest uppercase truncate cursor-pointer group-hover:text-[#d4af37] transition-colors">{friend.name}</h3>
        <p className="text-sm text-[#d4af37] font-bold cursor-default tracking-wide font-sans">{friend.elo} ELO <span className="text-zinc-500 ml-2 font-normal uppercase font-sans">• {friend.statusText}</span></p>
      </div>
      <div className="flex gap-2 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <button className="p-3.5 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 rounded-xl hover:bg-[#d4af37] hover:text-black transition-all cursor-pointer active:scale-95"><Swords size={20} strokeWidth={2.5} /></button>
        <button onClick={onChat} className="p-3.5 bg-white/5 text-[#d4af37] rounded-xl hover:bg-[#d4af37] hover:text-black transition-all border border-white/5 cursor-pointer active:scale-95"><MessageSquare size={20} strokeWidth={2.5} /></button>
      </div>
    </div>
  );
}