"use client";

import React, { useState, useEffect } from 'react';
import { Check, Loader2, Shield, Volume2, Bell, UserCircle, Moon, Sun } from 'lucide-react';

interface SettingsFormProps { onClose?: () => void; }

export default function SettingsForm({ onClose }: SettingsFormProps) {
  const [volume, setVolume] = useState(80);
  const [status, setStatus] = useState('online');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("user_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      setVolume(parsed.volume ?? 80);
      setStatus(parsed.status ?? 'online');
      setNotifications(parsed.notifications ?? true);
      setDarkMode(parsed.darkMode ?? true);
      if (parsed.darkMode === false) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (!newMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem("access_token");

    const settings = {
      volume,
      status,
      notifications,
      darkMode,
      manualAway: status === 'away',
    };
    localStorage.setItem("user_settings", JSON.stringify(settings));

    try {
      if (token) {
        await fetch('http://localhost:8000/api/users/me/', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: status !== 'invisible' })
        });
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setIsSaved(true);

      window.dispatchEvent(new Event('user-updated'));

      setTimeout(() => {
        setIsSaved(false);
        onClose?.();
      }, 1000);
    } catch (error) {
      console.error("Error de sincronización:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex flex-col p-8 md:p-12 space-y-6 max-h-[95vh] overflow-y-auto custom-scrollbar bg-black/40 border border-gold/10 rounded-[3rem] shadow-2xl font-sans">
      <div className="text-center">
        <h2 className="text-white font-cinzel text-4xl uppercase tracking-[0.25em]">Ajustes</h2>
        <p className="text-zinc-500 uppercase text-xs tracking-[0.4em] mt-2">Configuración de Élite</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto w-full">
        <div className="space-y-6">
          <SectionHeader title="Presencia & Social" icon={<UserCircle size={14}/>} />
          <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-6">
            <div className="grid grid-cols-1 gap-2">
              <StatusBtn label="En Línea"  active={status === 'online'}    color="bg-emerald-500" onClick={() => setStatus('online')} />
              <StatusBtn label="Meditando" active={status === 'away'}      color="bg-amber-500"   onClick={() => setStatus('away')} />
              <StatusBtn label="Incógnito" active={status === 'invisible'} color="bg-zinc-500"    onClick={() => setStatus('invisible')} />
            </div>
          </div>
          <ToggleItem label="Notificaciones" desc="Alertas de desafíos" active={notifications} onToggle={() => setNotifications(!notifications)} icon={<Bell size={20}/>} />
        </div>

        <div className="space-y-6">
          <SectionHeader title="Hardware & Sistema" icon={<Shield size={14}/>} />
          <ToggleItem
            label="Modo Oscuro"
            desc={darkMode ? "Interfaz nocturna" : "Interfaz clara"}
            active={darkMode}
            onToggle={toggleDarkMode}
            icon={darkMode ? <Moon size={20}/> : <Sun size={20}/>}
          />
          <div className="p-8 bg-black/60 border border-gold/20 rounded-[2rem] space-y-5">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2 text-gold/60 font-bold uppercase text-xs tracking-widest"><Volume2 size={24} /> Volumen</div>
              <span className="text-2xl text-white font-cinzel">{volume}%</span>
            </div>
            <input type="range" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-full h-1 accent-gold appearance-none rounded-full cursor-pointer bg-zinc-800" />
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={handleSave} disabled={isSaving || isSaved} className={`min-w-[340px] py-6 rounded-full font-black uppercase tracking-[0.5em] text-[12px] transition-all flex items-center justify-center gap-3 ${isSaved ? 'bg-emerald-600 text-white' : 'bg-gold text-black hover:scale-105 cursor-pointer'}`}>
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : isSaved ? <Check size={20} /> : "Sincronizar Cambios"}
        </button>
      </div>
    </div>
  );
}

const SectionHeader = ({ title, icon }: any) => (
  <div className="flex items-center gap-3 text-gold text-[10px] uppercase font-black tracking-[0.4em] px-2 opacity-80">
    {icon} <span>{title}</span>
    <div className="flex-grow h-px bg-gold/10 ml-2" />
  </div>
);

const StatusBtn = ({ label, active, color, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-gold/10 border-gold/40' : 'bg-transparent border-white/5 opacity-40 hover:opacity-100'}`}>
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${color} ${active ? 'animate-pulse' : ''}`}></div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-gold' : 'text-zinc-400'}`}>{label}</span>
    </div>
    {active && <div className="w-1.5 h-1.5 bg-gold rotate-45" />}
  </button>
);

const ToggleItem = ({ label, desc, active, onToggle, icon }: any) => (
  <button onClick={onToggle} className="w-full flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all text-left">
    <div className="flex items-center gap-4 text-zinc-400">
      {icon}
      <div>
        <p className="text-white font-bold text-sm uppercase tracking-wider">{label}</p>
        <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{desc}</p>
      </div>
    </div>
    <div className={`w-10 h-5 rounded-full relative transition-all p-1 ${active ? 'bg-gold' : 'bg-zinc-800'}`}>
      <div className={`w-3 h-3 bg-black rounded-full transition-transform ${active ? 'translate-x-5 bg-white' : 'translate-x-0'}`} />
    </div>
  </button>
);