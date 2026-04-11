import React, { useState } from 'react';

export default function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = email || "user@chess.com";
    const user = {
      name: emailValue.split('@')[0].toUpperCase(),
      email: emailValue,
      avatar: "/avatars/w_king_avatar.png"
    };
    localStorage.setItem("user", JSON.stringify(user));
    window.location.assign("/profile");
  };

  return (
    /* Contenedor relativo para posicionar las líneas */
    <div className="relative w-full h-full p-8 md:p-20 flex flex-col items-center justify-center space-y-10">
      
      {/* LÍNEA LATERAL IZQUIERDA (Ultra fina) */}
      <div className="absolute left-4 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
      
      {/* LÍNEA LATERAL DERECHA (Ultra fina) */}
      <div className="absolute right-4 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-[0.2em] font-['Cinzel'] uppercase">
          Acceso
        </h2>
        <p className="text-[#d4af37] text-sm tracking-[0.4em] uppercase font-bold opacity-70">
          Identifícate, Gran Maestro
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8 relative">
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="EMAIL@CHESS.COM"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white text-lg focus:border-[#d4af37]/50 transition-all outline-none"
          />
          <input 
            type="password" 
            placeholder="••••••••"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white text-lg focus:border-[#d4af37]/50 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-6 w-full">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#d4af37]/40"></div>
          <button 
            type="submit"
            className="px-16 py-5 bg-gradient-to-r from-[#8a6d1d] via-[#d4af37] to-[#8a6d1d] text-black font-black uppercase text-base tracking-[0.2em] rounded-full hover:scale-105 transition-all shadow-[0_10px_30px_rgba(212,175,55,0.3)] cursor-pointer"
          >
            Entrar
          </button>
          <div className="flex-1 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent"></div>
        </div>
      </form>

      <div className="flex flex-col items-center gap-4 text-xs font-black uppercase tracking-[0.2em]">
        <span className="text-zinc-500 opacity-50">¿Aún no tienes cuenta?</span>
        <button 
          onClick={onSwitchToRegister}
          className="text-[#d4af37] hover:text-white transition-colors cursor-pointer underline underline-offset-8"
        >
          Registrar nuevo gran maestro
        </button>
      </div>
    </div>
  );
}