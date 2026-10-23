import { useEffect, useMemo } from 'react';
import { useAppStore } from './store/useAppStore';
import { fetchAndNormaliseOrders } from './utils/loadOrders';
import { applyFilterAndSort } from './utils/filterAndSort';
import { useUrlSync } from './hooks/useUrlSync';
import './App.css';

export default function App() {
  const {
    orders,
    isLoading,
    error,
    filter,
    sort,
    setOrders,
    setLoading,
    setError,
    urlErrorBanner,
    dismissUrlErrorBanner,
  } = useAppStore();

  // Wire URL ↔ store sync
  useUrlSync();

  // Load orders once on mount
  useEffect(() => {
    fetchAndNormaliseOrders()
      .then((data) => {
        setOrders(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived: filtered + sorted view — only recomputes when inputs change
  const visibleOrders = useMemo(
    () => applyFilterAndSort(orders, filter, sort),
    [orders, filter, sort]
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="app-state">
        <div className="spinner" aria-label="Loading orders" />
        <p>Loading orders…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="app-state app-state--error">
        <p>⚠ Failed to load orders</p>
        <pre>{error}</pre>
      </div>
    );
  }

  // ── Main layout (placeholder — full UI in Steps 4-8) ──────────────────────
  return (
    <div className="app">
      {/* URL error banner */}
      {urlErrorBanner && (
        <div className="url-banner" role="alert">
          <span>⚠ {urlErrorBanner}</span>
          <button onClick={dismissUrlErrorBanner} aria-label="Dismiss">✕</button>
        </div>
      )}

      <header className="topbar">
        <h1>Orders Explorer</h1>
        <span className="result-count">
          {visibleOrders.length.toLocaleString()} of{' '}
          {orders.length.toLocaleString()} orders
        </span>
      </header>

      <main className="main-placeholder">
        <p>Step 2 complete ✓</p>
        <p>
          Store + URL sync wired. Showing{' '}
          <strong>{visibleOrders.length.toLocaleString()}</strong> orders.
        </p>
        <p>
          First order: <code>{visibleOrders[0]?.id}</code>
        </p>
      </main>
    </div>
  );
}
