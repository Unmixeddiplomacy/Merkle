import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { KeyboardEvent as ReactKbdEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { Order, OrderStatus } from '../../types/order';
import type { SortState } from '../../types/sort';
import { useAppStore } from '../../store/useAppStore';
import { useSortColumn } from '../../hooks/useSortColumn';
import { formatINR, formatDate } from '../../utils/format';
import { useVirtualRows } from './useVirtualRows';
import './Grid.css';

// ─── Column definitions ────────────────────────────────────────────────────

interface ColDef {
  id: string;
  label: string;
  sortable: boolean;
  thClass?: string;
  tdClass?: string;
  rightAlign?: boolean;
}

const COLUMNS: ColDef[] = [
  { id: 'id',            label: 'Order ID',     sortable: true,  thClass: 'grid-th--id',       tdClass: 'grid-td--id',       rightAlign: false },
  { id: 'customer',      label: 'Customer',     sortable: true,  thClass: 'grid-col-customer', tdClass: 'grid-td--customer' },
  { id: 'status',        label: 'Status',       sortable: true,  thClass: 'grid-col-status' },
  { id: 'amountINR',     label: 'Amount (\u20b9)',  sortable: true,  thClass: 'grid-col-amount',   tdClass: 'grid-td--amount',   rightAlign: true },
  { id: 'region',        label: 'Region',       sortable: true,  thClass: 'grid-col-region' },
  { id: 'channel',       label: 'Channel',      sortable: true,  thClass: 'grid-col-channel' },
  { id: 'priority',      label: 'Priority',     sortable: true,  thClass: 'grid-col-priority' },
  { id: 'paymentMethod', label: 'Payment',      sortable: true,  thClass: 'grid-col-payment' },
  { id: 'itemCount',     label: 'Items',        sortable: true,  thClass: 'grid-col-items',    tdClass: 'grid-td--items',    rightAlign: true },
  { id: 'createdAt',     label: 'Created At',   sortable: true,  thClass: 'grid-col-created',  tdClass: 'grid-td--date' },
  { id: 'updatedAt',     label: 'Updated At',   sortable: true,  thClass: 'grid-col-updated',  tdClass: 'grid-td--date' },
  { id: 'notes',         label: 'Notes / Logs', sortable: false, thClass: 'grid-col-notes',    tdClass: 'grid-td--notes' },
];

const DEFAULT_WIDTHS: Record<string, number> = {
  check: 36,
  id: 130,
  customer: 160,
  status: 110,
  amountINR: 120,
  region: 90,
  channel: 80,
  priority: 80,
  paymentMethod: 100,
  itemCount: 70,
  createdAt: 150,
  updatedAt: 150,
  notes: 200,
};

const ROW_HEIGHT = 32; // matches --row-height CSS var

// ─── Status pill ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'PENDING',
  processing: 'PROCESSING',
  shipped:    'SHIPPED',
  delivered:  'DELIVERED',
  cancelled:  'CANCELLED',
};

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`status-pill status-pill--${status}`}>
      <span className="status-pill__dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Priority badge ─────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<number, string> = { 1: 'P1-HIGH', 2: 'P2-NORM', 3: 'P3-LOW' };

