import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useLookbookQuestionsManagement } from '@/hooks/lookbook/useLookbookQuestionsManagement';
import { LookbookAnswers } from '@/types/lookbook';

interface QuestionFormFieldsProps {
  projectId: string;
  workspaceId: string | undefined;
  answers: LookbookAnswers;
  onAnswerChange: (questionId: string, value: string) => void;
  readOnly?: boolean;
  canAdd?: boolean;      // Permission to add new questions
  canDelete?: boolean;   // Permission to delete questions
}

export function QuestionFormFields({
  projectId,
  workspaceId,
  answers,
  onAnswerChange,
  readOnly = false,
  canAdd = false,
  canDelete = false,
}: QuestionFormFieldsProps) {
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionIsLong, setNewQuestionIsLong] = useState(false);

  const {
    questions,
    isLoading: questionsLoading,
    addQuestion,
    deleteQuestion,
  } = useLookbookQuestionsManagement({
    projectId,
    workspaceId,
  });

  const handleAddQuestion = async () => {
    if (!newQuestionLabel.trim()) return;

    const success = await addQuestion(newQuestionLabel.trim(), newQuestionIsLong);
    if (success) {
      setShowAddDialog(false);
      setNewQuestionLabel('');
      setNewQuestionIsLong(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    const success = await deleteQuestion(questionToDelete);
    if (success) {
      setQuestionToDelete(null);
    }
  };

  if (questionsLoading) {
    return <div className="text-muted-foreground">Loading questions...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add Question Button (requires specific add permission) */}
      {canAdd && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      )}

      {/* Questions Grid */}
      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          No questions yet. {canAdd && 'Click "Add Question" to get started.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((question) => (
            <div key={question.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={question.id} className="text-sm font-medium">
                  {question.label}
                </Label>
                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => setQuestionToDelete(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {question.is_long ? (
                <Textarea
                  id={question.id}
                  value={answers[question.id] || ''}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  className="mt-1"
                  disabled={readOnly}
                  placeholder={`Enter ${question.label.toLowerCase()}...`}
                />
              ) : (
                <Input
                  id={question.id}
                  value={answers[question.id] || ''}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  className="mt-1"
                  disabled={readOnly}
                  placeholder={`Enter ${question.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Question Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Add a new question for this project. Questions can be short (single line) or long (multi-line textarea).
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This will also delete all answers to this question for all projects.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuestionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
