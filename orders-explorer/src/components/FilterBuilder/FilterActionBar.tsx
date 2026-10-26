import React from 'react';

interface FilterActionBarProps {
  onAddGroup: () => void;
  onReset: () => void;
  onApply: () => void;
  hasFilters: boolean;
}

export const FilterActionBar = React.memo(function FilterActionBar({
  onAddGroup,
  onReset,
  onApply,
  hasFilters,
}: FilterActionBarProps) {
  return (
    <div className="fb__footer">
      <div className="fb__footer-left">
        <button type="button" className="fb__add-btn" onClick={onAddGroup}>
          <span className="material-symbols-outlined">library_add</span>
          Add Group
        </button>
      </div>
      <div className="fb__footer-right">
        <button
          type="button"
          className="fb__reset-btn"
          onClick={onReset}
          disabled={!hasFilters}
        >
          Reset
        </button>
        <button
          type="button"
          className="fb__apply-btn"
          onClick={onApply}
        >
          Apply Filters
          <span className="fb__kbd-inline">↵</span>
        </button>
      </div>
    </div>
  );
});
