import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { FilterState } from '../types/filter';
import type { SortState } from '../types/sort';
import { COLUMN_ID_SET } from '../types/columns';


// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Maximum number of selected IDs we'll encode into the URL.
 * Beyond this the URL becomes impractically long.
 */
const MAX_SEL_IN_URL = 500;

/**
 * Debounce delay (ms) for writing back to the URL.
 * Prevents hitting browser history API rate limits (~100 calls / 30 s).
 */
const URL_WRITE_DEBOUNCE_MS = 200;

/** Regex a valid order ID must satisfy when read from the URL. */
const ORDER_ID_RE = /^ORD-\d+$/;

// ─── Safe base64 helpers (handles Unicode in notes / customer names) ──────────

function toBase64(str: string): string {
  // encodeURIComponent percent-encodes unicode → escape() converts to latin1-safe
  // → btoa() encodes to base64. This is the classic unicode-safe btoa trick.
  return btoa(encodeURIComponent(str));
}

function fromBase64(b64: string): string {
  return decodeURIComponent(atob(b64));
}

// ─── Serialisers ──────────────────────────────────────────────────────────────

function serialiseFilter(f: FilterState): string {
  return toBase64(JSON.stringify(f));
}

function serialiseSort(s: SortState): string {
  return `${s.columnId}:${s.direction}`;
}

function serialiseSel(ids: Set<string>): string {
  return Array.from(ids).join(',');
}

// ─── Deserialisers (NEVER throw — always return a safe default) ───────────────

function deserialiseFilter(raw: string | null): FilterState | null {
  if (!raw) return null;
  try {
    const json = fromBase64(raw);
    const parsed: unknown = JSON.parse(json);
    // Validate minimal shape: must have a `groups` array
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'groups' in parsed &&
      Array.isArray((parsed as { groups: unknown }).groups)
    ) {
      return parsed as FilterState;
    }
    console.warn('[useUrlSync] filter param had unexpected shape — ignoring');
    return null;
  } catch (e) {
    console.warn('[useUrlSync] Could not decode filter param:', e);
    return null;
  }
}

function deserialiseSort(raw: string | null): SortState | null {
  if (!raw) return null;
  const parts = raw.split(':');
  if (parts.length !== 2) return null;
  const [columnId, direction] = parts;
  if (!COLUMN_ID_SET.has(columnId)) {
    console.warn('[useUrlSync] Unknown sort columnId:', columnId);
    return null;
  }
  if (direction !== 'asc' && direction !== 'desc') {
    console.warn('[useUrlSync] Invalid sort direction:', direction);
    return null;
  }
  return { columnId, direction };
}

function deserialisePinnedColumn(raw: string | null): string | null {
  if (!raw) return null;
  if (!COLUMN_ID_SET.has(raw)) {
    console.warn('[useUrlSync] Unknown pinned column:', raw);
    return null;
  }
  return raw;
}

function deserialiseSel(raw: string | null): Set<string> {
  if (!raw) return new Set();
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => ORDER_ID_RE.test(s));
  return new Set(ids);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Synchronises the Zustand store state with the URL search params.
 *
 * - On mount: reads URL → hydrates store (invalid values → safe defaults + banner)
 * - On change: debounced write from store → URL via history.replaceState
 *
 * Must be rendered once at the top of the component tree (inside App).
 */
export function useUrlSync(): void {
  const {
    filter,
    sort,
    pinnedColumn,
    selectedIds,
    setFilter,
    setSort,
    setPinnedColumn,
    setSelectedIds,
    setUrlErrorBanner,
  } = useAppStore();

  // ── One-time hydration from URL on mount ────────────────────────────────
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const params = new URLSearchParams(window.location.search);
    let hadErrors = false;

    // filter
    const rawFilter = params.get('filter');
    const parsedFilter = deserialiseFilter(rawFilter);
    if (rawFilter && parsedFilter === null) {
      hadErrors = true;
    }
    if (parsedFilter) setFilter(parsedFilter);

    // sort
    const rawSort = params.get('sort');
    const parsedSort = deserialiseSort(rawSort);
    if (rawSort && parsedSort === null) {
      hadErrors = true;
    }
    if (parsedSort) setSort(parsedSort);

    // pin
    const rawPin = params.get('pin');
    const parsedPin = deserialisePinnedColumn(rawPin);
    if (rawPin && parsedPin === null) {
      hadErrors = true;
    }
    if (parsedPin) setPinnedColumn(parsedPin);

    // sel
    const rawSel = params.get('sel');
    const parsedSel = deserialiseSel(rawSel);
    // We can't know if individual IDs were "bad" without the dataset,
    // so we only flag an error if the raw string was non-empty but
    // all entries were rejected.
    if (rawSel && rawSel.trim() !== '' && parsedSel.size === 0) {
      hadErrors = true;
    }
    if (parsedSel.size > 0) setSelectedIds(parsedSel);

    if (hadErrors) {
      setUrlErrorBanner(
        'Some URL parameters were invalid and have been reset to defaults.'
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ intentionally empty deps — runs once on mount

  // ── Debounced write-back to URL whenever URL-persisted state changes ─────
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated.current) return; // don't write before hydration finishes

    if (writeTimer.current !== null) {
      clearTimeout(writeTimer.current);
    }

    writeTimer.current = setTimeout(() => {
      const params = new URLSearchParams();

      // filter — only write if non-empty
      if (filter.groups.length > 0) {
        params.set('filter', serialiseFilter(filter));
      }

      // sort
      if (sort) {
        params.set('sort', serialiseSort(sort));
      }

      // pin
      if (pinnedColumn) {
        params.set('pin', pinnedColumn);
      }

      // sel — skip if too many IDs (URL length limit protection)
      if (selectedIds.size > 0 && selectedIds.size <= MAX_SEL_IN_URL) {
        params.set('sel', serialiseSel(selectedIds));
      }

      const qs = params.toString();
      const newUrl = qs
        ? `${window.location.pathname}?${qs}`
        : window.location.pathname;

      // history.replaceState so we don't pollute the back-stack
      window.history.replaceState(null, '', newUrl);
    }, URL_WRITE_DEBOUNCE_MS);

    return () => {
      if (writeTimer.current !== null) {
        clearTimeout(writeTimer.current);
      }
    };
  }, [filter, sort, pinnedColumn, selectedIds]);
}
