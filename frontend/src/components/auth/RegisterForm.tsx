"use client";

import React, { useState } from 'react';

export default function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); 

  // Validación de formato de email
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('FORMATO DE EMAIL INVÁLIDO');
      return;
    }

    if (password !== confirmPassword) {
      setError('LAS CONTRASEÑAS NO COINCIDEN');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          username: name, 
          password: password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = "ERROR EN EL REGISTRO";
        if (data.email) errorMsg = "EMAIL YA REGISTRADO";
        else if (data.username) errorMsg = "NOMBRE DE USUARIO YA EXISTE";
        else if (data.password) errorMsg = "LA CONTRASEÑA ES DEMASIADO SIMPLE";
        else if (data.detail) errorMsg = data.detail;
        
        throw new Error(errorMsg);
      }

      setSuccess(true);
      setTimeout(() => {
        onSwitchToLogin();
      }, 2500);

    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full p-8 md:p-12 flex flex-col items-center justify-center space-y-6 chess-card min-h-[400px]">
        <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center border-2 border-gold animate-bounce">
          <span className="text-gold text-4xl">✓</span>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">¡Bienvenido, Maestro!</h2>
          <p className="text-zinc-400 text-xs uppercase tracking-widest px-4">
            Tu cuenta ha sido creada con éxito. <br/> 
            Redirigiendo al acceso...
          </p>
        </div>
        <div className="w-full max-w-[200px] h-1 bg-white/5 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-gold animate-[loading_2.5s_ease-in-out]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 md:p-12 space-y-10 flex flex-col items-center chess-card">
      <div className="chess-title-group">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Unirse</h2>
        <p className="text-gold/60 text-xs uppercase tracking-wider">Comienza tu legado hoy</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {error && (
          <div className="chess-error bg-red-500/10 border border-red-500/50 p-3 text-red-500 text-[10px] text-center rounded uppercase tracking-wider">
            {error}
          </div>
        )}

        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {[
            { label: 'Usuario', val: name, set: setName, type: 'text', placeholder: 'magnus_carlsen' },
            { label: 'Email', val: email, set: setEmail, type: 'email', placeholder: 'gm_chess@example.com' },
            { label: 'Contraseña', val: password, set: setPassword, type: 'password', placeholder: '••••••••' },
            { label: 'Confirmar Clave', val: confirmPassword, set: setConfirmPassword, type: 'password', placeholder: '••••••••' }
          ].map((field) => (
            <div key={field.label} className="chess-form-group">
              <label className="chess-label flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">
                <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_#d4af37] ${error.includes(field.label.toUpperCase()) ? 'bg-red-500' : 'bg-gold'}`}></span> {field.label}
              </label>
              <input 
                type={field.type} 
                required 
                value={field.val} 
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="chess-input w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-gold/50 transition-all"
              />
            </div>
          ))}
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="btn-gold w-full bg-gold text-black font-black uppercase tracking-[0.3em] py-4 rounded-xl hover:bg-white hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Creando G.M...' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="flex flex-col items-center gap-4">
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">¿Ya eres parte de la élite?</p>
        <button onClick={onSwitchToLogin} className="text-gold hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
          Iniciar sesión ahora
        </button>
      </div>
    </div>
  );
}