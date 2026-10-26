// ─── Shared column definitions ────────────────────────────────────────────────

export interface ColDef {
  id: string;
  label: string;
  sortable: boolean;
  thClass?: string;
  tdClass?: string;
  rightAlign?: boolean;
}

export const COLUMNS: ColDef[] = [
  { id: 'id',            label: 'Order ID',     sortable: true,  thClass: 'grid-th--id',       tdClass: 'grid-td--id',       rightAlign: false },
  { id: 'customer',      label: 'Customer',     sortable: true,  thClass: 'grid-col-customer', tdClass: 'grid-td--customer' },
  { id: 'status',        label: 'Status',       sortable: true,  thClass: 'grid-col-status' },
  { id: 'amountINR',     label: 'Amount (₹)',   sortable: true,  thClass: 'grid-col-amount',   tdClass: 'grid-td--amount',   rightAlign: true },
  { id: 'region',        label: 'Region',       sortable: true,  thClass: 'grid-col-region' },
  { id: 'channel',       label: 'Channel',      sortable: true,  thClass: 'grid-col-channel' },
  { id: 'priority',      label: 'Priority',     sortable: true,  thClass: 'grid-col-priority' },
  { id: 'paymentMethod', label: 'Payment',      sortable: true,  thClass: 'grid-col-payment' },
  { id: 'itemCount',     label: 'Items',        sortable: true,  thClass: 'grid-col-items',    tdClass: 'grid-td--items',    rightAlign: true },
  { id: 'createdAt',     label: 'Created At',   sortable: true,  thClass: 'grid-col-created',  tdClass: 'grid-td--date' },
  { id: 'updatedAt',     label: 'Updated At',   sortable: true,  thClass: 'grid-col-updated',  tdClass: 'grid-td--date' },
  { id: 'notes',         label: 'Notes / Logs', sortable: false, thClass: 'grid-col-notes',    tdClass: 'grid-td--notes' },
];

export const DEFAULT_WIDTHS: Record<string, number> = {
  check: 36,
  id: 130,
  customer: 160,
  status: 110,
  amountINR: 120,
  region: 90,
  channel: 80,
  priority: 80,
  paymentMethod: 100,
  itemCount: 70,
  createdAt: 150,
  updatedAt: 150,
  notes: 200,
};

export const ROW_HEIGHT = 32; // matches --row-height CSS var
