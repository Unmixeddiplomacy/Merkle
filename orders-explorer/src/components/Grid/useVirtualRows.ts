import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualRowsOptions {
  totalRows: number;
  rowHeight: number;
  overscan?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface VirtualRowsResult {
  startIndex: number;
  endIndex: number;
  paddingTop: number;
  paddingBottom: number;
  totalHeight: number;
}

export function useVirtualRows({
  totalRows,
  rowHeight,
  overscan = 5,
  containerRef,
}: UseVirtualRowsOptions): VirtualRowsResult {
  const [range, setRange] = useState({ startIndex: 0, endIndex: 30 });
  const rafId = useRef<number | null>(null);

  const calculateRange = useCallback(() => {
    const container = containerRef.current;
    if (!container || totalRows === 0) {
      return { startIndex: 0, endIndex: 0 };
    }
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight || 600;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + clientHeight) / rowHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [totalRows, rowHeight, overscan, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial calculation
    setRange(calculateRange());

    const handleScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        setRange(calculateRange());
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [calculateRange, containerRef, totalRows]);

  const startIndex = Math.min(range.startIndex, Math.max(0, totalRows - 1));
  const endIndex = Math.min(range.endIndex, Math.max(0, totalRows - 1));
  const paddingTop = startIndex * rowHeight;
  const paddingBottom = Math.max(0, (totalRows - 1 - endIndex) * rowHeight);
  const totalHeight = totalRows * rowHeight;

  return {
    startIndex,
    endIndex,
    paddingTop,
    paddingBottom,
    totalHeight,
  };
}
