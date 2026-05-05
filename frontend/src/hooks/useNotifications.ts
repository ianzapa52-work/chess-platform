import { useEffect, useRef, useCallback } from "react";

export type NotificationHandler = (type: string, data: unknown) => void;

export function useNotifications(token: string | null, onNotification: NotificationHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!token || wsRef.current) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onNotification(msg.type, msg.data);
      } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      reconnectRef.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => ws.close();
  }, [token, onNotification]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);
}