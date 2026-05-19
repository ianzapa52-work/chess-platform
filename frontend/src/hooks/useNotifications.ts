import { useEffect, useRef, useCallback } from "react";

export type NotificationHandler = (type: string, data: unknown) => void;

export function useNotifications(token: string | null, onNotification: NotificationHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const connect = useCallback(() => {
    if (!token || wsRef.current) return;

    const ws = new WebSocket(`${process.env.WS_URL ?? 'ws://localhost:8000'}/ws/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onNotificationRef.current(msg.type, msg.data);
      } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      reconnectRef.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => ws.close();
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
}