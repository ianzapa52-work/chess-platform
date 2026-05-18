"use client";
import { useNotificationContext, AppNotification } from "@/components/context/NotificationContext";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "next/navigation";
import { Swords, Check, X, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getSubtitle(notification: AppNotification): { sender: string; message: string } {
  const d = notification.data as Record<string, unknown> | null;
  if (!d) return { sender: "Mensaje nuevo", message: "" };
  return {
    sender: d.from ? String(d.from) : d.username ? String(d.username) : "Mensaje nuevo",
    message: d.message ? String(d.message) : "",
  };
}

function MessageToastItem({
  notification,
  onClose,
  index,
}: {
  notification: AppNotification;
  onClose: () => void;
  index: number;
}) {
  const { sender, message } = getSubtitle(notification);
  const initials = getInitials(sender);
  const { isLight } = useTheme();

  const d = notification.data as Record<string, unknown> | null;
  const senderAvatar = d?.avatar ? String(d.avatar) : null;

  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const enterT = setTimeout(() => setVisible(true), index * 80);
    timerRef.current = setTimeout(() => handleClose(), 5500 + index * 80);
    return () => {
      clearTimeout(enterT);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setLeaving(true);
    setTimeout(onClose, 380);
  }

  function handleClick() {
    window.dispatchEvent(
      new CustomEvent("open-chat", {
        detail: { username: sender },
      })
    );
    handleClose();
  }

  return (
    <div
      style={{
        transition: "all 0.38s cubic-bezier(0.16,1,0.3,1)",
        opacity: visible && !leaving ? 1 : 0,
        transform:
          visible && !leaving
            ? "translateX(0) scale(1)"
            : "translateX(32px) scale(0.96)",
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <div
        onClick={handleClick}
        className="group relative flex items-center gap-3 rounded-2xl overflow-hidden cursor-pointer select-none"
        style={{
          width: 320,
          background: isLight
            ? "linear-gradient(135deg, rgba(255,253,245,0.98) 55%, rgba(255,250,230,0.98) 100%)"
            : "linear-gradient(135deg, rgba(14,12,7,0.98) 55%, rgba(24,20,10,0.98) 100%)",
          border: `1px solid rgba(212,175,55,${isLight ? "0.35" : "0.18"})`,
          boxShadow: isLight
            ? "0 4px 20px rgba(0,0,0,0.10), 0 1px 0 rgba(212,175,55,0.15) inset"
            : "0 8px 40px rgba(0,0,0,0.7), 0 1px 0 rgba(212,175,55,0.10) inset",
          backdropFilter: "blur(24px)",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = `rgba(212,175,55,${isLight ? "0.35" : "0.18"})`)}
      >
        {/* Barra lateral dorada */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "linear-gradient(to bottom, #D4AF37, rgba(212,175,55,0.35))",
            borderRadius: "2px 0 0 2px",
          }}
        />

        {/* Avatar */}
        <div
          className="shrink-0 ml-4"
          style={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            border: "1px solid rgba(212,175,55,0.25)",
            overflow: "hidden",
            boxShadow: "0 0 16px rgba(212,175,55,0.08)",
            flexShrink: 0,
          }}
        >
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={sender}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "rgba(212,175,55,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D4AF37",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Cinzel', serif",
                letterSpacing: "0.05em",
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 py-3.5 pr-2 min-w-0">
          <p
            className="font-black uppercase font-sans"
            style={{
              fontSize: 8,
              letterSpacing: "0.3em",
              color: isLight ? "rgba(120,85,10,0.7)" : "rgba(212,175,55,0.4)",
              marginBottom: 4,
            }}
          >
            Mensaje nuevo
          </p>
          <p
            className="font-bold truncate font-['Cinzel'] leading-tight"
            style={{ fontSize: 16, color: isLight ? "#8B6414" : "#D4AF37" }}
          >
            {sender}
          </p>
          {message && (
            <p
              className="truncate font-sans"
              style={{
                fontSize: 13,
                color: isLight ? "rgba(100,70,10,0.65)" : "rgba(212,175,55,0.55)",
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {message}
            </p>
          )}
        </div>

        {/* Botón cerrar — stopPropagation para no activar el click del toast */}
        <button
          onClick={e => { e.stopPropagation(); handleClose(); }}
          className="shrink-0 mr-3 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#D4AF37]/10"
          style={{
            width: 22,
            height: 22,
            color: isLight ? "rgba(120,85,10,0.5)" : "rgba(212,175,55,0.4)",
            border: `1px solid rgba(212,175,55,${isLight ? "0.25" : "0.12"})`,
            background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)",
          }}
          aria-label="Cerrar"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1 1l6 6M7 1L1 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Barra de progreso — se oculta instantáneamente al cerrar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 3,
            right: 0,
            height: 2,
            background: isLight ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.06)",
            borderRadius: "0 0 16px 0",
            overflow: "hidden",
            opacity: leaving ? 0 : 1,
            transition: "opacity 0s",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(to right, rgba(212,175,55,0.3), #D4AF37)",
              animation: leaving ? "none" : `toast-progress 5500ms linear forwards`,
              transformOrigin: "left",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

function ChallengeToastItem({ notification, onClose, index }: { notification: AppNotification; onClose: () => void; index: number }) {
  const data = notification.data as { challenge_id: number; sender_username: string; mode: string; initial_time: number; increment: number };
  const router = useRouter();
  const { isLight } = useTheme();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const enterT = setTimeout(() => setVisible(true), index * 80);
    timerRef.current = setTimeout(() => handleClose(), 30000 + index * 80);
    return () => {
      clearTimeout(enterT);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setLeaving(true);
    setTimeout(onClose, 380);
  }

  async function handleAccept() {
    setAccepting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/games/challenges/${data.challenge_id}/accept/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const body = await res.json();
        handleClose();
        router.push(`/play-online?game_id=${body.game_id}`);
        return;
      }
    } catch {}
    setAccepting(false);
  }

  const timeLabel = `${Math.floor(data.initial_time / 60)}+${data.increment}`;
  const modeLabel = data.mode === "bullet" ? "Bullet" : data.mode === "blitz" ? "Blitz" : "Rápidas";

  return (
    <div style={{ transition: "all 0.38s cubic-bezier(0.16,1,0.3,1)", opacity: visible && !leaving ? 1 : 0, transform: visible && !leaving ? "translateX(0) scale(1)" : "translateX(32px) scale(0.96)", pointerEvents: leaving ? "none" : "auto" }}>
      <div className="relative flex flex-col rounded-2xl overflow-hidden select-none"
        style={{ width: 320, background: isLight ? "linear-gradient(135deg,rgba(255,253,245,0.98) 55%,rgba(255,245,245,0.98) 100%)" : "linear-gradient(135deg,rgba(14,12,7,0.98) 55%,rgba(24,10,10,0.98) 100%)", border: `1px solid rgba(239,68,68,${isLight ? "0.35" : "0.25"})`, boxShadow: isLight ? "0 4px 20px rgba(0,0,0,0.10)" : "0 8px 40px rgba(0,0,0,0.7)", backdropFilter: "blur(24px)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(to bottom,#ef4444,rgba(239,68,68,0.35))", borderRadius: "2px 0 0 2px" }} />
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2 pl-5">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <Swords size={17} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 8, letterSpacing: "0.3em", color: isLight ? "rgba(180,40,40,0.7)" : "rgba(239,68,68,0.5)", fontWeight: 900, textTransform: "uppercase", marginBottom: 3 }}>Reto recibido</p>
            <p style={{ fontSize: 15, color: isLight ? "#991b1b" : "#f87171", fontWeight: 900, fontFamily: "'Cinzel',serif" }} className="truncate">{data.sender_username}</p>
            <p style={{ fontSize: 11, color: isLight ? "rgba(120,40,40,0.65)" : "rgba(239,68,68,0.5)", marginTop: 1 }}>{modeLabel} · {timeLabel} min</p>
          </div>
          <button onClick={handleClose} className="shrink-0 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-all"
            style={{ width: 22, height: 22, color: isLight ? "rgba(180,40,40,0.5)" : "rgba(239,68,68,0.4)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 px-4 pb-3.5 pl-5">
          <button onClick={handleAccept} disabled={accepting}
            className="py-2 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: isLight ? "#b91c1c" : "#f87171" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.8)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}>
            {accepting ? <Loader2 size={13} className="animate-spin" /> : <><Check size={13} strokeWidth={3} /> Aceptar</>}
          </button>
          <button onClick={handleClose}
            className="py-2 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
            style={{ background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.08)", color: isLight ? "#71717a" : "#52525b" }}>
            <X size={13} /> Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications, clearNotification } = useNotificationContext();
  const router = useRouter();

  useEffect(() => {
    const accepted = notifications.find(n => n.type === "challenge_accepted");
    if (accepted) {
      const data = accepted.data as { game_id: string };
      clearNotification(accepted.id);
      router.push(`/play-online?game_id=${data.game_id}`);
    }
  }, [notifications, clearNotification, router]);

  const messageNotifs = notifications.filter(n => n.type === "message");
  const challengeNotifs = notifications.filter(n => n.type === "new_challenge");

  if (messageNotifs.length === 0 && challengeNotifs.length === 0) return null;

  return (
    <div
      className="fixed z-[200] flex flex-col gap-2.5"
      style={{ top: 104, right: 20, maxHeight: "calc(100vh - 140px)", overflowY: "hidden" }}
      aria-live="polite"
    >
      {challengeNotifs.slice(0, 2).map((n, i) => (
        <ChallengeToastItem key={n.id} notification={n} onClose={() => clearNotification(n.id)} index={i} />
      ))}
      {messageNotifs.slice(0, 5).map((n, i) => (
        <MessageToastItem key={n.id} notification={n} onClose={() => clearNotification(n.id)} index={i} />
      ))}
    </div>
  );
}