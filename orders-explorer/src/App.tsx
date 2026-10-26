import { useEffect, useMemo, useCallback, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { fetchAndNormaliseOrders } from './utils/loadOrders';
import { applyFilterAndSort } from './utils/filterAndSort';
import { useUrlSync } from './hooks/useUrlSync';
import { FilterBuilder } from './components/FilterBuilder/FilterBuilder';
import { Grid } from './components/Grid/Grid';
import { TopBar } from './components/TopBar';
import { ErrorBoundary } from './components/ErrorBoundary';
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

  // Open filter builder via ⌘F
  const handleOpenFilterBuilder = useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true })
    );
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
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        handleExportCsv();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleExportCsv]);

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

      {/* Top bar header */}
      <TopBar
        visibleCount={visibleOrders.length}
        totalCount={orders.length}
        exportRowCount={exportRows.length}
        onExportCsv={handleExportCsv}
      />

      {/* ── Main content area ────────────────────────────────────────────── */}
      <ErrorBoundary>
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
      </ErrorBoundary>
    </div>
  );
}
