import { useEffect, useRef, useState } from 'react';
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
  orientation: 'w' | 'b';
  canDrag: (coord: Square) => boolean;
  pieceSrc: (coord: Square) => string | null;
  onDragStart?: (from: Square) => void;
  onDragEnd: (from: Square, to: Square | null) => void;
  /** Llamado cuando se selecciona una casilla por clic o drag-en-sitio */
  onSelect?: (sq: Square | null) => void;
  deps?: React.DependencyList;
}

export interface DragControllerResult {
  boardRef: React.RefObject<HTMLDivElement | null>;
  dragFrom: Square | null;
  dragOver: Square | null;
  isDragging: boolean;
  /** Casilla seleccionada (modo clic), null si no hay */
  selectedSquare: Square | null;
  /** Limpia la selección manualmente (úsalo cuando el movimiento se completa) */
  clearSelection: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
export function useDragController({
  orientation,
  canDrag,
  pieceSrc,
  onDragStart,
  onDragEnd,
  onSelect,
  deps = [],
}: DragControllerOptions): DragControllerResult {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragFrom, setDragFrom]           = useState<Square | null>(null);
  const [dragOver, setDragOver]           = useState<Square | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // Refs frescos
  const canDragRef      = useRef(canDrag);
  const pieceSrcRef     = useRef(pieceSrc);
  const onDragStartRef  = useRef(onDragStart);
  const onDragEndRef    = useRef(onDragEnd);
  const onSelectRef     = useRef(onSelect);
  const orientationRef  = useRef(orientation);
  // Ref para leer selectedSquare dentro del closure sin recrear el efecto
  const selectedRef     = useRef<Square | null>(null);

  useEffect(() => { canDragRef.current     = canDrag;     }, [canDrag]);
  useEffect(() => { pieceSrcRef.current    = pieceSrc;    }, [pieceSrc]);
  useEffect(() => { onDragStartRef.current = onDragStart; }, [onDragStart]);
  useEffect(() => { onDragEndRef.current   = onDragEnd;   }, [onDragEnd]);
  useEffect(() => { onSelectRef.current    = onSelect;    }, [onSelect]);
  useEffect(() => { orientationRef.current = orientation; }, [orientation]);

  const clearSelection = () => {
    selectedRef.current = null;
    setSelectedSquare(null);
    onSelectRef.current?.(null);
  };

  const selectSquare = (sq: Square | null) => {
    selectedRef.current = sq;
    setSelectedSquare(sq);
    onSelectRef.current?.(sq);
  };

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const boardEl = el;

    let floatImg  : HTMLImageElement | null = null;
    let sourceImg : HTMLImageElement | null = null;
    let fromSquare: Square | null = null;
    let lastOver  : Square | null = null;
    let raf       : number | null = null;
    let pendingX = 0, pendingY = 0;
    /** Posición del pointerdown para detectar si hubo movimiento real */
    let downX = 0, downY = 0;
    /** true si el puntero se ha movido lo suficiente como para ser un drag real */
    let didMove = false;
    const DRAG_THRESHOLD = 4; // px

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

    function startVisualDrag(sq: Square, clientX: number, clientY: number) {
      const src = pieceSrcRef.current(sq);
      if (!src) return;
      setCursorGrabbing();
      const imgEl = boardEl.querySelector<HTMLImageElement>(`[data-square="${sq}"] img`);
      if (imgEl) { sourceImg = imgEl; imgEl.style.opacity = '0.25'; }
      const size = squareSize() * 0.92;
      const fi = document.createElement('img');
      fi.src       = src;
      fi.draggable = false;
      fi.style.cssText = `
        position:fixed;top:0;left:0;
        width:${size}px;height:${size}px;
        pointer-events:none;z-index:9999;
        will-change:transform;
        filter:drop-shadow(0 8px 24px rgba(0,0,0,0.7));
        transform:translate3d(${clientX}px,${clientY}px,0) translate(-50%,-50%);
      `;
      document.body.appendChild(fi);
      floatImg = fi;
      pendingX = clientX; pendingY = clientY;
    }

    function flushPosition() {
      raf = null;
      if (floatImg)
        floatImg.style.transform =
          `translate3d(${pendingX}px,${pendingY}px,0) translate(-50%,-50%)`;
    }

