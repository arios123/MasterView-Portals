import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Folder, ChevronDown, ChevronRight, Download, FileIcon, Trash2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAttachmentFolders } from '@/hooks/useAttachmentFolders';
import { useAttachmentFolderPermissions } from '@/hooks/useAttachmentFolderPermissions';
import { logInsert, logDelete } from '@/lib/auditLog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AttachmentsTabProps {
  projectId: string;
  readOnly?: boolean;
}

export function AttachmentsTab({ projectId, readOnly = false }: AttachmentsTabProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { folders, loading: foldersLoading } = useAttachmentFolders();
  const { canViewFolder, canEditFolder, loading: permissionsLoading } = useAttachmentFolderPermissions();
  
  const [uploadingFolder, setUploadingFolder] = useState<string | null>(null);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<Record<string, any[]>>({});
  const [fileToDelete, setFileToDelete] = useState<{ folder: string; fileName: string } | null>(null);

  // Fetch folder files when a folder is expanded
  const fetchFolderFiles = async (folderSlug: string) => {
    if (!workspaceId) {
      console.error('Workspace ID not available');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('project-attachments')
        .list(`${workspaceId}/${projectId}/${folderSlug}`, {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;

      setFolderFiles(prev => ({
        ...prev,
        [folderSlug]: data || []
      }));
    } catch (error) {
      console.error('Error fetching folder files:', error);
      toast.error('Failed to load files');
    }
  };

  const handleFolderClick = async (folderSlug: string) => {
    if (expandedFolder === folderSlug) {
      setExpandedFolder(null);
    } else {
      setExpandedFolder(folderSlug);
      // Fetch files if not already loaded
      if (!folderFiles[folderSlug]) {
        await fetchFolderFiles(folderSlug);
      }
    }
  };

  const handleFileUpload = async (folderSlug: string, folderId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    // Check edit permission
    if (!canEditFolder(folderId)) {
      toast.error('You do not have permission to upload files to this folder');
      event.target.value = '';
      return;
    }

    setUploadingFolder(folderSlug);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const filePath = `${workspaceId}/${projectId}/${folderSlug}/${file.name}`;
        
        const { error } = await supabase.storage
          .from('project-attachments')
          .upload(filePath, file, {
            upsert: true
          });

        if (error) throw error;
        return file.name;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Log audit events for each uploaded file
      if (workspaceId && user && uploadedFiles.length > 0) {
        await Promise.all(
          uploadedFiles.map((fileName) => {
            const filePath = `${workspaceId}/${projectId}/${folderSlug}/${fileName}`;
            return logInsert(
              workspaceId,
              user.id,
              'project_documents',
              filePath, // Use file path as resource ID
              { file_path: filePath, project_id: projectId, folder_slug: folderSlug },
              'Attachments'
            );
          })
        );
      }
      
      toast.success(`Uploaded ${uploadedFiles.length} file(s)`);
      
      // Refresh the folder files
      await fetchFolderFiles(folderSlug);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(`Failed to upload: ${error.message}`);
    } finally {
      setUploadingFolder(null);
      // Reset input
      event.target.value = '';
    }
  };

  const handleFileDownload = async (folderSlug: string, fileName: string) => {
    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    try {
      const filePath = `${workspaceId}/${projectId}/${folderSlug}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('project-attachments')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${fileName}`);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(`Failed to download: ${error.message}`);
    }
  };

  const handleFileDelete = async () => {
    if (!fileToDelete) return;

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    // Find folder by slug to get ID for permission check
    const folder = folders.find(f => f.slug === fileToDelete.folder);
    if (folder && !canEditFolder(folder.id)) {
      toast.error('You do not have permission to delete files from this folder');
      setFileToDelete(null);
      return;
    }

    try {
      const filePath = `${workspaceId}/${projectId}/${fileToDelete.folder}/${fileToDelete.fileName}`;
      
      // Fetch before data for audit log (check if there's a database record)
      const { data: beforeData } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('file_path', filePath)
        .maybeSingle();
      
      const { error } = await supabase.storage
        .from('project-attachments')
        .remove([filePath]);

      if (error) throw error;

      // Log audit event for file deletion
      if (workspaceId && user) {
        const auditData = beforeData || { file_path: filePath, project_id: projectId, folder_slug: fileToDelete.folder };
        await logDelete(
          workspaceId,
          user.id,
          'project_documents',
          filePath, // Use file path as resource ID
          auditData,
          'Attachments'
        );
      }

      toast.success(`Deleted ${fileToDelete.fileName}`);
      
      // Refresh the folder files
      await fetchFolderFiles(fileToDelete.folder);
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(`Failed to delete: ${error.message}`);
    } finally {
      setFileToDelete(null);
    }
  };

  if (foldersLoading || permissionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading attachment folders...</div>
        </CardContent>
      </Card>
    );
  }

  // Filter folders by view permission
  const visibleFolders = folders.filter(folder => canViewFolder(folder.id));

  return (
    <div className="space-y-6">
      {/* Attachments List */}
      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleFolders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {folders.length === 0
                ? 'No attachment folders found. Add folders in Workspace Setup to get started.'
                : 'You do not have permission to view any attachment folders.'}
            </div>
          ) : (
            visibleFolders.map((folder) => {
              const canEdit = canEditFolder(folder.id);
              const isReadOnly = readOnly || !canEdit;
              
              return (
              <Collapsible
                key={folder.id}
                open={expandedFolder === folder.slug}
                onOpenChange={() => handleFolderClick(folder.slug)}
              >
                <div className="bg-card border rounded-lg">
                  <div className="flex justify-between items-center px-4 py-3 hover:bg-muted/50 transition">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                      {expandedFolder === folder.slug ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{folder.name}</span>
                      {!canEdit && (
                        <Lock className="h-3 w-3 text-muted-foreground" title="Read-only" />
                      )}
                      {folderFiles[folder.slug] && (
                        <span className="text-xs text-muted-foreground">
                          ({folderFiles[folder.slug].length} files)
                        </span>
                      )}
                    </CollapsibleTrigger>
                    
                    {!isReadOnly && (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleFileUpload(folder.slug, folder.id, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingFolder === folder.slug}
                          id={`upload-${folder.slug}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploadingFolder === folder.slug}
                          className="pointer-events-none"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingFolder === folder.slug ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <CollapsibleContent>
                    <div className="border-t px-4 py-2 bg-muted/20">
                      {folderFiles[folder.slug] && folderFiles[folder.slug].length > 0 ? (
                        <div className="space-y-1">
                          {folderFiles[folder.slug].map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded"
                            >
                              <div 
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                                onClick={() => handleFileDownload(folder.slug, file.name)}
                              >
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFileDownload(folder.slug, file.name)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                {!isReadOnly && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFileToDelete({ folder: folder.slug, fileName: file.name });
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No files uploaded yet
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.fileName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFileDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
