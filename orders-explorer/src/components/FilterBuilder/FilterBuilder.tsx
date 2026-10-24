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
  const addGroup = () => commitNow({ groups: [...draft.groups, makeGroup()] });

  const removeGroup = (id: string) =>
    commitNow({ groups: draft.groups.filter((g) => g.id !== id) });

  const addCondition = (groupId: string) =>
    commitNow({
      groups: draft.groups.map((g) =>
        g.id === groupId ? addConditionToGroup(g) : g
      ),
    });

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

  // Keyboard shortcut: Cmd/Ctrl+F toggles panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fb" id="filter-builder">
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
                        GROUP {gIdx + 1} ({gIdx === 0 ? 'AND' : 'OR'})
                      </span>
                      <span className="fb-group__desc">
                        {gIdx === 0
                          ? 'All criteria must evaluate true'
                          : 'Matches any child clause'}
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
                    <ConditionRow
                      key={cIdx}
                      cond={cond}
                      onUpdate={(partial) => updateCondition(group.id, cIdx, partial)}
                      onRemove={() => removeCondition(group.id, cIdx)}
                    />
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
