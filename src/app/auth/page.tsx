"use client";

import { useState, useEffect } from 'react';
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    document.title = "WELIKECHESS | Autenticación";
  }, []);


  return (
    <main className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-96px)] bg-[#050505] in-[.light]:bg-[#f4f4f5] relative overflow-hidden flex items-center justify-center p-6">
      {/* EFECTOS DE FONDO */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </main>
  );
}