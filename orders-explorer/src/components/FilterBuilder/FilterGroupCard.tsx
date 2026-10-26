import React from 'react';
import type { Condition, FilterGroup } from '../../types/filter';
import { ConditionRow } from './ConditionRow';

interface FilterGroupCardProps {
  group: FilterGroup;
  gIdx: number;
  onRemoveGroup: (id: string) => void;
  onAddCondition: (groupId: string) => void;
  onRemoveCondition: (groupId: string, condIdx: number) => void;
  onUpdateCondition: (
    groupId: string,
    condIdx: number,
    partial: Partial<Condition>
  ) => void;
}

export const FilterGroupCard = React.memo(function FilterGroupCard({
  group,
  gIdx,
  onRemoveGroup,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
}: FilterGroupCardProps) {
  return (
    <div>
      {gIdx > 0 && (
        <div className="fb-and-sep">
          <span className="fb-and-sep__label">AND</span>
        </div>
      )}
      <div className="fb-group">
        <div className="fb-group__header">
          <div className="fb-group__header-left">
            <span className="fb-group__label">GROUP {gIdx + 1}</span>
            <span className="fb-group__desc">Conditions combined with OR</span>
          </div>
          <button
            type="button"
            className="fb-group__delete"
            onClick={() => onRemoveGroup(group.id)}
            aria-label={`Delete group ${gIdx + 1}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              delete
            </span>
          </button>
        </div>

        {group.conditions.map((cond, cIdx) => (
          <div key={cIdx}>
            {cIdx > 0 && (
              <div className="fb-or-sep">
                <span className="fb-or-sep__label">OR</span>
              </div>
            )}
            <ConditionRow
              cond={cond}
              onUpdate={(partial) => onUpdateCondition(group.id, cIdx, partial)}
              onRemove={() => onRemoveCondition(group.id, cIdx)}
            />
          </div>
        ))}

        <button
          type="button"
          className="fb-group__add-cond"
          onClick={() => onAddCondition(group.id)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            add
          </span>
          Add Condition
        </button>
      </div>
    </div>
  );
});
