import type { Order } from '../types/order';
import type { SortState } from '../types/sort';

// ─── Comparators ─────────────────────────────────────────────────────────────

/**
 * Compare two Order values for a given column, respecting sort direction.
 *
 * Null-last rule: null/undefined always sort AFTER non-null values in BOTH
 * asc and desc directions.  This is implemented explicitly before the
 * general direction multiplier is applied.
 */
function compareOrders(a: Order, b: Order, sort: SortState): number {
  const { columnId, direction } = sort;
  const mul = direction === 'asc' ? 1 : -1;

  switch (columnId) {
    // ── Lexicographic (case-insensitive) ──────────────────────────────────
    case 'id':
      return a.id.localeCompare(b.id) * mul;

    case 'customer':
      return a.customer.localeCompare(b.customer, undefined, { sensitivity: 'base' }) * mul;

    case 'customerEmail':
      return a.customerEmail.localeCompare(b.customerEmail, undefined, { sensitivity: 'base' }) * mul;

    case 'notes': {
      const an = a.notes ?? '';
      const bn = b.notes ?? '';
      return an.localeCompare(bn, undefined, { sensitivity: 'base' }) * mul;
    }

    case 'status':
      return a.status.localeCompare(b.status) * mul;

    case 'region':
      return a.region.localeCompare(b.region) * mul;

    case 'channel':
      return a.channel.localeCompare(b.channel) * mul;

    case 'paymentMethod':
      return a.paymentMethod.localeCompare(b.paymentMethod) * mul;

    // ── Numeric ───────────────────────────────────────────────────────────
    case 'amountINR':
      return (a.amountINR - b.amountINR) * mul;

    case 'itemCount':
      return (a.itemCount - b.itemCount) * mul;

    // ── Priority: numeric but null ALWAYS last in both directions ─────────
    case 'priority': {
      if (a.priority === null && b.priority === null) return 0;
      if (a.priority === null) return 1;   // always last
      if (b.priority === null) return -1;  // always last
      // Non-null: numeric sort respecting direction
      return direction === 'asc'
        ? a.priority - b.priority
        : b.priority - a.priority;
    }

    // ── createdAt: always non-null (normaliser guarantees Date) ───────────
    case 'createdAt':
      return (a.createdAt.getTime() - b.createdAt.getTime()) * mul;

    // ── updatedAt: nullable — null ALWAYS last ────────────────────────────
    case 'updatedAt': {
      if (a.updatedAt === null && b.updatedAt === null) return 0;
      if (a.updatedAt === null) return 1;   // always last
      if (b.updatedAt === null) return -1;  // always last
      return (a.updatedAt.getTime() - b.updatedAt.getTime()) * mul;
    }

    default:
      return 0;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sort a copy of `orders` by `sort`.  Returns the original array reference
 * unchanged when sort is null (fast-path, no allocation).
 *
 * IMPORTANT: Never mutates the input array — always sorts a shallow copy.
 */
export function sortOrders(
  orders: Order[],
  sort: SortState | null
): Order[] {
  if (sort === null) return orders;
  return [...orders].sort((a, b) => compareOrders(a, b, sort));
}

/**
 * Compute the next SortState for a column header click.
 *
 * Cycle: unsorted → asc → desc → unsorted (null)
 */
export function nextSortState(
  current: SortState | null,
  columnId: string
): SortState | null {
  if (current === null || current.columnId !== columnId) {
    return { columnId, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { columnId, direction: 'desc' };
  }
  // desc → remove sort
  return null;
}
