import { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLookbookDefaultQuestions } from '@/hooks/lookbook/useLookbookDefaultQuestions';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';

interface SortableQuestionProps {
  question: any;
  onUpdate: (id: string, updates: { label?: string; is_long?: boolean }) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

function SortableQuestion({ question, onUpdate, onDelete, canEdit }: SortableQuestionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(question.label);
  const [editedIsLong, setEditedIsLong] = useState(question.is_long);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: !canEdit });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editedLabel.trim() && (editedLabel !== question.label || editedIsLong !== question.is_long)) {
      onUpdate(question.id, { label: editedLabel.trim(), is_long: editedIsLong });
    } else {
      setEditedLabel(question.label);
      setEditedIsLong(question.is_long);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedLabel(question.label);
    setEditedIsLong(question.is_long);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-background border rounded">
      {canEdit && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      {isEditing && canEdit ? (
        <div className="flex-1 space-y-2">
          <Input
            autoFocus
            value={editedLabel}
            onChange={(e) => setEditedLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            className="flex-1"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`is-long-${question.id}`}
              checked={editedIsLong}
              onChange={(e) => setEditedIsLong(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={`is-long-${question.id}`} className="text-sm font-normal cursor-pointer">
              Multi-line textarea
            </Label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 flex items-center gap-2 ${canEdit ? 'cursor-pointer hover:text-primary' : ''}`}
          onClick={() => canEdit && setIsEditing(true)}
        >
          <span>{question.label}</span>
          {question.is_long && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Multi-line
            </span>
          )}
        </div>
      )}
      
      {canEdit && !isEditing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(question.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}

interface LookbookDefaultQuestionsSectionProps {
  isCollapsible?: boolean;
  isOpen?: boolean;
}

export function LookbookDefaultQuestionsSection({ isCollapsible = false, isOpen = true }: LookbookDefaultQuestionsSectionProps = {}) {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('component.adminworkspacesetup_lookbookdefaultquestions.view');
  const canEdit = can('component.adminworkspacesetup_lookbookdefaultquestions.edit');
  const canEditEnabled = canView && canEdit;

  const {
    questions,
    isLoading,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
  } = useLookbookDefaultQuestions({
    workspaceId: currentWorkspace?.id,
  });

  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionIsLong, setNewQuestionIsLong] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; label: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddQuestion = async () => {
    if (!newQuestionLabel.trim()) return;

    const success = await addQuestion(newQuestionLabel.trim(), newQuestionIsLong);
    if (success) {
      setShowAddDialog(false);
      setNewQuestionLabel('');
      setNewQuestionIsLong(false);
      toast.success('Default question added');
    }
  };

  const handleUpdateQuestion = async (id: string, updates: { label?: string; is_long?: boolean }) => {
    const success = await updateQuestion(id, updates);
    if (success) {
      toast.success('Default question updated');
    }
  };

  const handleDeleteClick = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;
    setQuestionToDelete({ id: question.id, label: question.label });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;

    const success = await deleteQuestion(questionToDelete.id);
    if (success) {
      toast.success('Default question deleted');
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    const reordered = arrayMove(questions, oldIndex, newIndex);
    const questionIds = reordered.map((q) => q.id);

    // Update display_order in database
    const success = await reorderQuestions(questionIds);
    if (!success) {
      // Reload on error to reset
      window.location.reload();
    }
  };

  if (!canView) {
    return null;
  }

  const cardContent = (
    <CardContent className="space-y-4">
      {canEditEnabled && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Default Question
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading...</div>
      ) : questions.length > 0 ? (
        canEditEnabled ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {questions.map((question) => (
                  <div key={question.id} className="flex items-center gap-2">
                    <SortableQuestion
                      question={question}
                      onUpdate={handleUpdateQuestion}
                      onDelete={handleDeleteClick}
                      canEdit={canEditEnabled}
                    />
                    <AccountabilityInfo
                      created_by={question.created_by}
                      created_at={question.created_at}
                      updated_by={question.updated_by}
                      updated_at={question.updated_at}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-2">
            {questions.map((question) => (
              <div key={question.id} className="flex items-center gap-2">
                <SortableQuestion
                  question={question}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteClick}
                  canEdit={false}
                />
                <AccountabilityInfo
                  created_by={question.created_by}
                  created_at={question.created_at}
                  updated_by={question.updated_by}
                  updated_at={question.updated_at}
                />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No default questions yet. Add questions that will automatically appear for new projects.
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Default Question"
        description={
          questionToDelete
            ? `Are you sure you want to delete "${questionToDelete.label}"? This will not affect existing projects, but new projects will no longer get this question by default.`
            : ''
        }
      />

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Default Question</DialogTitle>
            <DialogDescription>
              Add a default question that will automatically appear for all new projects. Questions can be short (single line) or long (multi-line textarea).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-question-label">Question Label</Label>
              <Input
                id="new-question-label"
                value={newQuestionLabel}
                onChange={(e) => setNewQuestionLabel(e.target.value)}
                placeholder="e.g., Budget, Timeline, Style..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="new-question-is-long"
                checked={newQuestionIsLong}
                onChange={(e) => setNewQuestionIsLong(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="new-question-is-long" className="text-sm font-normal cursor-pointer">
                Use multi-line textarea (for longer answers)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddQuestion} disabled={!newQuestionLabel.trim()}>
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  );

  if (isCollapsible) {
    return (
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>Lookbook Default Questions</CardTitle>
                <CardDescription>
                  Manage default questions that automatically appear for new projects. These questions can be removed or customized per project.
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
        <CardTitle>Lookbook Default Questions</CardTitle>
        <CardDescription>
          Manage default questions that automatically appear for new projects. These questions can be removed or customized per project.
        </CardDescription>
      </CardHeader>
      {cardContent}
    </Card>
  );
}

