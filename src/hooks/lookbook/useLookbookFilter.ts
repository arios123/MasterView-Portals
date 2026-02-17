import { useMemo, useState, useEffect } from 'react';
import { LookbookItem, EXCLUDED_CATEGORIES } from '@/types/lookbook';
import { useLookbookCategories } from './useLookbookCategories';
import { useLocalStorageCache, useCacheKey } from '@/hooks/useLocalStorageCache';

// Helper function to convert currency string to number
const currencyToNumber = (price: string) => {
  const n = Number(price.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
};

export function useLookbookFilter(items: LookbookItem[], workspaceId: string | undefined, projectId?: string) {
  const { categories } = useLookbookCategories(workspaceId);
  const cacheKey = useCacheKey(); // Get cache key generator with user/workspace context
  
  // Cache filter state to localStorage (with user/workspace scoping)
  const cachePrefix = projectId ? `lookbookfilter.${projectId}` : 'lookbookfilter';
  const [searchTerm, setSearchTerm] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, projectId, undefined, 'searchTerm'),
    ''
  );
  const [sortBy, setSortBy] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, projectId, undefined, 'sortBy'),
    'relevance'
  );
  const [subTab, setSubTab] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, projectId, undefined, 'subTab'),
    'Other'
  );

  // Get category names from workspace categories
  const workspaceCategoryNames = useMemo(() => {
    return categories.map(c => c.name);
  }, [categories]);

  // Get "Other" category name (should always exist)
  const otherCategoryName = useMemo(() => {
    const otherCategory = categories.find(c => c.isDefault);
    return otherCategory?.name || 'Other';
  }, [categories]);

  // Derive subcategories: workspace categories + items with categories not in workspace (shown under "Other")
  const subCategories = useMemo(() => {
    // Start with workspace categories
    const categoryNames = [...workspaceCategoryNames];
    
    // Find items with categories not in workspace categories
    const itemsWithUnknownCategories = items
      .map((i) => i.category)
      .filter((cat) => cat && !EXCLUDED_CATEGORIES.includes(cat))
      .filter((cat) => !workspaceCategoryNames.includes(cat));
    
    const unknownCategories = Array.from(new Set(itemsWithUnknownCategories));
    
    // Ensure "Other" is in the list (it should be from workspace categories, but just in case)
    if (!categoryNames.includes(otherCategoryName)) {
      categoryNames.push(otherCategoryName);
    }
    
    // Sort: workspace categories first (in their display order), then "Other" at the end
    const sortedCategories = categories
      .map(c => c.name)
      .concat(unknownCategories.length > 0 ? [otherCategoryName] : [])
      .filter((name, index, self) => self.indexOf(name) === index); // Remove duplicates
    
    return sortedCategories;
  }, [items, workspaceCategoryNames, categories, otherCategoryName]);

  // Set initial tab to first category if available
  useEffect(() => {
    if (subCategories.length > 0 && !subCategories.includes(subTab)) {
      setSubTab(subCategories[0]);
    }
  }, [subCategories, subTab]);

  // Filter and sort items
  const visibleItems = useMemo(() => {
    // Determine which items to show based on selected tab
    let filtered: LookbookItem[];
    
    if (subTab === otherCategoryName) {
      // Show items that either:
      // 1. Have category matching "Other"
      // 2. Have category not in workspace categories
      filtered = items.filter((item) => {
        const itemCategory = item.category;
        if (!itemCategory) return false;
        if (EXCLUDED_CATEGORIES.includes(itemCategory)) return false;
        
        // Show if category is "Other" or not in workspace categories
        return itemCategory === otherCategoryName || !workspaceCategoryNames.includes(itemCategory);
      });
    } else {
      // Show items with exact category match
      filtered = items.filter(
      (item) =>
        item.category === subTab &&
          !EXCLUDED_CATEGORIES.includes(item.category)
      );
    }

    // Apply search filter
    const searchFiltered = filtered.filter((item) =>
        [item.title, item.description, item.brand]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    // Apply sorting
    if (sortBy === 'price-asc') {
      return [...searchFiltered].sort(
        (a, b) => currencyToNumber(a.price) - currencyToNumber(b.price)
      );
    }
    if (sortBy === 'price-desc') {
      return [...searchFiltered].sort(
        (a, b) => currencyToNumber(b.price) - currencyToNumber(a.price)
      );
    }
    return searchFiltered;
  }, [items, searchTerm, sortBy, subTab, workspaceCategoryNames, otherCategoryName]);

  return {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    subTab,
    setSubTab,
    subCategories,
    visibleItems,
  };
}

