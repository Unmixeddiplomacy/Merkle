import { formatINR } from '../../utils/format';

// ─── Status bar ───────────────────────────────────────────────────────────────

export interface StatusBarProps {
  visibleCount: number;
  totalCount: number;
  selectedCount: number;
  totalFilteredAmount: number;
  onShowHelp: () => void;
}

export function StatusBar({
  visibleCount,
  totalCount,
  selectedCount,
  totalFilteredAmount,
  onShowHelp,
}: StatusBarProps) {
  const pct = totalCount > 0 ? ((visibleCount / totalCount) * 100).toFixed(2) : '0.00';
  return (
    <footer className="statusbar" role="status">
      {/* Left */}
      <div className="statusbar__left">
        <span className="statusbar__stat">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            {selectedCount > 0 ? 'check_box' : 'check_box_outline_blank'}
          </span>
          <span className="statusbar__stat-val">{selectedCount}</span>
          <span>rows selected</span>
        </span>
        <span className="statusbar__dot">•</span>
        <span className="statusbar__stat">
          Total filtered:
          <span className="statusbar__stat-val">{formatINR(totalFilteredAmount)}</span>
        </span>
      </div>

      {/* Center */}
      <div className="statusbar__center">
        <span>Showing</span>
        <span className="statusbar__stat-val">{visibleCount.toLocaleString()}</span>
        <span style={{ color: 'var(--text-muted)' }}>of</span>
        <span className="statusbar__stat-val" style={{ fontWeight: 400 }}>
          {totalCount.toLocaleString()} orders
        </span>
        <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
      </div>

      {/* Right: shortcuts hint + help */}
      <div className="statusbar__right">
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">↑/↓</kbd>
          <span>Navigate</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">Space</kbd>
          <span>Select</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">Enter</kbd>
          <span>Detail</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">⌘F</kbd>
          <span>Filter</span>
        </span>
        <span className="statusbar__shortcut">
          <kbd className="statusbar__kbd">⌥E</kbd>
          <span>Export</span>
        </span>
        <button
          type="button"
          className="statusbar__help-btn"
          onClick={onShowHelp}
          title="Show keyboard shortcuts"
          aria-label="Show keyboard shortcuts"
        >
          <kbd className="statusbar__kbd">?</kbd>
          <span>Help</span>
        </button>
      </div>
    </footer>
  );
}
