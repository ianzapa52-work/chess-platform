"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VictoryToast() {
  const [winnerData, setWinnerData] = useState<{ message: string; elo?: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleVictory = useCallback((e: any) => {
    setWinnerData(null);
    requestAnimationFrame(() => {
      setWinnerData(e.detail);
    });
  }, []);

  useEffect(() => {
    window.addEventListener('game-victory', handleVictory);
    return () => window.removeEventListener('game-victory', handleVictory);
  }, [handleVictory]);

  useEffect(() => {
    if (winnerData) {
      const timer = setTimeout(() => setWinnerData(null), 4000); // Un poco más de tiempo para disfrutar la victoria
      return () => clearTimeout(timer);
    }
  }, [winnerData]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {winnerData && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none p-4">
          {/* Overlay con gradiente radial para centrar la atención */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)]"
          />
          
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0, filter: "blur(20px)" }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
            className="relative text-center z-10"
          >
            {/* Destello detrás del texto */}
            <motion.div 
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-gold/20 blur-[100px] -z-10"
            />

            <h3 className="text-gold/60 font-black text-xs md:text-sm tracking-[0.5em] uppercase mb-4">
              Duelo Finalizado
            </h3>

            <h2 className="text-white font-black text-7xl md:text-9xl italic mb-2 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              ¡VICTORIA!
            </h2>

            <div className="space-y-1">
              <p className="text-gold text-xl md:text-2xl font-bold tracking-[0.2em] uppercase">
                {winnerData.message}
              </p>
              {winnerData.elo && (
                <p className="text-zinc-500 text-sm font-black italic">
                  PUNTOS DE RATING: <span className="text-green-500">+{winnerData.elo}</span>
                </p>
              )}
            </div>

            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-4 mt-10"
            >
              <div className="text-5xl drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">👑</div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-6xl drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]"
              >
                🏆
              </motion.div>
              <div className="text-5xl drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">👑</div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}