function PriorityBadge({ priority }: { priority: number | null }) {
  if (priority === null) {
    return <span className="priority-badge--none">—</span>;
  }
  return (
    <span className={`priority-badge priority-badge--${priority}`}>
      <span className="priority-badge__dot" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

// ─── Sort arrow helper ──────────────────────────────────────────────────────

function SortArrow({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (!dir)
    return (
      <span className="grid-th__sort material-symbols-outlined" style={{ fontSize: 12, opacity: 0.3 }}>
        unfold_more
      </span>
    );
  return (
    <span className="grid-th__sort material-symbols-outlined" style={{ fontSize: 12 }}>
      {dir === 'asc' ? 'arrow_drop_up' : 'arrow_drop_down'}
    </span>
  );
}

// ─── Header cell ────────────────────────────────────────────────────────────

interface ThProps {
  col: ColDef;
  sort: SortState | null;
  onSortClick: (id: string) => void;
  pinnedColumn: string | null;
  onPinColumn: (colId: string | null) => void;
  onStartResize: (colId: string, e: ReactMouseEvent) => void;
}

function Th({ col, sort, onSortClick, pinnedColumn, onPinColumn, onStartResize }: ThProps) {
  const dir = sort?.columnId === col.id ? sort.direction : null;
  const isActive = sort?.columnId === col.id;
  const isPinned = pinnedColumn === col.id;
  const innerClass = col.rightAlign ? 'grid-th__inner grid-th__inner--right' : 'grid-th__inner';

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  // ARIA sort: must be 'ascending' | 'descending' | 'none' | 'other'
  const ariaSortValue: 'ascending' | 'descending' | 'none' = isActive
    ? dir === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none';

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ctxMenu]);

  const handleContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <th
      className={[
        'grid-th',
        col.thClass ?? '',
        col.sortable ? 'grid-th--sortable' : '',
        isActive ? 'grid-th--active' : '',
        isPinned ? 'grid-th--pinned' : '',
      ].join(' ')}
      onContextMenu={handleContextMenu}
      aria-sort={isActive ? ariaSortValue : undefined}
    >
      <div className={innerClass}>
        {col.sortable ? (
          <button
            type="button"
            className="grid-th__sort-btn"
            onClick={() => onSortClick(col.id)}
            aria-label={`Sort by ${col.label}${isActive ? `, currently ${ariaSortValue}` : ''}`}
          >
            <span className="grid-th__label">{col.label}</span>
            <SortArrow dir={dir} />
          </button>
        ) : (
          <span className="grid-th__label">{col.label}</span>
        )}
        {/* Resize handle */}
        <span
          className="grid-th__resize"
          aria-hidden="true"
          tabIndex={-1}
          onMouseDown={(e) => onStartResize(col.id, e)}
        >
          |
        </span>
      </div>

      {/* Right-click context menu (positioned absolutely via fixed) */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className="grid-ctx-menu"
          style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x }}
          role="menu"
          aria-label={`Column options for ${col.label}`}
        >
          <button
            type="button"
            role="menuitem"
            className="grid-ctx-menu__item"
            onClick={() => { onPinColumn(isPinned ? null : col.id); setCtxMenu(null); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {isPinned ? 'push_pin' : 'push_pin'}
            </span>
            {isPinned ? 'Unpin column' : 'Pin column'}
          </button>
          {col.sortable && (
            <button
              type="button"
              role="menuitem"
              className="grid-ctx-menu__item"
              onClick={() => { onSortClick(col.id); setCtxMenu(null); }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sort</span>
              Sort by {col.label}
            </button>
          )}
        </div>
      )}
    </th>
  );
}

// ─── Row cell renderer ──────────────────────────────────────────────────────

function renderCell(colId: string, order: Order): React.ReactNode {
  switch (colId) {
    case 'id':            return order.id;
    case 'customer':      return order.customer;
    case 'status':        return <StatusPill status={order.status} />;
    case 'amountINR':     return formatINR(order.amountINR);
    case 'region':        return order.region;
    case 'channel':       return order.channel;
    case 'priority':      return <PriorityBadge priority={order.priority} />;
    case 'paymentMethod': return order.paymentMethod;
    case 'itemCount':     return order.itemCount;
    case 'createdAt':     return formatDate(order.createdAt);
    case 'updatedAt':     return formatDate(order.updatedAt);
    case 'notes':         return order.notes || '\u2014';
    default:              return null;
  }
}

// ─── Row Detail Panel ────────────────────────────────────────────────────────

interface DetailPanelProps {
  order: Order;
  onClose: () => void;
}

