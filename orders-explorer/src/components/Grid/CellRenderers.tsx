import type { Order, OrderStatus } from '../../types/order';
import { formatINR, formatDate } from '../../utils/format';

// ─── Status pill ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'PENDING',
  processing: 'PROCESSING',
  shipped:    'SHIPPED',
  delivered:  'DELIVERED',
  cancelled:  'CANCELLED',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`status-pill status-pill--${status}`}>
      <span className="status-pill__dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Priority badge ──────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<number, string> = { 1: 'P1-HIGH', 2: 'P2-NORM', 3: 'P3-LOW' };

export function PriorityBadge({ priority }: { priority: number | null }) {
  if (priority === null) {
    return <span className="priority-badge--none">None</span>;
  }
  return (
    <span className={`priority-badge priority-badge--${priority}`}>
      <span className="priority-badge__dot" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

// ─── Sort arrow helper ────────────────────────────────────────────────────────

export function SortArrow({ dir }: { dir: 'asc' | 'desc' | null }) {
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

// ─── Cell renderer ────────────────────────────────────────────────────────────

export function renderCell(colId: string, order: Order): React.ReactNode {
  switch (colId) {
    case 'id':            return order.id;
    case 'customer':      return order.customer;
    case 'customerEmail': return order.customerEmail || '—';
    case 'status':        return <StatusPill status={order.status} />;
    case 'amountINR':     return formatINR(order.amountINR);
    case 'region':        return order.region;
    case 'channel':       return order.channel;
    case 'priority':      return <PriorityBadge priority={order.priority} />;
    case 'paymentMethod': return order.paymentMethod;
    case 'itemCount':     return order.itemCount;
    case 'createdAt':     return formatDate(order.createdAt);
    case 'updatedAt':     return formatDate(order.updatedAt);
    case 'notes':         return order.notes || '—';
    default:              return null;
  }
}
