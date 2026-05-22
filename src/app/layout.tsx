"use client";

import { Inter, Cinzel } from "next/font/google";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "@/styles/global.css";
import ModalManager from "@/components/modals/ModalManager";
import HeaderActions from "@/components/layout/HeaderActions";
import ChatWindow from "@/components/ui/ChatWindow";
import NotificationToast from "@/components/ui/NotificationToast";
import Link from "next/link";
import IdleTimer from "@/components/utils/IdleTimer";
import PasswordGate from "@/components/utils/PasswordGate";
import { NotificationProvider } from "@/components/context/NotificationContext";

const inter = Inter({ subsets: ["latin"] });
const cinzel = Cinzel({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navBtnClass = `${cinzel.className} px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 in-[.light]:text-black rounded-xl transition-all duration-300 hover:text-gold hover:bg-white/5 in-[.light]:hover:bg-black/10 flex items-center justify-center cursor-pointer select-none`;
  const mobileNavBtnClass = `${cinzel.className} w-full px-5 py-4 text-[13px] font-black uppercase tracking-[0.2em] text-zinc-300 in-[.light]:text-zinc-700 rounded-2xl transition-all duration-200 hover:text-gold hover:bg-white/5 in-[.light]:hover:bg-black/5 flex items-center cursor-pointer select-none border border-transparent hover:border-white/10 in-[.light]:hover:border-black/10`;

  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased selection:bg-gold/30 transition-colors duration-500 in-[.light]:text-black`}
      >
        <script dangerouslySetInnerHTML={{__html:`try{var s=localStorage.getItem('user_settings');if(s){var p=JSON.parse(s);if(p.darkMode===false)document.documentElement.classList.add('light')}}catch(e){}`}} />
        <PasswordGate>
          <NotificationProvider>
            {/* Fondo decorativo */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(212,175,55,0.15)_0%,transparent_100%)] opacity-70" />
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-20 md:h-24 bg-black/40 in-[.light]:bg-white/80 grid grid-cols-3 items-center px-4 md:px-10 z-60 backdrop-blur-xl border-b border-white/5 in-[.light]:border-black/10 transition-colors duration-500">
              {/* Logo */}
              <div className="flex justify-start">
                <Link href="/" className="relative group block cursor-pointer">
                  <h1
                    className={`${cinzel.className} text-lg sm:text-xl md:text-2xl font-light tracking-[0.2em] sm:tracking-[0.3em] transition-colors duration-300 in-[.light]:text-black`}
                  >
                    WELIKE
                    <span className="font-black text-gold group-hover:brightness-125 transition-all group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                      CHESS
                    </span>
                  </h1>
                </Link>
              </div>

              {/* Nav central */}
              <div className="flex justify-center">
                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/40 in-[.light]:bg-black/5 p-1.5 rounded-2xl border border-white/10 in-[.light]:border-black/10 backdrop-blur-md transition-all">
                  <div className="flex items-center gap-0.5">
                    <Link href="/play-online" className={navBtnClass}>Online</Link>
                    <Link href="/play-ia"     className={navBtnClass}>IA</Link>
                    <Link href="/play-local"  className={navBtnClass}>Local</Link>
                    <Link href="/puzzles"     className={navBtnClass}>Puzzles</Link>
                  </div>
                  <div className="w-px h-5 bg-white/10 in-[.light]:bg-black/20 mx-2" />
                  <div className="flex items-center gap-0.5">
                    <Link href="/ranking" className={navBtnClass}>Ranking</Link>
                    <Link href="/friends" className={navBtnClass}>Amigos</Link>
                    <HeaderActions variant="nav" />
                  </div>
                </nav>

                {/* Mobile hamburger */}
                <button
                  className="lg:hidden flex flex-col gap-1.25 p-2 cursor-pointer group"
                  onClick={() => setMobileMenuOpen(prev => !prev)}
                  aria-label="Menú de navegación"
                >
                  <span className={`block w-6 h-0.5 bg-white in-[.light]:bg-black/80 rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-1.75' : ''}`} />
                  <span className={`block w-6 h-0.5 bg-white in-[.light]:bg-black/80 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                  <span className={`block w-6 h-0.5 bg-white in-[.light]:bg-black/80 rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-1.75' : ''}`} />
                </button>
              </div>

              {/* Acciones usuario */}
              <div className="flex justify-end">
                <HeaderActions variant="user" />
              </div>
            </header>

            {/* Mobile menu dropdown */}
            <div className={`fixed top-20 md:top-24 left-0 w-full z-50 lg:hidden transition-all duration-300 ${
              mobileMenuOpen
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}>
              <div className="bg-[#060606]/98 in-[.light]:bg-white/98 backdrop-blur-2xl border-b border-white/10 in-[.light]:border-black/10 shadow-2xl">
                <nav className="flex flex-col gap-1 p-4">
                  <div className="mb-2">
                    <p className={`${cinzel.className} text-[9px] font-black uppercase tracking-[0.5em] text-gold/50 px-4 mb-2`}>Jugar</p>
                    <Link href="/play-online" className={mobileNavBtnClass}>Online</Link>
                    <Link href="/play-ia"     className={mobileNavBtnClass}>IA</Link>
                    <Link href="/play-local"  className={mobileNavBtnClass}>Local</Link>
                    <Link href="/puzzles"     className={mobileNavBtnClass}>Puzzles</Link>
                  </div>
                  <div className="h-px bg-white/5 in-[.light]:bg-black/8 mx-4 my-1" />
                  <div>
                    <p className={`${cinzel.className} text-[9px] font-black uppercase tracking-[0.5em] text-gold/50 px-4 mb-2 mt-2`}>Comunidad</p>
                    <Link href="/ranking" className={mobileNavBtnClass}>Ranking</Link>
                    <Link href="/friends" className={mobileNavBtnClass}>Amigos</Link>
                    <Link href="/profile" className={mobileNavBtnClass}>Perfil</Link>
                    <Link href="/history" className={mobileNavBtnClass}>Historial</Link>
                  </div>
                </nav>
                {/* Tap outside to close */}
                <div
                  className="fixed inset-0 -z-10"
                  onClick={() => setMobileMenuOpen(false)}
                />
              </div>
            </div>

            {/* Overlay oscuro detrás del menú móvil */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}

            {/* Contenido principal */}
            <main className="relative min-h-screen pt-20 md:pt-24">
              {children}
            </main>

            {/* Overlays globales */}
            <ModalManager />
            <ChatWindow />
            <IdleTimer />

            {/* Notificaciones toast — siempre al final para estar encima de todo */}
            <NotificationToast />
          </NotificationProvider>
        </PasswordGate>
      </body>
    </html>
  );
}