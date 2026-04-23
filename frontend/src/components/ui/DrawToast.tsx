"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DrawToast() {
  const [drawData, setDrawData] = useState<{ message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleDraw = useCallback((e: any) => {
    setDrawData(null);
    requestAnimationFrame(() => setDrawData(e.detail));
  }, []);

  useEffect(() => {
    window.addEventListener('game-draw', handleDraw);
    return () => window.removeEventListener('game-draw', handleDraw);
  }, [handleDraw]);

  useEffect(() => {
    if (drawData) {
      const timer = setTimeout(() => setDrawData(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [drawData]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {drawData && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none p-4">
          {/* Overlay azul grisáceo suave */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="relative text-center z-10"
          >
            <h3 className="text-slate-400 font-black text-xs md:text-sm tracking-[0.5em] uppercase mb-4">
              Tablas
            </h3>

            <h2 className="text-white font-black text-7xl md:text-9xl italic mb-2 tracking-tighter">
              EMPATE
            </h2>

            <p className="text-slate-300 text-xl font-light tracking-[0.2em] uppercase">
              {drawData.message}
            </p>

            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="text-6xl mt-10 opacity-50"
            >
              🤝
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}