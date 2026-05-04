"use client";

import { useState, useEffect, useRef } from "react";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"] });

const MASTER_PASSWORD = "e5!e3-Nf3-Nc1_202x";
const STORAGE_KEY = "wlc_unlocked";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [attempts, setAttempts] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (mounted && !unlocked) {
      setTimeout(() => inputRef.current?.focus(), 600);
    }
  }, [mounted, unlocked]);

  function handleSubmit() {
    if (input === MASTER_PASSWORD) {
      setStatus("success");
      sessionStorage.setItem(STORAGE_KEY, "1");
      setTimeout(() => setUnlocked(true), 700);
    } else {
      setStatus("error");
      setAttempts((a) => a + 1);
      setInput("");
      setTimeout(() => {
        setStatus("idle");
        inputRef.current?.focus();
      }, 1200);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  if (!mounted) return null;
  if (unlocked) return <>{children}</>;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-10px); }
          40%       { transform: translateX(10px); }
          60%       { transform: translateX(-7px); }
          80%       { transform: translateX(7px); }
        }
        @keyframes unlockPulse {
          0%   { box-shadow: 0 0 0 0 rgba(212,175,55,0.6); }
          70%  { box-shadow: 0 0 0 22px rgba(212,175,55,0); }
          100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
        }
        @keyframes glowLine {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        .gate-card {
          animation: fadeIn 0.65s cubic-bezier(.22,.68,0,1.15) both;
        }
        .gate-input-error {
          animation: shake 0.45s ease;
        }
        .gate-btn-success {
          animation: unlockPulse 0.65s ease;
        }
        .gate-gold-line {
          animation: glowLine 3s ease-in-out infinite;
        }
        .gate-input:focus {
          border-color: rgba(212,175,55,0.55) !important;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.1) !important;
        }
        .gate-btn:hover {
          background: rgba(212,175,55,0.22) !important;
          box-shadow: 0 0 32px rgba(212,175,55,0.18) !important;
        }
        .gate-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.45) 0%, rgba(180,140,30,0.18) 35%, rgba(30,24,8,0.95) 65%, #0a0800 100%)",
        }}
      >
        {/* Corner decorations */}
        {[
          { pos: "top-8 left-8", bt: true, bl: true },
          { pos: "top-8 right-8", bt: true, br: true },
          { pos: "bottom-8 left-8", bb: true, bl: true },
          { pos: "bottom-8 right-8", bb: true, br: true },
        ].map(({ pos, bt, br, bb, bl }, i) => (
          <div
            key={i}
            className={`absolute ${pos} w-10 h-10 pointer-events-none`}
            style={{
              borderTop:    bt ? "1.5px solid rgba(212,175,55,0.5)" : undefined,
              borderRight:  br ? "1.5px solid rgba(212,175,55,0.5)" : undefined,
              borderBottom: bb ? "1.5px solid rgba(212,175,55,0.5)" : undefined,
              borderLeft:   bl ? "1.5px solid rgba(212,175,55,0.5)" : undefined,
            }}
          />
        ))}

        {/* Card */}
        <div
          className="gate-card relative w-full mx-6"
          style={{ maxWidth: "520px" }}
        >
          <div
            style={{
              background: "rgba(16,13,6,0.96)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(212,175,55,0.07), 0 60px 120px rgba(0,0,0,0.85)",
            }}
          >
            {/* Animated gold top line */}
            <div
              className="gate-gold-line"
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.9) 50%, transparent 100%)",
              }}
            />

            <div
              style={{
                padding: "56px 56px 52px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "40px",
              }}
            >
              {/* Logo */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
                <div
                  style={{
                    width: "76px",
                    height: "76px",
                    borderRadius: "20px",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2v3M10.5 3.5h3M9 7h6l1 9H8L9 7zM7 16h10l1 4H6l1-4z"
                      stroke="#D4AF37"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div style={{ textAlign: "center" }}>
                  <h1
                    className={cinzel.className}
                    style={{
                      fontSize: "28px",
                      fontWeight: 300,
                      letterSpacing: "0.35em",
                      color: "rgba(255,255,255,0.95)",
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    WELIKE
                    <span style={{ fontWeight: 900, color: "#D4AF37" }}>CHESS</span>
                  </h1>
                  <p
                    className={cinzel.className}
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.3em",
                      color: "rgba(212,175,55,0.55)",
                      margin: "10px 0 0",
                      textTransform: "uppercase",
                    }}
                  >
                    Acceso restringido
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(212,175,55,0.12)" }} />
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "rgba(212,175,55,0.6)",
                  }}
                />
                <div style={{ flex: 1, height: "1px", background: "rgba(212,175,55,0.12)" }} />
              </div>

              {/* Form */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ position: "relative" }}>
                  <input
                    ref={inputRef}
                    type="password"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Contraseña maestra"
                    autoComplete="off"
                    className={`gate-input ${status === "error" ? "gate-input-error" : ""}`}
                    style={{
                      width: "100%",
                      borderRadius: "14px",
                      padding: "16px 50px 16px 20px",
                      fontSize: "15px",
                      color: "rgba(255,255,255,0.92)",
                      outline: "none",
                      background: "rgba(212,175,55,0.04)",
                      border:
                        status === "error"
                          ? "1px solid rgba(239,68,68,0.6)"
                          : status === "success"
                          ? "1px solid rgba(212,175,55,0.55)"
                          : "1px solid rgba(212,175,55,0.18)",
                      transition: "all 0.25s ease",
                      boxSizing: "border-box",
                      caretColor: "#D4AF37",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    {status === "error" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(239,68,68,0.7)" strokeWidth="1.5" />
                        <path d="M15 9l-6 6M9 9l6 6" stroke="rgba(239,68,68,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : status === "success" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="5" y="11" width="14" height="10" rx="2" stroke="rgba(212,175,55,0.35)" strokeWidth="1.5" />
                        <path d="M8 11V7a4 4 0 018 0v4" stroke="rgba(212,175,55,0.35)" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Error message */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "13px",
                    color: "rgba(239,68,68,0.85)",
                    maxHeight: status === "error" ? "28px" : "0px",
                    opacity: status === "error" ? 1 : 0,
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}
                >
                  Contraseña incorrecta{attempts > 1 ? ` · ${attempts} intentos` : ""}
                </div>

                {/* Button */}
                <button
                  onClick={handleSubmit}
                  className={`gate-btn ${cinzel.className} ${status === "success" ? "gate-btn-success" : ""}`}
                  style={{
                    width: "100%",
                    padding: "17px",
                    borderRadius: "14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.38)",
                    color: "#D4AF37",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                >
                  {status === "success" ? "Accediendo…" : "Entrar"}
                </button>
              </div>

              {/* Footer */}
              <p
                className={cinzel.className}
                style={{
                  fontSize: "10px",
                  color: "rgba(212,175,55,0.4)",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Sitio en desarrollo · Acceso privado
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}