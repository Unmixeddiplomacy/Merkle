import { useRef, useEffect } from 'react';
import type { KeyboardEvent as ReactKbdEvent } from 'react';
import type { Order } from '../../types/order';
import { formatINR, formatDate } from '../../utils/format';
import { StatusPill, PriorityBadge } from './CellRenderers';

// ─── Detail row helper ────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid-detail-panel__row">
      <span className="grid-detail-panel__row-label">{label}</span>
      <span
        className={`grid-detail-panel__row-value${mono ? ' grid-detail-panel__row-value--mono' : ''}`}
      >
        {children ?? value ?? '—'}
      </span>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

export interface DetailPanelProps {
  order: Order;
  onClose: () => void;
}

export function DetailPanel({ order, onClose }: DetailPanelProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus close button via requestAnimationFrame so panel is rendered first
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleKeyDown = (e: ReactKbdEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <>
      {/* Overlay — does NOT intercept scroll on grid behind it */}
      <div
        className="grid-detail-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="grid-detail-panel"
        role="dialog"
        aria-label="Order details"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Panel header */}
        <div className="grid-detail-panel__header">
          <div className="grid-detail-panel__title-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span>
            <span className="grid-detail-panel__title">Order Details</span>
            <span className="grid-detail-panel__id">{order.id}</span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="grid-detail-panel__close"
            onClick={onClose}
            aria-label="Close order details"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Panel body */}
        <div className="grid-detail-panel__body">
          <div className="grid-detail-panel__section">
            <div className="grid-detail-panel__section-label">Identity</div>
            <DetailRow label="Order ID" value={order.id} mono />
            <DetailRow label="Customer" value={order.customer} />
            <DetailRow label="Email" value={order.customerEmail} mono />
            <DetailRow label="Schema Version" value={`v${order.schemaVersion}`} mono />
          </div>
          <div className="grid-detail-panel__section">
            <div className="grid-detail-panel__section-label">Transaction</div>
            <DetailRow label="Status"><StatusPill status={order.status} /></DetailRow>
            <DetailRow label="Amount" value={formatINR(order.amountINR)} mono />
            <DetailRow label="Currency" value={order.currency} mono />
            <DetailRow label="Payment" value={order.paymentMethod} mono />
            <DetailRow label="Items" value={String(order.itemCount)} mono />
          </div>
          <div className="grid-detail-panel__section">
            <div className="grid-detail-panel__section-label">Routing</div>
            <DetailRow label="Region" value={order.region} mono />
            <DetailRow label="Channel" value={order.channel} mono />
            <DetailRow label="Priority"><PriorityBadge priority={order.priority} /></DetailRow>
          </div>
          <div className="grid-detail-panel__section">
            <div className="grid-detail-panel__section-label">Timestamps</div>
            <DetailRow label="Created" value={formatDate(order.createdAt)} mono />
            <DetailRow label="Updated" value={order.updatedAt ? formatDate(order.updatedAt) : '—'} mono />
          </div>
          {order.notes && (
            <div className="grid-detail-panel__section">
              <div className="grid-detail-panel__section-label">Notes / Logs</div>
              <div className="grid-detail-panel__notes">{order.notes}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
