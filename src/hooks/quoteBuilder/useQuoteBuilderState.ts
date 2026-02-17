import { useState, useEffect } from 'react';
import { useLocalStorageCache, useCacheKey } from '@/hooks/useLocalStorageCache';

export function useQuoteBuilderState(
  isSoldProject: boolean,
  soldProjectMultiplier: number,
  projectId?: string
) {
  const cacheKey = useCacheKey(); // Get cache key generator with user/workspace context
  const cachePrefix = projectId ? `quotebuilder.${projectId}` : 'quotebuilder';
  
  const [multiplier, setMultiplier, clearMultiplierCache] = useLocalStorageCache<number>(
    cacheKey(cachePrefix, projectId, undefined, 'multiplier'),
    1.4
  );
  const [draftName, setDraftName, clearDraftNameCache] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, projectId, undefined, 'draftName'),
    ''
  );
  const [isPaymentValid, setIsPaymentValid] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, projectId, undefined, 'isPaymentValid'),
    true
  );
  const [paymentSplits, setPaymentSplits, clearPaymentSplitsCache] = useLocalStorageCache<number[]>(
    cacheKey(cachePrefix, projectId, undefined, 'paymentSplits'),
    [40, 30, 20, 10]
  );
  const [estimatedStartDate, setEstimatedStartDate, clearEstimatedStartDateCache] = useLocalStorageCache<Date | undefined>(
    cacheKey(cachePrefix, projectId, undefined, 'estimatedStartDate'),
    undefined,
    {
      serialize: (date) => date ? date.toISOString() : '',
      deserialize: (str) => str ? new Date(str) : undefined,
    }
  );
  const [estimatedConstructionTime, setEstimatedConstructionTime, clearEstimatedConstructionTimeCache] = useLocalStorageCache<number | undefined>(
    cacheKey(cachePrefix, projectId, undefined, 'estimatedConstructionTime'),
    undefined
  );

  // Set multiplier from sold project if applicable
  useEffect(() => {
    if (isSoldProject && soldProjectMultiplier) {
      setMultiplier(soldProjectMultiplier);
    }
  }, [isSoldProject, soldProjectMultiplier]);

  // Clear all cached state (useful after save)
  const clearAllCache = () => {
    clearMultiplierCache();
    clearDraftNameCache();
    clearPaymentSplitsCache();
    clearEstimatedStartDateCache();
    clearEstimatedConstructionTimeCache();
  };

  return {
    multiplier,
    setMultiplier,
    draftName,
    setDraftName,
    isPaymentValid,
    setIsPaymentValid,
    paymentSplits,
    setPaymentSplits,
    estimatedStartDate,
    setEstimatedStartDate,
    estimatedConstructionTime,
    setEstimatedConstructionTime,
    clearAllCache,
  };
}

