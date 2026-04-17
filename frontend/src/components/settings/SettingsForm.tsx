"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, Loader2, Shield, LogOut, Volume2, 
  Bell, UserCircle, Lock, Moon, Sun 
} from 'lucide-react';

interface SettingsFormProps {
  onClose?: () => void;
}

export default function SettingsForm({ onClose }: SettingsFormProps) {
  const router = useRouter();
  
  const [volume, setVolume] = useState(80);
  const [status, setStatus] = useState('online');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setVolume(parsed.volume ?? 80);
        setStatus(parsed.status ?? 'online');
        setNotifications(parsed.notifications ?? true);
        setDarkMode(parsed.darkMode ?? true);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem("user_settings", JSON.stringify({ volume, status, notifications, darkMode }));
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => onClose?.(), 1000);
  };

  return (
    <div className="relative flex flex-col p-8 md:p-12 space-y-6 max-h-[95vh] overflow-y-auto custom-scrollbar font-sans bg-black/40 border border-gold/10 rounded-[3rem] shadow-2xl">
      
      {/* DECORACIÓN ELEGANTE: Brillo superior y esquinas */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-50" />
      <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-gold/20 rounded-tl-3xl" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t border-r border-gold/20 rounded-tr-3xl" />
      
      {/* HEADER */}
      <div className="chess-title-group relative z-10">
        <h2 className="text-white font-cinzel text-4xl uppercase tracking-[0.25em] drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">Ajustes</h2>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent mx-auto my-2" />
        <p className="text-zinc-500 uppercase text-xs tracking-[0.4em]">Configuración de Élite</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto w-full relative z-10">
        
        {/* COLUMNA 1: IDENTIDAD & SOCIAL */}
        <div className="space-y-6">
          <SectionHeader title="Presencia & Social" icon={<UserCircle size={14}/>} />
          
          <div className="space-y-4">
            <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-6 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gold/[0.01] group-hover:bg-gold/[0.03] transition-colors" />
              <div className="relative flex items-center gap-2 justify-center text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
                <span className="w-1.5 h-1.5 bg-gold/40 rotate-45" /> Estado del Perfil
              </div>
              <div className="relative grid grid-cols-1 gap-2">
                <StatusBtn label="En la Arena (Online)" active={status === 'online'} color="bg-emerald-500" onClick={() => setStatus('online')} />
                <StatusBtn label="Meditando (Ausente)" active={status === 'away'} color="bg-amber-500" onClick={() => setStatus('away')} />
                <StatusBtn label="Modo Incógnito" active={status === 'invisible'} color="bg-zinc-500" onClick={() => setStatus('invisible')} />
              </div>
            </div>

            <ToggleItem 
              label="Notificaciones" 
              desc="Alertas de desafíos y mensajes" 
              active={notifications} 
              onToggle={() => setNotifications(!notifications)} 
              icon={<Bell size={20}/>} 
            />
          </div>
        </div>

        {/* COLUMNA 2: SISTEMA & SEGURIDAD */}
        <div className="space-y-6">
          <SectionHeader title="Hardware & Seguridad" icon={<Shield size={14}/>} />
          
          <div className="space-y-4">
            <ToggleItem 
              label="Modo Oscuro" 
              desc="Interfaz de baja luminosidad" 
              active={darkMode} 
              onToggle={() => setDarkMode(!darkMode)} 
              icon={darkMode ? <Moon size={20} className="text-gold"/> : <Sun size={20} className="text-gold"/>} 
            />

            <div className="p-8 bg-black/60 border border-gold/20 rounded-[2rem] space-y-5 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              </div>
              <div className="flex justify-between items-end relative">
                <div className="flex items-center gap-2 text-[16px] uppercase font-bold text-gold/60 tracking-widest">
                  <Volume2 size={38} /> Volumen Maestro
                </div>
                <span className="text-3xl font-black text-white font-cinzel text-shadow-gold">{volume}%</span>
              </div>
              <input 
                type="range" 
                value={volume} 
                onChange={(e) => setVolume(parseInt(e.target.value))} 
                className="w-full h-1 accent-gold appearance-none rounded-full cursor-pointer bg-zinc-800" 
              />
            </div>

            <button className="w-full p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-gold/40 hover:bg-gold/[0.02] transition-all text-left cursor-pointer">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-white/5 rounded-2xl text-gold group-hover:bg-gold group-hover:text-black group-hover:shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all">
                  <Lock size={18}/>
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-cinzel tracking-wide">Seguridad</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 group-hover:text-zinc-300">Cambiar contraseña</p>
                </div>
              </div>
              <span className="text-gold text-xl group-hover:translate-x-2 transition-transform opacity-50 group-hover:opacity-100">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE DE ACCIONES FINALES */}
      <div className="flex flex-col items-center gap-6 w-full pt-4">
        <button 
          onClick={() => window.location.assign("/auth")} 
          className="max-w-md w-full py-4 bg-red-500/5 border border-red-500/10 rounded-full flex items-center justify-center gap-3 group hover:bg-red-950/40 hover:border-red-500/40 transition-all cursor-pointer"
        >
          <LogOut size={16} className="text-red-500/60 group-hover:text-red-500 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/40 group-hover:text-red-500 transition-colors">Cerrar Sesión</span>
        </button>

        <div className="flex items-center gap-6 w-full">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
          <button 
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className={`min-w-[340px] py-6 rounded-full font-black uppercase tracking-[0.5em] text-[12px] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${
              isSaved ? 'bg-emerald-600 text-white shadow-emerald-900/20' : 'bg-gold text-black hover:scale-[1.03] active:scale-95 hover:shadow-gold/20'
            } disabled:opacity-50 relative overflow-hidden`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : isSaved ? <Check size={20} strokeWidth={4} /> : "Sincronizar Cambios"}
            {!isSaved && !isSaving && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />}
          </button>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

const SectionHeader = ({ title, icon }: any) => (
  <div className="flex items-center gap-3 text-gold text-[11px] uppercase font-bold tracking-[0.4em] px-2 drop-shadow-[0_0_8px_rgba(212,175,55,0.2)]">
    <div className="relative">
      <div className="absolute inset-0 bg-gold blur-md opacity-20" />
      <span className="relative w-1.5 h-1.5 bg-gold rotate-45 inline-block" />
    </div>
    {icon}
    <span>{title}</span>
    <div className="flex-grow h-px bg-gradient-to-r from-gold/30 via-gold/5 to-transparent ml-2" />
  </div>
);

const ToggleItem = ({ label, desc, active, onToggle, icon }: any) => (
  <div className="flex items-center justify-between p-7 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:border-gold/20 hover:bg-white/[0.05] transition-all group">
    <div className="flex items-center gap-5">
      <div className="text-zinc-500 group-hover:text-gold group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-colors">{icon}</div>
      <div>
        <p className="text-xl font-bold text-white font-cinzel group-hover:text-gold transition-colors">{label}</p>
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 font-medium">{desc}</p>
      </div>
    </div>
    <button onClick={onToggle} className={`w-12 h-6 rounded-full relative transition-all duration-500 p-1 cursor-pointer border border-white/10 ${active ? 'bg-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-zinc-900'}`}>
      <div className={`w-4 h-4 bg-black rounded-full transition-all duration-500 transform shadow-sm ${active ? 'translate-x-6 bg-white' : 'translate-x-0'}`} />
    </button>
  </div>
);

const StatusBtn = ({ label, active, color, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${active ? 'bg-gold/10 border-gold/40 opacity-100 shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]' : 'bg-transparent border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'}`}>
    <div className="flex items-center gap-4 relative z-10">
      <div className={`w-2 h-2 rounded-full ${color} ${active ? 'animate-pulse shadow-[0_0_12px_currentColor]' : ''}`}></div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-gold' : 'text-white'}`}>{label}</span>
    </div>
    {active && <div className="w-1.5 h-1.5 bg-gold rotate-45 relative z-10 shadow-[0_0_8px_#d4af37]" />}
  </button>
);