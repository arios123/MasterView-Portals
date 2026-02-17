import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeneratedDocument } from '@/types/documents';
import { extractTemplateType, getDisplayName, getGeneratedDate, getTemplateLabel } from '@/utils/documentUtils';
import { buildProjectDocumentPath } from '@/lib/utils';
import { useDocumentGroups } from '@/hooks/useDocumentGroups';

export function useGeneratedDocuments(
  projectId: string,
  allowedDocumentTypes: string[],
  workspaceId?: string,
) {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'date-asc' | 'date-desc'>('date-desc');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const { groups } = useDocumentGroups();
  
  // Create slug to label map for sorting
  const slugToLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach(group => {
      map[group.slug] = group.name;
    });
    return map;
  }, [groups]);

  const fetchDocuments = async () => {
    try {
      if (!workspaceId) {
        // Without a workspace, we can't resolve the correct storage path
        setDocuments([]);
        return;
      }

      const { data: files, error } = await supabase.storage
        .from('project-attachments')
        .list(`${workspaceId}/${projectId}/documents`);

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      if (!files) return;

      // Filter files to only show those matching allowed document types
      // If allowedDocumentTypes is empty or not provided, show all files
      let filteredFiles = files;
      if (allowedDocumentTypes && allowedDocumentTypes.length > 0) {
        filteredFiles = files.filter((file) => {
          const templateType = extractTemplateType(file.name);
          return templateType && allowedDocumentTypes.includes(templateType);
        });
      }

      // Fetch active status and accountability data from database
      const filePaths = filteredFiles.map((file) =>
        buildProjectDocumentPath(workspaceId, projectId, file.name),
      );
      const { data: documentStatuses, error: statusError } = await supabase
        .from('project_documents' as any)
        .select('file_path, is_active, created_by, created_at, updated_by, updated_at')
        .eq('workspace_id', workspaceId)
        .eq('project_id', projectId)
        .in('file_path', filePaths);

      // Create maps for status and accountability data
      const activeStatusMap = new Map<string, boolean>();
      const accountabilityMap = new Map<string, any>();
      if (documentStatuses && !statusError) {
        (documentStatuses as any[]).forEach((doc: any) => {
          activeStatusMap.set(doc.file_path, doc.is_active || false);
          accountabilityMap.set(doc.file_path, {
            created_by: doc.created_by,
            created_at: doc.created_at,
            updated_by: doc.updated_by,
            updated_at: doc.updated_at,
          });
        });
      }

      const documentList = filteredFiles.map((file) => {
        const filePath = buildProjectDocumentPath(workspaceId, projectId, file.name);
        const accountability = accountabilityMap.get(filePath);
        return {
          name: file.name,
          path: filePath,
          created_at: file.created_at,
          is_active: activeStatusMap.get(filePath) || false,
          ...accountability,
        };
      });
      setDocuments(documentList);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const sortedDocuments = useMemo(() => {
    // First filter by active status if filter is enabled
    let filtered = documents;
    if (showActiveOnly) {
      filtered = documents.filter((doc) => doc.is_active === true);
    }

    // Then sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return getDisplayName(a.name).localeCompare(getDisplayName(b.name));
      } else if (sortBy === 'type') {
        return getTemplateLabel(a.name, slugToLabelMap).localeCompare(getTemplateLabel(b.name, slugToLabelMap));
      } else if (sortBy === 'date-desc') {
        const dateA = getGeneratedDate(a.name);
        const dateB = getGeneratedDate(b.name);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      } else {
        const dateA = getGeneratedDate(a.name);
        const dateB = getGeneratedDate(b.name);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      }
    });
  }, [documents, sortBy, showActiveOnly, slugToLabelMap]);

  return {
    documents,
    sortedDocuments,
    sortBy,
    setSortBy,
    showActiveOnly,
    setShowActiveOnly,
    refetch: fetchDocuments,
  };
}

