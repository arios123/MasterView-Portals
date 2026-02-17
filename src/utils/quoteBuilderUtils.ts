import { LineItem } from '@/types';

/**
 * Check if an ID is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Filter items to only include those with valid UUIDs
 */
export function filterValidItems(items: LineItem[], kind: 'labor' | 'material'): LineItem[] {
  return items.filter((item) => item.kind === kind && item.id && isValidUUID(item.id));
}

/**
 * Generate a local ID for non-database items
 */
export function generateLocalId(): string {
  return Math.random().toString(36).slice(2);
}

/**
 * Ensure item has a valid ID (database UUID or generated local ID)
 */
export function ensureItemId(item: LineItem): LineItem {
  if (item.id && item.id.length === 36 && item.id.includes('-')) {
    return item; // Already has a UUID
  }
  return { ...item, id: generateLocalId() };
}

