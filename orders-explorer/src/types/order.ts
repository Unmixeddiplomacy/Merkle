// ─── Enum-like string unions ────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type Region = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL' | 'NORTHEAST';

export type Channel = 'web' | 'app' | 'phone' | 'store';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';

/**
 * Priority: 1 = highest, 3 = lowest, null = missing from the record.
 */
export type Priority = 1 | 2 | 3 | null;

// ─── Raw shape from orders.json ──────────────────────────────────────────────

/**
 * The exact shape of a record as it comes out of JSON.parse().
 * All fields are loosely typed because the source data is messy.
 * Version 1 and version 2 fields co-exist here; the normaliser resolves them.
 */
export interface RawOrder {
  id?: unknown;
  schemaVersion?: unknown;

  // v1 uses snake_case, v2 uses camelCase — both mean "customer name"
  customer_name?: unknown;
  customerName?: unknown;

  customerEmail?: unknown;
  status?: unknown;

  // Can be a number (rupees or paise) or a numeric string
  amount?: unknown;
  currency?: unknown;

  // Comes in four different formats (ISO+TZ, ISO no TZ, epoch seconds, DD/MM/YYYY)
  createdAt?: unknown;

  // May be a string, null, or missing entirely
  updatedAt?: unknown;

  region?: unknown;
  channel?: unknown;

  // May be 1, 2, 3, or absent
  priority?: unknown;

  paymentMethod?: unknown;
  itemCount?: unknown;

  // May be null, empty, or contain HTML-like text
  notes?: unknown;
}

// ─── Clean normalised shape used everywhere in the app ───────────────────────

/**
 * A fully normalised order record.
 * Every field here is typed strictly; no unknowns, no null amounts, no bad dates.
 * The normaliser is the ONLY place that produces this shape.
 */
export interface Order {
  /** e.g. "ORD-0001234" */
  id: string;

  /** Resolved from customer_name (v1) or customerName (v2) */
  customer: string;

  customerEmail: string;
  status: OrderStatus;

  /** Always in rupees (v1 paise values are divided by 100 during normalisation) */
  amountINR: number;

  currency: 'INR';

  /** Parsed from any of the four createdAt formats, always stored as a UTC Date */
  createdAt: Date;

  /** null when the field is missing or explicitly null in the source */
  updatedAt: Date | null;

  region: Region;
  channel: Channel;

  /** null when the field is missing */
  priority: Priority;

  paymentMethod: PaymentMethod;
  itemCount: number;

  /** Plain text only — HTML tags stripped by normaliser */
  notes: string;

  schemaVersion: 1 | 2;
}
