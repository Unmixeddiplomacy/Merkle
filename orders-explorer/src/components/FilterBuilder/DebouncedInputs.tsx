import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

// ─── Input arrow navigation helper ────────────────────────────────────────────

export const handleInputArrowNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

// ─── Debounced text input ─────────────────────────────────────────────────────

export function DebouncedTextInput({
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

// ─── Debounced number input ───────────────────────────────────────────────────

export function DebouncedNumberInput({
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
