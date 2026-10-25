import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Condition, FieldId } from '../../types/filter';
import type { FieldDef } from '../../types/filter';
import { FIELD_DEFS, FIELD_MAP, getOperatorLabels } from './fieldDefs';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useDebounce } from '../../hooks/useDebounce';

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isKeyboardNavRef = useRef(false);
  const current = options.find((o) => o.value === value)?.label ?? value;

  // Auto-scroll highlighted option into view ONLY when navigating with keyboard
  useEffect(() => {
    if (open && dropdownRef.current && isKeyboardNavRef.current) {
      const activeOption = dropdownRef.current.children[highlightedIdx] as HTMLElement;
      activeOption?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIdx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || (e.altKey && e.key === 'ArrowDown')) {
        e.preventDefault();
        setHighlightedIdx(Math.max(0, options.findIndex((o) => o.value === value)));
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      isKeyboardNavRef.current = true;
      setHighlightedIdx((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      isKeyboardNavRef.current = true;
      setHighlightedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(options[highlightedIdx].value);
      setOpen(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
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
        <div className="fb-select__dropdown" ref={dropdownRef} role="listbox" aria-label="Options">
          {options.map((opt, idx) => (
            <div
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`fb-select__option${opt.value === value ? ' selected' : ''}${idx === highlightedIdx ? ' highlighted' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
              onMouseEnter={() => {
                isKeyboardNavRef.current = false;
                setHighlightedIdx(idx);
              }}
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isKeyboardNavRef = useRef(false);

  // Auto-scroll highlighted option into view ONLY when navigating with keyboard
  useEffect(() => {
    if (open && dropdownRef.current && isKeyboardNavRef.current) {
      const activeOption = dropdownRef.current.children[highlightedIdx] as HTMLElement;
      activeOption?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIdx]);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || (e.altKey && e.key === 'ArrowDown')) {
        e.preventDefault();
        setOpen(true);
        setHighlightedIdx(0);
      }
      return;
    }

    // When dropdown is open, handle listbox navigation directly on the focused trigger:
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      isKeyboardNavRef.current = true;
      setHighlightedIdx((i) => Math.min(i + 1, enumValues.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      isKeyboardNavRef.current = true;
      setHighlightedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (enumValues[highlightedIdx]) {
        toggle(enumValues[highlightedIdx]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
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
        onKeyDown={handleKeyDown}
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
              onClick={(e) => { e.stopPropagation(); remove(v); }}
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
          ref={dropdownRef}
          className="fb-enum__dropdown"
          role="listbox"
          aria-multiselectable="true"
        >
          {enumValues.map((ev, idx) => {
            const checked = values.includes(ev);
            return (
              <div
                key={ev}
                role="option"
                aria-selected={checked}
                className={`fb-enum__option${idx === highlightedIdx ? ' highlighted' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(ev);
                }}
                onMouseEnter={() => {
                  isKeyboardNavRef.current = false;
                  setHighlightedIdx(idx);
                }}
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

// ─── Input arrow navigation helper ───────────────────────────────────────────
const handleInputArrowNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    // Bubble to FilterBuilder 2D vertical navigation
    return;
  }
  if (e.key === 'ArrowLeft') {
    if (e.currentTarget.selectionEnd === 0) {
      // At start of input: bubble to navigate to previous control
      return;
    }
    e.stopPropagation();
    return;
  }
  if (e.key === 'ArrowRight') {
    if (e.currentTarget.selectionStart === e.currentTarget.value.length) {
      // At end of input: bubble to navigate to next control
      return;
    }
    e.stopPropagation();
    return;
  }
  if (e.key === 'Escape') {
    return;
  }
  e.stopPropagation();
};

// ─── Debounced text & number input components ────────────────────────────────

function DebouncedTextInput({
  value,
  onChange,
  placeholder = 'Enter value…',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [localVal, setLocalVal] = useState(value);
  const debouncedVal = useDebounce(localVal, 300);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    if (debouncedVal !== value) {
      onChange(debouncedVal);
    }
  }, [debouncedVal]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fb-input">
      <input
        type="text"
        value={localVal}
        placeholder={placeholder}
        onChange={(e) => setLocalVal(e.target.value)}
        onKeyDown={handleInputArrowNavigation}
        autoComplete="off"
      />
    </div>
  );
}

function DebouncedNumberInput({
  value,
  onChange,
  placeholder = 'Enter value…',
}: {
  value: number | '';
  onChange: (val: number | '') => void;
  placeholder?: string;
}) {
  const [localVal, setLocalVal] = useState<string>(value === '' ? '' : String(value));
  const debouncedVal = useDebounce(localVal, 300);

  useEffect(() => {
    setLocalVal(value === '' ? '' : String(value));
  }, [value]);

  useEffect(() => {
    const parsed = debouncedVal === '' ? '' : Number(debouncedVal);
    if (parsed !== value && !Number.isNaN(parsed)) {
      onChange(parsed);
    }
  }, [debouncedVal]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      type="number"
      value={localVal}
      placeholder={placeholder}
      onChange={(e) => setLocalVal(e.target.value)}
      onKeyDown={handleInputArrowNavigation}
    />
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
