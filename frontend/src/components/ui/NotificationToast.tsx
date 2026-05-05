"use client";
import { useNotificationContext, AppNotification } from "@/components/context/NotificationContext";
import { useEffect, useRef, useState } from "react";

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

  const d = notification.data as Record<string, unknown> | null;
  const senderAvatar = d?.avatar ? String(d.avatar) : null;
  const senderId = d?.from_id ? String(d.from_id) : d?.user_id ? String(d.user_id) : null;

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
          background:
            "linear-gradient(135deg, rgba(14,12,7,0.98) 55%, rgba(24,20,10,0.98) 100%)",
          border: "1px solid rgba(212,175,55,0.18)",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.7), 0 1px 0 rgba(212,175,55,0.10) inset",
          backdropFilter: "blur(24px)",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.18)")}
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
              color: "rgba(212,175,55,0.4)",
              marginBottom: 4,
            }}
          >
            Mensaje nuevo
          </p>
          <p
            className="font-bold truncate font-['Cinzel'] leading-tight"
            style={{ fontSize: 16, color: "#D4AF37" }}
          >
            {sender}
          </p>
          {message && (
            <p
              className="truncate font-sans"
              style={{
                fontSize: 13,
                color: "rgba(212,175,55,0.55)",
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
            color: "rgba(212,175,55,0.4)",
            border: "1px solid rgba(212,175,55,0.12)",
            background: "rgba(255,255,255,0.03)",
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
            background: "rgba(212,175,55,0.06)",
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

export default function MessageToast() {
  const { notifications, clearNotification } = useNotificationContext();
  const messageNotifs = notifications.filter((n) => n.type === "message");
  if (messageNotifs.length === 0) return null;

  return (
    <div
      className="fixed z-[200] flex flex-col gap-2.5"
      style={{ top: 104, right: 20, maxHeight: "calc(100vh - 140px)", overflowY: "hidden" }}
      aria-live="polite"
      aria-label="Mensajes"
    >
      {messageNotifs.slice(0, 5).map((n, i) => (
        <MessageToastItem
          key={n.id}
          notification={n}
          onClose={() => clearNotification(n.id)}
          index={i}
        />
      ))}
    </div>
  );
}