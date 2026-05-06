import { useEffect, useRef, useState, useCallback } from 'react';
import { Square } from 'chess.js';

// ── Cursor global ─────────────────────────────────────────────────────────────
let cursorStyle: HTMLStyleElement | null = null;
function setCursorGrabbing() {
  if (cursorStyle) return;
  cursorStyle = document.createElement('style');
  cursorStyle.textContent = '*{cursor:grabbing!important}';
  document.head.appendChild(cursorStyle);
}
function clearCursorGrabbing() {
  cursorStyle?.remove();
  cursorStyle = null;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface DragControllerOptions {
  /** Orientación actual del tablero */
  orientation: 'w' | 'b';
  /** Devuelve true si la pieza en esa casilla puede ser arrastrada */
  canDrag: (coord: Square) => boolean;
  /** Devuelve la ruta del SVG de la pieza en esa casilla, o null si no hay */
  pieceSrc: (coord: Square) => string | null;
  /** Llamado cuando empieza el drag */
  onDragStart?: (from: Square) => void;
  /** Llamado cuando el drag termina (to puede ser null si soltó fuera) */
  onDragEnd: (from: Square, to: Square | null) => void;
  /** Dependencias extra que deben forzar la recreación del controlador */
  deps?: React.DependencyList;
}

export interface DragControllerResult {
  /** Ref que debe asignarse al div del tablero */
  boardRef: React.RefObject<HTMLDivElement | null>;
  /** Casilla origen del drag activo, null si no hay drag */
  dragFrom: Square | null;
  /** Casilla sobre la que está pasando el drag */
  dragOver: Square | null;
  /** true mientras hay un drag en curso */
  isDragging: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
export function useDragController({
  orientation,
  canDrag,
  pieceSrc,
  onDragStart,
  onDragEnd,
  deps = [],
}: DragControllerOptions): DragControllerResult {
  const boardRef    = useRef<HTMLDivElement>(null);
  const [dragFrom, setDragFrom] = useState<Square | null>(null);
  const [dragOver, setDragOver] = useState<Square | null>(null);

  // Refs para siempre tener la versión fresca de los callbacks sin recrear el controlador
  const canDragRef     = useRef(canDrag);
  const pieceSrcRef    = useRef(pieceSrc);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef   = useRef(onDragEnd);
  const orientationRef = useRef(orientation);

  useEffect(() => { canDragRef.current     = canDrag;     }, [canDrag]);
  useEffect(() => { pieceSrcRef.current    = pieceSrc;    }, [pieceSrc]);
  useEffect(() => { onDragStartRef.current = onDragStart; }, [onDragStart]);
  useEffect(() => { onDragEndRef.current   = onDragEnd;   }, [onDragEnd]);
  useEffect(() => { orientationRef.current = orientation; }, [orientation]);

  useEffect(() => {
    const el: HTMLDivElement | null = boardRef.current;
    if (!el) return;
    const boardEl: HTMLDivElement = el;

    let floatImg  : HTMLImageElement | null = null;
    let sourceImg : HTMLImageElement | null = null;
    let fromSquare: Square | null = null;
    let lastOver  : Square | null = null;
    let raf       : number | null = null;
    let pendingX = 0, pendingY = 0;

    function squareSize() { return boardEl.getBoundingClientRect().width / 8; }

    function pointToSquare(clientX: number, clientY: number): Square | null {
      const rect = boardEl.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
      const col = Math.floor(x / (rect.width  / 8));
      const row = Math.floor(y / (rect.height / 8));
      if (col < 0 || col > 7 || row < 0 || row > 7) return null;
      const o = orientationRef.current;
      return (String.fromCharCode(97 + (o === 'w' ? col : 7 - col)) +
              (8 - (o === 'w' ? row : 7 - row))) as Square;
    }

    function flushPosition() {
      raf = null;
      if (floatImg)
        floatImg.style.transform =
          `translate3d(${pendingX}px,${pendingY}px,0) translate(-50%,-50%)`;
    }

    function onMove(e: PointerEvent) {
      if (!fromSquare) return;
      pendingX = e.clientX; pendingY = e.clientY;
      if (!raf) raf = requestAnimationFrame(flushPosition);
      const sq = pointToSquare(e.clientX, e.clientY);
      if (sq !== lastOver) { lastOver = sq; setDragOver(sq); }
    }

    function onUp(e: PointerEvent) {
      if (!fromSquare) return;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      const to   = pointToSquare(e.clientX, e.clientY);
      const from = fromSquare;
      floatImg?.remove(); floatImg = null;
      if (sourceImg) { sourceImg.style.opacity = ''; sourceImg = null; }
      clearCursorGrabbing();
      fromSquare = null; lastOver = null;
      setDragFrom(null); setDragOver(null);
      document.removeEventListener('pointermove',   onMove);
      document.removeEventListener('pointerup',     onUp);
      document.removeEventListener('pointercancel', onUp);
      onDragEndRef.current(from, to);
    }

    function onDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const sq = pointToSquare(e.clientX, e.clientY);
      if (!sq || !canDragRef.current(sq)) return;
      const src = pieceSrcRef.current(sq);
      if (!src) return;
      setCursorGrabbing();
      e.preventDefault();
      fromSquare = sq;
      const imgEl = boardEl.querySelector<HTMLImageElement>(`[data-square="${sq}"] img`);
      if (imgEl) { sourceImg = imgEl; imgEl.style.opacity = '0.25'; }
      const size = squareSize() * 0.92;
      const fi   = document.createElement('img');
      fi.src           = src;
      fi.draggable     = false;
      fi.style.cssText = `
        position:fixed;top:0;left:0;
        width:${size}px;height:${size}px;
        pointer-events:none;z-index:9999;
        will-change:transform;
        filter:drop-shadow(0 8px 24px rgba(0,0,0,0.7));
        transform:translate3d(${e.clientX}px,${e.clientY}px,0) translate(-50%,-50%);
      `;
      document.body.appendChild(fi);
      floatImg = fi;
      pendingX = e.clientX; pendingY = e.clientY;
      document.addEventListener('pointermove',   onMove,  { passive: true });
      document.addEventListener('pointerup',     onUp);
      document.addEventListener('pointercancel', onUp);
      setDragFrom(sq); setDragOver(sq);
      onDragStartRef.current?.(sq);
    }

    boardEl.addEventListener('pointerdown', onDown);

    return () => {
      boardEl.removeEventListener('pointerdown', onDown);
      floatImg?.remove();
      if (sourceImg) sourceImg.style.opacity = '';
      clearCursorGrabbing();
      document.removeEventListener('pointermove',   onMove);
      document.removeEventListener('pointerup',     onUp);
      document.removeEventListener('pointercancel', onUp);
      if (raf) cancelAnimationFrame(raf);
      setDragFrom(null); setDragOver(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    boardRef,
    dragFrom,
    dragOver,
    isDragging: dragFrom !== null,
  };
}