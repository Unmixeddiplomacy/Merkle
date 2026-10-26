import { useEffect } from 'react';

interface UseFilterKeyboardNavProps {
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useFilterKeyboardNav({ setCollapsed }: UseFilterKeyboardNavProps) {
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
              const firstField = panel?.querySelector<HTMLElement>(
                '.fb-cond .fb-select--field .fb-select__btn'
              );
              if (firstField) {
                firstField.focus();
              } else {
                const fallback = panel?.querySelector<HTMLElement>(
                  '.fb-group__add-cond, .fb__add-btn, button, input'
                );
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
  }, [setCollapsed]);

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
        condRow.querySelectorAll<HTMLElement>(
          '.fb-select__btn, .fb-input input, .fb-enum__trigger, .fb-cond__remove'
        )
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
            const nextRowFirst = allRows[rowIdx + 1].querySelector<HTMLElement>(
              '.fb-select__btn, input, .fb-enum__trigger'
            );
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
            nextRow.querySelectorAll<HTMLElement>(
              '.fb-select__btn, .fb-input input, .fb-enum__trigger, .fb-cond__remove'
            )
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
            prevRow.querySelectorAll<HTMLElement>(
              '.fb-select__btn, .fb-input input, .fb-enum__trigger, .fb-cond__remove'
            )
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
        const firstCond = groupEl?.querySelector<HTMLElement>(
          '.fb-cond .fb-select--field .fb-select__btn'
        );
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
          const firstCond = nextGroup?.querySelector<HTMLElement>(
            '.fb-cond .fb-select--field .fb-select__btn'
          );
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
      const footerButtons = Array.from(
        document.querySelectorAll<HTMLElement>('.fb__footer button:not(:disabled)')
      );
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
          const allFields = document.querySelectorAll<HTMLElement>(
            '.fb-cond .fb-select--field .fb-select__btn'
          );
          allFields[allFields.length - 1]?.focus();
        }
        return;
      }
    }
  };

  return { handleFilterBuilderKeyDown };
}
