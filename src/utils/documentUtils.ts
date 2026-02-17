import { format } from 'date-fns';
import { ALL_DOCUMENT_TYPES } from '@/types/documents';

export function extractTemplateType(fileName: string): string | null {
  // Extract template type from filename
  const withDate = fileName.match(/^(.+)_([^_]+)_(\d{4}-\d{2}-\d{2})\.(docx|pdf)$/);
  if (withDate) return withDate[2];

  const legacy = fileName.match(/^(.+)_([^_]+)\.(docx|pdf)$/);
  if (legacy) return legacy[2];

  return null;
}

/**
 * Get template label from slug
 * @param fileName - The filename to extract template type from
 * @param slugToLabelMap - Optional map of slug -> label for dynamic document groups
 * @returns The label for the template type
 */
export function getTemplateLabel(fileName: string, slugToLabelMap?: Record<string, string>): string {
  const templateType = extractTemplateType(fileName);
  if (!templateType) return 'Document';

  // First try dynamic map if provided
  if (slugToLabelMap && slugToLabelMap[templateType]) {
    return slugToLabelMap[templateType];
  }

  // Fall back to hardcoded list for backward compatibility
  const docType = ALL_DOCUMENT_TYPES.find((t) => t.value === templateType);
  if (docType) return docType.label;

  // If not found, format the slug as a readable label
  return templateType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getDisplayName(fileName: string): string {
  const withDate = fileName.match(/^(.+)_([^_]+)_(\d{4}-\d{2}-\d{2})\.(docx|pdf)$/);
  if (withDate) return withDate[1];

  const legacy = fileName.match(/^(.+)_([^_]+)\.(docx|pdf)$/);
  if (legacy) return legacy[1];

  return fileName.replace(/\.(docx|pdf)$/, '');
}

export function getGeneratedDate(fileName: string): string {
  const withDate = fileName.match(/^(.+)_([^_]+)_(\d{4}-\d{2}-\d{2})\.(docx|pdf)$/);
  if (withDate) {
    const dateStr = withDate[3];
    try {
      const [year, month, day] = dateStr.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)), 'MM/dd/yyyy');
    } catch (e) {
      return dateStr;
    }
  }
  return '';
}

