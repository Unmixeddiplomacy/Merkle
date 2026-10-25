import React, { useState, useCallback } from 'react';
import type { Condition, FieldId } from '../../types/filter';
import type { FieldDef } from '../../types/filter';
import { FIELD_DEFS, FIELD_MAP, getOperatorLabels } from './fieldDefs';
import { useClickOutside } from '../../hooks/useClickOutside';

// ─── Shared custom select ─────────────────────────────────────────────────────
interface SelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  className?: string;
}

function CustomSelect({ value, options, onChange, className = '' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);
  const current = options.find((o) => o.value === value)?.label ?? value;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setHighlightedIdx(options.findIndex((o) => o.value === value) || 0);
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIdx((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(options[highlightedIdx].value); setOpen(false); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') { setOpen(false); }
  };

  return (
    <div className={`fb-select ${className}`} ref={ref}>
      <button
        type="button"
        className="fb-select__btn"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${current}, select to change`}
      >
        <span>{current}</span>
        <span className="material-symbols-outlined fb-select__chevron">arrow_drop_down</span>
      </button>
      {open && (
        <div className="fb-select__dropdown" role="listbox" aria-label="Options">
          {options.map((opt, idx) => (
            <div
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`fb-select__option${opt.value === value ? ' selected' : ''}${idx === highlightedIdx ? ' highlighted' : ''}`}
              onPointerDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
              onMouseEnter={() => setHighlightedIdx(idx)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Enum multi-select ────────────────────────────────────────────────────────
interface EnumSelectProps {
  values: string[];
  enumValues: string[];
  onChange: (values: string[]) => void;
}

function EnumSelect({ values, enumValues, onChange }: EnumSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      setHighlightedIdx(0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIdx((i) => Math.min(i + 1, enumValues.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === ' ') { e.preventDefault(); if (enumValues[highlightedIdx]) toggle(enumValues[highlightedIdx]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') { setOpen(false); }
  };

  return (
    <div className="fb-enum" ref={ref}>
      <div
        className={`fb-enum__trigger${open ? ' open' : ''}`}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
      >
        {values.length === 0 && (
          <span className="fb-enum__placeholder">Select values…</span>
        )}
        {values.map((v) => (
          <span key={v} className="fb-enum__tag">
            {v}
            <button
              type="button"
              className="fb-enum__tag-remove"
              onPointerDown={(e) => { e.stopPropagation(); remove(v); }}
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <span className="material-symbols-outlined fb-enum__chevron">arrow_drop_down</span>
      </div>
      {open && (
        <div
          className="fb-enum__dropdown"
          role="listbox"
          aria-multiselectable="true"
          tabIndex={-1}
          onKeyDown={handleDropdownKeyDown}
        >
          {enumValues.map((ev, idx) => {
            const checked = values.includes(ev);
            return (
              <div
                key={ev}
                role="option"
                aria-selected={checked}
                className={`fb-enum__option${idx === highlightedIdx ? ' highlighted' : ''}`}
                onPointerDown={(e) => { e.preventDefault(); toggle(ev); }}
                onMouseEnter={() => setHighlightedIdx(idx)}
              >
                <span className={`fb-enum__checkbox${checked ? ' checked' : ''}`}>
                  {checked && (
                    <span className="material-symbols-outlined fb-enum__check-icon">check</span>
                  )}
                </span>
                {ev}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      <div className="fb-input">
        <input
          type="text"
          value={cond.value}
          placeholder="Enter value…"
          onChange={(e) => onChange({ value: e.target.value } as Partial<Condition>)}
          onKeyDown={(e) => e.stopPropagation()}
          autoComplete="off"
        />
      </div>
    );
  }

  if (cond.type === 'number') {
    if (cond.operator === 'between') {
      return (
        <div className="fb-input fb-input--between">
          <input
            type="number"
            value={cond.value}
            placeholder="Min"
            onChange={(e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value) } as Partial<Condition>)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <span>and</span>
          <input
            type="number"
            value={cond.value2 ?? ''}
            placeholder="Max"
            onChange={(e) => onChange({ value2: e.target.value === '' ? '' : Number(e.target.value) } as Partial<Condition>)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      );
    }
    return (
      <div className="fb-input">
        <input
          type="number"
          value={cond.value}
          placeholder="Enter value…"
          onChange={(e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value) } as Partial<Condition>)}
          onKeyDown={(e) => e.stopPropagation()}
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
            onKeyDown={(e) => e.stopPropagation()}
          />
          <span>and</span>
          <input
            type="date"
            value={cond.value2 ?? ''}
            onChange={(e) => onChange({ value2: e.target.value } as Partial<Condition>)}
            onKeyDown={(e) => e.stopPropagation()}
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
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  return null;
}

// ─── Single condition row ─────────────────────────────────────────────────────
interface ConditionRowProps {
  cond: Condition;
  onUpdate: (partial: Partial<Condition>) => void;
  onRemove: () => void;
}

function makeDefaultCondition(fieldId: FieldId): Condition {
  const def = FIELD_MAP.get(fieldId)!;
  switch (def.type) {
    case 'text':   return { field: fieldId, type: 'text',   operator: 'contains', value: '' };
    case 'number': return { field: fieldId, type: 'number', operator: 'gt',       value: '' };
    case 'date':   return { field: fieldId, type: 'date',   operator: 'after',    value: '' };
    case 'enum':   return { field: fieldId, type: 'enum',   operator: 'one_of',   values: [] };
  }
}

function ConditionRow({ cond, onUpdate, onRemove }: ConditionRowProps) {
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

// ─── Exports ──────────────────────────────────────────────────────────────────
export { ConditionRow, makeDefaultCondition };
export type { ConditionRowProps };
