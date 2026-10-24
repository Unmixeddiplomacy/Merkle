// ─── Indian currency formatter ────────────────────────────────────────────────

/**
 * Formats a number as Indian Rupees.
 *
 * Uses Intl.NumberFormat with locale 'en-IN' which produces correct Indian
 * digit grouping (3 digits first, then 2 digits each):
 *   123456.5  → "₹1,23,456.50"
 *   1000      → "₹1,000.00"
 *   50        → "₹50.00"
 *
 * Falls back to a manual formatter if the environment doesn't support 'en-IN'.
 */

let _inrFormatter: Intl.NumberFormat | null = null;

function getINRFormatter(): Intl.NumberFormat | null {
  if (_inrFormatter) return _inrFormatter;
  try {
    _inrFormatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    // Quick sanity check — en-IN should produce groups of 2 beyond the first 3
    const test = _inrFormatter.format(123456);
    if (!test.includes(',')) throw new Error('no grouping');
    return _inrFormatter;
  } catch {
    _inrFormatter = null;
    return null;
  }
}

/**
 * Manual Indian number grouping fallback.
 * Groups: rightmost 3 digits, then groups of 2 from right to left.
 */
function manualINR(amount: number): string {
  const fixed = Math.abs(amount).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const chars = intPart.split('').reverse();
  const groups: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (i === 3) groups.push(',');
    else if (i > 3 && (i - 3) % 2 === 0) groups.push(',');
    groups.push(chars[i]);
  }
  const formatted = groups.reverse().join('');
  return `${amount < 0 ? '-' : ''}₹${formatted}.${decPart}`;
}

export function formatINR(amount: number): string {
  const fmt = getINRFormatter();
  if (fmt) {
    // Intl result already includes the ₹ symbol for 'en-IN' + INR
    return fmt.format(amount);
  }
  return manualINR(amount);
}

// ─── Date formatter ───────────────────────────────────────────────────────────

/**
 * Formats a Date as "14 Mar 2025, 09:30" in UTC (all dates are stored as UTC).
 * Returns "—" for null.
 */

let _dateFormatter: Intl.DateTimeFormat | null = null;
let _timeFormatter: Intl.DateTimeFormat | null = null;

function getDateFormatter(): Intl.DateTimeFormat {
  if (!_dateFormatter) {
    _dateFormatter = new Intl.DateTimeFormat('en-GB', {
      day:      '2-digit',
      month:    'short',
      year:     'numeric',
      timeZone: 'UTC',
    });
  }
  return _dateFormatter;
}

function getTimeFormatter(): Intl.DateTimeFormat {
  if (!_timeFormatter) {
    _timeFormatter = new Intl.DateTimeFormat('en-GB', {
      hour:     '2-digit',
      minute:   '2-digit',
      hour12:   false,
      timeZone: 'UTC',
    });
  }
  return _timeFormatter;
}

export function formatDate(date: Date | null): string {
  if (date === null || date === undefined) return '—';
  // Produces e.g. "14 Mar 2025"
  const datePart = getDateFormatter().format(date);
  // Produces e.g. "09:30"
  const timePart = getTimeFormatter().format(date);
  return `${datePart}, ${timePart}`;
}

// ─── Short date (date only, no time) — for date filter chips ─────────────────
export function formatDateShort(date: Date | null): string {
  if (date === null || date === undefined) return '—';
  return getDateFormatter().format(date);
}
