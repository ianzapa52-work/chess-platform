import RankingForm from "@/components/ranking/RankingForm";

export default function RankingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { 
          height: 100%;
          overflow: hidden !important; 
          margin: 0;
          padding: 0;
          background: #050505;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.5); }
        .custom-scrollbar-hidden::-webkit-scrollbar { display: none; }
      `}} />
      <main className="h-screen w-full flex flex-col relative overflow-hidden bg-[#050505] text-white">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#d4af37]/5 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d4af37]/5 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="flex-grow min-h-0">
          <RankingForm />
        </div>
      </main>
    </>
  );
}