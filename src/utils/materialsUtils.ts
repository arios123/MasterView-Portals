import { Item } from '@/types/materials';

export const money = (n: number) => 
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export const uid = () => Math.random().toString(36).slice(2);

/** Coerce a value to number for save; use fallback (or 0) when blank/empty/invalid so no space is left blank. */
export function ensureNumber(value: unknown, fallback: number | undefined): number {
  if (value === undefined || value === null || value === '') return fallback ?? 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : (fallback ?? 0);
}

export function total(items: Item[]): number {
  return items.reduce((s, it) => s + it.qty * (it.price || 0), 0);
}

export function groupByBaseName(items: Item[]): Record<string, Item[]> {
  const groups: Record<string, Item[]> = {};
  items.forEach(it => {
    const baseName = it.name.replace(/\s*\(Part \d+\)$/i, '').trim();
    if (!groups[baseName]) groups[baseName] = [];
    groups[baseName].push(it);
  });
  return groups;
}

