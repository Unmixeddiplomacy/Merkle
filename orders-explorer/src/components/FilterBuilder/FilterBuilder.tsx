import { useState, useCallback, useRef, useEffect } from 'react';
import type { Condition, FilterGroup, FilterState } from '../../types/filter';
import { EMPTY_FILTER } from '../../types/filter';
import { makeDefaultCondition } from './ConditionRow';
import { FilterChips } from './FilterChips';
import { FilterGroupCard } from './FilterGroupCard';
import { FilterActionBar } from './FilterActionBar';
import { useFilterKeyboardNav } from './useFilterKeyboardNav';
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

  // Keyboard navigation & Cmd/Ctrl+F shortcuts
  const { handleFilterBuilderKeyDown } = useFilterKeyboardNav({ setCollapsed });

  // Sync if store filter changed externally (e.g. URL load)
  const filterRef = useRef(filter);
  useEffect(() => {
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
      const allFields = document.querySelectorAll<HTMLElement>(
        '.fb-cond .fb-select--field .fb-select__btn'
      );
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
      const allFields = document.querySelectorAll<HTMLElement>(
        '.fb-cond .fb-select--field .fb-select__btn'
      );
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

  const handleApply = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    onChange(draft);
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setCollapsed((c) => !c);
          }}
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
            />
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
              <FilterGroupCard
                key={group.id}
                group={group}
                gIdx={gIdx}
                onRemoveGroup={removeGroup}
                onAddCondition={addCondition}
                onRemoveCondition={removeCondition}
                onUpdateCondition={updateCondition}
              />
            ))
          )}

          {/* Footer action bar */}
          <FilterActionBar
            onAddGroup={addGroup}
            onReset={clearAll}
            onApply={handleApply}
            hasFilters={draft.groups.length > 0}
          />
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
