import { create } from 'zustand';
import type { Order } from '../types/order';
import type { FilterState } from '../types/filter';
import { EMPTY_FILTER } from '../types/filter';
import type { SortState } from '../types/sort';

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  // ── Data ──────────────────────────────────────────────────────────────────
  /** The full normalised dataset. Never mutate this array. */
  orders: Order[];
  isLoading: boolean;
  error: string | null;

  // ── URL-persisted state ───────────────────────────────────────────────────
  filter: FilterState;
  sort: SortState | null;
  pinnedColumn: string | null;
  selectedIds: Set<string>;

  // ── Ephemeral (NOT in URL) ────────────────────────────────────────────────
  /** The cell that has keyboard focus. Lives only in memory. */
  focusedCell: { rowIndex: number; colId: string } | null;

  /**
   * Banner shown when the URL contained invalid state on load.
   * Dismissed after the user acknowledges it.
   */
  urlErrorBanner: string | null;
}

// ─── Action shape ─────────────────────────────────────────────────────────────

interface AppActions {
  // ── Data ──────────────────────────────────────────────────────────────────
  setOrders: (orders: Order[]) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;

  // ── Filter / sort / pin ───────────────────────────────────────────────────
  setFilter: (f: FilterState) => void;
  setSort: (s: SortState | null) => void;
  setPinnedColumn: (col: string | null) => void;

  // ── Selection ─────────────────────────────────────────────────────────────
  setSelectedIds: (ids: Set<string>) => void;
  /**
   * Toggle a single row ID in the selection.
   * If already selected → remove; if not → add.
   */
  toggleRowSelection: (id: string) => void;
  /**
   * Select a contiguous range of rows (inclusive).
   * Merges with the current selection (does not replace it).
   *
   * @param fromIndex 0-based index in allVisibleIds
   * @param toIndex   0-based index in allVisibleIds
   * @param allVisibleIds The current filtered+sorted order of IDs shown in the grid
   */
  selectRange: (
    fromIndex: number,
    toIndex: number,
    allVisibleIds: string[]
  ) => void;

  // ── Keyboard focus ────────────────────────────────────────────────────────
  setFocusedCell: (cell: { rowIndex: number; colId: string } | null) => void;

  // ── URL banner ────────────────────────────────────────────────────────────
  setUrlErrorBanner: (msg: string | null) => void;
  dismissUrlErrorBanner: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  orders: [],
  isLoading: true,
  error: null,
  filter: EMPTY_FILTER,
  sort: null,
  pinnedColumn: null,
  selectedIds: new Set<string>(),
  focusedCell: null,
  urlErrorBanner: null,

  // ── Data actions ──────────────────────────────────────────────────────────
  setOrders: (orders) => set({ orders }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (msg) => set({ error: msg }),

  // ── Filter / sort / pin ───────────────────────────────────────────────────
  setFilter: (f) => set({ filter: f }),
  setSort: (s) => set({ sort: s }),
  setPinnedColumn: (col) => set({ pinnedColumn: col }),

  // ── Selection ─────────────────────────────────────────────────────────────
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleRowSelection: (id) => {
    const current = get().selectedIds;
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedIds: next });
  },

  selectRange: (fromIndex, toIndex, allVisibleIds) => {
    const lo = Math.min(fromIndex, toIndex);
    const hi = Math.max(fromIndex, toIndex);
    const rangeIds = allVisibleIds.slice(lo, hi + 1);
    const next = new Set(get().selectedIds);
    for (const id of rangeIds) {
      next.add(id);
    }
    set({ selectedIds: next });
  },

  // ── Keyboard focus ────────────────────────────────────────────────────────
  setFocusedCell: (cell) => set({ focusedCell: cell }),

  // ── URL banner ────────────────────────────────────────────────────────────
  setUrlErrorBanner: (msg) => set({ urlErrorBanner: msg }),
  dismissUrlErrorBanner: () => set({ urlErrorBanner: null }),
}));
