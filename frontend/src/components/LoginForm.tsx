import React, { useState } from 'react';

export default function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error('CREDENCIALES INVÁLIDAS');
      
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.removeItem("user");
      window.location.assign("/profile");
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-fit mx-auto p-8 md:p-12 space-y-10 flex flex-col items-center bg-black/40 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] font-['Cinzel'] uppercase">Acceso</h2>
        <p className="text-[#d4af37] text-[10px] tracking-[0.4em] uppercase font-bold opacity-60">Bienvenido de nuevo, Maestro</p>
      </div>

      <form onSubmit={handleSubmit} className="w-80 md:w-96 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold p-4 rounded-xl text-center tracking-widest animate-pulse uppercase">
            {error}
          </div>
        )}
        
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[#d4af37] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
              <span className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></span> Email del Jugador
            </label>
            <input type="email" required placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-[#d4af37]/50 focus:bg-white/[0.07] transition-all placeholder:opacity-20" />
          </div>

          <div className="space-y-2">
            <label className="text-[#d4af37] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
              <span className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></span> Contraseña
            </label>
            <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-[#d4af37]/50 focus:bg-white/[0.07] transition-all placeholder:opacity-20" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-5 bg-[#d4af37] text-black font-black uppercase text-xs tracking-[0.2em] rounded-full hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#d4af37]/20">
          {loading ? 'Validando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="flex flex-col items-center gap-3">
        <p className="text-white/40 text-[10px] uppercase tracking-widest">¿Aún no tienes rango?</p>
        <button onClick={onSwitchToRegister} className="text-[#d4af37] text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors underline underline-offset-8">
          Registrar nuevo gran maestro
        </button>
      </div>
    </div>
  );
}