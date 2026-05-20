"use client";
import { useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const IDLE_MS      = 3 * 60 * 1000;   // 3 min sin actividad → away
const HEARTBEAT_MS = 4 * 60 * 1000;   // cada 4 min mientras activo → refresca last_seen

export default function IdleTimer() {
  const isIdle = useRef(false);

  useEffect(() => {
    let idleTimer:      NodeJS.Timeout;
    let heartbeatTimer: NodeJS.Timeout;

    const token = () => localStorage.getItem("access_token");

    // Llama a /api/users/me/ en GET para que el middleware actualice last_seen
    const heartbeat = () => {
      const t = token();
      if (!t || isIdle.current) return;
      const s = JSON.parse(localStorage.getItem("user_settings") || "{}");
      if (s.status === 'invisible' || s.manualAway) return;
      fetch(`${API}/api/users/me/`, {
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
      heartbeatTimer = setTimeout(heartbeat, HEARTBEAT_MS);
    };

    const syncStatus = (status: 'online' | 'away') => {
      const settings = JSON.parse(localStorage.getItem("user_settings") || "{}");
      if (settings.status === status) return;
      localStorage.setItem("user_settings", JSON.stringify({ ...settings, status }));
      window.dispatchEvent(new Event('user-updated'));
      window.dispatchEvent(new Event('user-settings-changed'));
    };

    const goIdle = () => {
      isIdle.current = true;
      clearTimeout(heartbeatTimer);
      syncStatus('away');
    };

    const handleActivity = () => {
      const settings = JSON.parse(localStorage.getItem("user_settings") || "{}");
      if (settings.status === 'invisible') return;
      if (settings.manualAway) return;

      if (isIdle.current) {
        isIdle.current = false;
        syncStatus('online');
        // Refresca last_seen inmediatamente al volver y retoma el heartbeat
        heartbeat();
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(goIdle, IDLE_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(ev => window.addEventListener(ev, handleActivity));
    handleActivity(); // arranca el timer y el primer heartbeat

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(heartbeatTimer);
      activityEvents.forEach(ev => window.removeEventListener(ev, handleActivity));
    };
  }, []);

  return null;
}