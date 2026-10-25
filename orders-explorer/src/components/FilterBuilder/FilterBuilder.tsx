import { useState, useCallback, useRef, useEffect } from 'react';
import type { Condition, FilterGroup, FilterState } from '../../types/filter';
import { EMPTY_FILTER } from '../../types/filter';
import { ConditionRow, makeDefaultCondition } from './ConditionRow';
import { FilterChips } from './FilterChips';
import './FilterBuilder.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGroup(): FilterGroup {
  return {
    id: crypto.randomUUID(),
    conditions: [makeDefaultCondition('status')],
  };
}

function addConditionToGroup(group: FilterGroup): FilterGroup {
  return {
    ...group,
    conditions: [...group.conditions, makeDefaultCondition('status')],
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FilterBuilderProps {
  filter: FilterState;
  /** Called with debounced (300ms) filter update */
  onChange: (filter: FilterState) => void;
  matchingCount: number;
  totalCount: number;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FilterBuilder({
  filter,
  onChange,
  matchingCount,
  totalCount,
}: FilterBuilderProps) {
  // Local draft — user edits this; debounce commits to global store
  const [draft, setDraft] = useState<FilterState>(filter);
  const [collapsed, setCollapsed] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if store filter changed externally (e.g. URL load)
  const filterRef = useRef(filter);
  useEffect(() => {
    // Only sync when filter identity genuinely changed from outside
    if (filter !== filterRef.current) {
      filterRef.current = filter;
      setDraft(filter);
    }
  }, [filter]);

  // Commit to global store with 300ms debounce
  const commit = useCallback(
    (newDraft: FilterState) => {
      setDraft(newDraft);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onChange(newDraft);
      }, 300);
    },
    [onChange]
  );

  // Immediate commit (for structural changes like add/remove group)
  const commitNow = useCallback(
    (newDraft: FilterState) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setDraft(newDraft);
      onChange(newDraft);
    },
    [onChange]
  );

  // ── Group actions ──────────────────────────────────────────────────────────
  const addGroup = () => {
    commitNow({ groups: [...draft.groups, makeGroup()] });
    requestAnimationFrame(() => {
      const allFields = document.querySelectorAll<HTMLElement>('.fb-cond .fb-select--field .fb-select__btn');
      allFields[allFields.length - 1]?.focus();
    });
  };

  const removeGroup = (id: string) =>
    commitNow({ groups: draft.groups.filter((g) => g.id !== id) });

  const addCondition = (groupId: string) => {
    commitNow({
      groups: draft.groups.map((g) =>
        g.id === groupId ? addConditionToGroup(g) : g
      ),
    });
    requestAnimationFrame(() => {
      const allFields = document.querySelectorAll<HTMLElement>('.fb-cond .fb-select--field .fb-select__btn');
      allFields[allFields.length - 1]?.focus();
    });
  };

  const removeCondition = (groupId: string, condIdx: number) => {
    const groups = draft.groups
      .map((g) => {
        if (g.id !== groupId) return g;
        const conditions = g.conditions.filter((_, i) => i !== condIdx);
        return { ...g, conditions };
      })
      .filter((g) => g.conditions.length > 0); // remove empty groups
    commitNow({ groups });
  };

  const updateCondition = (
    groupId: string,
    condIdx: number,
    partial: Partial<Condition>
  ) => {
    const groups = draft.groups.map((g) => {
      if (g.id !== groupId) return g;
      const conditions = g.conditions.map((c, i) => {
        if (i !== condIdx) return c;
        // If this is a full replacement (field change resets the condition type)
        if ('type' in partial && partial.type !== c.type) {
          return partial as Condition;
        }
        return { ...c, ...partial } as Condition;
      });
      return { ...g, conditions };
    });
    commit({ groups });
  };

  const clearAll = () => commitNow(EMPTY_FILTER);

  // Keyboard shortcut: Cmd/Ctrl+F toggles panel with intelligent focus management
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setCollapsed((c) => {
          const next = !c;
          if (!next) {
            // Opening panel: focus first interactive field selector inside
            requestAnimationFrame(() => {
              const panel = document.getElementById('fb-body');
              const firstField = panel?.querySelector<HTMLElement>('.fb-cond .fb-select--field .fb-select__btn');
              if (firstField) {
                firstField.focus();
              } else {
                const fallback = panel?.querySelector<HTMLElement>('.fb-group__add-cond, .fb__add-btn, button, input');
                fallback?.focus();
              }
            });
          } else {
            // Closing panel: return focus directly to the grid
            requestAnimationFrame(() => {
              const grid = document.querySelector<HTMLElement>('[data-grid-wrapper]');
              grid?.focus({ preventScroll: true });
            });
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleFilterBuilderKeyDown = (e: React.KeyboardEvent) => {
    const openDropdown = document.querySelector('.fb-select__dropdown, .fb-enum__dropdown');

    if (e.key === 'Escape') {
      if (!openDropdown) {
        e.preventDefault();
        setCollapsed(true);
        requestAnimationFrame(() => {
          const grid = document.querySelector<HTMLElement>('[data-grid-wrapper]');
          grid?.focus({ preventScroll: true });
        });
      }
      return;
    }

    if (openDropdown) {
      // Open dropdown handles its own up/down/enter/escape keys
      return;
    }

    const target = e.target as HTMLElement;
    if (!target) return;

    // Arrow navigation inside condition rows
    const condRow = target.closest<HTMLElement>('.fb-cond');
    if (condRow) {
      const rowControls = Array.from(
        condRow.querySelectorAll<HTMLElement>('.fb-select__btn, .fb-input input, .fb-enum__trigger, .fb-cond__remove')
      );
      const curIdx = rowControls.indexOf(target);

      if (e.key === 'ArrowRight') {
        if (target.tagName === 'INPUT') {
          const input = target as HTMLInputElement;
          if (input.selectionStart !== null && input.selectionStart < input.value.length) {
            return; // let text cursor move right inside input
          }
        }
        if (curIdx >= 0 && curIdx < rowControls.length - 1) {
          e.preventDefault();
          rowControls[curIdx + 1]?.focus();
          return;
        } else if (curIdx === rowControls.length - 1) {
          e.preventDefault();
          const allRows = Array.from(document.querySelectorAll<HTMLElement>('.fb-cond'));
          const rowIdx = allRows.indexOf(condRow);
          if (rowIdx >= 0 && rowIdx < allRows.length - 1) {
            const nextRowFirst = allRows[rowIdx + 1].querySelector<HTMLElement>('.fb-select__btn, input, .fb-enum__trigger');
            nextRowFirst?.focus();
          } else {
            const groupEl = condRow.closest('.fb-group');
            const addCondBtn = groupEl?.querySelector<HTMLElement>('.fb-group__add-cond');
            addCondBtn?.focus();
          }
          return;
        }
      } else if (e.key === 'ArrowLeft') {
        if (target.tagName === 'INPUT') {
          const input = target as HTMLInputElement;
          if (input.selectionEnd !== null && input.selectionEnd > 0) {
            return; // let text cursor move left inside input
          }
        }
        if (curIdx > 0) {
          e.preventDefault();
          rowControls[curIdx - 1]?.focus();
          return;
        } else if (curIdx === 0) {
          e.preventDefault();
          const allRows = Array.from(document.querySelectorAll<HTMLElement>('.fb-cond'));
          const rowIdx = allRows.indexOf(condRow);
          if (rowIdx > 0) {
            const prevRowRemove = allRows[rowIdx - 1].querySelector<HTMLElement>('.fb-cond__remove');
            prevRowRemove?.focus();
          } else {
            const groupEl = condRow.closest('.fb-group');
            const delBtn = groupEl?.querySelector<HTMLElement>('.fb-group__delete');
            delBtn?.focus();
          }
          return;
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const allRows = Array.from(document.querySelectorAll<HTMLElement>('.fb-cond'));
        const rowIdx = allRows.indexOf(condRow);
        if (rowIdx >= 0 && rowIdx < allRows.length - 1) {
          const nextRow = allRows[rowIdx + 1];
          const nextControls = Array.from(
            nextRow.querySelectorAll<HTMLElement>('.fb-select__btn, .fb-input input, .fb-enum__trigger, .fb-cond__remove')
          );
          const targetIdx = Math.min(curIdx, nextControls.length - 1);
          nextControls[targetIdx]?.focus();
          return;
        } else {
          // Last condition row: move to + Add Condition
          const groupEl = condRow.closest('.fb-group');
          const addCondBtn = groupEl?.querySelector<HTMLElement>('.fb-group__add-cond');
          if (addCondBtn) {
            addCondBtn.focus();
            return;
          }
          const addGroupBtn = document.querySelector<HTMLElement>('.fb__add-btn');
          addGroupBtn?.focus();
          return;
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const allRows = Array.from(document.querySelectorAll<HTMLElement>('.fb-cond'));
        const rowIdx = allRows.indexOf(condRow);
        if (rowIdx > 0) {
          const prevRow = allRows[rowIdx - 1];
          const prevControls = Array.from(
            prevRow.querySelectorAll<HTMLElement>('.fb-select__btn, .fb-input input, .fb-enum__trigger, .fb-cond__remove')
          );
          const targetIdx = Math.min(curIdx, prevControls.length - 1);
          prevControls[targetIdx]?.focus();
          return;
        } else {
          // First row: move to group delete button or header
          const groupEl = condRow.closest('.fb-group');
          const delBtn = groupEl?.querySelector<HTMLElement>('.fb-group__delete');
          if (delBtn) {
            delBtn.focus();
            return;
          }
        }
      }
      return;
    }

    // Navigating from Group delete button
    if (target.classList.contains('fb-group__delete')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const groupEl = target.closest('.fb-group');
        const firstCond = groupEl?.querySelector<HTMLElement>('.fb-cond .fb-select--field .fb-select__btn');
        firstCond?.focus();
        return;
      }
    }

    // Navigating from Add Condition button
    if (target.classList.contains('fb-group__add-cond')) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const groupEl = target.closest('.fb-group');
        const rows = groupEl?.querySelectorAll<HTMLElement>('.fb-cond');
        if (rows && rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          const firstField = lastRow.querySelector<HTMLElement>('.fb-select--field .fb-select__btn');
          firstField?.focus();
        }
        return;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const allAddConds = Array.from(document.querySelectorAll<HTMLElement>('.fb-group__add-cond'));
        const idx = allAddConds.indexOf(target);
        if (idx >= 0 && idx < allAddConds.length - 1) {
          const nextGroup = allAddConds[idx + 1].closest('.fb-group');
          const firstCond = nextGroup?.querySelector<HTMLElement>('.fb-cond .fb-select--field .fb-select__btn');
          firstCond?.focus();
        } else {
          const addBtn = document.querySelector<HTMLElement>('.fb__add-btn');
          addBtn?.focus();
        }
        return;
      }
    }

    // Navigating inside Footer action bar
    if (target.closest('.fb__footer')) {
      const footerButtons = Array.from(document.querySelectorAll<HTMLElement>('.fb__footer button:not(:disabled)'));
      const idx = footerButtons.indexOf(target);
      if (e.key === 'ArrowRight') {
        if (idx >= 0 && idx < footerButtons.length - 1) {
          e.preventDefault();
          footerButtons[idx + 1]?.focus();
          return;
        }
      } else if (e.key === 'ArrowLeft') {
        if (idx > 0) {
          e.preventDefault();
          footerButtons[idx - 1]?.focus();
          return;
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const allAddConds = document.querySelectorAll<HTMLElement>('.fb-group__add-cond');
        if (allAddConds.length > 0) {
          allAddConds[allAddConds.length - 1]?.focus();
        } else {
          const allFields = document.querySelectorAll<HTMLElement>('.fb-cond .fb-select--field .fb-select__btn');
          allFields[allFields.length - 1]?.focus();
        }
        return;
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fb" id="filter-builder" onKeyDown={handleFilterBuilderKeyDown}>
        {/* Header */}
        <div
          className="fb__header"
          onClick={() => setCollapsed((c) => !c)}
          role="button"
          aria-expanded={!collapsed}
          aria-controls="fb-body"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCollapsed((c) => !c); }}
        >
          <div className="fb__header-left">
            <span
              className={`material-symbols-outlined fb__toggle-icon${collapsed ? '' : ' open'}`}
            >
              arrow_right
            </span>
            <div className="fb__title-wrap">
              <span className="material-symbols-outlined fb__filter-icon">filter_alt</span>
              <span className="fb__title">Filter Builder</span>
            </div>
            <kbd className="fb__kbd">⌘F</kbd>
            <span className="fb__header-sep">•</span>
            <span className="fb__summary-text">
              {draft.groups.length === 0
                ? 'No filters active'
                : draft.groups.length === 1 && draft.groups[0].conditions.length === 0
                ? 'No filters active'
                : `${matchingCount.toLocaleString()} of ${totalCount.toLocaleString()} matching`}
            </span>
          </div>

          {/* Quick chip preview in header */}
          {!collapsed && draft.groups.length > 0 && (
            <div
              className="fb__chips-preview"
              onClick={(e) => e.stopPropagation()}
            >
              {/* intentionally empty — chips are shown below panel */}
            </div>
          )}
        </div>

        {/* Body */}
        <div className={`fb__body${collapsed ? ' fb__body--hidden' : ''}`} id="fb-body">
          {draft.groups.length === 0 ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              No filter groups yet. Add a group to start filtering.
            </span>
          ) : (
            draft.groups.map((group, gIdx) => (
              <div key={group.id}>
                {gIdx > 0 && (
                  <div className="fb-and-sep">
                    <span className="fb-and-sep__label">AND</span>
                  </div>
                )}
                <div className="fb-group">
                  <div className="fb-group__header">
                    <div className="fb-group__header-left">
                      <span className="fb-group__label">
                        GROUP {gIdx + 1}
                      </span>
                      <span className="fb-group__desc">
                        Conditions combined with OR
                      </span>
                    </div>
                    <button
                      type="button"
                      className="fb-group__delete"
                      onClick={() => removeGroup(group.id)}
                      aria-label={`Delete group ${gIdx + 1}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
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
                        onUpdate={(partial) => updateCondition(group.id, cIdx, partial)}
                        onRemove={() => removeCondition(group.id, cIdx)}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    className="fb-group__add-cond"
                    onClick={() => addCondition(group.id)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
                    Add Condition
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Footer action bar */}
          <div className="fb__footer">
            <div className="fb__footer-left">
              <button type="button" className="fb__add-btn" onClick={addGroup}>
                <span className="material-symbols-outlined">library_add</span>
                Add Group
              </button>
            </div>
            <div className="fb__footer-right">
              <button
                type="button"
                className="fb__reset-btn"
                onClick={clearAll}
                disabled={draft.groups.length === 0}
              >
                Reset
              </button>
              <button
                type="button"
                className="fb__apply-btn"
                onClick={() => { if (debounceTimer.current) clearTimeout(debounceTimer.current); onChange(draft); }}
              >
                Apply Filters
                <span className="fb__kbd-inline">↵</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips strip — always visible when filter is active */}
      <FilterChips
        filter={draft}
        onRemoveCondition={removeCondition}
        onClearAll={clearAll}
      />
    </>
  );
}
