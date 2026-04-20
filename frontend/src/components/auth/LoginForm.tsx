"use client";

import React, { useState } from 'react';

export default function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validación de formato de email
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación previa al envío
    if (!validateEmail(email)) {
      setError('FORMATO DE EMAIL INVÁLIDO');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          password: password 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        let errorMsg = "ERROR DE AUTENTICACIÓN";

        // Diferenciación específica de errores por Status Code
        if (response.status === 404) {
          errorMsg = "EL EMAIL NO EXISTE";
        } else if (response.status === 401) {
          errorMsg = "CONTRASEÑA INCORRECTA";
        } else {
          errorMsg = data.detail || "CREDENCIALES INVÁLIDAS";
        }
        
        throw new Error(errorMsg);
      }
      
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      window.dispatchEvent(new Event('user-auth-change'));
      window.location.assign("/profile");
      
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8 md:p-12 space-y-10 flex flex-col items-center chess-card">
      <div className="chess-title-group">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Acceso</h2>
        <p className="text-gold/60 text-xs uppercase tracking-wider">Bienvenido de nuevo, Maestro</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {error && (
          <div className="chess-error bg-red-500/10 border border-red-500/50 p-3 text-red-500 text-[10px] text-center rounded uppercase tracking-wider animate-shake">
            {error}
          </div>
        )}
        
        <div className="space-y-5">
          <div className="chess-form-group">
            <label className="chess-label flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">
              <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px] ${error.includes('EMAIL') ? 'bg-red-500 shadow-red-500' : 'bg-gold shadow-gold'}`}></span> Email
            </label>
            <input 
              type="email" 
              required 
              placeholder="tu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="chess-input w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-gold/50 transition-all" 
            />
          </div>

          <div className="chess-form-group">
            <label className="chess-label flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">
              <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px] ${error.includes('CONTRASEÑA') ? 'bg-red-500 shadow-red-500' : 'bg-gold shadow-gold'}`}></span> Contraseña
            </label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="chess-input w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-gold/50 transition-all" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="btn-gold w-full bg-gold text-black font-black uppercase tracking-[0.3em] py-4 rounded-xl hover:bg-white hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Validando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="flex flex-col items-center gap-4">
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">¿Aún no tienes rango?</p>
        <button 
          onClick={onSwitchToRegister} 
          className="text-gold hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Registrar nuevo gran maestro
        </button>
      </div>
    </div>
  );
}