import { LookbookItem } from '@/types/lookbook';

interface ExportItem {
  title: string;
  brand: string;
  link: string;
  finish: string;
  price: string;
  image: string;
  description: string;
  category: string;
  model_number?: string;
  collection?: string;
}

export function exportLookbookItems(items: LookbookItem[], format: 'json' | 'csv') {
  const rows: ExportItem[] = items.map((i) => ({
    title: i.title,
    brand: i.brand,
    link: i.link,
    finish: i.finish,
    price: i.price,
    image: i.image,
    description: i.description,
    category: i.category,
    model_number: i.model_number,
    collection: i.collection,
  }));

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liked-items.json';
    a.click();
    URL.revokeObjectURL(url);
  } else {
    if (rows.length === 0) return;
    
    const headers = Object.keys(rows[0]).join(',');
    const body = rows
      .map((r) =>
        Object.values(r)
          .map((v) => {
            const value = v ?? '';
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');
    const blob = new Blob([`${headers}\n${body}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liked-items.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}

