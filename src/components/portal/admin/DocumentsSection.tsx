import { useState, useEffect } from 'react';
import { Upload, Trash2, Download, FileIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Can } from '@/components/Can';
import { useDocumentGroups } from '@/hooks/useDocumentGroups';
import { DocumentGroup } from '@/stores/adminStore';

type StoredFile = {
  name: string;
  path: string;
  created_at: string;
};

export function DocumentsSection() {
  const { can } = usePermissions();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const canEdit = can('tab.admin_documents.view') && can('tab.admin_documents.edit');
  const { groups, loading: groupsLoading } = useDocumentGroups();
  
  const [templateFiles, setTemplateFiles] = useState<Record<string, StoredFile | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (workspaceId && groups.length > 0) {
      fetchFiles();
    }
  }, [workspaceId, groups]);

  const fetchFiles = async () => {
    if (!workspaceId || groups.length === 0) return;

    const newTemplateFiles: Record<string, StoredFile | null> = {};

    // Fetch each document group's template
    for (const group of groups) {
      const { data, error } = await supabase.storage
        .from('contract_templates')
        .list(`${workspaceId}/${group.slug}`, { sortBy: { column: 'created_at', order: 'desc' }, limit: 1 });

      if (!error && data && data.length > 0) {
        newTemplateFiles[group.id] = {
          name: data[0].name,
          path: `${workspaceId}/${group.slug}/${data[0].name}`,
          created_at: data[0].created_at
        };
      } else {
        newTemplateFiles[group.id] = null;
      }
    }

    setTemplateFiles(newTemplateFiles);
  };

  const handleFileUpload = async (file: File, group: DocumentGroup) => {
    if (!canEdit) {
      toast.error('You do not have permission to upload files');
      return;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    if (!file || file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      toast.error('Only DOCX files are supported');
      return;
    }

    setUploading(prev => ({ ...prev, [group.id]: true }));

    try {
      // Delete existing file if present
      const existingFile = templateFiles[group.id];
      if (existingFile) {
        await supabase.storage
          .from('contract_templates')
          .remove([existingFile.path]);
      }

      // Read file as ArrayBuffer to ensure binary integrity
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      // Upload new file using group slug
      const filePath = `${workspaceId}/${group.slug}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('contract_templates')
        .upload(filePath, blob, { 
          upsert: true,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

      if (uploadError) throw uploadError;

      toast.success('Template uploaded successfully');
      fetchFiles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload template');
    } finally {
      setUploading(prev => ({ ...prev, [group.id]: false }));
    }
  };

  const deleteFile = async (filePath: string) => {
    if (!canEdit) {
      toast.error('You do not have permission to delete files');
      return;
    }

    if (!confirm('Are you sure you want to delete this template?')) return;

    const { error } = await supabase.storage
      .from('contract_templates')
      .remove([filePath]);

    if (error) {
      toast.error('Failed to delete file');
      return;
    }

    toast.success('Template deleted');
    fetchFiles();
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('contract_templates')
      .download(filePath);

    if (error) {
      toast.error('Failed to download file');
      return;
    }

    // Supabase download returns a Blob - use it directly to preserve binary integrity
    // No text processing or modification is done - the blob is used as-is
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderTemplateRow = (group: DocumentGroup) => {
    const file = templateFiles[group.id];
    const isUploading = uploading[group.id] || false;

    return (
      <div key={group.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-medium text-sm shrink-0 w-48">{group.name}:</span>
          {file ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate">{file.name}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">No template uploaded</span>
          )}
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <Can permission="tab.admin_documents.edit">
            <input
              type="file"
              accept=".docx"
              onChange={(e) => {
                const uploadFile = e.target.files?.[0];
                if (uploadFile) handleFileUpload(uploadFile, group);
                e.target.value = '';
              }}
              className="hidden"
              id={`upload-${group.id}`}
            />
            <label htmlFor={`upload-${group.id}`}>
              <Button
                size="sm"
                variant="outline"
                disabled={isUploading}
                asChild
              >
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                </span>
              </Button>
            </label>
          </Can>
          {file && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadFile(file.path, file.name)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteFile(file.path)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (groupsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading document groups...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Templates</CardTitle>
        <CardDescription>
          Upload DOCX templates for each document type. Templates are managed in Workspace Setup &gt; Document Groups.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No document groups found. Add document groups in Workspace Setup to get started.
          </div>
        ) : (
          groups.map(group => renderTemplateRow(group))
        )}
      </CardContent>
    </Card>
  );
}
