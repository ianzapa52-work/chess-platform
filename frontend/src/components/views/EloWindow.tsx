"use client";

import React from 'react';

const RANKINGS = [
  { tier: "Gran Maestro (GM)", range: "2500+", status: "Nivel Máximo", highlight: true },
  { tier: "Maestro Internacional (IM)", range: "2400 - 2499", status: "Internacional", highlight: false },
  { tier: "Maestro FIDE (FM)", range: "2300 - 2399", status: "Avanzado", highlight: false },
  { tier: "Experto", range: "2000 - 2199", status: "Nacional", highlight: false },
  { tier: "Aficionado", range: "0 - 1999", status: "Iniciación", highlight: false },
];

export default function EloWindow() {
  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans">
      {/* Header Section */}
      <div className="px-6 md:px-12 pt-12 pb-8 shrink-0">
        <header className="mb-10 text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-black tracking-[0.2em] leading-tight font-serif uppercase">
            ESCALAFÓN <span className="text-gold">OFICIAL</span>
          </h2>
          <p className="text-zinc-500 text-[11px] tracking-[0.5em] uppercase mt-4 font-bold opacity-70">
            Estándares Internacionales 2026
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-4">
          <InfoBlock 
            title="SISTEMA DE TÍTULOS" 
            text="Los títulos son vitalicios. El ELO fluctúa según el factor K." 
          />
          <InfoBlock 
            title="NORMATIVA DE ÉLITE" 
            text="Superar los 2500 puntos otorga el estatus de Gran Maestro." 
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="px-6 md:px-12 pb-12 flex-grow overflow-hidden flex flex-col min-h-0">
        <div className="bg-black/40 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
          {/* Contenedor con Scroll Dorado */}
          <div className="overflow-y-auto max-h-[400px] scroll-gold">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0a0a0a] text-gold text-[10px] md:text-[12px] tracking-[0.3em] sticky top-0 z-10 font-bold border-b border-gold/10">
                <tr>
                  <th className="px-6 md:px-10 py-5">TÍTULO</th>
                  <th className="px-6 md:px-10 py-5">RATING</th>
                  <th className="px-6 md:px-10 py-5 hidden sm:table-cell text-right">ESTADO</th>
                </tr>
              </thead>
              <tbody className="text-[13px] md:text-[14px]">
                {RANKINGS.map((rank, idx) => (
                  <RankRow key={idx} {...rank} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Fondo del scroll (negro) */
        .scroll-gold::-webkit-scrollbar {
          width: 5px;
        }
        .scroll-gold::-webkit-scrollbar-track {
          background: #050505;
        }
        /* Barra del scroll (dorada) */
        .scroll-gold::-webkit-scrollbar-thumb {
          background: #d4af37;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
        }
        /* Hover para que brille un poco más */
        .scroll-gold::-webkit-scrollbar-thumb:hover {
          background: #f1c40f;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-3">
      <h4 className="text-gold font-black tracking-[0.2em] border-b border-gold/20 pb-2 text-[10px] md:text-[12px] flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-gold rotate-45 inline-block" /> {title}
      </h4>
      <p className="text-zinc-400 leading-relaxed text-[13px] md:text-[14px] italic font-medium">
        {text}
      </p>
    </div>
  );
}

function RankRow({ tier, range, status, highlight }: typeof RANKINGS[0]) {
  return (
    <tr className={`
      border-b border-white/5 transition-all duration-300
      ${highlight ? 'bg-gold/10' : 'hover:bg-white/[0.03]'}
    `}>
      <td className={`px-6 md:px-10 py-6 uppercase tracking-wider font-serif ${highlight ? 'text-gold font-bold' : 'text-zinc-200'}`}>
        {tier}
      </td>
      <td className={`px-6 md:px-10 py-6 font-mono ${highlight ? 'text-white font-bold' : 'text-zinc-400'}`}>
        {range}
      </td>
      <td className={`
        px-6 md:px-10 py-6 text-[10px] tracking-[0.2em] hidden sm:table-cell text-right uppercase font-bold
        ${highlight ? 'text-gold' : 'text-zinc-600'}
      `}>
        {status}
      </td>
    </tr>
  );
}