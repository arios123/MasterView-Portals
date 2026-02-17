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
  fetchDocumentGroups,
  createDocumentGroup,
  updateDocumentGroup,
  deleteDocumentGroup,
  updateDocumentGroupOrders,
  checkDocumentGroupHasTemplates,
  generateSlug,
} from '@/queries/documentGroups';
import { supabase } from '@/integrations/supabase/client';
import { DocumentGroup } from '@/stores/adminStore';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';

interface SortableDocumentGroupProps {
  group: DocumentGroup;
  onUpdate: (id: string, updates: { name?: string; slug?: string }) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

function SortableDocumentGroup({ group, onUpdate, onDelete, canEdit }: SortableDocumentGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  const [editedSlug, setEditedSlug] = useState(group.slug);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id, disabled: !canEdit || isEditing });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editedName.trim() && (editedName !== group.name || editedSlug !== group.slug)) {
      onUpdate(group.id, { name: editedName.trim(), slug: editedSlug.trim() });
    } else {
      setEditedName(group.name);
      setEditedSlug(group.slug);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(group.name);
    setEditedSlug(group.slug);
    setIsEditing(false);
  };

  const handleNameChange = (value: string) => {
    setEditedName(value);
    // Auto-generate slug from name
    setEditedSlug(generateSlug(value));
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
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            className="flex-1"
            placeholder="Document type name"
          />
          <Input
            value={editedSlug}
            onChange={(e) => setEditedSlug(e.target.value)}
            className="flex-1 max-w-xs"
            placeholder="slug-identifier"
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
            <div className="font-medium">{group.name}</div>
          </div>
          <AccountabilityInfo
            created_by={group.createdBy}
            created_at={group.createdAt}
            updated_by={group.updatedBy}
            updated_at={group.updatedAt}
          />
          {canEdit && (
            <div className="flex gap-2">
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
                onClick={() => onDelete(group.id)}
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

export function DocumentGroupsSection() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('component.adminworkspacesetup_documentgroups.view');
  const canEdit = can('component.adminworkspacesetup_documentgroups.edit');
  const canEditEnabled = canView && canEdit;
  
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string; templateCount: number } | null>(null);
  const [checkingTemplates, setCheckingTemplates] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadGroups();
    }
  }, [currentWorkspace?.id]);

  const loadGroups = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const data = await fetchDocumentGroups(currentWorkspace.id);
      setGroups(data);
    } catch (error) {
      console.error('Error loading document groups:', error);
      toast.error('Failed to load document groups');
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !currentWorkspace?.id || !user?.id) return;
    
    setLoading(true);
    try {
      const slug = generateSlug(newGroupName.trim());
      
      // Check if slug already exists
      const existingGroup = groups.find(g => g.slug === slug);
      if (existingGroup) {
        toast.error('A document group with this name already exists');
        setLoading(false);
        return;
      }

      const maxOrder = groups.length > 0 ? Math.max(...groups.map(g => g.displayOrder)) : -1;
      await createDocumentGroup(
        currentWorkspace.id,
        newGroupName.trim(),
        slug,
        maxOrder + 1,
        user.id
      );
      await loadGroups();
      setNewGroupName('');
      toast.success('Document group created');
    } catch (error: any) {
      console.error('Error creating document group:', error);
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        toast.error('A document group with this name or slug already exists');
      } else {
        toast.error(error.message || 'Failed to create document group');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (id: string, updates: { name?: string; slug?: string }) => {
    if (!currentWorkspace?.id || !user?.id) return;
    
    try {
      await updateDocumentGroup(id, currentWorkspace.id, updates, user.id);
      await loadGroups();
      toast.success('Document group updated');
    } catch (error: any) {
      console.error('Error updating document group:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error('A document group with this name or slug already exists');
      } else {
        toast.error('Failed to update document group');
      }
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!currentWorkspace?.id) return;
    
    setCheckingTemplates(true);
    try {
      // Check if group has templates
      const hasTemplates = await checkDocumentGroupHasTemplates(id, currentWorkspace.id);
      
      if (hasTemplates) {
        // Get template count for display
        const group = groups.find(g => g.id === id);
        if (group) {
          // List files to get count
          const { data: files } = await supabase.storage
            .from('contract_templates')
            .list(`${currentWorkspace.id}/${group.slug}`);
          
          const templateCount = files?.length || 0;
          setGroupToDelete({ id, name: group.name, templateCount });
          setDeleteDialogOpen(true);
        }
      } else {
        // No templates, proceed with deletion
        await deleteDocumentGroup(id, currentWorkspace.id);
        await loadGroups();
        toast.success('Document group deleted');
      }
    } catch (error: any) {
      console.error('Error checking templates:', error);
      if (error.message?.includes('not found')) {
        toast.error('Document group not found');
      } else {
        toast.error('Failed to check templates');
      }
    } finally {
      setCheckingTemplates(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete || !currentWorkspace?.id) return;

    try {
      // Delete the group (templates will remain in storage but won't be accessible)
      await deleteDocumentGroup(groupToDelete.id, currentWorkspace.id);
      await loadGroups();
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      toast.success('Document group deleted. Template files remain in storage.');
    } catch (error: any) {
      console.error('Error deleting document group:', error);
      toast.error('Failed to delete document group');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !currentWorkspace?.id || !user?.id) return;
    
    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    
    const reordered = arrayMove(groups, oldIndex, newIndex);
    setGroups(reordered);
    
    // Update display_order in database
    try {
      const updates = reordered.map((group, index) => ({
        id: group.id,
        display_order: index,
      }));
      
      await updateDocumentGroupOrders(updates, currentWorkspace.id, user.id);
    } catch (error) {
      console.error('Error reordering groups:', error);
      toast.error('Failed to reorder groups');
      await loadGroups(); // Reload to reset
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Document Groups</CardTitle>
          <CardDescription>
            Manage document template types for your workspace. Each group represents a type of document template that can be uploaded and used for document generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Can permission="tab.admin_workspacesetup.edit">
            <div className="flex gap-2">
              <Input
                placeholder="New document type name (e.g., Invoice, Proposal)..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
              />
              <Button onClick={handleAddGroup} disabled={loading || !newGroupName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </Can>

          <div className="space-y-2">
            {groups.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={groups.map(g => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {groups.map((group) => (
                    <SortableDocumentGroup
                      key={group.id}
                      group={group}
                      onUpdate={handleUpdateGroup}
                      onDelete={handleDeleteClick}
                      canEdit={canEditEnabled}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No document groups yet. Add one to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Document Group"
        description={
          groupToDelete
            ? `Are you sure you want to delete "${groupToDelete.name}"? This will also delete ${groupToDelete.templateCount} template file(s) associated with this group. This action cannot be undone.`
            : ''
        }
      />
    </>
  );
}

