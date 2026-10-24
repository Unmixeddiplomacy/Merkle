import type { Order } from '../types/order';
import type {
  Condition,
  DateCondition,
  EnumCondition,
  FilterState,
  NumberCondition,
  TextCondition,
} from '../types/filter';
import type { SortState } from '../types/sort';
import { sortOrders } from './sort';

// ─── Condition evaluators ─────────────────────────────────────────────────────

/**
 * Resolve the raw value of a field on an order.
 * Returns the value as-is so each evaluator can type-narrow correctly.
 */
function getFieldValue(order: Order, field: Condition['field']): unknown {
  return order[field as keyof Order];
}

function evaluateTextCondition(
  order: Order,
  cond: TextCondition
): boolean {
  const raw = getFieldValue(order, cond.field);
  const haystack = (typeof raw === 'string' ? raw : String(raw ?? '')).toLowerCase();
  const needle = cond.value.toLowerCase();

  // An empty needle means the condition is incomplete — treat as "pass all"
  if (needle === '') return true;

  switch (cond.operator) {
    case 'contains':
      return haystack.includes(needle);
    case 'not_contains':
      return !haystack.includes(needle);
    case 'equals':
      return haystack === needle;
  }
}

function evaluateNumberCondition(
  order: Order,
  cond: NumberCondition
): boolean {
  const raw = getFieldValue(order, cond.field);
  const val = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (isNaN(val)) return false;

  // Incomplete condition — pass all
  if (cond.value === '' || cond.value === undefined) return true;
  const v1 = Number(cond.value);
  if (isNaN(v1)) return true;

  switch (cond.operator) {
    case 'equals':
      return val === v1;
    case 'gt':
      return val > v1;
    case 'lt':
      return val < v1;
    case 'between': {
      if (cond.value2 === '' || cond.value2 === undefined) return true;
      const v2 = Number(cond.value2);
      if (isNaN(v2)) return true;
      return val >= v1 && val <= v2; // inclusive on both ends
    }
  }
}

function evaluateDateCondition(
  order: Order,
  cond: DateCondition
): boolean {
  const raw = getFieldValue(order, cond.field);
  // updatedAt can be null — null fields do not match any date condition
  if (raw === null || raw === undefined) return false;
  const orderDate = raw instanceof Date ? raw : new Date(String(raw));
  if (isNaN(orderDate.getTime())) return false;

  // Incomplete condition
  if (!cond.value) return true;
  // Parse as midnight UTC
  const v1 = new Date(cond.value + 'T00:00:00Z');
  if (isNaN(v1.getTime())) return true;

  switch (cond.operator) {
    case 'before':
      return orderDate < v1;
    case 'after':
      return orderDate > v1;
    case 'between': {
      // Both bounds required; if either is missing → no-op
      if (!cond.value2) return true;
      const v2 = new Date(cond.value2 + 'T00:00:00Z');
      if (isNaN(v2.getTime())) return true;
      // Inclusive on both ends
      return orderDate >= v1 && orderDate <= v2;
    }
  }
}

function evaluateEnumCondition(
  order: Order,
  cond: EnumCondition
): boolean {
  // Incomplete condition — no values selected → pass all
  if (cond.values.length === 0) return true;

  const raw = getFieldValue(order, cond.field);

  // Priority special case: "None" in the filter matches priority === null
  if (cond.field === 'priority') {
    return cond.values.some((v) => {
      if (v === 'None') return raw === null;
      return String(raw) === v;
    });
  }

  const strVal = typeof raw === 'string' ? raw : String(raw ?? '');
  return cond.values.includes(strVal);
}

function evaluateCondition(order: Order, cond: Condition): boolean {
  switch (cond.type) {
    case 'text':
      return evaluateTextCondition(order, cond);
    case 'number':
      return evaluateNumberCondition(order, cond);
    case 'date':
      return evaluateDateCondition(order, cond);
    case 'enum':
      return evaluateEnumCondition(order, cond);
  }
}

// ─── Filter application ───────────────────────────────────────────────────────

/**
 * Returns true if the order passes the filter.
 * - Empty filter (no groups) → always true
 * - Groups are ANDed
 * - Conditions within a group are ORed
 */
function matchesFilter(order: Order, filter: FilterState): boolean {
  if (filter.groups.length === 0) return true;

  return filter.groups.every((group) => {
    // Empty group → passes (so adding a new empty group doesn't hide all rows)
    if (group.conditions.length === 0) return true;
    return group.conditions.some((cond) => evaluateCondition(order, cond));
  });
}


// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Pure function: filter then sort the order list.
 *
 * - Never mutates the input array.
 * - Safe to wrap in useMemo — it has no side effects.
 * - Target: < 50 ms for 50,000 rows on a mid-range laptop.
 *
 * @param orders  Full normalised dataset from the store
 * @param filter  Current filter state (empty = show all)
 * @param sort    Current sort state (null = preserve insertion order)
 */
export function applyFilterAndSort(
  orders: Order[],
  filter: FilterState,
  sort: SortState | null
): Order[] {
  // Filter
  const filtered =
    filter.groups.length === 0
      ? orders // fast path: no filter active, skip the loop entirely
      : orders.filter((o) => matchesFilter(o, filter));

  // Sort — delegated to sort.ts (single source of truth)
  return sortOrders(filtered, sort);
}
