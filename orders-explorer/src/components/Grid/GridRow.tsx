import React from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Order } from '../../types/order';
import { COLUMNS } from './columnDefs';
import { renderCell } from './CellRenderers';

interface GridRowProps {
  order: Order;
  rowIdx: number;
  isSelected: boolean;
  isFocused: boolean;
  focusedColId?: string;
  onRowClick: (rowIdx: number, orderId: string, e: ReactMouseEvent) => void;
  onCellClick: (rowIdx: number, colId: string, orderId: string, e: ReactMouseEvent) => void;
  onCheckboxClick: (rowIdx: number, orderId: string, e: ReactMouseEvent) => void;
  onDoubleClick: (order: Order) => void;
}

export const GridRow = React.memo(function GridRow({
  order,
  rowIdx,
  isSelected,
  isFocused,
  focusedColId,
  onRowClick,
  onCellClick,
  onCheckboxClick,
  onDoubleClick,
}: GridRowProps) {
  const rowClass = [
    'grid-tr',
    rowIdx % 2 === 0 ? 'grid-tr--even' : 'grid-tr--odd',
    isSelected ? 'grid-tr--selected' : '',
    isFocused ? 'grid-tr--focused' : '',
  ].join(' ');

  return (
    <tr
      id={`grid-row-${rowIdx}`}
      className={rowClass}
      onClick={(e) => onRowClick(rowIdx, order.id, e)}
      onDoubleClick={() => onDoubleClick(order)}
      role="row"
      aria-rowindex={rowIdx + 1}
      aria-selected={isSelected}
      style={{ cursor: 'default' }}
    >
      {/* Checkbox cell */}
      <td className="grid-td grid-td--check" role="gridcell" aria-colindex={1}>
        <input
          type="checkbox"
          className="grid-checkbox"
          checked={isSelected}
          onChange={() => {}}
          onClick={(e) => onCheckboxClick(rowIdx, order.id, e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCheckboxClick(rowIdx, order.id, e as unknown as ReactMouseEvent);
            }
          }}
          aria-label={`Select order ${order.id}`}
        />
      </td>

      {/* Data cells */}
      {COLUMNS.map((col, colIdx) => {
        const isCellFocused = isFocused && focusedColId === col.id;
        return (
          <td
            key={col.id}
            className={[
              'grid-td',
              col.tdClass ?? '',
              col.id === 'id' ? 'grid-td--id' : '',
              isCellFocused ? 'grid-td--focused' : '',
            ].join(' ')}
            role="gridcell"
            aria-colindex={colIdx + 2}
            data-focused={isCellFocused ? 'true' : undefined}
            title={col.id === 'notes' ? (order.notes || '') : undefined}
            onClick={(e) => onCellClick(rowIdx, col.id, order.id, e)}
          >
            {renderCell(col.id, order)}
          </td>
        );
      })}
    </tr>
  );
});
