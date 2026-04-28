import { useEffect, useRef, useCallback, useState } from 'react';

export interface AIGameSocketResult {
  sendMove: (uci: string) => Promise<AIResponse>;
  connected: boolean;
  connecting: boolean;
  reconnect: () => void;
}

export interface AIResponse {
  fen: string;
  aiMove: string;
  gameOver: boolean;
  result?: string;
}

export function useAIGameSocket(difficulty: number): AIGameSocketResult {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);

  const pendingResolve = useRef<((value: AIResponse) => void) | null>(null);
  const pendingReject = useRef<((reason: string) => void) | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      if (!pendingResolve.current) return;

      if (data.action === 'ai_move') {
        pendingResolve.current({ fen: data.fen, aiMove: data.move, gameOver: false });
        pendingResolve.current = null;
        pendingReject.current = null;

      } else if (data.action === 'game_ended') {
        pendingResolve.current({ fen: '', aiMove: '', gameOver: true, result: data.result });
        pendingResolve.current = null;
        pendingReject.current = null;

      } else if (data.type === 'error') {
        pendingReject.current?.(data.message ?? 'Error desconocido del servidor');
        pendingResolve.current = null;
        pendingReject.current = null;
      }
    } catch {
      pendingReject.current?.('Respuesta inválida del servidor');
      pendingResolve.current = null;
      pendingReject.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState < WebSocket.CLOSING) {
      ws.current.onclose = null;
      ws.current.close();
    }

    setConnected(false);
    setConnecting(true);

    const url = `ws://localhost:8000/ws/stockfish/${difficulty}/`;
    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnecting(false);
      setConnected(true);
    };

    socket.onclose = () => {
      setConnecting(false);
      setConnected(false);
      pendingReject.current?.('Conexión cerrada');
      pendingResolve.current = null;
      pendingReject.current = null;
    };

    socket.onerror = () => {
      setConnecting(false);
      setConnected(false);
      pendingReject.current?.('Error en la conexión WebSocket');
      pendingResolve.current = null;
      pendingReject.current = null;
    };

    socket.onmessage = handleMessage;
    ws.current = socket;
  }, [difficulty, handleMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMove = useCallback((uci: string): Promise<AIResponse> => {
    return new Promise((resolve, reject) => {
      const doSend = () => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
          reject('WebSocket no conectado tras espera. Pulsa Reconectar.');
          return;
        }
        pendingReject.current?.('Nuevo movimiento enviado antes de recibir respuesta');
        pendingResolve.current = resolve;
        pendingReject.current = reject;
        ws.current.send(JSON.stringify({ action: 'move', move: uci }));
      };

      if (ws.current?.readyState === WebSocket.OPEN) {
        doSend();
        return;
      }

      if (ws.current?.readyState === WebSocket.CONNECTING) {
        const timeout = setTimeout(() => {
          reject('Timeout esperando conexión WebSocket.');
        }, 5000);

        const socket = ws.current;
        const prevOnOpen = socket.onopen;
        socket.onopen = (e) => {
          clearTimeout(timeout);
          if (typeof prevOnOpen === 'function') prevOnOpen.call(socket, e);
          doSend();
        };
        return;
      }

      reject('WebSocket cerrado. Pulsa Reconectar.');
    });
  }, []);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  return { sendMove, connected, connecting, reconnect };
}