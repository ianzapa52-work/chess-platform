"use client";

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: string;
}

export default function ModalFrame({ isOpen, onClose, children, size = "max-w-[115rem]" }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
          {/* OVERLAY con Blur animado */}
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 cursor-pointer"
          />
          
          {/* CONTAINER utilizando las variables de tema y bordes del CSS global */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`relative w-full ${size} bg-[#050505] in-[.light]:bg-white border border-gold/30 in-[.light]:border-gold/20 rounded-[2.5rem] shadow-[0_0_120px_rgba(0,0,0,0.8)] in-[.light]:shadow-[0_8px_60px_rgba(0,0,0,0.12)] overflow-hidden z-10 flex flex-col`}
          >
            <header className="relative w-full h-12 md:h-14 bg-zinc-900/40 in-[.light]:bg-white border-b border-white/5 in-[.light]:border-gray-100 flex items-center px-6 shrink-0 z-20">
              <div className="flex items-center gap-2 opacity-30">
                <div className="w-1.5 h-1.5 rounded-full bg-white in-[.light]:bg-gray-400 rotate-45"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white in-[.light]:bg-gray-400 rotate-45"></div>
              </div>

              <div className="ml-auto flex items-center justify-center">
                <button
                  onClick={onClose}
                  className="group relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/5 in-[.light]:hover:bg-gray-100 transition-all duration-300 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-zinc-500 in-[.light]:text-gray-400 group-hover:text-gold group-hover:rotate-90 transition-all duration-500 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}