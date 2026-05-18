"use client";
import { useState, useEffect } from 'react';

export function useTheme() {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('light');
  });

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains('light'));
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return { isLight };
}
