import React, { useState } from 'react';

export default function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('LAS CONTRASEÑAS NO COINCIDEN');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: name, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        let errorMsg = data.email ? "EL EMAIL YA ESTÁ REGISTRADO" : data.username ? "EL NOMBRE YA EXISTE" : "ERROR EN EL REGISTRO";
        throw new Error(errorMsg);
      }

      alert("¡REGISTRO EXITOSO!");
      onSwitchToLogin();
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-fit mx-auto p-8 md:p-12 space-y-10 flex flex-col items-center bg-black/40 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] font-['Cinzel'] uppercase">Unirse</h2>
        <p className="text-[#d4af37] text-[10px] tracking-[0.4em] uppercase font-bold opacity-60">Comienza tu legado hoy</p>
      </div>

      <form onSubmit={handleSubmit} className="w-80 md:w-96 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold p-3 rounded-xl text-center tracking-widest animate-pulse uppercase">
            {error}
          </div>
        )}

        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
          {[
            { label: 'Nombre de Usuario', val: name, set: setName, type: 'text', placeholder: 'magnus_carlsen' },
            { label: 'Email', val: email, set: setEmail, type: 'email', placeholder: 'gm_chess@example.com' },
            { label: 'Contraseña', val: password, set: setPassword, type: 'password', placeholder: '••••••••' },
            { label: 'Confirmar Clave', val: confirmPassword, set: setConfirmPassword, type: 'password', placeholder: '••••••••' }
          ].map((field) => (
            <div key={field.label} className="space-y-1.5">
              <label className="text-[#d4af37] text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                <span className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></span> {field.label}
              </label>
              <input 
                type={field.type} 
                required 
                value={field.val} 
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white focus:border-[#d4af37]/50 transition-all outline-none text-sm placeholder:text-white/20 placeholder:font-light"
              />
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="w-full py-5 bg-[#d4af37] text-black font-black uppercase text-xs tracking-[0.2em] rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#d4af37]/20">
          {loading ? 'Creando G.M...' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="flex flex-col items-center gap-3">
        <p className="text-white/40 text-[10px] uppercase tracking-widest">¿Ya eres parte de la élite?</p>
        <button onClick={onSwitchToLogin} className="text-[#d4af37] text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors underline underline-offset-8">
          Iniciar sesión ahora
        </button>
      </div>
    </div>
  );
}