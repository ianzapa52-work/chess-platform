"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementToast() {
  const [notification, setNotification] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleAchievement = useCallback((e: any) => {
    setNotification(null);
    requestAnimationFrame(() => {
      setNotification(e.detail);
    });
  }, []);

  useEffect(() => {
    window.addEventListener('puzzle-solved', handleAchievement);
    return () => window.removeEventListener('puzzle-solved', handleAchievement);
  }, [handleAchievement]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 1100);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {notification && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none p-4">
          {/* Fondo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Contenido */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.08, opacity: 0, filter: "blur(6px)", transition: { duration: 0.18, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="relative text-center z-10"
          >
            {/* Destello radial detrás del texto */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none"
            />

            {/* Texto principal */}
            <motion.h2
              initial={{ letterSpacing: "0.05em" }}
              animate={{ letterSpacing: "-0.04em" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-emerald-400 font-black text-7xl md:text-9xl italic tracking-tighter drop-shadow-[0_0_40px_rgba(52,211,153,0.6)] leading-none"
            >
              ¡BIEN!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.18 }}
              className="text-white/70 [.light_&]:text-zinc-700 text-sm font-black tracking-[0.35em] uppercase mt-3"
            >
              {notification}
            </motion.p>

            {/* Línea de acento */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.08, duration: 0.25, ease: "easeOut" }}
              className="mt-4 mx-auto h-px w-32 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}