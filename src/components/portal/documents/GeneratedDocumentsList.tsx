import React from 'react';
import { GeneratedDocument } from '@/types/documents';
import { DocumentListControls } from './DocumentListControls';
import { GeneratedDocumentItem } from './GeneratedDocumentItem';
import { extractTemplateType, getTemplateLabel } from '@/utils/documentUtils';

interface GeneratedDocumentsListProps {
  documents: GeneratedDocument[];
  sortBy: 'name' | 'type' | 'date-asc' | 'date-desc';
  onSortChange: (value: 'name' | 'type' | 'date-asc' | 'date-desc') => void;
  showActiveOnly: boolean;
  onShowActiveChange: (checked: boolean) => void;
  onSetActive: (path: string, type: string) => void;
  onDeactivate: (path: string) => void;
  onDownload: (path: string, name: string) => void;
  onDelete: (path: string) => void;
  readOnly: boolean;
  slugToLabelMap?: Record<string, string>;
}

export function GeneratedDocumentsList({
  documents,
  sortBy,
  onSortChange,
  showActiveOnly,
  onShowActiveChange,
  onSetActive,
  onDeactivate,
  onDownload,
  onDelete,
  readOnly,
  slugToLabelMap,
}: GeneratedDocumentsListProps) {
  if (documents.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      <DocumentListControls
        sortBy={sortBy}
        onSortChange={onSortChange}
        showActiveOnly={showActiveOnly}
        onShowActiveChange={onShowActiveChange}
      />
      {documents.map((doc) => {
        const documentType = extractTemplateType(doc.name) || '';
        return (
          <GeneratedDocumentItem
            key={doc.path}
            document={doc}
            documentType={documentType}
            onSetActive={onSetActive}
            onDeactivate={onDeactivate}
            onDownload={onDownload}
            onDelete={onDelete}
            readOnly={readOnly}
            slugToLabelMap={slugToLabelMap}
          />
        );
      })}
    </div>
  );
}

