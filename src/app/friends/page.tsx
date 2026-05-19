import FriendsForm from "@/components/friends/FriendsForm";

export const metadata = {
  title: "WELIKECHESS | Amigos",
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
        }
      `}} />
      <div className="h-screen w-full flex flex-col relative overflow-hidden bg-[#050505] in-[.light]:bg-white">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="relative z-20 grow min-h-0">
          <FriendsForm />
        </div>
      </div>
    </>
  );
}