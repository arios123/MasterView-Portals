import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  fetchPackageGroups,
  createPackageGroup,
  updatePackageGroup,
  deletePackageGroup,
  updatePackageGroupOrders,
} from '@/queries/packageGroups';
import { PackageGroup } from '@/stores/adminStore';

interface SortablePackageGroupProps {
  group: PackageGroup;
  onUpdate: (id: string, updates: { name?: string }) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

function SortablePackageGroup({ group, onUpdate, onDelete, canEdit }: SortablePackageGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editedName.trim() && editedName !== group.name) {
      onUpdate(group.id, { name: editedName.trim() });
    } else {
      setEditedName(group.name);
    }
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-background border rounded">
      {canEdit && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      {isEditing ? (
        <Input
          autoFocus
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              setEditedName(group.name);
              setIsEditing(false);
            }
          }}
          className="flex-1"
        />
      ) : (
        <div
          className={`flex-1 ${canEdit ? 'cursor-pointer hover:text-primary' : ''}`}
          onClick={() => canEdit && setIsEditing(true)}
        >
          {group.name}
        </div>
      )}
      
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(group.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}

interface PackageGroupsSectionProps {
  isCollapsible?: boolean;
  isOpen?: boolean;
}

export function PackageGroupsSection({ isCollapsible = false, isOpen = true }: PackageGroupsSectionProps = {}) {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('component.adminworkspacesetup_packagegroups.view');
  const canEdit = can('component.adminworkspacesetup_packagegroups.edit');
  const canEditEnabled = canView && canEdit;
  
  const [groups, setGroups] = useState<PackageGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);

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
      const data = await fetchPackageGroups(currentWorkspace.id);
      setGroups(data);
    } catch (error) {
      console.error('Error loading package groups:', error);
      toast.error('Failed to load package groups');
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !currentWorkspace?.id || !user?.id) return;
    
    setLoading(true);
    try {
      const maxOrder = groups.length > 0 ? Math.max(...groups.map(g => g.displayOrder)) : -1;
      await createPackageGroup(
        currentWorkspace.id,
        newGroupName.trim(),
        maxOrder + 1,
        user.id
      );
      await loadGroups();
      setNewGroupName('');
      toast.success('Package group created');
    } catch (error: any) {
      console.error('Error creating package group:', error);
      toast.error(error.message || 'Failed to create package group');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (id: string, updates: { name?: string }) => {
    if (!currentWorkspace?.id || !user?.id) return;
    
    try {
      await updatePackageGroup(id, currentWorkspace.id, updates, user.id);
      await loadGroups();
      toast.success('Package group updated');
    } catch (error: any) {
      console.error('Error updating package group:', error);
      if (error.message?.includes('duplicate key')) {
        toast.error('A package group with this name already exists');
      } else {
        toast.error('Failed to update package group');
      }
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!currentWorkspace?.id) return;
    
    try {
      await deletePackageGroup(id, currentWorkspace.id);
      await loadGroups();
      toast.success('Package group deleted');
    } catch (error: any) {
      console.error('Error deleting package group:', error);
      if (error.message?.includes('foreign key')) {
        toast.error('Cannot delete: packages are using this group');
      } else {
        toast.error('Failed to delete package group');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
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
      
      if (currentWorkspace?.id && user?.id) {
        await updatePackageGroupOrders(updates, currentWorkspace.id, user.id);
      }
    } catch (error) {
      console.error('Error reordering groups:', error);
      toast.error('Failed to reorder groups');
      await loadGroups(); // Reload to reset
    }
  };

  const cardContent = (
    <CardContent className="space-y-4">
        <Can permission="tab.admin_workspacesetup.edit">
          <div className="flex gap-2">
            <Input
              placeholder="New package group name..."
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
                  <SortablePackageGroup
                    key={group.id}
                    group={group}
                    onUpdate={handleUpdateGroup}
                    onDelete={handleDeleteGroup}
                    canEdit={canEditEnabled}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No package groups yet. Add one to get started.
            </div>
          )}
        </div>
    </CardContent>
  );

  if (isCollapsible) {
    return (
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle>Package Groups</CardTitle>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "transform rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {cardContent}
        </CollapsibleContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Groups</CardTitle>
      </CardHeader>
      {cardContent}
    </Card>
  );
}

