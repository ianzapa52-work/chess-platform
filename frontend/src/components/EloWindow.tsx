import React from 'react';

interface EloWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EloWindow({ isOpen, onClose }: EloWindowProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-[#0a0a0a] border border-[#d4af37]/20 w-full max-w-[950px] max-h-[90vh] rounded-[32px] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(212,175,55,0.1)] animate-in fade-in zoom-in duration-300 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex justify-between items-center px-10 py-6 border-b border-white/5 bg-white/[0.02] shrink-0">
          <span className="text-[12px] text-[#d4af37] font-bold tracking-[0.4em] uppercase">Protocolo de Clasificación Oficial</span>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-[#d4af37] transition-colors text-2xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="px-12 pt-12 pb-8 shrink-0">
          <header className="mb-10 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-black font-['Cinzel'] tracking-[0.2em] text-white">
              ESCALAFÓN <span className="text-[#d4af37]">FIDE</span>
            </h2>
            <p className="text-zinc-500 text-[11px] tracking-[0.5em] uppercase mt-4 font-semibold">Estándares Internacionales de Competición</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-3">
              <h4 className="text-[#d4af37] font-bold font-['Cinzel'] tracking-[0.2em] border-b border-[#d4af37]/20 pb-2 text-[11px]">SISTEMA DE TÍTULOS</h4>
              <p className="text-zinc-400 leading-relaxed text-[13px] italic">
                Los títulos de Maestro son vitalicios. El ELO fluctúa según el factor K: los nuevos jugadores tienen mayor volatilidad que los veteranos.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[#d4af37] font-bold font-['Cinzel'] tracking-[0.2em] border-b border-[#d4af37]/20 pb-2 text-[11px]">NORMATIVA 2026</h4>
              <p className="text-zinc-400 leading-relaxed text-[13px] italic">
                Para alcanzar el rango de GM no solo se requiere el ELO, sino mantener una consistencia de élite frente a otros Maestros.
              </p>
            </div>
          </div>
        </div>

        <div className="px-12 pb-12 flex-grow overflow-hidden flex flex-col min-h-0">
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <table className="w-full text-left">
              <thead className="bg-white/[0.05] text-[#d4af37] font-['Cinzel'] text-[11px] tracking-[0.3em] sticky top-0 z-10">
                <tr>
                  <th className="px-10 py-5">RANGO</th>
                  <th className="px-10 py-5">RATING</th>
                  <th className="px-10 py-5 hidden sm:table-cell">ESTADO</th>
                </tr>
              </thead>
            </table>
            
            <div className="overflow-y-auto custom-scrollbar max-h-[350px]">
              <table className="w-full text-left">
                <tbody className="text-[13px] font-medium">
                  <RankRow tier="Super Gran Maestro" range="2700+" status="Élite Mundial" highlight />
                  <RankRow tier="Gran Maestro (GM)" range="2500 - 2699" status="Leyenda" />
                  <RankRow tier="Maestro Internacional (IM)" range="2400 - 2499" status="Profesional" />
                  <RankRow tier="Maestro FIDE (FM)" range="2300 - 2399" status="Avanzado" />
                  <RankRow tier="Candidato a Maestro (CM)" range="2200 - 2299" status="Experto" />
                  <RankRow tier="Experto Nacional" range="2000 - 2199" status="Club A" />
                  <RankRow tier="Jugador de Club" range="1600 - 1999" status="Club B" />
                  <RankRow tier="Aficionado" range="1200 - 1599" status="Competidor" />
                  <RankRow tier="Principiante" range="0 - 1199" status="Iniciación" />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankRow({ tier, range, status, highlight = false }: { tier: string, range: string, status: string, highlight?: boolean }) {
  return (
    <tr className={`border-b border-white/5 transition-colors ${highlight ? 'bg-[#d4af37]/10' : 'hover:bg-white/[0.02]'}`}>
      <td className={`px-10 py-6 font-['Cinzel'] tracking-[0.1em] uppercase ${highlight ? 'text-[#d4af37] font-black shadow-[#d4af37]/20' : 'text-white'}`}>{tier}</td>
      <td className={`px-10 py-6 font-mono ${highlight ? 'text-white font-bold' : 'text-zinc-400'}`}>{range}</td>
      <td className={`px-10 py-6 text-[10px] tracking-[0.2em] hidden sm:table-cell ${highlight ? 'text-[#d4af37]' : 'text-zinc-600'} uppercase`}>{status}</td>
    </tr>
  );
}