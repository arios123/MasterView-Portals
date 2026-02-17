import React from 'react';
import { Button } from '@/components/ui/button';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import { GeneratedDocument } from '@/types/documents';
import { getDisplayName, getTemplateLabel, getGeneratedDate } from '@/utils/documentUtils';

interface GeneratedDocumentItemProps {
  document: GeneratedDocument;
  documentType: string;
  onSetActive: (path: string, type: string) => void;
  onDeactivate: (path: string) => void;
  onDownload: (path: string, name: string) => void;
  onDelete: (path: string) => void;
  readOnly: boolean;
  slugToLabelMap?: Record<string, string>;
}

export function GeneratedDocumentItem({
  document,
  documentType,
  onSetActive,
  onDeactivate,
  onDownload,
  onDelete,
  readOnly,
  slugToLabelMap,
}: GeneratedDocumentItemProps) {
  const isActive = document.is_active || false;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <span className="font-medium text-sm truncate">
          {getDisplayName(document.name)}
          {isActive && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>}
        </span>
        <span className="text-sm text-muted-foreground">{getTemplateLabel(document.name, slugToLabelMap)}</span>
        <span className="text-sm text-muted-foreground">{getGeneratedDate(document.name)}</span>
        <AccountabilityInfo
          created_by={document.created_by}
          created_at={document.created_at}
          updated_by={document.updated_by}
          updated_at={document.updated_at}
        />
      </div>
      <div className="flex gap-2 shrink-0">
        {!isActive ? (
          <Button size="sm" variant="outline" onClick={() => onSetActive(document.path, documentType)} disabled={readOnly}>
            Set Active
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onDeactivate(document.path)} disabled={readOnly}>
            Deactivate
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onDownload(document.path, document.name)}>
          Download
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(document.path)}
          className="text-destructive hover:text-destructive"
          disabled={readOnly}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

