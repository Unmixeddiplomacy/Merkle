import { useState, useRef, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { SortState } from '../../types/sort';
import { SortArrow } from './CellRenderers';
import type { ColDef } from './columnDefs';

// ─── Header cell (Th) ─────────────────────────────────────────────────────────

export interface ThProps {
  col: ColDef;
  sort: SortState | null;
  onSortClick: (id: string) => void;
  pinnedColumn: string | null;
  onPinColumn: (colId: string | null) => void;
  onStartResize: (colId: string, e: ReactMouseEvent) => void;
}

export function Th({ col, sort, onSortClick, pinnedColumn, onPinColumn, onStartResize }: ThProps) {
  const dir = sort?.columnId === col.id ? sort.direction : null;
  const isActive = sort?.columnId === col.id;
  const isPinned = pinnedColumn === col.id;
  const innerClass = col.rightAlign ? 'grid-th__inner grid-th__inner--right' : 'grid-th__inner';

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  // ARIA sort: must be 'ascending' | 'descending' | 'none' | 'other'
  const ariaSortValue: 'ascending' | 'descending' | 'none' = isActive
    ? dir === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none';

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ctxMenu]);

  const handleContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <th
      className={[
        'grid-th',
        col.thClass ?? '',
        col.sortable ? 'grid-th--sortable' : '',
        isActive ? 'grid-th--active' : '',
        isPinned ? 'grid-th--pinned' : '',
      ].join(' ')}
      onContextMenu={handleContextMenu}
      aria-sort={isActive ? ariaSortValue : undefined}
    >
      <div className={innerClass}>
        {col.sortable ? (
          <button
            type="button"
            className="grid-th__sort-btn"
            onClick={() => onSortClick(col.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSortClick(col.id);
              }
            }}
            aria-label={`Sort by ${col.label}${isActive ? `, currently ${ariaSortValue}` : ''}`}
          >
            <span className="grid-th__label">{col.label}</span>
            <SortArrow dir={dir} />
          </button>
        ) : (
          <span className="grid-th__label">{col.label}</span>
        )}
        {/* Resize handle */}
        <span
          className="grid-th__resize"
          aria-hidden="true"
          tabIndex={-1}
          onMouseDown={(e) => onStartResize(col.id, e)}
        >
          |
        </span>
      </div>

      {/* Right-click context menu (positioned via fixed) */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className="grid-ctx-menu"
          style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x }}
          role="menu"
          aria-label={`Column options for ${col.label}`}
        >
          <button
            type="button"
            role="menuitem"
            className="grid-ctx-menu__item"
            onClick={() => { onPinColumn(isPinned ? null : col.id); setCtxMenu(null); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              push_pin
            </span>
            {isPinned ? 'Unpin column' : 'Pin column'}
          </button>
          {col.sortable && (
            <button
              type="button"
              role="menuitem"
              className="grid-ctx-menu__item"
              onClick={() => { onSortClick(col.id); setCtxMenu(null); }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sort</span>
              Sort by {col.label}
            </button>
          )}
        </div>
      )}
    </th>
  );
}
