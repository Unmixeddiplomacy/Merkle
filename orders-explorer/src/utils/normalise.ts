import type { Order, RawOrder } from '../types/order';
import {
  parseAmount,
  parseCreatedAt,
  parseUpdatedAt,
  normaliseStatus,
  normaliseRegion,
  normaliseChannel,
  normalisePaymentMethod,
  normalisePriority,
  stripHtml,
  normaliseItemCount,
  normaliseId,
  normaliseSchemaVersion,
} from './normaliseParsers';

// ─── Main normaliser ──────────────────────────────────────────────────────────

/**
 * Convert a single raw record into a clean, strongly-typed Order.
 * Returns null if the record has no usable ID (so callers can skip it).
 *
 * ALL ten data problems from data-notes.md are fixed here and ONLY here.
 */
export function normaliseOrder(raw: RawOrder, originalIndex: number): Order | null {
  if (!raw || typeof raw !== 'object') {
    console.warn('[normalise] Skipping non-object record at index', originalIndex);
    return null;
  }

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
    typeof customerRaw === 'string'
      ? customerRaw.trim()
      : (customerRaw ? String(customerRaw).trim() : '');

  // ── Problem 2 + 3 (amount): parse string, then convert paise→rupees for v1 ──
  const rawAmount = parseAmount(raw.amount);
  let amountINR = schemaVersion === 1 ? rawAmount / 100 : rawAmount;
  if (isNaN(amountINR)) {
    console.warn('[normalise] amountINR resulted in NaN at index', originalIndex, '— setting to 0');
    amountINR = 0;
  }

  // ── Problem 3 (createdAt): four formats ──
  const createdAtParsed = parseCreatedAt(raw.createdAt);
  const createdAt =
    createdAtParsed && !isNaN(createdAtParsed.getTime())
      ? createdAtParsed
      : new Date(0);

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
