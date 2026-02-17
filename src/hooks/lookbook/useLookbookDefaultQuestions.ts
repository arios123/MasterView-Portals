import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LookbookDefaultQuestion } from '@/types/lookbook';
import {
  fetchLookbookDefaultQuestions,
  createLookbookDefaultQuestion,
  updateLookbookDefaultQuestion,
  deleteLookbookDefaultQuestion,
  updateLookbookDefaultQuestionOrders,
} from '@/queries/lookbookDefaultQuestions';

interface UseLookbookDefaultQuestionsProps {
  workspaceId: string | undefined;
}

export function useLookbookDefaultQuestions({
  workspaceId,
}: UseLookbookDefaultQuestionsProps) {
  const [questions, setQuestions] = useState<LookbookDefaultQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load default questions for this workspace
  useEffect(() => {
    const loadQuestions = async () => {
      if (!workspaceId) {
        setQuestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await fetchLookbookDefaultQuestions(workspaceId);
        setQuestions(data);
      } catch (error) {
        console.error('Error loading default questions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load default questions',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [workspaceId, toast]);

  const addQuestion = async (label: string, isLong: boolean = false) => {
    if (!workspaceId || !user) {
      toast({
        title: 'Error',
        description: 'Cannot add question: missing required information',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Get the maximum display_order for this workspace
      const maxOrder = questions.length > 0
        ? Math.max(...questions.map(q => q.display_order))
        : -1;

      const newQuestion = await createLookbookDefaultQuestion(
        workspaceId,
        label.trim(),
        isLong,
        maxOrder + 1,
        user.id
      );

      setQuestions((prev) => [...prev, newQuestion].sort((a, b) => a.display_order - b.display_order));
      return true;
    } catch (error: any) {
      console.error('Error adding default question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add default question',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateQuestion = async (questionId: string, updates: { label?: string; is_long?: boolean }) => {
    if (!workspaceId || !user) {
      toast({
        title: 'Error',
        description: 'Cannot update question: missing required information',
        variant: 'destructive',
      });
      return false;
    }

    try {
      await updateLookbookDefaultQuestion(questionId, workspaceId, updates, user.id);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
      );
      return true;
    } catch (error: any) {
      console.error('Error updating default question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update default question',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!workspaceId) {
      toast({
        title: 'Error',
        description: 'Cannot delete question: missing workspace',
        variant: 'destructive',
      });
      return false;
    }

    try {
      await deleteLookbookDefaultQuestion(questionId, workspaceId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      return true;
    } catch (error: any) {
      console.error('Error deleting default question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete default question',
        variant: 'destructive',
      });
      return false;
    }
  };

  const reorderQuestions = async (questionIds: string[]) => {
    if (!workspaceId || !user) {
      return false;
    }

    try {
      const orders = questionIds.map((id, index) => ({ id, display_order: index }));
      await updateLookbookDefaultQuestionOrders(workspaceId, orders, user.id);

      // Update local state
      const questionMap = new Map(questions.map(q => [q.id, q]));
      const reordered = questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is LookbookDefaultQuestion => q !== undefined);
      setQuestions(reordered);

      return true;
    } catch (error: any) {
      console.error('Error reordering default questions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder questions',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    questions,
    isLoading,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    refetch: async () => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        const data = await fetchLookbookDefaultQuestions(workspaceId);
        setQuestions(data);
      } catch (error) {
        console.error('Error refetching default questions:', error);
      } finally {
        setIsLoading(false);
      }
    },
  };
}

