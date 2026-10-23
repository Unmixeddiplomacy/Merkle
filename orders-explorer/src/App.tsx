import { useEffect, useState } from 'react'
import type { Order } from './types/order'
import { fetchAndNormaliseOrders } from './utils/loadOrders'
import './App.css'

export default function App() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAndNormaliseOrders()
      .then((data) => {
        setOrders(data)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, []) // run exactly once on mount

  if (isLoading) {
    return (
      <div className="app-state">
        <div className="spinner" aria-label="Loading" />
        <p>Loading orders…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-state app-state--error">
        <p>⚠ Failed to load orders</p>
        <pre>{error}</pre>
      </div>
    )
  }

  // Placeholder — the real grid will be built in Steps 4-8
  return (
    <div className="app">
      <header className="topbar">
        <h1>Orders Explorer</h1>
        <span>{orders.length.toLocaleString()} orders loaded</span>
      </header>
      <main className="main-placeholder">
        <p>Step 1 complete ✓ — {orders.length.toLocaleString()} orders normalised &amp; deduplicated.</p>
        <p>First order: <code>{orders[0]?.id}</code> — ₹{orders[0]?.amountINR.toFixed(2)}</p>
      </main>
    </div>
  )
}
