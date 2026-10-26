import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

// ─── CustomSelect — single-value dropdown ─────────────────────────────────────

export interface SelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  className?: string;
}

export function CustomSelect({ value, options, onChange, className = '' }: SelectProps) {
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
