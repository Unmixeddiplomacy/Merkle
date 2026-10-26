import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKbdEvent } from 'react';
import type { Order } from '../../types/order';
import { COLUMNS, ROW_HEIGHT } from './columnDefs';

interface UseGridKeyboardNavParams {
  orders: Order[];
  focusedCell: { rowIndex: number; colId: string } | null;
  setFocusedCell: (cell: { rowIndex: number; colId: string } | null) => void;
  toggleRowSelection: (id: string) => void;
  setSelectedIds: (ids: Set<string>) => void;
  pinnedColumn: string | null;
  setPinnedColumn: (col: string | null) => void;
  handleColumnClick: (colId: string) => void;
  openDetail: (order: Order) => void;
  closeDetail: () => void;
  detailOrder: Order | null;
  gridScrollRef: React.RefObject<HTMLDivElement | null>;
  lastClickedIndexRef: React.MutableRefObject<number | null>;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useGridKeyboardNav({
  orders,
  focusedCell,
  setFocusedCell,
  toggleRowSelection,
  setSelectedIds,
  pinnedColumn,
  setPinnedColumn,
  handleColumnClick,
  openDetail,
  closeDetail,
  detailOrder,
  gridScrollRef,
  lastClickedIndexRef,
  setShowHelp,
}: UseGridKeyboardNavParams) {
  // Scroll into view (keyboard only, auto/instant)
  const scrollRowIntoView = useCallback((rowIndex: number) => {
    const container = gridScrollRef.current;
    if (!container) return;
    const HEADER_H = 32;
    const rowTop = rowIndex * ROW_HEIGHT;
    const rowBottom = (rowIndex + 1) * ROW_HEIGHT;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight - HEADER_H;
    const viewBottom = scrollTop + viewportHeight;

    if (rowTop < scrollTop) {
      container.scrollTo({ top: rowTop, behavior: 'auto' });
    } else if (rowBottom > viewBottom) {
      container.scrollTo({ top: Math.max(0, rowBottom - viewportHeight), behavior: 'auto' });
    }
  }, [gridScrollRef]);

  // Keyboard navigation
  const handleGridKeyDown = useCallback(
    (e: ReactKbdEvent<HTMLDivElement>) => {
      // Always let Tab pass through
      if (e.key === 'Tab') return;

      // ? shows help panel
      if (e.key === '?') {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      const colIds = COLUMNS.map((c) => c.id);
      const rowCount = orders.length;
      if (rowCount === 0) return;

      const currentRow = focusedCell?.rowIndex ?? 0;
      const currentColId = focusedCell?.colId ?? colIds[0];
      const currentColIdx = colIds.indexOf(currentColId);

      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement;
      const isButton = target instanceof HTMLButtonElement;

      // When an interactive child control inside the grid (e.g. checkbox or header sort button)
      // has focus, let that control process Enter and Space naturally
      if (isInput) {
        if (target.type === 'checkbox' && e.key === 'Enter') {
          e.preventDefault();
          target.click();
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          return;
        }
      }

      if (isButton && (e.key === 'Enter' || e.key === ' ')) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextRow = Math.min(currentRow + 1, rowCount - 1);
          setFocusedCell({ rowIndex: nextRow, colId: currentColId });
          scrollRowIntoView(nextRow);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevRow = Math.max(currentRow - 1, 0);
          setFocusedCell({ rowIndex: prevRow, colId: currentColId });
          scrollRowIntoView(prevRow);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const nextColIdx = (currentColIdx + 1) % colIds.length;
          setFocusedCell({ rowIndex: currentRow, colId: colIds[nextColIdx] });
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          const prevColIdx = (currentColIdx - 1 + colIds.length) % colIds.length;
          setFocusedCell({ rowIndex: currentRow, colId: colIds[prevColIdx] });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (orders[currentRow]) openDetail(orders[currentRow]);
          break;
        }
        case ' ': {
          e.preventDefault();
          if (orders[currentRow]) {
            toggleRowSelection(orders[currentRow].id);
            lastClickedIndexRef.current = currentRow;
          }
          break;
        }
        case 'PageDown': {
          e.preventDefault();
          const nextRow = Math.min(currentRow + 15, rowCount - 1);
          setFocusedCell({ rowIndex: nextRow, colId: currentColId });
          scrollRowIntoView(nextRow);
          break;
        }
        case 'PageUp': {
          e.preventDefault();
          const prevRow = Math.max(currentRow - 15, 0);
          setFocusedCell({ rowIndex: prevRow, colId: currentColId });
          scrollRowIntoView(prevRow);
          break;
        }
        case 'Home': {
          e.preventDefault();
          setFocusedCell({ rowIndex: 0, colId: currentColId });
          scrollRowIntoView(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          const lastRow = rowCount - 1;
          setFocusedCell({ rowIndex: lastRow, colId: currentColId });
          scrollRowIntoView(lastRow);
          break;
        }
        case 's':
        case 'S': {
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleColumnClick(currentColId);
          }
          break;
        }
        case 'p':
        case 'P': {
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setPinnedColumn(pinnedColumn === currentColId ? null : currentColId);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          if (detailOrder) {
            closeDetail();
          } else {
            setSelectedIds(new Set<string>());
          }
          break;
        }
      }
    },
    [
      orders,
      focusedCell,
      setFocusedCell,
      toggleRowSelection,
      openDetail,
      closeDetail,
      detailOrder,
      setSelectedIds,
      scrollRowIntoView,
      handleColumnClick,
      setPinnedColumn,
      pinnedColumn,
      lastClickedIndexRef,
      setShowHelp,
    ]
  );

  // Initialize and clamp focused cell
  useEffect(() => {
    if (orders.length === 0) {
      if (focusedCell !== null) {
        setFocusedCell(null);
      }
      return;
    }
    if (focusedCell === null) {
      setFocusedCell({ rowIndex: 0, colId: COLUMNS[0].id });
    } else if (focusedCell.rowIndex >= orders.length) {
      setFocusedCell({ rowIndex: orders.length - 1, colId: focusedCell.colId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length]);

  // Auto-focus the grid container on initial load so keyboard navigation activates immediately
  const hasAutoFocusedRef = useRef(false);
  useEffect(() => {
    if (!hasAutoFocusedRef.current && orders.length > 0 && gridScrollRef.current) {
      hasAutoFocusedRef.current = true;
      const active = document.activeElement;
      const isInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement;
      if (!isInput) {
        gridScrollRef.current.focus({ preventScroll: true });
      }
    }
  }, [orders.length, gridScrollRef]);

  return { handleGridKeyDown, scrollRowIntoView };
}
