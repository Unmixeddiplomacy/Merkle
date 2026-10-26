import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

// ─── EnumSelect — multi-value dropdown with checkboxes ────────────────────────

export interface EnumSelectProps {
  values: string[];
  enumValues: string[];
  onChange: (values: string[]) => void;
}

export function EnumSelect({ values, enumValues, onChange }: EnumSelectProps) {
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
