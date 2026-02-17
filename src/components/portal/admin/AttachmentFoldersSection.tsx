import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Edit2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Can } from '@/components/Can';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchAttachmentFolders,
  createAttachmentFolder,
  updateAttachmentFolder,
  deleteAttachmentFolder,
  updateAttachmentFolderOrders,
  checkAttachmentFolderHasFiles,
  generateSlug,
} from '@/queries/attachmentFolders';
import { supabase } from '@/integrations/supabase/client';
import { AttachmentFolder } from '@/stores/adminStore';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';
import { AttachmentFolderPermissionsDialog } from './AttachmentFolderPermissionsDialog';
import { Shield } from 'lucide-react';

interface SortableAttachmentFolderProps {
  folder: AttachmentFolder;
  onUpdate: (id: string, updates: { name?: string; slug?: string }) => void;
  onDelete: (id: string) => void;
  onPermissionsClick: (folder: { id: string; name: string }) => void;
  canEdit: boolean;
}

function SortableAttachmentFolder({ folder, onUpdate, onDelete, onPermissionsClick, canEdit }: SortableAttachmentFolderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(folder.name);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id, disabled: !canEdit || isEditing });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editedName.trim() && editedName !== folder.name) {
      // Only update name, slug will be auto-generated on the backend
      onUpdate(folder.id, { name: editedName.trim() });
    } else {
      setEditedName(folder.name);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(folder.name);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-background border rounded">
      {canEdit && !isEditing && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            autoFocus
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            className="flex-1"
            placeholder="Folder name"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div
            className={`flex-1 ${canEdit ? 'cursor-pointer hover:text-primary' : ''}`}
            onClick={() => canEdit && setIsEditing(true)}
          >
            <div className="font-medium">{folder.name}</div>
          </div>
          <AccountabilityInfo
            created_by={folder.createdBy}
            created_at={folder.createdAt}
            updated_by={folder.updatedBy}
            updated_at={folder.updatedAt}
          />
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPermissionsClick({ id: folder.id, name: folder.name })}
                className="h-8 w-8 p-0"
                title="Manage permissions"
              >
                <Shield className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(folder.id)}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function AttachmentFoldersSection() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('component.adminworkspacesetup_attachmentfolders.view');
  const canEdit = can('component.adminworkspacesetup_attachmentfolders.edit');
  const canEditEnabled = canView && canEdit;
  
  const [folders, setFolders] = useState<AttachmentFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string; fileCount: number } | null>(null);
  const [checkingFiles, setCheckingFiles] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedFolderForPermissions, setSelectedFolderForPermissions] = useState<{ id: string; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadFolders();
    }
  }, [currentWorkspace?.id]);

  const loadFolders = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const data = await fetchAttachmentFolders(currentWorkspace.id);
      setFolders(data);
    } catch (error) {
      console.error('Error loading attachment folders:', error);
      toast.error('Failed to load attachment folders');
    }
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !currentWorkspace?.id || !user?.id) return;
    
    setLoading(true);
    try {
      const slug = generateSlug(newFolderName.trim());
      
      // Check if slug already exists
      const existingFolder = folders.find(f => f.slug === slug);
      if (existingFolder) {
        toast.error('An attachment folder with this name already exists');
        setLoading(false);
        return;
      }

      const maxOrder = folders.length > 0 ? Math.max(...folders.map(f => f.displayOrder)) : -1;
      await createAttachmentFolder(
        currentWorkspace.id,
        newFolderName.trim(),
        slug,
        maxOrder + 1,
        user.id
      );
      await loadFolders();
      setNewFolderName('');
      toast.success('Attachment folder created');
    } catch (error: any) {
      console.error('Error creating attachment folder:', error);
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        toast.error('An attachment folder with this name or slug already exists');
      } else {
        toast.error(error.message || 'Failed to create attachment folder');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async (id: string, updates: { name?: string; slug?: string }) => {
    if (!currentWorkspace?.id || !user?.id) return;
    
    try {
      await updateAttachmentFolder(id, currentWorkspace.id, updates, user.id);
      await loadFolders();
      toast.success('Attachment folder updated');
    } catch (error: any) {
      console.error('Error updating attachment folder:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error('An attachment folder with this name or slug already exists');
      } else {
        toast.error('Failed to update attachment folder');
      }
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!currentWorkspace?.id) return;
    
    setCheckingFiles(true);
    try {
      // Check if folder has files
      const { hasFiles, fileCount } = await checkAttachmentFolderHasFiles(id, currentWorkspace.id);
      
      if (hasFiles) {
        // Show warning dialog
        const folder = folders.find(f => f.id === id);
        if (folder) {
          setFolderToDelete({ id, name: folder.name, fileCount });
          setDeleteDialogOpen(true);
        }
      } else {
        // No files, proceed with deletion
        await deleteAttachmentFolder(id, currentWorkspace.id);
        await loadFolders();
        toast.success('Attachment folder deleted');
      }
    } catch (error: any) {
      console.error('Error checking files:', error);
      if (error.message?.includes('not found')) {
        toast.error('Attachment folder not found');
      } else {
        toast.error('Failed to delete attachment folder');
      }
    } finally {
      setCheckingFiles(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!folderToDelete || !currentWorkspace?.id) return;

    try {
      // Delete the folder (files will remain in storage but won't be accessible)
      await deleteAttachmentFolder(folderToDelete.id, currentWorkspace.id);
      await loadFolders();
      setDeleteDialogOpen(false);
      setFolderToDelete(null);
      toast.success('Attachment folder deleted. Files remain in storage.');
    } catch (error: any) {
      console.error('Error deleting attachment folder:', error);
      toast.error('Failed to delete attachment folder');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !currentWorkspace?.id || !user?.id) return;
    
    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    
    const reordered = arrayMove(folders, oldIndex, newIndex);
    setFolders(reordered);
    
    // Update display_order in database
    try {
      const updates = reordered.map((folder, index) => ({
        id: folder.id,
        display_order: index,
      }));
      
      await updateAttachmentFolderOrders(updates, currentWorkspace.id, user.id);
    } catch (error) {
      console.error('Error reordering folders:', error);
      toast.error('Failed to reorder folders');
      await loadFolders(); // Reload to reset
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Attachment Folders</CardTitle>
          <CardDescription>
            Manage attachment folder types for your workspace. Each folder represents a category that can be used to organize project attachments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Can permission="tab.admin_workspacesetup.edit">
            <div className="flex gap-2">
              <Input
                placeholder="New folder name (e.g., Photos, Videos, Plans)..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
              />
              <Button onClick={handleAddFolder} disabled={loading || !newFolderName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </Can>

          <div className="space-y-2">
            {folders.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={folders.map(f => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {folders.map((folder) => (
                    <SortableAttachmentFolder
                      key={folder.id}
                      folder={folder}
                      onUpdate={handleUpdateFolder}
                      onDelete={handleDeleteClick}
                      onPermissionsClick={(folder) => {
                        setSelectedFolderForPermissions(folder);
                        setPermissionsDialogOpen(true);
                      }}
                      canEdit={canEditEnabled}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No attachment folders yet. Add one to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Attachment Folder"
        description={
          folderToDelete
            ? `Are you sure you want to delete "${folderToDelete.name}"? This folder contains ${folderToDelete.fileCount} file(s) across projects. Files will remain in storage but won't be accessible. This action cannot be undone.`
            : ''
        }
      />

      {selectedFolderForPermissions && (
        <AttachmentFolderPermissionsDialog
          open={permissionsDialogOpen}
          onOpenChange={(open) => {
            setPermissionsDialogOpen(open);
            if (!open) {
              setSelectedFolderForPermissions(null);
            }
          }}
          folderId={selectedFolderForPermissions.id}
          folderName={selectedFolderForPermissions.name}
          onPermissionsUpdated={() => {
            // Permissions updated - no need to reload folders, but could refresh if needed
          }}
        />
      )}
    </>
  );
}

