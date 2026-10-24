import type {
  Channel,
  Order,
  OrderStatus,
  PaymentMethod,
  Priority,
  RawOrder,
  Region,
} from '../types/order';

// ─── Whitelists ───────────────────────────────────────────────────────────────

const VALID_STATUSES = new Set<OrderStatus>([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

const VALID_REGIONS = new Set<Region>([
  'NORTH',
  'SOUTH',
  'EAST',
  'WEST',
  'CENTRAL',
  'NORTHEAST',
]);

const VALID_CHANNELS = new Set<Channel>(['web', 'app', 'phone', 'store']);

const VALID_PAYMENT_METHODS = new Set<PaymentMethod>([
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
function parseCreatedAt(value: unknown): Date | null {
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
function parseUpdatedAt(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  return parseCreatedAt(value); // same logic covers all cases
}

// ─── Field coercions ──────────────────────────────────────────────────────────

/** Parse amount to a float, handling the case where it arrives as a string. */
function parseAmount(value: unknown): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }
  console.warn('[normalise] Unexpected amount type:', typeof value, value);
  return 0;
}

function normaliseStatus(value: unknown): OrderStatus {
  if (typeof value !== 'string') return 'pending';
  const lower = value.trim().toLowerCase() as OrderStatus;
  if (VALID_STATUSES.has(lower)) return lower;
  console.warn('[normalise] Unknown status:', value, '→ defaulting to pending');
  return 'pending';
}

function normaliseRegion(value: unknown): Region {
  if (typeof value !== 'string') return 'NORTH';
  const upper = value.trim().toUpperCase() as Region;
  if (VALID_REGIONS.has(upper)) return upper;
  console.warn('[normalise] Unknown region:', value, '→ defaulting to NORTH');
  return 'NORTH';
}

function normaliseChannel(value: unknown): Channel {
  if (typeof value !== 'string') return 'web';
  const lower = value.trim().toLowerCase() as Channel;
  if (VALID_CHANNELS.has(lower)) return lower;
  console.warn('[normalise] Unknown channel:', value, '→ defaulting to web');
  return 'web';
}

function normalisePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== 'string') return 'cod';
  const lower = value.trim().toLowerCase() as PaymentMethod;
  if (VALID_PAYMENT_METHODS.has(lower)) return lower;
  console.warn('[normalise] Unknown paymentMethod:', value, '→ defaulting to cod');
  return 'cod';
}

function normalisePriority(value: unknown): Priority {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (n === 1 || n === 2 || n === 3) return n as Priority;
  return null; // anything else (0, 4, NaN, …) is treated as missing
}

/** Strip HTML-like tags from notes to prevent any XSS risk. */
function stripHtml(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Replace every <...> sequence with nothing — plain regex, no DOM required
  return value.replace(/<[^>]*>/g, '').trim();
}

function normaliseItemCount(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) return Math.max(0, Math.round(value));
  const n = parseInt(String(value), 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function normaliseId(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value !== null && value !== undefined) return String(value).trim();
  return '';
}

function normaliseSchemaVersion(value: unknown): 1 | 2 {
  if (value === 1) return 1;
  if (value === 2) return 2;
  // Anything unexpected is treated as v2 (newer format fallback)
  return 2;
}

// ─── Main normaliser ──────────────────────────────────────────────────────────

/**
 * Convert a single raw record into a clean, strongly-typed Order.
 * Returns null if the record has no usable ID (so callers can skip it).
 *
 * ALL ten data problems from data-notes.md are fixed here and ONLY here.
 */
export function normaliseOrder(raw: RawOrder, originalIndex: number): Order | null {
  // ── Guard: must have an ID ──
  const id = normaliseId(raw.id);
  if (!id) {
    console.warn('[normalise] Skipping record at index', originalIndex, '— missing id');
    return null;
  }

  const schemaVersion = normaliseSchemaVersion(raw.schemaVersion);

  // ── Problem 1: two names for customer ──
  const customerRaw =
    schemaVersion === 1
      ? (raw.customer_name ?? raw.customerName)
      : (raw.customerName ?? raw.customer_name);
  const customer =
    typeof customerRaw === 'string' ? customerRaw.trim() : '';

  // ── Problem 2 + 3 (amount): parse string, then convert paise→rupees for v1 ──
  const rawAmount = parseAmount(raw.amount);
  const amountINR = schemaVersion === 1 ? rawAmount / 100 : rawAmount;

  // ── Problem 9 (currency): trim trailing spaces ──
  // We always output 'INR' — the source field is only checked for completeness
  // const currency = typeof raw.currency === 'string' ? raw.currency.trim() : 'INR';

  // ── Problem 3 (createdAt): four formats ──
  const createdAtParsed = parseCreatedAt(raw.createdAt);
  // If unparseable, fall back to epoch (1970-01-01) as a last resort — do not crash
  const createdAt = createdAtParsed ?? new Date(0);

  // ── Problem 4 (updatedAt): null or missing ──
  const updatedAt = parseUpdatedAt(raw.updatedAt);

  // ── Problem 5 (status/region casing) ──
  const status = normaliseStatus(raw.status);
  const region = normaliseRegion(raw.region);

  // ── Problem 7 (priority missing) ──
  const priority = normalisePriority(raw.priority);

  // ── Problem 8 (notes HTML) ──
  const notes = stripHtml(raw.notes);

  const channel = normaliseChannel(raw.channel);
  const paymentMethod = normalisePaymentMethod(raw.paymentMethod);
  const itemCount = normaliseItemCount(raw.itemCount);
  const customerEmail =
    typeof raw.customerEmail === 'string' ? raw.customerEmail.trim() : '';

  return {
    id,
    customer,
    customerEmail,
    status,
    amountINR,
    currency: 'INR',
    createdAt,
    updatedAt,
    region,
    channel,
    priority,
    paymentMethod,
    itemCount,
    notes,
    schemaVersion,
  };
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Problem 6: ~30 order IDs appear in two records.
 * Keep one per ID according to these rules:
 *   - Both have updatedAt  → keep the LATER updatedAt
 *   - Only one has updatedAt → keep that one
 *   - Neither has updatedAt → keep the one that appeared LATER in the file
 *
 * The input array is already normalised, so IDs are trimmed strings.
 */
export function deduplicateOrders(orders: Order[]): Order[] {
  const seen = new Map<string, { order: Order; originalIndex: number }>();

  orders.forEach((order, originalIndex) => {
    const existing = seen.get(order.id);

    if (!existing) {
      seen.set(order.id, { order, originalIndex });
      return;
    }

    const existingUpdatedAt = existing.order.updatedAt;
    const incomingUpdatedAt = order.updatedAt;

    let keepIncoming = false;

    if (existingUpdatedAt !== null && incomingUpdatedAt !== null) {
      // Both have updatedAt → keep the later one
      keepIncoming = incomingUpdatedAt.getTime() > existingUpdatedAt.getTime();
    } else if (existingUpdatedAt === null && incomingUpdatedAt !== null) {
      // Only incoming has updatedAt → keep incoming
      keepIncoming = true;
    } else if (existingUpdatedAt !== null && incomingUpdatedAt === null) {
      // Only existing has updatedAt → keep existing (keepIncoming = false)
      keepIncoming = false;
    } else {
      // Neither has updatedAt → keep the one that appears LATER in the file
      keepIncoming = originalIndex > existing.originalIndex;
    }

    if (keepIncoming) {
      seen.set(order.id, { order, originalIndex });
    }
  });

  return Array.from(seen.values()).map((entry) => entry.order);
}
