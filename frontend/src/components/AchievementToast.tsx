// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementToast() {
  const [notification, setNotification] = useState<string | null>(null);

  const handleAchievement = useCallback((e: any) => {
    setNotification(null);
    // Usamos el siguiente frame para asegurar que React reinicie el ciclo de vida
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
      // Duración optimizada: 1.5 segundos totales
      const timer = setTimeout(() => setNotification(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <AnimatePresence>
      {notification && (
        <>
          {/* Overlay optimizado con opacidad fija para evitar lag en móviles */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-[4px] pointer-events-none"
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              key={notification}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: { type: "spring", stiffness: 500, damping: 25 } 
              }}
              exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
              className="relative w-full max-w-lg flex flex-col items-center"
              style={{ willChange: "transform, opacity" }}
            >
              {/* Brillo de fondo simplificado para rendimiento */}
              <div className="absolute inset-0 bg-[#f1c40f]/10 blur-[60px] rounded-full" />
              
              <div className="relative text-center">
                <p className="text-[#f1c40f] text-[10px] sm:text-xs tracking-[0.5em] font-bold uppercase mb-2"
                   style={{ fontFamily: "'Cinzel', serif" }}>
                  ¡Puzzle Resuelto!
                </p>
                
                <h2 className="text-[12vw] sm:text-7xl md:text-8xl font-black italic text-white leading-none mb-4"
                    style={{ 
                      fontFamily: "'Cinzel', serif",
                      textShadow: "0 0 30px rgba(241, 196, 15, 0.5)"
                    }}>
                  ¡EXCELENTE!
                </h2>

                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "80%" }}
                  className="h-0.5 bg-gradient-to-r from-transparent via-[#2ecc71] to-transparent mx-auto mb-4"
                />

                <p className="text-white/90 text-sm sm:text-base font-medium italic max-w-[280px] sm:max-w-none mx-auto"
                   style={{ fontFamily: "'Marcellus', serif" }}>
                  {notification}
                </p>
                
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                  className="text-4xl sm:text-5xl mt-6 drop-shadow-lg"
                >
                  🏆
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}