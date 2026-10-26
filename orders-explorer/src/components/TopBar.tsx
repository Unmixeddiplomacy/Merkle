import React from 'react';

interface TopBarProps {
  visibleCount: number;
  totalCount: number;
  exportRowCount: number;
  onExportCsv: () => void;
}

export const TopBar = React.memo(function TopBar({
  visibleCount,
  totalCount,
  exportRowCount,
  onExportCsv,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__brand">
          <span className="material-symbols-outlined topbar__logo">terminal</span>
          <span className="topbar__title">Orders Explorer</span>
        </div>
      </div>

      <div className="topbar__center">
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          sync_alt
        </span>
        <span className="topbar__count-num">{visibleCount.toLocaleString()}</span>
        <span>of</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {totalCount.toLocaleString()} orders
        </span>
        {exportRowCount > 0 && (
          <>
            <span className="topbar__sep">|</span>
            <span className="topbar__sel-count">
              {exportRowCount.toLocaleString()} selected
            </span>
          </>
        )}
      </div>

      <div className="topbar__right">
        <button
          id="export-csv-btn"
          className={`topbar__action-btn${
            exportRowCount === 0 ? ' topbar__action-btn--disabled' : ''
          }`}
          onClick={onExportCsv}
          disabled={exportRowCount === 0}
          title={
            exportRowCount === 0
              ? 'Select visible rows to export'
              : `Export ${exportRowCount.toLocaleString()} visible selected rows to CSV`
          }
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            download
          </span>
          Export CSV
          {exportRowCount > 0 && (
            <span className="topbar__export-count">{exportRowCount}</span>
          )}
          <kbd className="topbar__kbd">⌥E</kbd>
        </button>
      </div>
    </header>
  );
});