function DetailPanel({ order, onClose }: DetailPanelProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus close button via requestAnimationFrame so panel is rendered first
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleKeyDown = (e: ReactKbdEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <>
      {/* Overlay — does NOT intercept scroll on grid behind it */}
      <div
        className="grid-detail-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="grid-detail-panel"
        role="dialog"
        aria-label="Order details"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Panel header */}
        <div className="grid-detail-panel__header">
          <div className="grid-detail-panel__title-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span>
            <span className="grid-detail-panel__title">Order Details</span>
            <span className="grid-detail-panel__id">{order.id}</span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="grid-detail-panel__close"
            onClick={onClose}
            aria-label="Close order details"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Panel body */}
        <div className="grid-detail-panel__body">
          <div className="grid-detail-panel__section">
            <div className="grid-detail-panel__section-label">Identity</div>
            <DetailRow label="Order ID" value={order.id} mono />
            <DetailRow label="Customer" value={order.customer} />
            <DetailRow label="Email" value={order.customerEmail} mono />
            <DetailRow label="Schema Version" value={`v${order.schemaVersion}`} mono />
          </div>
          <div className="grid-detail-panel__section">
            <div className="grid-detail-panel__section-label">Transaction</div>
            <DetailRow label="Status"><StatusPill status={order.status} /></DetailRow>
            <DetailRow label="Amount" value={formatINR(order.amountINR)} mono />
            <DetailRow label="Currency" value={order.currency} mono />
            <DetailRow label="Payment" value={order.paymentMethod} mono />
            <DetailRow label="Items" value={String(order.itemCount)} mono />
          </div>
          <div className="grid-detail-panel__section">
            <div className="grid-detail-panel__section-label">Routing</div>
            <DetailRow label="Region" value={order.region} mono />
            <DetailRow label="Channel" value={order.channel} mono />
            <DetailRow label="Priority"><PriorityBadge priority={order.priority} /></DetailRow>
          </div>
          <div className="grid-detail-panel__section">
            <div className="grid-detail-panel__section-label">Timestamps</div>
            <DetailRow label="Created" value={formatDate(order.createdAt)} mono />
            <DetailRow label="Updated" value={order.updatedAt ? formatDate(order.updatedAt) : '\u2014'} mono />
          </div>
          {order.notes && (
            <div className="grid-detail-panel__section">
              <div className="grid-detail-panel__section-label">Notes / Logs</div>
              <div className="grid-detail-panel__notes">{order.notes}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid-detail-panel__row">
      <span className="grid-detail-panel__row-label">{label}</span>
      <span
        className={`grid-detail-panel__row-value${mono ? ' grid-detail-panel__row-value--mono' : ''}`}
      >
        {children ?? value ?? '\u2014'}
      </span>
    </div>
  );
}

// ─── Keyboard Help Panel ─────────────────────────────────────────────────────

