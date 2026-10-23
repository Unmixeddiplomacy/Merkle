/**
 * Single source of truth for all column IDs in the data grid.
 *
 * Used by:
 *  - useUrlSync  → validate `pin` and `sort` URL params
 *  - useAppStore → typed pinnedColumn
 *  - columns.ts  → column definitions (Step 4)
 *
 * Keep this list in sync with columns.ts when adding/removing columns.
 */
export const COLUMN_IDS = [
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
  'createdAt',
  'updatedAt',
  'notes',
] as const;

export type ColumnId = (typeof COLUMN_IDS)[number];

export const COLUMN_ID_SET = new Set<string>(COLUMN_IDS);
