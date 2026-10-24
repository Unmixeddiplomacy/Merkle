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

  // Esc = clear filters
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClearFilters();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClearFilters]);

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
          <span className="topbar__badge">v2.8.4-prod</span>
          <span className="topbar__live">
            <span className="topbar__live-dot" />
            LIVE
          </span>
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
          <span className="topbar__sep">|</span>
          <span className="topbar__latency">Stream: 42ms</span>
        </div>

        <div className="topbar__right">
          <div className="topbar__view-toggle">
            <button className="topbar__view-btn active" title="Table View" type="button">
              <span className="material-symbols-outlined">table_rows</span>
            </button>
            <button className="topbar__view-btn" title="Split Inspector" type="button">
              <span className="material-symbols-outlined">vertical_split</span>
            </button>
            <button className="topbar__view-btn" title="Raw Log" type="button">
              <span className="material-symbols-outlined">data_array</span>
            </button>
          </div>

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

          <div className="topbar__divider" />
          <div className="topbar__right-group">
            <span className="topbar__notif material-symbols-outlined" title="Incidents">notifications</span>
            <div className="topbar__user">
              <div className="topbar__avatar">OP</div>
              <div className="topbar__user-info">
                <span className="topbar__user-name">ops.primary</span>
                <span className="topbar__user-role">L3 Responder</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="sidebar" aria-label="Navigation">
        <div>
          <div className="sidebar__section-label">Queues &amp; Telemetry</div>
          <nav className="sidebar__nav">
            <a href="#" className="sidebar__nav-item active" aria-current="page">
              <span className="sidebar__nav-item-left">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>orders</span>
                Live Orders
              </span>
              <span className="sidebar__nav-badge">
                {visibleOrders.length >= 1000
                  ? `${(visibleOrders.length / 1000).toFixed(1)}k`
                  : visibleOrders.length}
              </span>
            </a>
            <a href="#" className="sidebar__nav-item">
              <span className="sidebar__nav-item-left">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#dc2626' }}>error</span>
                Critical Failures
              </span>
              <span className="sidebar__nav-badge sidebar__nav-badge--red">14</span>
            </a>
            <a href="#" className="sidebar__nav-item">
              <span className="sidebar__nav-item-left">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#d97706' }}>warning</span>
                Settlement Hold
              </span>
              <span className="sidebar__nav-badge">89</span>
            </a>
            <a href="#" className="sidebar__nav-item">
              <span className="sidebar__nav-item-left">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schema</span>
                Pipeline Routing
              </span>
            </a>
            <a href="#" className="sidebar__nav-item">
              <span className="sidebar__nav-item-left">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span>
                Audit Ledger
              </span>
            </a>
          </nav>
        </div>
        <div className="sidebar__footer">
          <span>CLUSTER: us-east-01</span>
          <span className="sidebar__footer-sync">SYNC OK</span>
        </div>
      </aside>

      {/* ── Content area ────────────────────────────────────────────────── */}
      <div className="content-area">
        <div className="content-inner">
          {/* Sub-header */}
          <div className="subheader">
            <div className="subheader__left">
              <span className="subheader__breadcrumb">Telemetry Query</span>
              <span className="subheader__slash">/</span>
              <span className="subheader__page">Transactions Live Pipeline</span>
              <span className="subheader__count-badge">{visibleOrders.length.toLocaleString()} MATCHES</span>
            </div>
            <div className="subheader__right">
              <span className="subheader__stat">
                <span className="subheader__stat-dot" />
                Ingest buffer: <span className="subheader__stat-val">14.2 MB/s</span>
              </span>
              <div className="subheader__divider" />
              <span className="subheader__stat">
                Query Latency: <span className="subheader__stat-val">1.8ms</span>
              </span>
            </div>
          </div>

          {/* Filter Builder */}
          <FilterBuilder
            filter={filter}
            onChange={handleFilterChange}
            matchingCount={visibleOrders.length}
            totalCount={orders.length}
          />

          {/* Metrics strip */}
          <div className="metrics-strip">
            <div className="metric-card">
              <div className="metric-card__left">
                <span className="metric-card__label">Failed Routing Rate</span>
                <span className="metric-card__value">3.82%</span>
              </div>
              <svg className="metric-card__sparkline" viewBox="0 0 60 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="0,15 10,12 20,18 30,8 40,14 50,4 60,6" />
              </svg>
            </div>
            <div className="metric-card">
              <div className="metric-card__left">
                <span className="metric-card__label">Avg Settlement Latency</span>
                <span className="metric-card__value">184 ms</span>
              </div>
              <svg className="metric-card__sparkline" viewBox="0 0 60 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="0,8 10,10 20,5 30,12 40,6 50,7 60,3" />
              </svg>
            </div>
            <div className="metric-card">
              <div className="metric-card__left">
                <span className="metric-card__label">Held in Escrow (24H)</span>
                <span className="metric-card__value">₹9.42M</span>
              </div>
              <svg className="metric-card__sparkline" viewBox="0 0 60 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="0,18 12,14 24,15 36,9 48,11 60,2" />
              </svg>
            </div>
            <div className="metric-card">
              <div className="metric-card__left">
                <span className="metric-card__label">Circuit Breaker</span>
                <span className="metric-card__status">
                  <span style={{ width: 6, height: 6, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                  NOMINAL / ARMED
                </span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-secondary)' }}>verified</span>
            </div>
          </div>

          {/* Data Grid */}
          <Grid
            orders={visibleOrders}
            totalCount={orders.length}
            onClearFilters={handleClearFilters}
            onOpenFilterBuilder={handleOpenFilterBuilder}
          />
        </div>
      </div>
    </div>
  );
}
