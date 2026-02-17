import { useMemo } from 'react';
import { useDocumentGroups } from '@/hooks/useDocumentGroups';
import { DocumentType } from '@/types/documents';

/**
 * Hook to get document types from document groups
 * Converts document groups to DocumentType format for use in document generation
 * @param allowedSlugs - Optional array of slugs to filter by. If not provided, returns all groups.
 */
export function useDocumentTypes(allowedSlugs?: string[]): {
  documentTypes: DocumentType[];
  loading: boolean;
} {
  const { groups, loading } = useDocumentGroups();

  const documentTypes = useMemo(() => {
    // If no allowedSlugs provided, return all groups
    if (!allowedSlugs || allowedSlugs.length === 0) {
      return groups.map(group => ({
        value: group.slug,
        label: group.name,
      }));
    }

    // Filter by allowed slugs if provided
    return groups
      .filter(g => allowedSlugs.includes(g.slug))
      .map(group => ({
        value: group.slug,
        label: group.name,
      }));
  }, [groups, allowedSlugs]);

  return {
    documentTypes,
    loading,
  };
}

/**
 * Check if a document type slug requires a change order
 * This maintains backward compatibility with the hardcoded list
 */
export function requiresChangeOrder(slug: string): boolean {
  const CHANGE_ORDER_SLUGS = [
    'change-order',
    'quote-change-order',
    'complimentary-work',
    'addendum-contract',
  ];
  
  return CHANGE_ORDER_SLUGS.includes(slug);
}

