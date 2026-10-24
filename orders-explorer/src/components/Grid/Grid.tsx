import { useCallback, useMemo } from 'react';
import type { Order, OrderStatus } from '../../types/order';
import type { SortState } from '../../types/sort';
import { useAppStore } from '../../store/useAppStore';
import { useSortColumn } from '../../hooks/useSortColumn';
import { formatINR, formatDate } from '../../utils/format';
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
  { id: 'id',            label: 'Order ID',    sortable: true,  thClass: 'grid-th--id',  tdClass: 'grid-td--id',       rightAlign: false },
  { id: 'customer',      label: 'Customer',    sortable: true,  thClass: 'grid-col-customer', tdClass: 'grid-td--customer' },
  { id: 'status',        label: 'Status',      sortable: true,  thClass: 'grid-col-status' },
  { id: 'amountINR',     label: 'Amount (₹)',  sortable: true,  thClass: 'grid-col-amount',  tdClass: 'grid-td--amount', rightAlign: true },
  { id: 'region',        label: 'Region',      sortable: true,  thClass: 'grid-col-region' },
  { id: 'channel',       label: 'Channel',     sortable: true,  thClass: 'grid-col-channel' },
  { id: 'priority',      label: 'Priority',    sortable: true,  thClass: 'grid-col-priority' },
  { id: 'paymentMethod', label: 'Payment',     sortable: true,  thClass: 'grid-col-payment' },
  { id: 'itemCount',     label: 'Items',       sortable: true,  thClass: 'grid-col-items',   tdClass: 'grid-td--items', rightAlign: true },
  { id: 'createdAt',     label: 'Created At',  sortable: true,  thClass: 'grid-col-created', tdClass: 'grid-td--date' },
  { id: 'updatedAt',     label: 'Updated At',  sortable: true,  thClass: 'grid-col-updated', tdClass: 'grid-td--date' },
  { id: 'notes',         label: 'Notes / Logs',sortable: false, thClass: 'grid-col-notes',   tdClass: 'grid-td--notes' },
];

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
  if (!dir) return <span className="grid-th__sort material-symbols-outlined" style={{ fontSize: 12, opacity: 0.3 }}>unfold_more</span>;
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
}

function Th({ col, sort, onSortClick }: ThProps) {
  const dir = sort?.columnId === col.id ? sort.direction : null;
  const isActive = sort?.columnId === col.id;
  const innerClass = col.rightAlign ? 'grid-th__inner grid-th__inner--right' : 'grid-th__inner';

  return (
    <th
      className={[
        'grid-th',
        col.thClass ?? '',
        col.sortable ? 'grid-th--sortable' : '',
        isActive ? 'grid-th--active' : '',
      ].join(' ')}
      onClick={col.sortable ? () => onSortClick(col.id) : undefined}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <div className={innerClass}>
        <span className="grid-th__label">{col.label}</span>
        {col.sortable && <SortArrow dir={dir} />}
        <span className="grid-th__resize" onClick={(e) => e.stopPropagation()}>|</span>
      </div>
    </th>
  );
}

// ─── Row cell renderer ──────────────────────────────────────────────────────

function renderCell(colId: string, order: Order): React.ReactNode {
  switch (colId) {
    case 'id':           return order.id;
    case 'customer':     return order.customer;
    case 'status':       return <StatusPill status={order.status} />;
    case 'amountINR':    return formatINR(order.amountINR);
    case 'region':       return order.region;
    case 'channel':      return order.channel;
    case 'priority':     return <PriorityBadge priority={order.priority} />;
    case 'paymentMethod':return order.paymentMethod;
    case 'itemCount':    return order.itemCount;
    case 'createdAt':    return formatDate(order.createdAt);
    case 'updatedAt':    return formatDate(order.updatedAt);
    case 'notes':        return order.notes || '—';
    default:             return null;
  }
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
          <span className="grid-empty__kbd" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>⌘F</span>
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
}

