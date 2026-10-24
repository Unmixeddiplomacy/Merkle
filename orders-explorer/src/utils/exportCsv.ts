import type { Order } from '../types/order';

// ─── CSV injection protection ─────────────────────────────────────────────────

/**
 * Characters that trigger Excel formula execution when at the start of a cell.
 * Prefix with a single-quote to neutralise them.
 */
const FORMULA_TRIGGER_RE = /^[=+\-@]/;

/**
 * Escapes a single field value for CSV:
 *  1. Coerce to string
 *  2. Neutralise potential Excel injection (=, +, -, @)
 *  3. If the value contains comma, double-quote, or newline → wrap in quotes
 *     and escape internal double-quotes by doubling them
 */
function escapeField(raw: unknown): string {
  let s = raw === null || raw === undefined ? '' : String(raw);

  // CSV injection guard: prefix dangerous leading characters
  if (FORMULA_TRIGGER_RE.test(s)) {
    s = "'" + s;
  }

  // Wrap in quotes if the field contains special characters
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    // Double any internal double-quotes
    s = '"' + s.replace(/"/g, '""') + '"';
  }

  return s;
}

// ─── Column definitions for the CSV ──────────────────────────────────────────

/**
 * Maps each CSV column to a label and a value extractor.
 * Amount uses the raw number (not formatted) so Excel can parse it.
 * Dates use ISO 8601 (portable across locales).
 */
const CSV_COLUMNS: Array<{
  label: string;
  getValue: (o: Order) => unknown;
}> = [
  { label: 'Order ID',        getValue: (o) => o.id },
  { label: 'Customer',        getValue: (o) => o.customer },
  { label: 'Email',           getValue: (o) => o.customerEmail },
  { label: 'Status',          getValue: (o) => o.status },
  { label: 'Amount (INR)',    getValue: (o) => o.amountINR },
  { label: 'Region',          getValue: (o) => o.region },
  { label: 'Channel',         getValue: (o) => o.channel },
  { label: 'Priority',        getValue: (o) => o.priority ?? '' },
  { label: 'Payment Method',  getValue: (o) => o.paymentMethod },
  { label: 'Item Count',      getValue: (o) => o.itemCount },
  { label: 'Created At',      getValue: (o) => o.createdAt.toISOString() },
  { label: 'Updated At',      getValue: (o) => o.updatedAt ? o.updatedAt.toISOString() : '' },
  { label: 'Notes',           getValue: (o) => o.notes },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exports a list of orders as a CSV file download.
 *
 * - Uses CRLF line endings (Windows Excel compatibility)
 * - Amount is raw numeric (not formatted) so Excel can parse formulas on it
 * - Dates are ISO 8601 strings in UTC
 * - CSV injection is neutralised by prefixing = + - @ with a single-quote
 * - revokeObjectURL is deferred 100ms so the browser has time to start the download
 *
 * @param orders   Orders to export (should already be filtered+selected by caller)
 * @param filename Target filename including extension (e.g. "orders-export-2025-03-14.csv")
 * @returns        'ok' | 'empty' — callers should show a toast on 'empty'
 */
export function exportToCsv(orders: Order[], filename: string): 'ok' | 'empty' {
  if (orders.length === 0) return 'empty';

  // ── Build rows ─────────────────────────────────────────────────────────────
  const headerRow = CSV_COLUMNS.map((c) => escapeField(c.label)).join(',');

  const dataRows = orders.map((order) =>
    CSV_COLUMNS.map((c) => escapeField(c.getValue(order))).join(',')
  );

  const csv = [headerRow, ...dataRows].join('\r\n') + '\r\n';

  // ── Create Blob ────────────────────────────────────────────────────────────
  // UTF-8 BOM (0xEF 0xBB 0xBF) tells Excel to interpret the file as UTF-8.
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  // ── Programmatic download ──────────────────────────────────────────────────
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Defer revoke so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 100);

  return 'ok';
}

/**
 * Builds a filename for the export using today's date in UTC.
 * Example: "orders-export-2025-03-14.csv"
 */
export function buildExportFilename(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `orders-export-${today}.csv`;
}
