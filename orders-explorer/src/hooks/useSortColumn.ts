import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { nextSortState } from '../utils/sort';


/**
 * Returns a stable callback that cycles the sort state for a given column:
 *   unsorted → asc → desc → unsorted (null)
 *
 * Also returns helpers for the column header to render the correct icon.
 */
export function useSortColumn() {
  const sort = useAppStore((s) => s.sort);
  const setSort = useAppStore((s) => s.setSort);

  const handleColumnClick = useCallback(
    (columnId: string) => {
      setSort(nextSortState(sort, columnId));
    },
    [sort, setSort]
  );

  /**
   * Returns the current sort direction for a column, or null if not sorted.
   */
  const getSortDirection = useCallback(
    (columnId: string): 'asc' | 'desc' | null => {
      if (!sort || sort.columnId !== columnId) return null;
      return sort.direction;
    },
    [sort]
  );

  /**
   * Returns the correct Unicode arrow character for the column header:
   *   asc  → '▲'
   *   desc → '▼'
   *   null → ''  (no arrow — unsorted)
   */
  const getSortArrow = useCallback(
    (columnId: string): string => {
      const dir = getSortDirection(columnId);
      if (dir === 'asc')  return '▲';
      if (dir === 'desc') return '▼';
      return '';
    },
    [getSortDirection]
  );

  return { sort, handleColumnClick, getSortDirection, getSortArrow };
}
