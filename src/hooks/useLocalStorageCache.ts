import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

/**
 * Hook for caching component state to localStorage
 * Automatically saves on changes and restores on mount
 * 
 * SECURITY: Cache keys MUST include userId and workspaceId to prevent cross-user/workspace data leakage
 * 
 * @param key - Unique cache key (MUST include userId and workspaceId via useCacheKey hook)
 * @param initialValue - Initial value if no cache exists
 * @param options - Options for caching behavior
 */
export function useLocalStorageCache<T>(
  key: string,
  initialValue: T,
  options: {
    /**
     * Custom serialization function (default: JSON.stringify)
     */
    serialize?: (value: T) => string;
    /**
     * Custom deserialization function (default: JSON.parse)
     */
    deserialize?: (value: string) => T;
    /**
     * Debounce delay in ms for saving to localStorage (default: 300ms)
     */
    debounceMs?: number;
    /**
     * Whether to restore from cache on mount (default: true)
     */
    restoreOnMount?: boolean;
    /**
     * Whether to save to cache on changes (default: true)
     */
    saveOnChange?: boolean;
  } = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debounceMs = 300,
    restoreOnMount = true,
    saveOnChange = true,
  } = options;

  // Get cached value from localStorage on mount
  const getCachedValue = useCallback((): T | null => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return null;
      return deserialize(item);
    } catch (error) {
      console.error(`Error reading cache for key "${key}":`, error);
      return null;
    }
  }, [key, deserialize]);

  // Initialize state with cached value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (restoreOnMount) {
      const cached = getCachedValue();
      return cached !== null ? cached : initialValue;
    }
    return initialValue;
  });

  // Track if this is the initial mount (to prevent saving initial restore)
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage (debounced)
  const saveToCache = useCallback(
    (value: T, immediate: boolean = false) => {
      if (!saveOnChange || isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Save immediately if requested (for deletions and critical updates)
      if (immediate) {
        try {
          const serialized = serialize(value);
          window.localStorage.setItem(key, serialized);
        } catch (error) {
          console.error(`Error saving cache for key "${key}":`, error);
        }
        return;
      }

      // Otherwise, debounce save
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const serialized = serialize(value);
          window.localStorage.setItem(key, serialized);
        } catch (error) {
          console.error(`Error saving cache for key "${key}":`, error);
        }
      }, debounceMs);
    },
    [key, serialize, saveOnChange, debounceMs]
  );

  // Helper to detect if this looks like a deletion (for arrays/objects)
  const isLikelyDeletion = useCallback((prev: T, next: T): boolean => {
    // If both are arrays, check if length decreased
    if (Array.isArray(prev) && Array.isArray(next)) {
      return next.length < prev.length;
    }
    // If both are objects, check if keys decreased (indicating property deletion)
    if (typeof prev === 'object' && prev !== null && typeof next === 'object' && next !== null) {
      const prevKeys = Object.keys(prev as Record<string, unknown>);
      const nextKeys = Object.keys(next as Record<string, unknown>);
      return nextKeys.length < prevKeys.length;
    }
    return false;
  }, []);

  // Update state and save to cache
  const setValue = useCallback(
    (value: T | ((val: T) => T), immediate: boolean = false) => {
      setStoredValue((prev) => {
        const newValue = typeof value === 'function' ? (value as (val: T) => T)(prev) : value;
        
        // Auto-detect deletions and save immediately
        // If immediate flag is set, or if we detect a deletion, save immediately
        const shouldSaveImmediately = immediate || isLikelyDeletion(prev, newValue);
        saveToCache(newValue, shouldSaveImmediately);
        
        return newValue;
      });
    },
    [saveToCache, isLikelyDeletion]
  );

  // Manually clear the cache
  const clearCache = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error clearing cache for key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Restore from cache (useful for manual refresh)
  const restoreFromCache = useCallback(() => {
    const cached = getCachedValue();
    if (cached !== null) {
      setStoredValue(cached);
      return true;
    }
    return false;
  }, [getCachedValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Mark initial mount as complete after first render
  useEffect(() => {
    if (isInitialMount.current && restoreOnMount) {
      // Small delay to ensure we don't save the initial restore
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [restoreOnMount]);

  return [storedValue, setValue, clearCache, restoreFromCache] as const;
}

/**
 * Utility to generate cache keys scoped by user, workspace, project, and route
 * 
 * SECURITY: userId and workspaceId are REQUIRED to prevent cross-user/workspace data leakage
 * 
 * @param prefix - Component/feature prefix (e.g., 'clientprofile', 'calendartab')
 * @param userId - User ID (REQUIRED for security)
 * @param workspaceId - Workspace ID (REQUIRED for security and multi-tenancy)
 * @param projectId - Optional project ID for project-scoped cache
 * @param tab - Optional tab name for tab-scoped cache
 * @param subKey - Optional sub-key for additional scoping
 * @returns A cache key string that includes user and workspace identifiers
 */
export function getCacheKey(
  prefix: string,
  userId: string,
  workspaceId: string,
  projectId?: string,
  tab?: string,
  subKey?: string
): string {
  if (!userId || !workspaceId) {
    throw new Error('getCacheKey requires userId and workspaceId for security. Use useCacheKey hook instead.');
  }
  
  const parts = ['kba_cache', `user:${userId}`, `workspace:${workspaceId}`, prefix];
  if (projectId) parts.push(`project:${projectId}`);
  if (tab) parts.push(`tab:${tab}`);
  if (subKey) parts.push(subKey);
  return parts.join('.');
}

/**
 * Hook to generate cache keys automatically with user and workspace context
 * This ensures all cache keys include user and workspace IDs for security
 * 
 * @returns A function that generates cache keys with current user/workspace context
 */
export function useCacheKey() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  return useCallback((
    prefix: string,
    projectId?: string,
    tab?: string,
    subKey?: string
  ): string => {
    const userId = user?.id || 'anonymous';
    const workspaceId = currentWorkspace?.id || 'no-workspace';
    
    return getCacheKey(prefix, userId, workspaceId, projectId, tab, subKey);
  }, [user?.id, currentWorkspace?.id]);
}

/**
 * Hook to clear all cache for a specific project within current user/workspace context
 * 
 * SECURITY: Only clears cache for the current user and workspace
 */
export function useClearProjectCache() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  return useCallback((projectId: string) => {
    if (!user?.id || !currentWorkspace?.id) {
      console.warn('Cannot clear project cache: user or workspace not available');
      return;
    }
    
    try {
      const keys = Object.keys(window.localStorage);
      const userPrefix = `kba_cache.user:${user.id}.workspace:${currentWorkspace.id}`;
      const projectSuffix = `project:${projectId}`;
      
      keys.forEach((key) => {
        if (key.startsWith(userPrefix) && key.includes(projectSuffix)) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing project cache:', error);
    }
  }, [user?.id, currentWorkspace?.id]);
}

/**
 * Hook to clear all cache for the current user and workspace
 * 
 * SECURITY: Only clears cache for the current user and workspace
 */
export function useClearAllCache() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  return useCallback(() => {
    if (!user?.id || !currentWorkspace?.id) {
      console.warn('Cannot clear cache: user or workspace not available');
      return;
    }
    
    try {
      const keys = Object.keys(window.localStorage);
      const userPrefix = `kba_cache.user:${user.id}.workspace:${currentWorkspace.id}`;
      
      keys.forEach((key) => {
        if (key.startsWith(userPrefix)) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [user?.id, currentWorkspace?.id]);
}

/**
 * Utility to clear all cache (including other users/workspaces) - USE WITH CAUTION
 * This is mainly for admin/debugging purposes
 */
export function clearAllCacheUnsafe() {
  try {
    const keys = Object.keys(window.localStorage);
    keys.forEach((key) => {
      if (key.startsWith('kba_cache.')) {
        window.localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

