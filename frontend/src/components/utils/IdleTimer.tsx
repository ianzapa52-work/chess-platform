"use client";
import { useEffect } from 'react';

export default function IdleTimer() {
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const syncStatus = async (status: 'online' | 'away') => {
      const token = localStorage.getItem("access_token");
      const settings = JSON.parse(localStorage.getItem("user_settings") || "{}");
      if (settings.status === status) return;
      localStorage.setItem("user_settings", JSON.stringify({ ...settings, status }));
      window.dispatchEvent(new Event('user-updated'));
      if (token) {
        try {
          await fetch(`${process.env.API_URL ?? 'http://localhost:8000'}/api/users/me/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_active: status === 'online' })
          });
        } catch (e) {
          console.error("Error de presencia:", e);
        }
      }
    };

    const handleActivity = () => {
      const settings = JSON.parse(localStorage.getItem("user_settings") || "{}");
      if (settings.status === 'invisible') return;
      if (settings.manualAway) return;
      if (settings.status === 'away') {
        syncStatus('online');
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => syncStatus('away'), 300000);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, handleActivity));
    handleActivity();

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, []);

  return null;
}