    function cleanup() {
      floatImg?.remove(); floatImg = null;
      if (sourceImg) { sourceImg.style.opacity = ''; sourceImg = null; }
      clearCursorGrabbing();
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      document.removeEventListener('pointermove',   onMove);
      document.removeEventListener('pointerup',     onUp);
      document.removeEventListener('pointercancel', onCancel);
    }

    function onMove(e: PointerEvent) {
      if (!fromSquare) return;

      // Detectar si cruzamos el umbral de drag real
      if (!didMove) {
        const dx = e.clientX - downX;
        const dy = e.clientY - downY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        // Superamos el umbral → es un drag real
        didMove = true;
        // Si la casilla estaba seleccionada por clic previo y arrastramos
        // esa misma pieza, mantenemos fromSquare pero limpiamos la selección visual
        selectSquare(null);
        startVisualDrag(fromSquare, downX, downY);
        setDragFrom(fromSquare);
        setDragOver(fromSquare);
        onDragStartRef.current?.(fromSquare);
      }

      pendingX = e.clientX; pendingY = e.clientY;
      if (!raf) raf = requestAnimationFrame(flushPosition);
      const sq = pointToSquare(e.clientX, e.clientY);
      if (sq !== lastOver) { lastOver = sq; setDragOver(sq); }
    }

    function onUp(e: PointerEvent) {
      if (!fromSquare) return;
      const to   = pointToSquare(e.clientX, e.clientY);
      const from = fromSquare;
      fromSquare = null; lastOver = null;

      if (!didMove) {
        // ── MODO CLIC ────────────────────────────────────────────────────────
        cleanup();
        setDragFrom(null); setDragOver(null);

        const currentSelected = selectedRef.current;

        if (currentSelected && currentSelected !== to) {
          // Hay pieza seleccionada y clicamos en otra casilla → intentar mover
          selectSquare(null);
          setDragFrom(null); setDragOver(null);
          onDragEndRef.current(currentSelected, to);
        } else if (to && canDragRef.current(to) && pieceSrcRef.current(to)) {
          if (currentSelected === to) {
            // Clic en la misma pieza seleccionada → deseleccionar
            selectSquare(null);
          } else {
            // Seleccionar la pieza
            selectSquare(to);
          }
        } else {
          // Clic en casilla vacía sin selección → limpiar
          selectSquare(null);
        }
        return;
      }

      // ── MODO DRAG ────────────────────────────────────────────────────────
      cleanup();
      setDragFrom(null); setDragOver(null);

      if (to === from) {
        // Drag en la misma casilla → seleccionar (comportamiento lichess/chess.com)
        selectSquare(from);
      } else {
        selectSquare(null);
        onDragEndRef.current(from, to);
      }
    }

    function onCancel() {
      if (!fromSquare) return;
      const from = fromSquare;
      fromSquare = null; lastOver = null;
      cleanup();
      setDragFrom(null); setDragOver(null);
      if (didMove) onDragEndRef.current(from, null);
    }

    function onDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const sq = pointToSquare(e.clientX, e.clientY);

      // Si hay pieza seleccionada y clicamos en otra casilla (sin pieza arrastrable)
      // lo tratamos como destino del movimiento por clic
      const currentSelected = selectedRef.current;
      if (currentSelected && sq && sq !== currentSelected && !canDragRef.current(sq)) {
        selectSquare(null);
        onDragEndRef.current(currentSelected, sq);
        return;
      }

      if (!sq || !canDragRef.current(sq)) {
        // Clic en casilla no arrastrable → limpiar selección
        if (currentSelected) selectSquare(null);
        return;
      }

      e.preventDefault();
      fromSquare = sq;
      downX = e.clientX;
      downY = e.clientY;
      didMove = false;

      document.addEventListener('pointermove',   onMove,  { passive: true });
      document.addEventListener('pointerup',     onUp);
      document.addEventListener('pointercancel', onCancel);
    }

    boardEl.addEventListener('pointerdown', onDown);
    return () => {
      boardEl.removeEventListener('pointerdown', onDown);
      cleanup();
      document.removeEventListener('pointermove',   onMove);
      document.removeEventListener('pointerup',     onUp);
      document.removeEventListener('pointercancel', onCancel);
      setDragFrom(null); setDragOver(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { boardRef, dragFrom, dragOver, isDragging: dragFrom !== null, selectedSquare, clearSelection };
}