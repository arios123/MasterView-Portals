import { useState, useEffect } from 'react';

interface UseUnsavedChangesOptions<T> {
  currentData: T;
  originalData: T;
  compareFn?: (current: T, original: T) => boolean;
  checkInterval?: number;
}

/**
 * Project-wide hook to detect unsaved changes
 * 
 * @param currentData - Current state of the data
 * @param originalData - Original/saved state of the data
 * @param compareFn - Optional custom comparison function (default: JSON.stringify)
 * @param checkInterval - How often to check for changes in ms (default: 500)
 * @returns hasUnsavedChanges - Boolean indicating if there are unsaved changes
 */
export function useUnsavedChanges<T>({
  currentData,
  originalData,
  compareFn,
  checkInterval = 500,
}: UseUnsavedChangesOptions<T>) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const checkChanges = () => {
      try {
        const hasChanges = compareFn
          ? compareFn(currentData, originalData)
          : JSON.stringify(currentData) !== JSON.stringify(originalData);
        
        setHasUnsavedChanges(hasChanges);
      } catch (e) {
        console.error('Error checking unsaved changes:', e);
        setHasUnsavedChanges(false);
      }
    };

    // Check immediately
    checkChanges();

    // Check periodically
    const interval = setInterval(checkChanges, checkInterval);
    return () => clearInterval(interval);
  }, [currentData, originalData, compareFn, checkInterval]);

  return { hasUnsavedChanges };
}

