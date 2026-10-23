// ─── Field identifiers ────────────────────────────────────────────────────────

export type FieldId =
  | 'id'
  | 'customer'
  | 'customerEmail'
  | 'status'
  | 'amountINR'
  | 'region'
  | 'channel'
  | 'priority'
  | 'paymentMethod'
  | 'itemCount'
  | 'notes'
  | 'createdAt'
  | 'updatedAt';

export type FieldType = 'text' | 'number' | 'date' | 'enum';

export interface FieldDef {
  id: FieldId;
  label: string;
  type: FieldType;
  /** Only set for enum-type fields */
  enumValues?: string[];
}

// ─── Operators per field type ─────────────────────────────────────────────────

export type TextOperator = 'contains' | 'not_contains' | 'equals';
export type NumberOperator = 'equals' | 'gt' | 'lt' | 'between';
export type DateOperator = 'before' | 'after' | 'between';
export type EnumOperator = 'one_of';

// ─── Condition variants ───────────────────────────────────────────────────────

export interface TextCondition {
  field: FieldId;
  type: 'text';
  operator: TextOperator;
  value: string;
}

export interface NumberCondition {
  field: FieldId;
  type: 'number';
  operator: NumberOperator;
  /** Primary value */
  value: number | '';
  /** Second bound for "between" */
  value2?: number | '';
}

export interface DateCondition {
  field: FieldId;
  type: 'date';
  operator: DateOperator;
  /** ISO date string "YYYY-MM-DD" */
  value: string;
  /** Second bound for "between" */
  value2?: string;
}

export interface EnumCondition {
  field: FieldId;
  type: 'enum';
  operator: EnumOperator;
  /** Selected enum values (e.g. ['shipped', 'delivered']) */
  values: string[];
}

export type Condition =
  | TextCondition
  | NumberCondition
  | DateCondition
  | EnumCondition;

// ─── Group and top-level state ────────────────────────────────────────────────

/**
 * A group of conditions combined with OR.
 * Multiple groups are combined with AND.
 */
export interface FilterGroup {
  /** Stable unique id — use crypto.randomUUID() when creating */
  id: string;
  conditions: Condition[];
}

/**
 * The complete filter state serialised to/from the URL.
 * An empty groups array means "no filter" (show everything).
 */
export interface FilterState {
  groups: FilterGroup[];
}

/** Convenience: a filter that shows every row */
export const EMPTY_FILTER: FilterState = { groups: [] };
