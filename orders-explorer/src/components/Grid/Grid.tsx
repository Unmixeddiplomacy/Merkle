import { useCallback, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Order } from '../../types/order';
import { useAppStore } from '../../store/useAppStore';
import { useSortColumn } from '../../hooks/useSortColumn';
import { useVirtualRows } from './useVirtualRows';
import { useColumnResizing } from './useColumnResizing';
import { useGridKeyboardNav } from './useGridKeyboardNav';
import { GridRow } from './GridRow';
import { StatusBar } from './StatusBar';
import { EmptyState } from './EmptyState';
import { DetailPanel } from './DetailPanel';
import { KeyboardHelp } from './HelpPanel';
import { Th } from './HeaderCell';
import { COLUMNS, DEFAULT_WIDTHS, ROW_HEIGHT } from './columnDefs';
import './Grid.css';

// ─── Main Grid component ─────────────────────────────────────────────────────

interface GridProps {
  orders: Order[];
  totalCount: number;
  onClearFilters: () => void;
  onOpenFilterBuilder: () => void;
}

export function Grid({ orders, totalCount, onClearFilters, onOpenFilterBuilder }: GridProps) {
  const {
    selectedIds,
    toggleRowSelection,
    sort,
    focusedCell,
    setFocusedCell,
    setSelectedIds,
    pinnedColumn,
    setPinnedColumn,
  } = useAppStore();
  const selectRange = useAppStore((s) => s.selectRange);
  const setSelectedIdsAction = useAppStore((s) => s.setSelectedIds);
  const { handleColumnClick } = useSortColumn();

  const gridScrollRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const lastClickedIndexRef = useRef<number | null>(null);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Column width resizing
  const { colWidths, isResizing, handleStartResize } = useColumnResizing();

  // Detail panel helpers
  const openDetail = useCallback((order: Order) => {
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    setDetailOrder(order);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOrder(null);
    requestAnimationFrame(() => {
      if (prevFocusRef.current && prevFocusRef.current !== document.body) {
        prevFocusRef.current.focus({ preventScroll: true });
      } else {
        gridScrollRef.current?.focus({ preventScroll: true });
      }
    });
  }, []);

  // Keyboard navigation & focus management
  const { handleGridKeyDown } = useGridKeyboardNav({
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
  });

  // Virtualisation: ~20-30 rows in DOM
  const {
    startIndex,
    endIndex,
    paddingTop,
    paddingBottom,
  } = useVirtualRows({
    totalRows: orders.length,
    rowHeight: ROW_HEIGHT,
    overscan: 5,
    containerRef: gridScrollRef,
  });

  const visibleOrders = useMemo(
    () => orders.slice(startIndex, endIndex + 1),
    [orders, startIndex, endIndex]
  );

  // Select-all & Range selection
  const allVisibleIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const selectedCount = useMemo(
    () => allVisibleIds.filter((id) => selectedIds.has(id)).length,
    [allVisibleIds, selectedIds]
  );
  const allSelected = allVisibleIds.length > 0 && selectedCount === allVisibleIds.length;
  const someSelected = selectedCount > 0 && selectedCount < allVisibleIds.length;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      const next = new Set(selectedIds);
      for (const id of allVisibleIds) next.delete(id);
      setSelectedIdsAction(next);
    } else {
      const next = new Set(selectedIds);
      for (const id of allVisibleIds) next.add(id);
      setSelectedIdsAction(next);
    }
  }, [allSelected, allVisibleIds, selectedIds, setSelectedIdsAction]);

  const handleRowClick = useCallback(
    (rowIdx: number, orderId: string, e: ReactMouseEvent) => {
      if (e.shiftKey && lastClickedIndexRef.current !== null) {
        selectRange(lastClickedIndexRef.current, rowIdx, allVisibleIds);
      } else {
        toggleRowSelection(orderId);
        lastClickedIndexRef.current = rowIdx;
      }
    },
    [allVisibleIds, selectRange, toggleRowSelection]
  );

  const handleCellClick = useCallback(
    (rowIdx: number, colId: string, orderId: string, e: ReactMouseEvent) => {
      setFocusedCell({ rowIndex: rowIdx, colId });
      handleRowClick(rowIdx, orderId, e);
    },
    [handleRowClick, setFocusedCell]
  );

  const handleCheckboxClick = useCallback(
    (rowIdx: number, orderId: string, e: ReactMouseEvent) => {
      e.stopPropagation();
      setFocusedCell({ rowIndex: rowIdx, colId: 'id' });
      if (e.shiftKey && lastClickedIndexRef.current !== null) {
        selectRange(lastClickedIndexRef.current, rowIdx, allVisibleIds);
      } else {
        toggleRowSelection(orderId);
        lastClickedIndexRef.current = rowIdx;
      }
    },
    [allVisibleIds, selectRange, setFocusedCell, toggleRowSelection]
  );

  const totalFilteredAmount = useMemo(
    () => orders.reduce((sum, o) => sum + (o.amountINR || 0), 0),
    [orders]
  );

  const exportSelectedCount = useMemo(
    () => orders.filter((o) => selectedIds.has(o.id)).length,
    [orders, selectedIds]
  );

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="grid-wrapper">
        <EmptyState
          totalCount={totalCount}
          onClearFilters={onClearFilters}
          onOpenFilterBuilder={onOpenFilterBuilder}
        />
        <StatusBar
          visibleCount={0}
          totalCount={totalCount}
          selectedCount={exportSelectedCount}
          totalFilteredAmount={0}
          onShowHelp={() => setShowHelp(true)}
        />
        {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
      </div>
    );
  }

  return (
    <div className={`grid-wrapper${isResizing ? ' grid-wrapper--resizing' : ''}`}>
      {/* Scrollable grid — keyboard-navigable */}
      <div
        ref={gridScrollRef}
        className="grid-scroll"
        tabIndex={0}
        role="grid"
        aria-label="Orders data grid"
        aria-rowcount={orders.length}
        onKeyDown={handleGridKeyDown}
        data-grid-wrapper=""
      >
        <table className="grid-table" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: `${colWidths.check ?? 36}px` }} />
            {COLUMNS.map((col) => (
              <col
                key={col.id}
                style={{ width: `${colWidths[col.id] ?? DEFAULT_WIDTHS[col.id] ?? 120}px` }}
              />
            ))}
          </colgroup>
          <thead className="grid-thead">
            <tr style={{ height: 'var(--header-height)' }}>
              {/* Select-all checkbox column header */}
              <th className="grid-th grid-th--check" role="columnheader" aria-label="Select all rows">
                <input
                  type="checkbox"
                  className="grid-checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={handleSelectAll}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSelectAll();
                    }
                  }}
                  aria-label="Select all visible rows"
                />
              </th>
              {COLUMNS.map((col) => (
                <Th
                  key={col.id}
                  col={col}
                  sort={sort}
                  onSortClick={handleColumnClick}
                  pinnedColumn={pinnedColumn}
                  onPinColumn={setPinnedColumn}
                  onStartResize={handleStartResize}
                />
              ))}
            </tr>
          </thead>
          <tbody className="grid-tbody">
            {/* Top virtual spacer */}
            {paddingTop > 0 && (
              <tr style={{ height: `${paddingTop}px`, background: 'transparent' }} aria-hidden="true">
                <td colSpan={COLUMNS.length + 1} style={{ height: `${paddingTop}px`, padding: 0, border: 'none' }} />
              </tr>
            )}

            {/* Virtualized visible rows */}
            {visibleOrders.map((order, localIdx) => {
              const rowIdx = startIndex + localIdx;
              const isSelected = selectedIds.has(order.id);
              const isFocused = focusedCell?.rowIndex === rowIdx;

              return (
                <GridRow
                  key={order.id}
                  order={order}
                  rowIdx={rowIdx}
                  isSelected={isSelected}
                  isFocused={isFocused}
                  focusedColId={focusedCell?.colId}
                  onRowClick={handleRowClick}
                  onCellClick={handleCellClick}
                  onCheckboxClick={handleCheckboxClick}
                  onDoubleClick={openDetail}
                />
              );
            })}

            {/* Bottom virtual spacer */}
            {paddingBottom > 0 && (
              <tr style={{ height: `${paddingBottom}px`, background: 'transparent' }} aria-hidden="true">
                <td colSpan={COLUMNS.length + 1} style={{ height: `${paddingBottom}px`, padding: 0, border: 'none' }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StatusBar
        visibleCount={orders.length}
        totalCount={totalCount}
        selectedCount={exportSelectedCount}
        totalFilteredAmount={totalFilteredAmount}
        onShowHelp={() => setShowHelp(true)}
      />

      {/* Row detail panel */}
      {detailOrder && <DetailPanel order={detailOrder} onClose={closeDetail} />}

      {/* Keyboard help */}
      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}
