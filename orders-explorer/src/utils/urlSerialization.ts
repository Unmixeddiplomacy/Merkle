import type { FilterState } from '../types/filter';
import type { SortState } from '../types/sort';
import { COLUMN_ID_SET } from '../types/columns';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Maximum number of selected IDs we'll encode into the URL.
 * Beyond this the URL becomes impractically long.
 */
export const MAX_SEL_IN_URL = 500;

/**
 * Debounce delay (ms) for writing back to the URL.
 * Prevents hitting browser history API rate limits (~100 calls / 30 s).
 */
export const URL_WRITE_DEBOUNCE_MS = 200;

/** Regex a valid order ID must satisfy when read from the URL. */
export const ORDER_ID_RE = /^ORD-\d+$/;

// ─── Safe base64 helpers (handles Unicode in notes / customer names) ──────────

export function toBase64(str: string): string {
  // encodeURIComponent percent-encodes unicode → escape() converts to latin1-safe
  // → btoa() encodes to base64. This is the classic unicode-safe btoa trick.
  return btoa(encodeURIComponent(str));
}

export function fromBase64(b64: string): string {
  return decodeURIComponent(atob(b64));
}

// ─── Serialisers ──────────────────────────────────────────────────────────────

export function serialiseFilter(f: FilterState): string {
  return toBase64(JSON.stringify(f));
}

export function serialiseSort(s: SortState): string {
  return `${s.columnId}:${s.direction}`;
}

export function serialiseSel(ids: Set<string>): string {
  return Array.from(ids).join(',');
}

// ─── Deserialisers (NEVER throw — always return a safe default) ───────────────

const VALID_FIELD_IDS = new Set([
  'id',
  'customer',
  'customerEmail',
  'status',
  'amountINR',
  'region',
  'channel',
  'priority',
  'paymentMethod',
  'itemCount',
  'notes',
  'createdAt',
  'updatedAt',
]);

const VALID_TYPES = new Set(['text', 'number', 'date', 'enum']);

function isValidCondition(c: unknown): boolean {
  if (!c || typeof c !== 'object') return false;
  const cond = c as Record<string, unknown>;
  if (!cond.field || typeof cond.field !== 'string' || !VALID_FIELD_IDS.has(cond.field)) return false;
  if (!cond.type || typeof cond.type !== 'string' || !VALID_TYPES.has(cond.type)) return false;
  if (!cond.operator || typeof cond.operator !== 'string') return false;
  return true;
}

function isValidFilterGroup(g: unknown): boolean {
  if (!g || typeof g !== 'object') return false;
  const group = g as Record<string, unknown>;
  if (!group.id || typeof group.id !== 'string') return false;
  if (!Array.isArray(group.conditions)) return false;
  return group.conditions.every(isValidCondition);
}

function isValidFilterState(f: unknown): f is FilterState {
  if (!f || typeof f !== 'object') return false;
  const filter = f as Record<string, unknown>;
  if (!Array.isArray(filter.groups)) return false;
  return filter.groups.every(isValidFilterGroup);
}

export function deserialiseFilter(raw: string | null): FilterState | null {
  if (!raw) return null;
  try {
    const json = fromBase64(raw);
    const parsed: unknown = JSON.parse(json);
    if (isValidFilterState(parsed)) {
      return parsed;
    }
    console.warn('[useUrlSync] filter param had unexpected shape or invalid fields — ignoring');
    return null;
  } catch (e) {
    console.warn('[useUrlSync] Could not decode filter param:', e);
    return null;
  }
}

export function deserialiseSort(raw: string | null): SortState | null {
  if (!raw) return null;
  const parts = raw.split(':');
  if (parts.length !== 2) return null;
  const [columnId, direction] = parts;
  if (!COLUMN_ID_SET.has(columnId)) {
    console.warn('[useUrlSync] Unknown sort columnId:', columnId);
    return null;
  }
  if (direction !== 'asc' && direction !== 'desc') {
    console.warn('[useUrlSync] Invalid sort direction:', direction);
    return null;
  }
  return { columnId, direction };
}

export function deserialisePinnedColumn(raw: string | null): string | null {
  if (!raw) return null;
  if (!COLUMN_ID_SET.has(raw)) {
    console.warn('[useUrlSync] Unknown pinned column:', raw);
    return null;
  }
  return raw;
}

export function deserialiseSel(raw: string | null): Set<string> {
  if (!raw) return new Set();
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => ORDER_ID_RE.test(s));
  return new Set(ids);
}
