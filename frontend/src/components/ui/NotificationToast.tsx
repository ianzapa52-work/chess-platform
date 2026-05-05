"use client";
import { useNotificationContext, AppNotification } from "@/components/context/NotificationContext";
import { useEffect, useRef, useState } from "react";

const TYPE_CONFIG: Record<string, { icon: string; label: string; accent: string }> = {
  friend_request:   { icon: "♟", label: "Solicitud de amistad", accent: "#D4AF37" },
  game_invite:      { icon: "⚔",  label: "Invitación a partida", accent: "#D4AF37" },
  game_start:       { icon: "▶",  label: "Partida iniciada",     accent: "#4ade80" },
  game_end:         { icon: "⬛", label: "Partida finalizada",   accent: "#94a3b8" },
  move:             { icon: "→",  label: "Movimiento recibido",  accent: "#D4AF37" },
  message:          { icon: "💬", label: "Mensaje nuevo",        accent: "#60a5fa" },
  achievement:      { icon: "★",  label: "Logro desbloqueado",   accent: "#f59e0b" },
  default:          { icon: "◆",  label: "Notificación",         accent: "#D4AF37" },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
}

function getSubtitle(notification: AppNotification): string {
  const d = notification.data as Record<string, unknown> | null;
  if (!d) return "";
  if (d.message)  return String(d.message);
  if (d.username) return String(d.username);
  if (d.from)     return `De: ${String(d.from)}`;
  return "";
}

function ToastItem({
  notification,
  onClose,
  index,
}: {
  notification: AppNotification;
  onClose: () => void;
  index: number;
}) {
  const cfg = getConfig(notification.type);
  const subtitle = getSubtitle(notification);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Entrada escalonada
    const enterT = setTimeout(() => setVisible(true), index * 80);
    // Auto-cierre
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

  return (
    <div
      style={{
        transition: "all 0.38s cubic-bezier(0.16,1,0.3,1)",
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? "translateX(0) scale(1)" : "translateX(32px) scale(0.96)",
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <div
        className="group relative flex items-start gap-3 rounded-2xl overflow-hidden cursor-default select-none"
        style={{
          width: 320,
          background: "linear-gradient(135deg, rgba(20,18,14,0.97) 60%, rgba(30,26,18,0.97) 100%)",
          border: `1px solid rgba(212,175,55,0.18)`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(212,175,55,0.12) inset, 0 -1px 0 rgba(0,0,0,0.4) inset`,
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Barra lateral de acento */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: `linear-gradient(to bottom, ${cfg.accent}, ${cfg.accent}88)`,
            borderRadius: "2px 0 0 2px",
          }}
        />

        {/* Icono */}
        <div
          className="shrink-0 flex items-center justify-center rounded-xl mt-3.5 ml-4"
          style={{
            width: 36,
            height: 36,
            background: `radial-gradient(circle at 40% 40%, ${cfg.accent}22, ${cfg.accent}08)`,
            border: `1px solid ${cfg.accent}30`,
            fontSize: 16,
            color: cfg.accent,
          }}
        >
          {cfg.icon}
        </div>

        {/* Texto */}
        <div className="flex-1 py-3.5 pr-2 min-w-0">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-0.5"
            style={{ color: cfg.accent, letterSpacing: "0.12em" }}
          >
            {cfg.label}
          </p>
          {subtitle && (
            <p className="text-sm text-zinc-300 truncate leading-snug">{subtitle}</p>
          )}
        </div>

        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="shrink-0 mt-3 mr-3 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: "#71717a", background: "rgba(255,255,255,0.06)" }}
          aria-label="Cerrar"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Barra de progreso */}
        <ProgressBar duration={5500} accent={cfg.accent} paused={leaving} />
      </div>
    </div>
  );
}

function ProgressBar({
  duration,
  accent,
  paused,
}: {
  duration: number;
  accent: string;
  paused: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 3,
        right: 0,
        height: 2,
        background: "rgba(255,255,255,0.05)",
        borderRadius: "0 0 16px 0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          background: `linear-gradient(to right, ${accent}99, ${accent})`,
          animation: paused ? "none" : `toast-progress ${duration}ms linear forwards`,
          transformOrigin: "left",
        }}
      />
      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications, clearNotification } = useNotificationContext();

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed z-[200] flex flex-col gap-2.5"
      style={{ top: 104, right: 20, maxHeight: "calc(100vh - 140px)", overflowY: "hidden" }}
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {notifications.slice(0, 5).map((n, i) => (
        <ToastItem
          key={n.id}
          notification={n}
          onClose={() => clearNotification(n.id)}
          index={i}
        />
      ))}
    </div>
  );
}