"use client";

import { useState, useEffect } from 'react';
import SettingsForm from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  useEffect(() => {
    document.title = "WELIKECHESS | Ajustes";
  }, []);

  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <main className="min-h-screen bg-[#050505] [.light_&]:bg-white flex items-center justify-center p-4">
      {/* Fondo decorativo dinámico que podrías ajustar luego para modo claro */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#000000_100%)] opacity-70 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-7xl bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden">
        <SettingsForm onClose={() => setIsOpen(false)} />
      </div>
    </main>
  );
}