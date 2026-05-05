"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export type AppNotification = { id: number; type: string; data: unknown };

const NotificationContext = createContext<{
  notifications: AppNotification[];
  clearNotification: (id: number) => void;
}>({ notifications: [], clearNotification: () => {} });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Leer el token del localStorage
  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    setToken(stored);
    const handler = () => setToken(localStorage.getItem("access_token"));
    window.addEventListener("user-auth-change", handler);
    return () => window.removeEventListener("user-auth-change", handler);
  }, []);

  const handleNotification = useCallback((type: string, data: unknown) => {
    if (type === 'message') {
        const chatOpen = document.querySelector('[data-chat-open="true"]');
        if (chatOpen) return;
    }
    setNotifications((prev) => [...prev, { type, data, id: Date.now() }]);
  }, []);

  // WebSocket de notificaciones globales
  useNotifications(token, handleNotification);

  // Escuchar mensajes de chat recibidos con el panel cerrado
  useEffect(() => {
    const handler = (e: Event) => {
      const { type, data } = (e as CustomEvent).detail;
      handleNotification(type, data);
    };
    window.addEventListener("app-notification", handler);
    return () => window.removeEventListener("app-notification", handler);
  }, [handleNotification]);

  const clearNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, clearNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationContext = () => useContext(NotificationContext);