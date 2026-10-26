// ─── Empty state ──────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  totalCount: number;
  onClearFilters: () => void;
  onOpenFilterBuilder: () => void;
}

export function EmptyState({ totalCount, onClearFilters, onOpenFilterBuilder }: EmptyStateProps) {
  return (
    <div className="grid-empty">
      <div className="grid-empty__icon-wrap">
        <div className="grid-empty__icon-outer">
          <div className="grid-empty__icon-inner">
            <span className="material-symbols-outlined">filter_alt_off</span>
          </div>
        </div>
        <div className="grid-empty__badge">0 res</div>
      </div>
      <h3 className="grid-empty__title">No orders match your filter criteria</h3>
      <p className="grid-empty__subtitle">
        Zero transactions satisfied your active constraints.
        Try adjusting conditions or clearing all filters.
        Showing <strong>0</strong> of <strong>{totalCount.toLocaleString()}</strong> orders.
      </p>
      <div className="grid-empty__actions">
        <button className="grid-empty__btn-primary" onClick={onClearFilters} type="button">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>restart_alt</span>
          Clear all filters
          <span className="grid-empty__kbd">Esc</span>
        </button>
        <button className="grid-empty__btn-secondary" onClick={onOpenFilterBuilder} type="button">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>tune</span>
          Modify conditions
          <span
            className="grid-empty__kbd"
            style={{
              background: 'var(--surface-subtle)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-muted)',
            }}
          >
            ⌘F
          </span>
        </button>
      </div>
    </div>
  );
}
