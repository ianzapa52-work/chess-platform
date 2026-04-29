import FriendsForm from "@/components/friends/FriendsForm";

export const metadata = {
  title: "Red de Amigos | WELIKECHESS",
};

export default function FriendsPage() {
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
      `}} />
      <div className="h-screen w-full flex flex-col relative overflow-hidden bg-[#050505]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#d4af37]/5 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#d4af37]/5 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="relative z-20 flex-grow min-h-0">
          <FriendsForm />
        </div>
      </div>
    </>
  );
}