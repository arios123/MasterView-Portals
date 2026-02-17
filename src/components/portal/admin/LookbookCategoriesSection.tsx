import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  fetchLookbookCategories,
  createLookbookCategory,
  updateLookbookCategory,
  deleteLookbookCategory,
  updateLookbookCategoryOrders,
  LookbookCategory,
} from '@/queries/lookbookCategories';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';

interface SortableLookbookCategoryProps {
  category: LookbookCategory;
  onUpdate: (id: string, updates: { name?: string }) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

function SortableLookbookCategory({ category, onUpdate, onDelete, canEdit }: SortableLookbookCategoryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (category.isDefault) {
      // Cannot edit default category
      setEditedName(category.name);
      setIsEditing(false);
      return;
    }
    
    if (editedName.trim() && editedName !== category.name) {
      onUpdate(category.id, { name: editedName.trim() });
    } else {
      setEditedName(category.name);
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
      
      {isEditing && !category.isDefault ? (
        <Input
          autoFocus
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              setEditedName(category.name);
              setIsEditing(false);
            }
          }}
          className="flex-1"
        />
      ) : (
        <div
          className={`flex-1 flex items-center gap-2 ${canEdit && !category.isDefault ? 'cursor-pointer hover:text-primary' : ''}`}
          onClick={() => canEdit && !category.isDefault && setIsEditing(true)}
        >
          <span>{category.name}</span>
          {category.isDefault && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Required
            </span>
          )}
        </div>
      )}
      
      {canEdit && !category.isDefault && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(category.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}

interface LookbookCategoriesSectionProps {
  isCollapsible?: boolean;
  isOpen?: boolean;
}

export function LookbookCategoriesSection({ isCollapsible = false, isOpen = true }: LookbookCategoriesSectionProps = {}) {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('component.adminworkspacesetup_lookbookcategories.view');
  const canEdit = can('component.adminworkspacesetup_lookbookcategories.edit');
  const canEditEnabled = canView && canEdit;
  
  const [categories, setCategories] = useState<LookbookCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadCategories();
    }
  }, [currentWorkspace?.id]);

  const loadCategories = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const data = await fetchLookbookCategories(currentWorkspace.id);
      setCategories(data);
    } catch (error) {
      console.error('Error loading lookbook categories:', error);
      toast.error('Failed to load lookbook categories');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !currentWorkspace?.id || !user?.id) return;
    
    // Check for duplicate names
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error('A category with this name already exists');
      return;
    }
    
    setLoading(true);
    try {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.displayOrder)) : -1;
      await createLookbookCategory(
        currentWorkspace.id,
        newCategoryName.trim(),
        maxOrder + 1,
        user.id
      );
      await loadCategories();
      setNewCategoryName('');
      toast.success('Lookbook category created');
    } catch (error: any) {
      console.error('Error creating lookbook category:', error);
      toast.error(error.message || 'Failed to create lookbook category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (id: string, updates: { name?: string }) => {
    if (!currentWorkspace?.id || !user?.id) return;
    
    const category = categories.find(c => c.id === id);
    if (category?.isDefault) {
      toast.error('Cannot modify the default "Other" category');
      return;
    }
    
    try {
      await updateLookbookCategory(id, currentWorkspace.id, updates, user.id);
      await loadCategories();
      toast.success('Lookbook category updated');
    } catch (error: any) {
      console.error('Error updating lookbook category:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error('A category with this name already exists');
      } else {
        toast.error('Failed to update lookbook category');
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    if (category.isDefault) {
      toast.error('"Other" is a required category and cannot be deleted');
      return;
    }
    setCategoryToDelete({ id: category.id, name: category.name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete || !currentWorkspace?.id) return;
    
    try {
      await deleteLookbookCategory(categoryToDelete.id, currentWorkspace.id);
      await loadCategories();
      toast.success('Lookbook category deleted');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error('Error deleting lookbook category:', error);
      if (error.message?.includes('default')) {
        toast.error('Cannot delete the default "Other" category');
      } else {
        toast.error('Failed to delete lookbook category');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    
    // Update display_order in database
    try {
      const updates = reordered.map((category, index) => ({
        id: category.id,
        display_order: index,
      }));
      
      if (currentWorkspace?.id && user?.id) {
        await updateLookbookCategoryOrders(updates, currentWorkspace.id, user.id);
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Failed to reorder categories');
      await loadCategories(); // Reload to reset
    }
  };

  const cardContent = (
    <CardContent className="space-y-4">
        <Can permission="tab.admin_workspacesetup.edit">
          <div className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button onClick={handleAddCategory} disabled={loading || !newCategoryName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </Can>

        <div className="space-y-2">
          {categories.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <SortableLookbookCategory
                      category={category}
                      onUpdate={handleUpdateCategory}
                      onDelete={handleDeleteClick}
                      canEdit={canEditEnabled}
                    />
                    <AccountabilityInfo
                      created_by={category.createdBy}
                      created_at={category.createdAt}
                      updated_by={category.updatedBy}
                      updated_at={category.updatedAt}
                    />
                  </div>
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No categories yet. Add one to get started.
            </div>
          )}
        </div>
      {/* </CardContent> */}

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Lookbook Category"
        description={
          categoryToDelete
            ? `Are you sure you want to delete "${categoryToDelete.name}"? Lookbook items with this category will appear under "Other". This action cannot be undone.`
            : ''
        }
      />
    </CardContent>
  );

  if (isCollapsible) {
    return (
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>Lookbook Categories</CardTitle>
                <CardDescription>
                  Manage the categories available for lookbook items in your workspace. 
                  "Other" is a required category and cannot be deleted or renamed.
                </CardDescription>
              </div>
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
        <CardTitle>Lookbook Categories</CardTitle>
        <CardDescription>
          Manage the categories available for lookbook items in your workspace. 
          "Other" is a required category and cannot be deleted or renamed.
        </CardDescription>
      </CardHeader>
      {cardContent}
    </Card>
  );
}

