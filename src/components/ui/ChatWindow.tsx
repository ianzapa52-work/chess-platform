"use client";

import { FormEvent, useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface ChatMessage {
  id: number;
  sender_username: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

interface ChatRoom {
  id: number;
  other_user: { username: string; avatar: string | null };
  last_message: ChatMessage | null;
  last_message_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000';

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

const avatarSrc = (src: string | null | undefined) => src ?? '/avatars/b_king_avatar.png';
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function calcFriendStatus(lastSeen: string | null): 'online' | 'away' | 'offline' {
  if (!lastSeen) return 'offline';
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 8 * 60 * 1000) return 'online';
  if (diff < 60 * 60 * 1000) return 'away';
  return 'offline';
}

export default function ChatWindow() {
  const [isOpen, setIsOpen]         = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [room, setRoom]             = useState<ChatRoom | null>(null);
  const [friendUsername, setFriendUsername] = useState<string | null>(null);
  const [friendLastSeen, setFriendLastSeen] = useState<string | null>(null);
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [sending, setSending]       = useState(false);
  const [wsReady, setWsReady]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);

  const { isLight } = useTheme();
  const scrollRef      = useRef<HTMLDivElement>(null);
  const wsRef          = useRef<WebSocket | null>(null);
  const isOpenRef      = useRef(false);
  const optimisticIdRef = useRef(-1);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Obtener mi username desde /api/users/me/
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch(`${API}/api/users/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setMyUsername(data.username ?? null))
      .catch(() => {});
  }, []);

  const closeWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsReady(false);
  }, []);

  const openWs = useCallback((roomId: number) => {
    closeWs();
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(`${WS_BASE}/ws/chat/${roomId}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setWsReady(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'error') { setError(data.message); return; }

        const incoming: ChatMessage = {
          id:              data.id,
          sender_username: data.sender_username,
          text:            data.text,
          is_read:         false,
          created_at:      data.created_at,
        };

        setMessages(prev => {
          // Reemplazar el primer mensaje optimista del mismo remitente con el real
          const idx = prev.findIndex(m => m.id < 0 && m.sender_username === incoming.sender_username);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = incoming;
            return next;
          }
          return [...prev, incoming];
        });

      } catch { /* silent */ }
    };

    ws.onerror = () => setError('Error de conexión WebSocket');

    ws.onclose = (e) => {
      setWsReady(false);
      if (e.code !== 1000) {
        setTimeout(() => openWs(roomId), 2000);
      }
    };
  }, [closeWs]);

  useEffect(() => {
    setMounted(true);

    const handleOpen = async (e: Event) => {
      const { username } = (e as CustomEvent).detail as { username: string };
      if (!username) return;

      setFriendUsername(username);
      setFriendLastSeen(null);
      setIsOpen(true);
      setError(null);
      setMessages([]);
      setLoadingRoom(true);
      closeWs();

      try {
        const [chatRoom, profile] = await Promise.all([
          apiFetch<ChatRoom>(`/api/chat/start/${username}/`, { method: 'POST' }),
          apiFetch<{ last_seen: string | null }>(`/api/users/${username}/`).catch(() => ({ last_seen: null })),
        ]);
        setRoom(chatRoom);
        setFriendLastSeen(profile.last_seen ?? null);

        const history = await apiFetch<ChatMessage[]>(`/api/chat/${chatRoom.id}/history/`);
        setMessages(history);

        openWs(chatRoom.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo abrir el chat');
      } finally {
        setLoadingRoom(false);
      }
    };

    window.addEventListener('open-chat', handleOpen);
    return () => {
      window.removeEventListener('open-chat', handleOpen);
      closeWs();
    };
  }, [openWs, closeWs]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !wsRef.current || !wsReady || sending) return;

    setSending(true);
    setInputValue('');

    const optimistic: ChatMessage = {
      id:              optimisticIdRef.current--,
      sender_username: myUsername ?? '__me__',
      text,
      is_read:         false,
      created_at:      new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    wsRef.current.send(JSON.stringify({ text }));
    setSending(false);
  };

  const isMine = (msg: ChatMessage) =>
    msg.sender_username === myUsername || msg.sender_username === '__me__';

  if (!mounted) return null;

  return (
    <>
      {/* Overlay translúcido — se puede ver el fondo */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[998] transition-opacity duration-700
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />

      <aside
        data-chat-open={isOpen ? "true" : "false"}
        className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-[#050505]/95 in-[.light]:bg-white border-l border-gold/20
          z-[999] shadow-[-20px_0_50px_rgba(0,0,0,0.9)] in-[.light]:shadow-[-20px_0_50px_rgba(0,0,0,0.08)] flex flex-col
          transition-transform duration-500 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <header className="p-6 border-b border-gold/10 bg-linear-to-r from-zinc-900 via-black to-zinc-900 in-[.light]:from-white in-[.light]:via-gray-50 in-[.light]:to-white relative shrink-0">
          <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gold/50 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full bg-zinc-900 in-[.light]:bg-gray-100 border-2 border-gold/40 overflow-hidden shadow-2xl">
                {room?.other_user?.avatar ? (
                  <img src={avatarSrc(room.other_user.avatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-gold font-serif text-2xl font-bold">
                    {friendUsername?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-white in-[.light]:text-gray-900 font-serif font-medium text-2xl tracking-tight leading-tight italic">
                  {friendUsername ?? 'Chat'}
                </h3>
                {(() => {
                  const st = calcFriendStatus(friendLastSeen);
                  const dot = st === 'online' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)] animate-pulse'
                    : st === 'away'   ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)] animate-pulse'
                    : 'bg-zinc-600';
                  const txt = st === 'online' ? 'En línea' : st === 'away' ? 'Meditando' : 'Desconectado';
                  const col = st === 'online' ? 'text-green-400/70' : st === 'away' ? 'text-amber-400/70' : 'text-zinc-600';
                  return (
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${dot}`} />
                      <span className={`text-[10px] font-sans font-bold tracking-[0.2em] uppercase transition-colors ${col}`}>{txt}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <button onClick={handleClose} className="group p-2 hover:bg-white/5 in-[.light]:hover:bg-gray-100 rounded-full transition-all cursor-pointer">
              <X size={24} className="text-zinc-500 in-[.light]:text-gray-400 group-hover:text-gold group-hover:rotate-90 transition-all duration-300" />
            </button>
          </div>
        </header>

        {/* Mensajes */}
        <div
          ref={scrollRef}
          className="grow overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar"
          style={{ background: isLight ? '#f9fafb' : '#050505' }}
        >
          {loadingRoom && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-600 in-[.light]:text-zinc-400">
              <Loader2 size={28} className="animate-spin text-gold" />
              <span className="text-xs tracking-widest uppercase">Conectando sala...</span>
            </div>
          )}

          {!loadingRoom && error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-red-500 text-xs tracking-widest uppercase">{error}</p>
            </div>
          )}

          {!loadingRoom && !error && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-700 in-[.light]:text-zinc-400">
              <p className="text-xs tracking-widest uppercase">Inicia la conversación</p>
            </div>
          )}

          {!loadingRoom && messages.map((msg) => {
            const mine = isMine(msg);
            return (
              <div key={msg.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                {!mine && (
                  <span className="text-[9px] text-zinc-600 in-[.light]:text-zinc-500 font-bold tracking-widest uppercase px-1 mb-1">
                    {msg.sender_username}
                  </span>
                )}
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[15px] font-sans leading-relaxed shadow-lg
                  ${mine
                    ? 'bg-gold text-black rounded-tr-none font-medium'
                    : 'bg-zinc-900 in-[.light]:bg-gray-100 text-zinc-100 in-[.light]:text-gray-800 border border-white/5 in-[.light]:border-gray-200 rounded-tl-none'
                  }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] mt-1.5 font-bold tracking-tighter text-zinc-600 in-[.light]:text-zinc-400 uppercase px-1">
                  {fmtTime(msg.created_at)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <footer className="p-6 bg-zinc-950 in-[.light]:bg-white border-t border-gold/10 in-[.light]:border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] in-[.light]:shadow-[0_-4px_20px_rgba(0,0,0,0.06)] shrink-0">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-3 bg-white/5 in-[.light]:bg-gray-50 border border-white/10 in-[.light]:border-gray-200 p-2 pl-5 rounded-full focus-within:border-gold/40 focus-within:bg-white/10 in-[.light]:focus-within:bg-white transition-all"
          >
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={!wsReady || loadingRoom}
              className="grow bg-transparent outline-none text-white in-[.light]:text-gray-900 text-sm font-sans placeholder:text-zinc-600 in-[.light]:placeholder:text-zinc-400 disabled:opacity-40"
              placeholder={wsReady ? 'Escribe un mensaje...' : 'Conectando...'}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || !wsReady || sending}
              className="bg-gold hover:bg-white text-black p-3 rounded-full transition-all active:scale-95 disabled:opacity-20 disabled:grayscale cursor-pointer"
            >
              {sending
                ? <Loader2 size={18} className="animate-spin" />
                : <Send size={18} strokeWidth={2.5} />
              }
            </button>
          </form>
          <div className="mt-4 flex justify-center">
            <p className="text-[8px] text-zinc-600 in-[.light]:text-zinc-400 font-bold tracking-[0.3em] uppercase">
              Encriptación de extremo a extremo
            </p>
          </div>
        </footer>
      </aside>
    </>
  );
}