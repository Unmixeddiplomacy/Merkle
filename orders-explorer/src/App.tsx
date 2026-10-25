import { useEffect, useMemo, useCallback, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { fetchAndNormaliseOrders } from './utils/loadOrders';
import { applyFilterAndSort } from './utils/filterAndSort';
import { useUrlSync } from './hooks/useUrlSync';
import { FilterBuilder } from './components/FilterBuilder/FilterBuilder';
import { Grid } from './components/Grid/Grid';
import { exportToCsv, buildExportFilename } from './utils/exportCsv';
import { EMPTY_FILTER } from './types/filter';
import type { FilterState } from './types/filter';
import './index.css';
import './App.css';

const MAX_SEL_IN_URL = 500;

export default function App() {
  const {
    orders,
    isLoading,
    error,
    filter,
    sort,
    selectedIds,
    setOrders,
    setLoading,
    setError,
    setFilter,
    urlErrorBanner,
    dismissUrlErrorBanner,
  } = useAppStore();

  useUrlSync();

  const [exportToast, setExportToast] = useState<string | null>(null);

  // Load orders on mount
  useEffect(() => {
    fetchAndNormaliseOrders()
      .then((data) => setOrders(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived: filtered + sorted
  const visibleOrders = useMemo(
    () => applyFilterAndSort(orders, filter, sort),
    [orders, filter, sort]
  );

  // Visible + selected = export rows
  const exportRows = useMemo(
    () => visibleOrders.filter((o) => selectedIds.has(o.id)),
    [visibleOrders, selectedIds]
  );

  const selTooLargeForUrl = selectedIds.size > MAX_SEL_IN_URL;

  const handleFilterChange = useCallback(
    (newFilter: FilterState) => setFilter(newFilter),
    [setFilter]
  );

  const handleClearFilters = useCallback(() => {
    setFilter(EMPTY_FILTER);
  }, [setFilter]);

  // Open filter builder via ⌘F — FilterBuilder handles the keyboard shortcut itself,
  // but we expose this for the empty state "Modify conditions" button.
  const handleOpenFilterBuilder = useCallback(() => {
    // Dispatch a synthetic Ctrl+F to trigger FilterBuilder's keyboard handler
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true }));
  }, []);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    if (exportRows.length === 0) {
      setExportToast('No visible rows selected. Select rows to export.');
      setTimeout(() => setExportToast(null), 4000);
      return;
    }
    exportToCsv(exportRows, buildExportFilename());
  }, [exportRows]);

  // Alt+E shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'e') { e.preventDefault(); handleExportCsv(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleExportCsv]);

  // NOTE: Escape key is now handled by the Grid component:
  //   - If detail panel is open: closes the panel
  //   - Otherwise: deselects all selected rows
  // The FilterBuilder manages its own Escape (Ctrl+F toggle).

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="app-state">
        <div className="spinner" aria-label="Loading orders" />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
          Loading orders…
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="app-state app-state--error">
        <p>⚠ Failed to load orders</p>
        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{error}</pre>
      </div>
    );
  }

  // ── Full shell ───────────────────────────────────────────────────────────
  return (
    <div className="layout">
      {/* URL error banner */}
      {urlErrorBanner && (
        <div className="url-banner" role="alert">
          <span>⚠ {urlErrorBanner}</span>
          <button onClick={dismissUrlErrorBanner} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Large selection URL warning */}
      {selTooLargeForUrl && (
        <div className="url-banner url-banner--info" role="status">
          <span>ℹ Selection not saved in URL (too large — {selectedIds.size.toLocaleString()} rows selected)</span>
        </div>
      )}

      {/* Export toast */}
      {exportToast && (
        <div className="export-toast" role="alert">{exportToast}</div>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar__left">
          <div className="topbar__brand">
            <span className="material-symbols-outlined topbar__logo">terminal</span>
            <span className="topbar__title">Orders Explorer</span>
          </div>
        </div>

        <div className="topbar__center">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>sync_alt</span>
          <span className="topbar__count-num">{visibleOrders.length.toLocaleString()}</span>
          <span>of</span>
          <span style={{ color: 'var(--text-secondary)' }}>{orders.length.toLocaleString()} orders</span>
          {exportRows.length > 0 && (
            <>
              <span className="topbar__sep">|</span>
              <span className="topbar__sel-count">{exportRows.length.toLocaleString()} selected</span>
            </>
          )}
        </div>

        <div className="topbar__right">
          <button
            id="export-csv-btn"
            className={`topbar__action-btn${exportRows.length === 0 ? ' topbar__action-btn--disabled' : ''}`}
            onClick={handleExportCsv}
            disabled={exportRows.length === 0}
            title={
              exportRows.length === 0
                ? 'Select visible rows to export'
                : `Export ${exportRows.length.toLocaleString()} visible selected rows to CSV`
            }
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
            Export CSV
            {exportRows.length > 0 && (
              <span className="topbar__export-count">{exportRows.length}</span>
            )}
            <kbd className="topbar__kbd">⌥E</kbd>
          </button>
        </div>
      </header>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <main className="content-area">
        <div className="content-inner">
          {/* Filter Builder */}
          <FilterBuilder
            filter={filter}
            onChange={handleFilterChange}
            matchingCount={visibleOrders.length}
            totalCount={orders.length}
          />

          {/* Data Grid */}
          <Grid
            orders={visibleOrders}
            totalCount={orders.length}
            onClearFilters={handleClearFilters}
            onOpenFilterBuilder={handleOpenFilterBuilder}
          />
        </div>
      </main>
    </div>
  );
}