function StatusBar({ visibleCount, totalCount, selectedCount, totalFilteredAmount }: StatusBarProps) {
  const pct = totalCount > 0 ? ((visibleCount / totalCount) * 100).toFixed(2) : '0.00';
  return (
    <footer className="statusbar" role="status">
      {/* Left: selection + aggregate */}
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

      {/* Center: row count */}
      <div className="statusbar__center">
        <span>Showing</span>
        <span className="statusbar__stat-val">{visibleCount.toLocaleString()}</span>
        <span style={{ color: 'var(--text-muted)' }}>of</span>
        <span className="statusbar__stat-val" style={{ fontWeight: 400 }}>{totalCount.toLocaleString()} orders</span>
        <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
      </div>

      {/* Right: keyboard shortcuts */}
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
          <kbd className="statusbar__kbd">⌘F</kbd>
          <span>Filter</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">⌥E</kbd>
          <span>Export</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">Esc</kbd>
          <span>Reset</span>
        </span>
      </div>
    </footer>
  );
}

// ─── Main Grid component ──────────────────────────────────────────────────────

interface GridProps {
  orders: Order[];          // filtered + sorted rows to render
  totalCount: number;       // total orders in dataset (for empty state + status bar)
  onClearFilters: () => void;
  onOpenFilterBuilder: () => void;
}

export function Grid({ orders, totalCount, onClearFilters, onOpenFilterBuilder }: GridProps) {
  const { selectedIds, toggleRowSelection, sort } = useAppStore();
  const { handleColumnClick } = useSortColumn();

  // All IDs in current view — for select-all
  const allVisibleIds = useMemo(() => orders.map((o) => o.id), [orders]);

  // Selection helpers
  const selectedCount = useMemo(
    () => allVisibleIds.filter((id) => selectedIds.has(id)).length,
    [allVisibleIds, selectedIds]
  );
  const allSelected = allVisibleIds.length > 0 && selectedCount === allVisibleIds.length;
  const someSelected = selectedCount > 0 && selectedCount < allVisibleIds.length;

  const setSelectedIds = useAppStore((s) => s.setSelectedIds);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      // Deselect all visible
      const next = new Set(selectedIds);
      for (const id of allVisibleIds) next.delete(id);
      setSelectedIds(next);
    } else {
      // Select all visible (merge with existing)
      const next = new Set(selectedIds);
      for (const id of allVisibleIds) next.add(id);
      setSelectedIds(next);
    }
  }, [allSelected, allVisibleIds, selectedIds, setSelectedIds]);

  // Total amount of filtered orders
  const totalFilteredAmount = useMemo(
    () => orders.reduce((sum, o) => sum + o.amountINR, 0),
    [orders]
  );

  // Export row count (visible + selected)
  const exportSelectedCount = useMemo(
    () => orders.filter((o) => selectedIds.has(o.id)).length,
    [orders, selectedIds]
  );

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
        />
      </div>
    );
  }

  return (
    <div className="grid-wrapper">
      <div className="grid-scroll">
        <table className="grid-table" role="grid" aria-label="Orders data grid">
          <thead className="grid-thead">
            <tr style={{ height: 'var(--header-height)' }}>
              {/* Select all checkbox */}
              <th className="grid-th grid-th--check">
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
                />
              ))}
            </tr>
          </thead>
          <tbody className="grid-tbody">
            {orders.map((order, idx) => {
              const isSelected = selectedIds.has(order.id);
              const rowClass = [
                'grid-tr',
                idx % 2 === 0 ? 'grid-tr--even' : 'grid-tr--odd',
                isSelected ? 'grid-tr--selected' : '',
              ].join(' ');

              return (
                <tr
                  key={order.id}
                  className={rowClass}
                  onClick={() => toggleRowSelection(order.id)}
                  role="row"
                  aria-selected={isSelected}
                  style={{ cursor: 'default' }}
                >
                  {/* Checkbox */}
                  <td className="grid-td grid-td--check">
                    <input
                      type="checkbox"
                      className="grid-checkbox"
                      checked={isSelected}
                      onChange={() => toggleRowSelection(order.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select order ${order.id}`}
                    />
                  </td>

                  {/* Data cells */}
                  {COLUMNS.map((col) => (
                    <td
                      key={col.id}
                      className={[
                        'grid-td',
                        col.tdClass ?? '',
                        col.id === 'id' ? 'grid-td--id' : '',
                      ].join(' ')}
                      title={col.id === 'notes' ? (order.notes || '') : undefined}
                    >
                      {renderCell(col.id, order)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <StatusBar
        visibleCount={orders.length}
        totalCount={totalCount}
        selectedCount={exportSelectedCount}
        totalFilteredAmount={totalFilteredAmount}
      />
    </div>
  );
}
