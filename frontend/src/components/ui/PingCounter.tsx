"use client";
import { useState, useEffect } from 'react';

export default function PingCounter() {
  const [ping, setPing] = useState<number | 'err' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const measurePing = async () => {
      if (!window.navigator.onLine) { setPing('err'); return; }
      const start = Date.now();
      try {
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(3000) });
        setPing(Date.now() - start);
      } catch { setPing('err'); }
    };
    measurePing();
    const interval = setInterval(measurePing, 5000);
    return () => clearInterval(interval);
  }, []);

  const getPingColor = () => {
    if (ping === null || ping === 'err') return 'text-zinc-600';
    if (ping < 100) return 'text-emerald-400';
    if (ping < 200) return 'text-gold';
    return 'text-red-500';
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col">
      <span className="chess-label !ml-0 !text-[8px] opacity-50">Global Ping</span>
      <span className={`text-xs font-mono font-bold transition-colors ${getPingColor()}`}>
        {ping === null ? '-- ms' : ping === 'err' ? 'ERROR' : `${ping} MS`}
      </span>
    </div>
  );
}