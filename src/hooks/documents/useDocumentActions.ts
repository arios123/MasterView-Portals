import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDocumentActions(
  projectId: string,
  workspaceId: string | undefined,
  userId: string | undefined,
  refetch: () => void,
) {
  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('project-attachments').download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage.from('project-attachments').remove([filePath]);

      if (storageError) throw storageError;

      // Also delete from database
      let deleteQuery = supabase.from('project_documents').delete().eq('project_id', projectId).eq('file_path', filePath);
      if (workspaceId) {
        deleteQuery = deleteQuery.eq('workspace_id', workspaceId);
      }
      const { error: dbError } = await deleteQuery;

      if (dbError) {
        console.error('Error deleting document record:', dbError);
        // Don't fail if database delete fails
      }

      toast.success('File deleted successfully');
      refetch();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleSetActive = async (filePath: string, documentType: string) => {
    try {
      // First, deactivate all other documents of the same type for this project
      let deactivateQuery = supabase
        .from('project_documents')
        .update({
          is_active: false,
          updated_by: userId || null,
        })
        .eq('project_id', projectId)
        .eq('document_type', documentType)
        .eq('is_active', true);

      if (workspaceId) {
        deactivateQuery = deactivateQuery.eq('workspace_id', workspaceId);
      }

      const { error: deactivateError } = await deactivateQuery;

      if (deactivateError) {
        if (deactivateError.code === 'PGRST205' || deactivateError.message?.includes('Could not find the table')) {
          toast.error('Database migration required. Please run migration: 20251122210432_add_project_documents_active_status.sql');
          throw new Error('Table project_documents does not exist. Please run the migration.');
        } else {
          throw deactivateError;
        }
      }

      // Then, set this document as active (upsert to create if doesn't exist)
      const { error: activateError } = await supabase
        .from('project_documents')
        .upsert(
          {
            workspace_id: workspaceId,
            project_id: projectId,
            file_path: filePath,
            document_type: documentType,
            is_active: true,
            created_by: userId || null,
            updated_by: userId || null,
          },
          {
            onConflict: 'project_id,file_path',
          }
        );

      if (activateError) {
        if (activateError.code === 'PGRST205' || activateError.message?.includes('Could not find the table')) {
          toast.error('Database migration required. Please run migration: 20251122210432_add_project_documents_active_status.sql');
          throw new Error('Table project_documents does not exist. Please run the migration.');
        } else {
          throw activateError;
        }
      }

      toast.success('Document set as active');
      refetch();
    } catch (error: any) {
      console.error('Error setting document active:', error);
      toast.error('Failed to set document as active. Please run the migration first.');
    }
  };

  const handleDeactivate = async (filePath: string) => {
    try {
      let updateQuery = supabase
        .from('project_documents')
        .update({
          is_active: false,
          updated_by: userId || null,
        })
        .eq('project_id', projectId)
        .eq('file_path', filePath);

      if (workspaceId) {
        updateQuery = updateQuery.eq('workspace_id', workspaceId);
      }

      const { error } = await updateQuery;

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          toast.error('Database migration required. Please run migration: 20251122210432_add_project_documents_active_status.sql');
          throw new Error('Table project_documents does not exist. Please run the migration.');
        } else {
          throw error;
        }
      }

      toast.success('Document deactivated');
      refetch();
    } catch (error: any) {
      console.error('Error deactivating document:', error);
      toast.error('Failed to deactivate document. Please run the migration first.');
    }
  };

  return {
    handleDownload,
    handleDelete,
    handleSetActive,
    handleDeactivate,
  };
}

