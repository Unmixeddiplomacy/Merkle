import { useState, useRef, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { DEFAULT_WIDTHS } from './columnDefs';

export function useColumnResizing() {
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
  const [isResizing, setIsResizing] = useState(false);
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  const handleStartResize = useCallback(
    (colId: string, e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      const startWidth = colWidths[colId] ?? DEFAULT_WIDTHS[colId] ?? 120;
      resizingRef.current = { colId, startX: e.clientX, startWidth };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = moveEvent.clientX - resizingRef.current.startX;
        const newWidth = Math.max(50, resizingRef.current.startWidth + delta);
        setColWidths((prev) => ({ ...prev, [resizingRef.current!.colId]: newWidth }));
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [colWidths]
  );

  return { colWidths, isResizing, handleStartResize };
}
