import type { Order, RawOrder } from '../types/order';
import { deduplicateOrders, normaliseOrder } from './normalise';

/**
 * Fetch orders.json from the public folder, parse it, normalise every record,
 * and deduplicate by order ID.
 *
 * Why fetch('/orders.json') instead of a static import?
 *   Vite processes static imports at bundle-time. A 17 MB JSON import would be
 *   inlined into the bundle and parsed synchronously on the main thread, causing
 *   a multi-second freeze before the first render. fetch() is asynchronous and
 *   non-blocking, and the browser can stream/decompress the file while the rest
 *   of the UI initialises.
 *
 * @throws never — all errors are caught and re-thrown with a human-readable message
 */
export async function fetchAndNormaliseOrders(): Promise<Order[]> {
  let response: Response;

  // ── 1. Network fetch ──────────────────────────────────────────────────────
  try {
    response = await fetch('/orders.json');
  } catch (networkError) {
    throw new Error(
      `Failed to fetch orders.json — check that the dev server is running and ` +
        `public/orders.json exists.\n${String(networkError)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `orders.json request failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  // ── 2. JSON parse ─────────────────────────────────────────────────────────
  let rawArray: RawOrder[];
  try {
    const json: unknown = await response.json();
    if (!Array.isArray(json)) {
      throw new TypeError(`Expected an array, got ${typeof json}`);
    }
    rawArray = json as RawOrder[];
  } catch (parseError) {
    throw new Error(
      `Failed to parse orders.json as JSON.\n${String(parseError)}`
    );
  }

  // ── 3. Normalise every record ─────────────────────────────────────────────
  const normalised: Order[] = [];
  for (let i = 0; i < rawArray.length; i++) {
    const order = normaliseOrder(rawArray[i], i);
    if (order !== null) {
      normalised.push(order);
    }
  }

  // ── 4. Deduplicate ────────────────────────────────────────────────────────
  const deduplicated = deduplicateOrders(normalised);

  console.info(
    `[loadOrders] Loaded ${rawArray.length} raw records → ` +
      `${normalised.length} valid → ${deduplicated.length} after dedup`
  );

  return deduplicated;
}