function KeyboardHelp({ onClose }: { onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, []);

  const shortcuts = [
    { key: '\u2191 / \u2193',   desc: 'Navigate rows up / down' },
    { key: '\u2190 / \u2192',   desc: 'Navigate columns left / right' },
    { key: 'Enter',    desc: 'Open row detail panel' },
    { key: 'Space',    desc: 'Toggle row selection' },
    { key: 'Escape',   desc: 'Close panel / deselect all' },
    { key: '\u2318F',  desc: 'Toggle Filter Builder' },
    { key: '\u2325E',  desc: 'Export selected rows to CSV' },
    { key: '?',        desc: 'Show this keyboard shortcuts panel' },
    { key: 'Right-click column', desc: 'Pin / unpin, sort column' },
    { key: 'Double-click row',   desc: 'Open row detail panel' },
  ];

  return (
    <>
      <div className="grid-detail-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="grid-help-panel"
        role="dialog"
        aria-label="Keyboard shortcuts"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
      >
        <div className="grid-detail-panel__header">
          <div className="grid-detail-panel__title-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>keyboard</span>
            <span className="grid-detail-panel__title">Keyboard Shortcuts</span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="grid-detail-panel__close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <div className="grid-help-panel__body">
          {shortcuts.map(({ key, desc }) => (
            <div key={key} className="grid-help-panel__row">
              <kbd className="grid-help-panel__kbd">{key}</kbd>
              <span className="grid-help-panel__desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  totalCount: number;
  onClearFilters: () => void;
  onOpenFilterBuilder: () => void;
}

function EmptyState({ totalCount, onClearFilters, onOpenFilterBuilder }: EmptyStateProps) {
  return (
    <div className="grid-empty">
      <div className="grid-empty__icon-wrap">
        <div className="grid-empty__icon-outer">
          <div className="grid-empty__icon-inner">
            <span className="material-symbols-outlined">filter_alt_off</span>
          </div>
        </div>
        <div className="grid-empty__badge">0 res</div>
      </div>
      <h3 className="grid-empty__title">No orders match your filter criteria</h3>
      <p className="grid-empty__subtitle">
        Zero transactions satisfied your active constraints.
        Try adjusting conditions or clearing all filters.
        Showing <strong>0</strong> of <strong>{totalCount.toLocaleString()}</strong> orders.
      </p>
      <div className="grid-empty__actions">
        <button className="grid-empty__btn-primary" onClick={onClearFilters} type="button">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>restart_alt</span>
          Clear all filters
          <span className="grid-empty__kbd">Esc</span>
        </button>
        <button className="grid-empty__btn-secondary" onClick={onOpenFilterBuilder} type="button">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>tune</span>
          Modify conditions
          <span
            className="grid-empty__kbd"
            style={{
              background: 'var(--surface-subtle)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-muted)',
            }}
          >
            ⌘F
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Status bar ───────────────────────────────────────────────────────────────

interface StatusBarProps {
  visibleCount: number;
  totalCount: number;
  selectedCount: number;
  totalFilteredAmount: number;
  onShowHelp: () => void;
}

function StatusBar({
  visibleCount,
  totalCount,
  selectedCount,
  totalFilteredAmount,
  onShowHelp,
}: StatusBarProps) {
  const pct = totalCount > 0 ? ((visibleCount / totalCount) * 100).toFixed(2) : '0.00';
  return (
    <footer className="statusbar" role="status">
      {/* Left */}
      <div className="statusbar__left">
        <span className="statusbar__stat">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            {selectedCount > 0 ? 'check_box' : 'check_box_outline_blank'}
          </span>
          <span className="statusbar__stat-val">{selectedCount}</span>
          <span>rows selected</span>
        </span>
        <span className="statusbar__dot">•</span>
        <span className="statusbar__stat">
          Total filtered:
          <span className="statusbar__stat-val">{formatINR(totalFilteredAmount)}</span>
        </span>
      </div>

      {/* Center */}
      <div className="statusbar__center">
        <span>Showing</span>
        <span className="statusbar__stat-val">{visibleCount.toLocaleString()}</span>
        <span style={{ color: 'var(--text-muted)' }}>of</span>
        <span className="statusbar__stat-val" style={{ fontWeight: 400 }}>
          {totalCount.toLocaleString()} orders
        </span>
        <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
      </div>

      {/* Right: shortcuts hint + help */}
      <div className="statusbar__right">
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">↑/↓</kbd>
          <span>Navigate</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">Space</kbd>
          <span>Select</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">Enter</kbd>
          <span>Detail</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">⌘F</kbd>
          <span>Filter</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">⌥E</kbd>
          <span>Export</span>
        </span>
        <button
          type="button"
          className="statusbar__help-btn"
          onClick={onShowHelp}
          title="Show keyboard shortcuts"
          aria-label="Show keyboard shortcuts"
        >
          <kbd className="statusbar__kbd">?</kbd>
          <span>Help</span>
        </button>
      </div>
    </footer>
  );
}

// ─── Main Grid component ──────────────────────────────────────────────────────

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

  // ── Column width resizing (local state — does NOT trigger store or row re-renders) ──
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

  // ── Virtualisation: ~20-30 rows in DOM ──────────────────────────────────────
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

  // ── Select-all & Range selection ───────────────────────────────────────────
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

  const handleCheckboxClick = useCallback(
    (rowIdx: number, orderId: string, e: ReactMouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey && lastClickedIndexRef.current !== null) {
        selectRange(lastClickedIndexRef.current, rowIdx, allVisibleIds);
      } else {
        toggleRowSelection(orderId);
        lastClickedIndexRef.current = rowIdx;
      }
    },
    [allVisibleIds, selectRange, toggleRowSelection]
  );

  const totalFilteredAmount = useMemo(
    () => orders.reduce((sum, o) => sum + (o.amountINR || 0), 0),
    [orders]
  );

  const exportSelectedCount = useMemo(
    () => orders.filter((o) => selectedIds.has(o.id)).length,
    [orders, selectedIds]
  );

  // ── Detail panel ──────────────────────────────────────────────────────────

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

  // ── Scroll into view (keyboard only, smooth) ──────────────────────────────

  const scrollRowIntoView = useCallback((rowIndex: number) => {
    const container = gridScrollRef.current;
    if (!container) return;
    const HEADER_H = 32;
    const rowTop = rowIndex * ROW_HEIGHT;
    const rowBottom = rowTop + ROW_HEIGHT;
    const scrollTop = container.scrollTop;
    const viewBottom = scrollTop + container.clientHeight - HEADER_H;
    if (rowTop < scrollTop + HEADER_H) {
      container.scrollTo({ top: Math.max(0, rowTop - HEADER_H), behavior: 'smooth' });
    } else if (rowBottom > viewBottom) {
      container.scrollTo({ top: rowTop - container.clientHeight + HEADER_H + ROW_HEIGHT, behavior: 'smooth' });
    }
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────

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
          const active = document.activeElement;
          const isChildInput =
            active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement ||
            active instanceof HTMLSelectElement;
          if (!isChildInput) {
            e.preventDefault();
            if (orders[currentRow]) {
              toggleRowSelection(orders[currentRow].id);
              lastClickedIndexRef.current = currentRow;
            }
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

  // ── Empty state ───────────────────────────────────────────────────────────

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
              const rowClass = [
                'grid-tr',
                rowIdx % 2 === 0 ? 'grid-tr--even' : 'grid-tr--odd',
                isSelected ? 'grid-tr--selected' : '',
                isFocused ? 'grid-tr--focused' : '',
              ].join(' ');

              return (
                <tr
                  key={order.id}
                  id={`grid-row-${rowIdx}`}
                  className={rowClass}
                  onClick={(e) => handleRowClick(rowIdx, order.id, e)}
                  onDoubleClick={() => openDetail(order)}
                  role="row"
                  aria-rowindex={rowIdx + 1}
                  aria-selected={isSelected}
                  style={{ cursor: 'default' }}
                >
                  {/* Checkbox cell */}
                  <td className="grid-td grid-td--check" role="gridcell" aria-colindex={1}>
                    <input
                      type="checkbox"
                      className="grid-checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      onClick={(e) => handleCheckboxClick(rowIdx, order.id, e)}
                      aria-label={`Select order ${order.id}`}
                    />
                  </td>

                  {/* Data cells */}
                  {COLUMNS.map((col, colIdx) => {
                    const isCellFocused = isFocused && focusedCell?.colId === col.id;
                    return (
                      <td
                        key={col.id}
                        className={[
                          'grid-td',
                          col.tdClass ?? '',
                          col.id === 'id' ? 'grid-td--id' : '',
                          isCellFocused ? 'grid-td--focused' : '',
                        ].join(' ')}
                        role="gridcell"
                        aria-colindex={colIdx + 2}
                        data-focused={isCellFocused ? 'true' : undefined}
                        title={col.id === 'notes' ? (order.notes || '') : undefined}
                      >
                        {renderCell(col.id, order)}
                      </td>
                    );
                  })}
                </tr>
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
