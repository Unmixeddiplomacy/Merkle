import type {
  Channel,
  OrderStatus,
  PaymentMethod,
  Priority,
  Region,
} from '../types/order';

// ─── Whitelists ───────────────────────────────────────────────────────────────

export const VALID_STATUSES = new Set<OrderStatus>([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

export const VALID_REGIONS = new Set<Region>([
  'NORTH',
  'SOUTH',
  'EAST',
  'WEST',
  'CENTRAL',
  'NORTHEAST',
]);

export const VALID_CHANNELS = new Set<Channel>(['web', 'app', 'phone', 'store']);

export const VALID_PAYMENT_METHODS = new Set<PaymentMethod>([
  'upi',
  'card',
  'netbanking',
  'cod',
  'wallet',
]);

// ─── Date parsing ─────────────────────────────────────────────────────────────

/**
 * Parse a createdAt value that can arrive in four different formats:
 *   1. ISO with TZ   : "2025-03-14T09:30:00.000Z"
 *   2. ISO without TZ: "2025-03-14T09:30:00"  → treat as UTC
 *   3. Epoch seconds (number): 1741944600
 *   4. DD/MM/YYYY string: "14/03/2025"
 *
 * Returns null if the value cannot be parsed into a valid Date.
 */
export function parseCreatedAt(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  // ── Format 3: epoch seconds as a plain number ──
  if (typeof value === 'number') {
    const d = new Date(value * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value !== 'string' || value.trim() === '') return null;

  const raw = value.trim();

  // ── Format 4: DD/MM/YYYY ──
  const dmyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (dmyMatch) {
    // Construct as midnight UTC: "YYYY-MM-DDT00:00:00Z"
    const [, dd, mm, yyyy] = dmyMatch;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // ── Format 1: ISO with timezone (contains 'Z' or '+' offset) ──
  if (raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw)) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  // ── Format 2: ISO without timezone — treat as UTC by appending 'Z' ──
  // Covers "2025-03-14T09:30:00" and "2025-03-14T09:30:00.000"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    const d = new Date(raw + 'Z');
    return isNaN(d.getTime()) ? null : d;
  }

  // ── Fallback: let Date try it, but distrust the result ──
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse an updatedAt value (string | null | undefined).
 * Returns null when missing or explicitly null.
 */
export function parseUpdatedAt(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  return parseCreatedAt(value);
}

// ─── Field coercions ──────────────────────────────────────────────────────────

/** Parse amount to a float, handling the case where it arrives as a string. */
export function parseAmount(value: unknown): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }
  console.warn('[normalise] Unexpected amount type:', typeof value, value);
  return 0;
}

export function normaliseStatus(value: unknown): OrderStatus {
  if (typeof value !== 'string') return 'pending';
  const lower = value.trim().toLowerCase() as OrderStatus;
  if (VALID_STATUSES.has(lower)) return lower;
  console.warn('[normalise] Unknown status:', value, '→ defaulting to pending');
  return 'pending';
}

export function normaliseRegion(value: unknown): Region {
  if (typeof value !== 'string') return 'NORTH';
  const upper = value.trim().toUpperCase() as Region;
  if (VALID_REGIONS.has(upper)) return upper;
  console.warn('[normalise] Unknown region:', value, '→ defaulting to NORTH');
  return 'NORTH';
}

export function normaliseChannel(value: unknown): Channel {
  if (typeof value !== 'string') return 'web';
  const lower = value.trim().toLowerCase() as Channel;
  if (VALID_CHANNELS.has(lower)) return lower;
  console.warn('[normalise] Unknown channel:', value, '→ defaulting to web');
  return 'web';
}

export function normalisePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== 'string') return 'cod';
  const lower = value.trim().toLowerCase() as PaymentMethod;
  if (VALID_PAYMENT_METHODS.has(lower)) return lower;
  console.warn('[normalise] Unknown paymentMethod:', value, '→ defaulting to cod');
  return 'cod';
}

export function normalisePriority(value: unknown): Priority {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (n === 1 || n === 2 || n === 3) return n as Priority;
  return null;
}

/** Strip HTML-like tags from notes to prevent any XSS risk. */
export function stripHtml(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

export function normaliseItemCount(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) return Math.max(0, Math.round(value));
  const n = parseInt(String(value), 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

export function normaliseId(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value !== null && value !== undefined) return String(value).trim();
  return '';
}

export function normaliseSchemaVersion(value: unknown): 1 | 2 {
  if (value === 1) return 1;
  if (value === 2) return 2;
  return 2;
}
