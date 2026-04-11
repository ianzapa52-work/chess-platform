import React, { useState, useEffect, useRef } from 'react';

interface Message {
  sender: 'me' | 'friend';
  text: string;
  time: string;
}

interface ChatStorage {
  [key: string]: Message[];
}

export default function ChatWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFriend, setActiveFriend] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  const [allConversations, setAllConversations] = useState<ChatStorage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('casino_chats');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('casino_chats', JSON.stringify(allConversations));
  }, [allConversations]);

  useEffect(() => {
    const handleOpen = (e: any) => {
      const friendName = e.detail.name;
      const friendStatus = e.detail.status !== 'offline';
      
      setActiveFriend(friendName);
      setIsOnline(friendStatus);
      setIsOpen(true);

      setAllConversations(prev => {
        if (prev[friendName]) return prev;
        return {
          ...prev,
          [friendName]: [{
            sender: 'friend',
            text: `¡Hola! ¿Qué tal? ¿Te apetece una partida rápida?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        };
      });
    };

    window.addEventListener('open-chat', handleOpen);
    return () => window.removeEventListener('open-chat', handleOpen);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allConversations, isOpen, activeFriend]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeFriend) return;

    const newMessage: Message = {
      sender: 'me',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAllConversations(prev => ({
      ...prev,
      [activeFriend]: [...(prev[activeFriend] || []), newMessage]
    }));
    
    setInputValue('');
  };

  const currentMessages = activeFriend ? allConversations[activeFriend] || [] : [];

  return (
    <>
      {/* Overlay con transición de opacidad suave */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Drawer con visibilidad oculta inicial para evitar el parpadeo de cierre */}
      <aside 
        style={{ visibility: isOpen ? 'visible' : 'hidden' }}
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-[#0c0c0c] border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,1)] z-[101] flex flex-col transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        <header className="p-7 border-b border-white/5 flex justify-between items-center bg-[#0f0f0f]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-3.5 h-3.5 rounded-full border-2 border-[#0c0c0c] ${isOnline ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-zinc-600'}`}></div>
            </div>
            <div>
              <h3 className="text-white font-['Outfit'] font-semibold tracking-tight text-xl m-0 leading-tight">
                {activeFriend || 'Chat'}
              </h3>
              <p className="text-[11px] text-[#d4af37] font-medium uppercase tracking-[0.15em] m-0 opacity-70">
                {isOnline ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-[#d4af37] transition-all cursor-pointer p-2 hover:bg-white/5 rounded-full">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar bg-[#0c0c0c]" ref={scrollRef}>
          <div className="flex items-center gap-4 my-4">
             <div className="flex-grow h-px bg-white/5"></div>
             <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-[0.2em]">Hoy</span>
             <div className="flex-grow h-px bg-white/5"></div>
          </div>
          
          {currentMessages.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-5 py-3.5 rounded-[22px] shadow-lg transition-all ${
                msg.sender === 'me' 
                ? 'bg-[#d4af37] text-black rounded-tr-none' 
                : 'bg-[#1a1a1a] text-zinc-100 border border-white/5 rounded-tl-none'
              }`}>
                <p className="text-[15.5px] leading-relaxed m-0 font-['Outfit'] font-normal">
                  {msg.text}
                </p>
                <span className={`block text-[10px] mt-2 font-medium ${msg.sender === 'me' ? 'text-black/40' : 'text-zinc-500'} text-right`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        <form className="p-6 bg-[#0f0f0f] border-t border-white/5" onSubmit={handleSend}>
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-[24px] p-2 pr-2 pl-5 focus-within:border-[#d4af37]/30 transition-all shadow-inner">
            <input 
              type="text" 
              placeholder="Escribe un mensaje..." 
              className="flex-grow bg-transparent border-none text-white text-[15px] outline-none py-2 font-['Outfit'] placeholder:text-zinc-600"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="bg-[#d4af37] text-black w-11 h-11 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 hover:bg-white active:scale-95 transition-all shadow-xl">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
            </button>
          </div>
        </form>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');
        
        .font-['Outfit'] {
          font-family: 'Outfit', sans-serif !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.3);
        }
      `}</style>
    </>
  );
}