import { useRef, useEffect } from 'react';

// ─── Keyboard Help Panel ──────────────────────────────────────────────────────

const SHORTCUTS = [
  { key: '↑ / ↓',              desc: 'Navigate rows up / down' },
  { key: '← / →',              desc: 'Navigate columns left / right' },
  { key: 'PgUp / PgDn',        desc: 'Jump 15 rows up / down' },
  { key: 'Home / End',         desc: 'Jump to first / last row' },
  { key: 'Space',              desc: 'Toggle row selection' },
  { key: 'Enter',              desc: 'Open row detail panel' },
  { key: 'S',                  desc: 'Sort focused column (asc / desc / off)' },
  { key: 'P',                  desc: 'Pin / unpin focused column' },
  { key: '⌘F / Ctrl+F',        desc: 'Toggle Filter Builder (focus moves inside)' },
  { key: '⌥E / Alt+E',         desc: 'Export visible selected rows to CSV' },
  { key: 'Escape',             desc: 'Close panel / deselect all' },
  { key: '?',                  desc: 'Show this keyboard shortcuts panel' },
  { key: 'Right-click column', desc: 'Column options (pin / sort)' },
  { key: 'Double-click row',   desc: 'Open row detail panel' },
];

export function KeyboardHelp({ onClose }: { onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div className="grid-detail-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="grid-help-panel"
        role="dialog"
        aria-label="Keyboard shortcuts"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
      >
        <div className="grid-detail-panel__header">
          <div className="grid-detail-panel__title-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>keyboard</span>
            <span className="grid-detail-panel__title">Keyboard Shortcuts</span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="grid-detail-panel__close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <div className="grid-help-panel__body">
          {SHORTCUTS.map(({ key, desc }) => (
            <div key={key} className="grid-help-panel__row">
              <kbd className="grid-help-panel__kbd">{key}</kbd>
              <span className="grid-help-panel__desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
