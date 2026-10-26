import type { FieldDef, FieldId, FieldType } from '../../types/filter';

export const FIELD_DEFS: FieldDef[] = [
  { id: 'id',            label: 'Order ID',       type: 'text' },
  { id: 'customer',      label: 'Customer',       type: 'text' },
  { id: 'customerEmail', label: 'Customer Email', type: 'text' },
  { id: 'status',        label: 'Status',         type: 'enum', enumValues: ['pending','processing','shipped','delivered','cancelled'] },
  { id: 'amountINR',     label: 'Amount (₹)',  type: 'number' },
  { id: 'region',        label: 'Region',      type: 'enum', enumValues: ['NORTH','SOUTH','EAST','WEST','CENTRAL','NORTHEAST'] },
  { id: 'channel',       label: 'Channel',     type: 'enum', enumValues: ['web','app','phone','store'] },
  { id: 'priority',      label: 'Priority',    type: 'enum', enumValues: ['1','2','3','None'] },
  { id: 'paymentMethod', label: 'Payment',     type: 'enum', enumValues: ['upi','card','netbanking','cod','wallet'] },
  { id: 'itemCount',     label: 'Items',       type: 'number' },
  { id: 'createdAt',     label: 'Created At',  type: 'date' },
  { id: 'updatedAt',     label: 'Updated At',  type: 'date' },
  { id: 'notes',         label: 'Notes',       type: 'text' },
];

export const FIELD_MAP = new Map<FieldId, FieldDef>(
  FIELD_DEFS.map((f) => [f.id, f])
);

export const TEXT_OPERATOR_LABELS: Record<string, string> = {
  contains:     'contains',
  not_contains: 'does not contain',
  equals:       'equals',
};

export const NUMBER_OPERATOR_LABELS: Record<string, string> = {
  equals:  'equals',
  gt:      'greater than',
  lt:      'less than',
  between: 'between',
};

export const DATE_OPERATOR_LABELS: Record<string, string> = {
  before:  'before',
  after:   'after',
  between: 'between',
};

export const ENUM_OPERATOR_LABELS: Record<string, string> = {
  one_of: 'is any of',
};

export function getOperatorLabels(type: FieldType): Record<string, string> {
  switch (type) {
    case 'text':   return TEXT_OPERATOR_LABELS;
    case 'number': return NUMBER_OPERATOR_LABELS;
    case 'date':   return DATE_OPERATOR_LABELS;
    case 'enum':   return ENUM_OPERATOR_LABELS;
  }
}

export function defaultOperator(type: FieldType): string {
  switch (type) {
    case 'text':   return 'contains';
    case 'number': return 'gt';
    case 'date':   return 'after';
    case 'enum':   return 'one_of';
  }
}
