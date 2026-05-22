import ProfileForm from "@/components/profile/ProfileForm";

export const metadata = {
  title: "WELIKECHESS | Mi Perfil",
};

export default function ProfilePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) {
          html, body {
            height: 100%;
            overflow: hidden !important;
            margin: 0;
            padding: 0;
          }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
      `}} />
      <div className="min-h-screen lg:h-screen w-full flex flex-col relative overflow-y-auto lg:overflow-hidden bg-[#050505] in-[.light]:bg-white">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="relative z-20 grow lg:min-h-0">
          <ProfileForm />
        </div>
      </div>
    </>
  );
}
