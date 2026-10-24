import type { Condition, FilterState } from '../../types/filter';
import { FIELD_MAP } from './fieldDefs';

interface FilterChipsProps {
  filter: FilterState;
  onRemoveCondition: (groupId: string, condIdx: number) => void;
  onClearAll: () => void;
}

function describeCondition(cond: Condition): string {
  const fieldDef = FIELD_MAP.get(cond.field);
  const label = fieldDef?.label ?? cond.field;

  if (cond.type === 'enum') {
    return `${label}: ${cond.values.join(', ')}`;
  }
  if (cond.type === 'text') {
    const opLabel = { contains: 'contains', not_contains: '≠', equals: '=' }[cond.operator];
    return cond.value ? `${label} ${opLabel} "${cond.value}"` : '';
  }
  if (cond.type === 'number') {
    if (cond.operator === 'between') {
      return cond.value !== '' && cond.value2 !== ''
        ? `${label}: ${cond.value}–${cond.value2}`
        : '';
    }
    const opLabel = { equals: '=', gt: '>', lt: '<' }[cond.operator];
    return cond.value !== '' ? `${label} ${opLabel} ${cond.value}` : '';
  }
  if (cond.type === 'date') {
    if (cond.operator === 'between') {
      return cond.value && cond.value2
        ? `${label}: ${cond.value} – ${cond.value2}`
        : '';
    }
    const opLabel = { before: '<', after: '>' }[cond.operator as 'before' | 'after'];
    return cond.value ? `${label} ${opLabel} ${cond.value}` : '';
  }
  return '';
}

export function FilterChips({ filter, onRemoveCondition, onClearAll }: FilterChipsProps) {
  const chips: { groupId: string; condIdx: number; label: string }[] = [];

  for (const group of filter.groups) {
    group.conditions.forEach((cond, i) => {
      const label = describeCondition(cond);
      if (label) chips.push({ groupId: group.id, condIdx: i, label });
    });
  }

  if (!chips.length) return null;

  return (
    <div className="filter-chips" role="list" aria-label="Active filters">
      {chips.map(({ groupId, condIdx, label }) => (
        <span key={`${groupId}-${condIdx}`} className="filter-chip" role="listitem">
          <span className="filter-chip__value">{label}</span>
          <button
            type="button"
            className="filter-chip__remove"
            onClick={() => onRemoveCondition(groupId, condIdx)}
            aria-label={`Remove filter: ${label}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
          </button>
        </span>
      ))}
      <button type="button" className="chips-clear-all" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}
