import type { Condition, FieldId } from '../../types/filter';
import type { FieldDef } from '../../types/filter';
import { FIELD_DEFS, FIELD_MAP, getOperatorLabels } from './fieldDefs';
import { CustomSelect } from './CustomSelect';
import { EnumSelect } from './EnumSelect';
import { DebouncedTextInput, DebouncedNumberInput, handleInputArrowNavigation } from './DebouncedInputs';

// ─── Value input switcher ─────────────────────────────────────────────────────

interface ValueInputProps {
  cond: Condition;
  onChange: (partial: Partial<Condition>) => void;
}

function ValueInput({ cond, onChange }: ValueInputProps) {
  if (cond.type === 'enum') {
    const fieldDef: FieldDef | undefined = FIELD_MAP.get(cond.field);
    return (
      <EnumSelect
        values={cond.values}
        enumValues={fieldDef?.enumValues ?? []}
        onChange={(values) => onChange({ values } as Partial<Condition>)}
      />
    );
  }

  if (cond.type === 'text') {
    return (
      <DebouncedTextInput
        value={cond.value}
        onChange={(val) => onChange({ value: val } as Partial<Condition>)}
      />
    );
  }

  if (cond.type === 'number') {
    if (cond.operator === 'between') {
      return (
        <div className="fb-input fb-input--between">
          <DebouncedNumberInput
            value={cond.value}
            placeholder="Min"
            onChange={(val) => onChange({ value: val } as Partial<Condition>)}
          />
          <span>and</span>
          <DebouncedNumberInput
            value={cond.value2 ?? ''}
            placeholder="Max"
            onChange={(val) => onChange({ value2: val } as Partial<Condition>)}
          />
        </div>
      );
    }
    return (
      <div className="fb-input">
        <DebouncedNumberInput
          value={cond.value}
          onChange={(val) => onChange({ value: val } as Partial<Condition>)}
        />
      </div>
    );
  }

  if (cond.type === 'date') {
    if (cond.operator === 'between') {
      return (
        <div className="fb-input fb-input--between">
          <input
            type="date"
            value={cond.value}
            onChange={(e) => onChange({ value: e.target.value } as Partial<Condition>)}
            onKeyDown={handleInputArrowNavigation}
          />
          <span>and</span>
          <input
            type="date"
            value={cond.value2 ?? ''}
            onChange={(e) => onChange({ value2: e.target.value } as Partial<Condition>)}
            onKeyDown={handleInputArrowNavigation}
          />
        </div>
      );
    }
    return (
      <div className="fb-input">
        <input
          type="date"
          value={cond.value}
          onChange={(e) => onChange({ value: e.target.value } as Partial<Condition>)}
          onKeyDown={handleInputArrowNavigation}
        />
      </div>
    );
  }

  return null;
}

// ─── Single condition row ─────────────────────────────────────────────────────

export interface ConditionRowProps {
  cond: Condition;
  onUpdate: (partial: Partial<Condition>) => void;
  onRemove: () => void;
}

export function makeDefaultCondition(fieldId: FieldId): Condition {
  const def = FIELD_MAP.get(fieldId)!;
  switch (def.type) {
    case 'text':   return { field: fieldId, type: 'text',   operator: 'contains', value: '' };
    case 'number': return { field: fieldId, type: 'number', operator: 'gt',       value: '' };
    case 'date':   return { field: fieldId, type: 'date',   operator: 'after',    value: '' };
    case 'enum':   return { field: fieldId, type: 'enum',   operator: 'one_of',   values: [] };
  }
}

export function ConditionRow({ cond, onUpdate, onRemove }: ConditionRowProps) {
  const fieldDef = FIELD_MAP.get(cond.field)!;
  const operatorLabels = getOperatorLabels(fieldDef.type);
  const operatorOptions = Object.entries(operatorLabels).map(([value, label]) => ({ value, label }));
  const fieldOptions = FIELD_DEFS.map((f) => ({ value: f.id, label: f.label }));

  const handleFieldChange = (newFieldId: string) => {
    const newDef = FIELD_MAP.get(newFieldId as FieldId)!;
    const newCond = makeDefaultCondition(newDef.id);
    onUpdate(newCond as unknown as Partial<Condition>);
  };

  const handleOperatorChange = (newOp: string) => {
    // When switching to/from 'between', reset value2
    if (cond.type === 'number') {
      onUpdate({ operator: newOp, value2: undefined } as Partial<Condition>);
    } else if (cond.type === 'date') {
      onUpdate({ operator: newOp, value2: undefined } as Partial<Condition>);
    } else {
      onUpdate({ operator: newOp } as Partial<Condition>);
    }
  };

  return (
    <div className="fb-cond">
      <CustomSelect
        className="fb-select--field"
        value={cond.field}
        options={fieldOptions}
        onChange={handleFieldChange}
      />
      <CustomSelect
        className="fb-select--operator"
        value={cond.operator}
        options={operatorOptions}
        onChange={handleOperatorChange}
      />
      <ValueInput cond={cond} onChange={onUpdate} />
      <button type="button" className="fb-cond__remove" onClick={onRemove} aria-label="Remove condition">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  );
}
