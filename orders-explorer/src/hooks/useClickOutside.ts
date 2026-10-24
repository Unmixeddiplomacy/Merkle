import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Fires `callback` when a click/touch occurs outside the referenced element.
 * The returned ref should be attached to the element you want to monitor.
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [callback]);

  return ref;
}
