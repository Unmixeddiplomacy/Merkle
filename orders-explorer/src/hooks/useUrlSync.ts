import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  MAX_SEL_IN_URL,
  URL_WRITE_DEBOUNCE_MS,
  serialiseFilter,
  serialiseSort,
  serialiseSel,
  deserialiseFilter,
  deserialiseSort,
  deserialisePinnedColumn,
  deserialiseSel,
} from '../utils/urlSerialization';

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

    let hadErrors = false;

    try {
      const params = new URLSearchParams(window.location.search);

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
      if (rawSel && rawSel.trim() !== '' && parsedSel.size === 0) {
        hadErrors = true;
      }
      if (parsedSel.size > 0) setSelectedIds(parsedSel);
    } catch (err) {
      console.warn('[useUrlSync] Fatal error parsing URL params:', err);
      hadErrors = true;
    }

    if (hadErrors) {
      setUrlErrorBanner(
        'Some URL parameters were invalid and have been reset to defaults.'
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
