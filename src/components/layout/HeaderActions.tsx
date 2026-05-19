"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname, useSearchParams } from 'next/navigation';
import { Cinzel } from "next/font/google";
import { LogOut, User as UserIcon } from "lucide-react";

const cinzel = Cinzel({ subsets: ["latin"] });

interface HeaderActionsProps {
  variant: 'nav' | 'user';
}

export default function HeaderActions({ variant }: HeaderActionsProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const checkAuth = () => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
    setActiveGameId(localStorage.getItem("active_game_id"));
  };

  useEffect(() => {
    checkAuth();

    window.addEventListener('storage', checkAuth);
    window.addEventListener('user-auth-change', checkAuth);
    window.addEventListener('active-game-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('user-auth-change', checkAuth);
      window.removeEventListener('active-game-change', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    window.location.assign("/");
  };

  const openModal = (name: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`open-${name}`));
    }
  };

  const navBtnClass = `${cinzel.className} px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 in-[.light]:text-black rounded-xl transition-all duration-300 hover:text-gold hover:bg-white/5 in-[.light]:hover:bg-black/10 flex items-center justify-center cursor-pointer select-none`;

  if (variant === 'nav') {
    return (
      <button onClick={() => openModal('history')} className={navBtnClass}>
        Historial
      </button>
    );
  }

  return (
    <div className={`${cinzel.className} flex items-center gap-4`}>
      
      {!isLoggedIn ? (
        <button 
          onClick={() => openModal('login')}
          className="hidden sm:flex items-center justify-center px-6 py-2 rounded-lg border border-white/10 in-[.light]:border-black/30 text-white/70 in-[.light]:text-black text-[10px] font-bold uppercase tracking-[0.15em] hover:border-gold/50 in-[.light]:hover:border-black hover:text-white in-[.light]:hover:bg-black in-[.light]:hover:text-white transition-all duration-300 cursor-pointer"
        >
          Acceso
        </button>
      ) : (
        <>
          {activeGameId && searchParams.get('game_id') !== activeGameId && (
            <Link
              href={`/play-online?game_id=${activeGameId}`}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-green-500/30 in-[.light]:border-green-600/40 bg-green-500/10 in-[.light]:bg-green-50 hover:border-green-500/60 in-[.light]:hover:border-green-600 transition-all cursor-pointer"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-green-400 in-[.light]:text-green-700 uppercase tracking-[0.15em]">Partida activa</span>
            </Link>
          )}
          <Link href="/profile" className="flex items-center gap-3 bg-white/5 in-[.light]:bg-black/5 pl-4 pr-1.5 py-1.5 rounded-xl border border-white/5 in-[.light]:border-black/20 hover:border-gold/30 transition-all group cursor-pointer">
            <span className="text-[10px] font-bold text-zinc-400 in-[.light]:text-black group-hover:text-gold uppercase tracking-widest hidden xl:block">Mi Perfil</span>
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-gold to-[#996515] flex items-center justify-center text-black font-black text-[11px] shadow-lg">
              <UserIcon size={14} />
            </div>
          </Link>

          <button 
            onClick={handleLogout}
            className="group p-2 rounded-lg border border-red-500/10 in-[.light]:border-red-500/40 bg-red-500/5 hover:border-red-500 transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut size={16} className="text-red-500/50 group-hover:text-red-500 transition-colors" />
          </button>
        </>
      )}

      <button onClick={() => openModal('settings')} className="group p-2 rounded-lg border border-white/5 in-[.light]:border-black/10 bg-white/5 in-[.light]:bg-black/5 hover:border-gold/40 transition-all cursor-pointer">
        <img src="/assets/gear.png" className="w-4.5 h-4.5 opacity-50 in-[.light]:opacity-100 in-[.light]:invert group-hover:opacity-100 group-hover:rotate-45 transition-all duration-500 brightness-200 in-[.light]:brightness-0" alt="Ajustes" />
      </button>
    </div>
  );
}