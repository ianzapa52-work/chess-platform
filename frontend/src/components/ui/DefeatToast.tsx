"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DefeatToast() {
  const [defeatData, setDefeatData] = useState<{ message: string; elo?: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleDefeat = useCallback((e: any) => {
    setDefeatData(null);
    requestAnimationFrame(() => {
      setDefeatData(e.detail);
    });
  }, []);

  useEffect(() => {
    window.addEventListener('game-defeat', handleDefeat);
    return () => window.removeEventListener('game-defeat', handleDefeat);
  }, [handleDefeat]);

  useEffect(() => {
    if (defeatData) {
      const timer = setTimeout(() => setDefeatData(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [defeatData]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {defeatData && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none p-4">
          {/* Overlay oscuro y rojizo con desaturación fuerte */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/90 backdrop-grayscale"
          />
          
          <motion.div
            initial={{ scale: 1.2, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative text-center z-10"
          >
            {/* Resplandor rojo de fondo */}
            <div className="absolute inset-0 bg-red-600/10 blur-[80px] -z-10" />

            <h3 className="text-red-500/60 font-black text-xs md:text-sm tracking-[0.4em] uppercase mb-4">
              Fin de la partida
            </h3>

            {/* Efecto de "sacudida" en el texto de derrota */}
            <motion.h2 
              animate={{ x: [-1, 1, -1, 1, 0] }}
              transition={{ repeat: 2, duration: 0.2 }}
              className="text-zinc-200 font-black text-7xl md:text-9xl italic mb-2 tracking-tighter"
            >
              DERROTA
            </motion.h2>

            <div className="space-y-1">
              <p className="text-zinc-500 text-xl md:text-2xl font-bold tracking-[0.1em] uppercase">
                {defeatData.message}
              </p>
              {defeatData.elo && (
                <p className="text-zinc-600 text-sm font-black italic">
                  RATING: <span className="text-red-800">-{defeatData.elo}</span>
                </p>
              )}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="text-6xl mt-10 grayscale"
            >
              💀
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}