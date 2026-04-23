"use client";

import { Inter, Cinzel } from "next/font/google";
import "@/styles/global.css";
import ModalManager from "@/components/modals/ModalManager";
import HeaderActions from "@/components/layout/HeaderActions";
import ChatWindow from "@/components/ui/ChatWindow";
import Link from "next/link";
import IdleTimer from "@/components/utils/IdleTimer";
import GlobalToasts from "@/components/ui/GlobalToasts";

const inter = Inter({ subsets: ["latin"] });
const cinzel = Cinzel({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {

  const navBtnClass = `${cinzel.className} px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 [.light_&]:text-black rounded-xl transition-all duration-300 hover:text-gold hover:bg-white/5 [.light_&]:hover:bg-black/10 flex items-center justify-center cursor-pointer select-none`;

  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} antialiased selection:bg-gold/30 transition-colors duration-500 [.light_&]:text-black`}>
        
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(212,175,55,0.15)_0%,transparent_100%)] opacity-70"></div>
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>

        <header className="fixed top-0 left-0 w-full h-20 md:h-24 bg-black/40 [.light_&]:bg-white/80 grid grid-cols-3 items-center px-4 md:px-10 z-[60] backdrop-blur-xl border-b border-white/5 [.light_&]:border-black/10 transition-colors duration-500">
          
          <div className="flex justify-start">
            <Link href="/" className="relative group block cursor-pointer">
              <h1 className={`${cinzel.className} text-xl md:text-2xl font-light tracking-[0.3em] transition-colors duration-300 [.light_&]:text-black`}>
                WELIKE<span className="font-black text-gold group-hover:brightness-125 transition-all group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">CHESS</span>
              </h1>
            </Link>
          </div>

          <div className="flex justify-center">
            <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/40 [.light_&]:bg-black/5 p-1.5 rounded-2xl border border-white/10 [.light_&]:border-black/10 backdrop-blur-md transition-all">
              <div className="flex items-center gap-0.5">
                <Link href="/play-online" className={navBtnClass}>Online</Link>
                <Link href="/play-ia" className={navBtnClass}>IA</Link>
                <Link href="/play-local" className={navBtnClass}>Local</Link>
                <Link href="/puzzles" className={navBtnClass}>Puzzles</Link>
              </div>

              <div className="w-[1px] h-5 bg-white/10 [.light_&]:bg-black/20 mx-2"></div>

              <div className="flex items-center gap-0.5">
                <Link href="/ranking" className={navBtnClass}>Ranking</Link>
                <Link href="/friends" className={navBtnClass}>Amigos</Link>
                <HeaderActions variant="nav" />
              </div>
            </nav>
          </div>

          <div className="flex justify-end">
             <HeaderActions variant="user" />
          </div>
        </header>

        <main className="relative min-h-screen pt-20 md:pt-24">
          {children}
        </main>

        <ModalManager />
        <ChatWindow />
        <IdleTimer />
        <GlobalToasts /> 
      </body>
    </html>
  );
}