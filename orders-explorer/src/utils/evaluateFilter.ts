import type { Order } from '../types/order';
import type {
  Condition,
  DateCondition,
  EnumCondition,
  FilterState,
  NumberCondition,
  TextCondition,
} from '../types/filter';

// ─── Helper: get field value from Order ──────────────────────────────────────

function getFieldValue(order: Order, field: Condition['field']): unknown {
  return order[field as keyof Order];
}

// ─── Condition evaluators ─────────────────────────────────────────────────────

function evalText(order: Order, cond: TextCondition): boolean {
  const raw = getFieldValue(order, cond.field);
  const val = raw == null ? '' : String(raw);
  if (cond.value === '') return true; // empty condition = no filter
  const a = val.toLowerCase();
  const b = cond.value.toLowerCase();
  switch (cond.operator) {
    case 'contains':     return a.includes(b);
    case 'not_contains': return !a.includes(b);
    case 'equals':       return a === b;
  }
}

function evalNumber(order: Order, cond: NumberCondition): boolean {
  if (cond.value === '' || cond.value == null) return true; // empty = no filter
  const raw = getFieldValue(order, cond.field);
  if (raw == null) return false;
  const n = Number(raw);
  const v = Number(cond.value);
  switch (cond.operator) {
    case 'equals':  return n === v;
    case 'gt':      return n > v;
    case 'lt':      return n < v;
    case 'between': {
      if (cond.value2 === '' || cond.value2 == null) return true; // one side = no-op
      const v2 = Number(cond.value2);
      return n >= v && n <= v2;
    }
  }
}

function evalDate(order: Order, cond: DateCondition): boolean {
  if (!cond.value) return true; // empty = no filter
  const raw = getFieldValue(order, cond.field);
  if (raw == null) return false; // null updatedAt → non-matching
  const d = raw instanceof Date ? raw : new Date(raw as string);
  if (isNaN(d.getTime())) return false;
  const v = new Date(cond.value);
  switch (cond.operator) {
    case 'before': return d < v;
    case 'after':  return d > v;
    case 'between': {
      if (!cond.value2) return true; // one side = no-op
      const v2 = new Date(cond.value2);
      // inclusive both ends
      return d >= v && d <= v2;
    }
  }
}

function evalEnum(order: Order, cond: EnumCondition): boolean {
  if (!cond.values.length) return true; // empty selection = no filter
  const raw = getFieldValue(order, cond.field);
  return cond.values.some((sel) => {
    if (sel === 'None') return raw === null || raw === undefined;
    // Priority: compare .toString()
    return String(raw) === sel;
  });
}

// ─── Condition dispatcher ─────────────────────────────────────────────────────

function evalCondition(order: Order, cond: Condition): boolean {
  switch (cond.type) {
    case 'text':   return evalText(order, cond);
    case 'number': return evalNumber(order, cond);
    case 'date':   return evalDate(order, cond);
    case 'enum':   return evalEnum(order, cond);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if `order` matches `filter`.
 *
 * - Empty filter (no groups) → true (show all)
 * - Groups are ANDed; conditions within a group are ORed
 * - An empty group (no conditions) evaluates to true
 */
export function evaluateFilter(order: Order, filter: FilterState): boolean {
  if (!filter.groups.length) return true;

  return filter.groups.every((group) => {
    if (!group.conditions.length) return true; // empty group = pass
    return group.conditions.some((cond) => evalCondition(order, cond));
  });
}
