"use client";

import { useState, useEffect, useRef } from 'react';
import { Check, Loader2, Shield, UserCircle, Moon, Sun } from 'lucide-react';

interface SettingsFormProps { onClose?: () => void; }

function applyTheme(isDark: boolean) {
  if (!isDark) {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}

function getSavedDarkMode(): boolean {
  try {
    const saved = localStorage.getItem("user_settings");
    if (saved) return JSON.parse(saved).darkMode ?? true;
  } catch {}
  return true;
}

export default function SettingsForm({ onClose }: SettingsFormProps) {
  const [status, setStatus] = useState('online');
  const [darkMode, setDarkMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("user_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      setStatus(parsed.status ?? 'online');
      setDarkMode(parsed.darkMode ?? true);
      applyTheme(parsed.darkMode ?? true);
    }

    // Al desmontar sin guardar, revertir el DOM al estado persistido
    return () => {
      if (!savedRef.current) {
        applyTheme(getSavedDarkMode());
      }
    };
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    // Preview inmediato en el DOM
    applyTheme(newMode);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem("access_token");

    const settings = {
      status,
      darkMode,
      manualAway: status === 'away',
    };
    localStorage.setItem("user_settings", JSON.stringify(settings));
    applyTheme(darkMode);
    savedRef.current = true;

    try {
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/users/me/`, {
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
      // Incluso si el backend falla, el localStorage ya está guardado
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose?.();
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex flex-col p-8 md:p-12 space-y-6 max-h-[95vh] overflow-y-auto custom-scrollbar bg-black/40 in-[.light]:bg-white border border-gold/10 rounded-[3rem] shadow-2xl font-sans">
      <div className="text-center">
        <h2 className="text-white in-[.light]:text-zinc-900 font-cinzel text-4xl uppercase tracking-[0.25em]">Ajustes</h2>
        <p className="text-zinc-500 uppercase text-xs tracking-[0.4em] mt-2">Configuración de Élite</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto w-full">
        <div className="space-y-6">
          <SectionHeader title="Presencia & Social" icon={<UserCircle size={14}/>} />
          <div className="p-8 bg-white/3 in-[.light]:bg-zinc-100 border border-white/5 in-[.light]:border-zinc-200 rounded-4xl space-y-6">
            <div className="grid grid-cols-1 gap-2">
              <StatusBtn label="En Línea"  active={status === 'online'}    color="bg-emerald-500" onClick={() => setStatus('online')} />
              <StatusBtn label="Meditando" active={status === 'away'}      color="bg-amber-500"   onClick={() => setStatus('away')} />
              <StatusBtn label="Incógnito" active={status === 'invisible'} color="bg-zinc-500"    onClick={() => setStatus('invisible')} />
            </div>
          </div>
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
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={handleSave} disabled={isSaving || isSaved} className={`min-w-[340px] py-6 rounded-full font-black uppercase tracking-[0.5em] text-[12px] transition-all flex items-center justify-center gap-3 cursor-pointer ${isSaved ? 'bg-emerald-600 text-white' : 'bg-gold text-black hover:scale-105'} disabled:cursor-not-allowed`}>
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : isSaved ? <Check size={20} /> : "Sincronizar Cambios"}
        </button>
      </div>
    </div>
  );
}

const SectionHeader = ({ title, icon }: any) => (
  <div className="flex items-center gap-3 text-gold text-[10px] uppercase font-black tracking-[0.4em] px-2 opacity-80">
    {icon} <span>{title}</span>
    <div className="grow h-px bg-gold/10 ml-2" />
  </div>
);

const StatusBtn = ({ label, active, color, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-gold/10 border-gold/40' : 'bg-transparent border-white/5 in-[.light]:border-zinc-200 opacity-40 hover:opacity-100'}`}>
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${color} ${active ? 'animate-pulse' : ''}`}></div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-gold' : 'text-zinc-400 in-[.light]:text-zinc-600'}`}>{label}</span>
    </div>
    {active && <div className="w-1.5 h-1.5 bg-gold rotate-45" />}
  </button>
);

const ToggleItem = ({ label, desc, active, onToggle, icon }: any) => (
  <button onClick={onToggle} className="w-full flex items-center justify-between p-6 bg-white/3 in-[.light]:bg-zinc-100 border border-white/5 in-[.light]:border-zinc-200 rounded-4xl hover:bg-white/5 in-[.light]:hover:bg-zinc-200 transition-all text-left cursor-pointer">
    <div className="flex items-center gap-4 text-zinc-400 in-[.light]:text-zinc-600">
      {icon}
      <div>
        <p className="text-white in-[.light]:text-zinc-900 font-bold text-sm uppercase tracking-wider">{label}</p>
        <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{desc}</p>
      </div>
    </div>
    <div className={`w-10 h-5 rounded-full relative transition-all p-1 ${active ? 'bg-gold' : 'bg-zinc-800 in-[.light]:bg-zinc-300'}`}>
      <div className={`w-3 h-3 bg-black rounded-full transition-transform ${active ? 'translate-x-5 bg-white' : 'translate-x-0'}`} />
    </div>
  </button>
);
