import { useEffect } from "react";
import HistoryForm from "@/components/history/HistoryForm";

export const metadata = {
  title: "WELIKECHESS | Historial de Partidas",
};

export default function HistoryPage() {
  useEffect(() => {
    document.title = "WELIKECHESS | Jugar Vs IA";
  }, []);

  return (
    <main className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-96px)] bg-[#050505] relative overflow-hidden flex flex-col justify-center">
      {/* LUZ DE FONDO AMBIENTAL */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#d4af37]/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* COMPONENTE INTERACTIVO */}
      <HistoryForm />
    </main>
  );
}