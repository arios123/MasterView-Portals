import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LookbookQuestion } from '@/types/lookbook';
import { logInsert, logDelete } from '@/lib/auditLog';

interface UseLookbookQuestionsManagementProps {
  projectId: string;
  workspaceId: string | undefined;
}

export function useLookbookQuestionsManagement({
  projectId,
  workspaceId,
}: UseLookbookQuestionsManagementProps) {
  const [questions, setQuestions] = useState<LookbookQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load questions for this project
  useEffect(() => {
    const loadQuestions = async () => {
      if (!projectId || !workspaceId) {
        setQuestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('lookbook_questions')
          .select('*')
          .eq('project_id', projectId)
          .eq('workspace_id', workspaceId)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error loading lookbook questions:', error);
          toast({
            title: 'Error',
            description: 'Failed to load questions',
            variant: 'destructive',
          });
          return;
        }

        setQuestions(data || []);
      } catch (error) {
        console.error('Error loading lookbook questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [projectId, workspaceId, toast]);

  const addQuestion = async (label: string, isLong: boolean = false) => {
    if (!projectId || !workspaceId || !user) {
      toast({
        title: 'Error',
        description: 'Cannot add question: missing required information',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Get the maximum display_order for this project
      const { data: existingQuestions } = await (supabase as any)
        .from('lookbook_questions')
        .select('display_order')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextDisplayOrder = existingQuestions && existingQuestions.length > 0
        ? existingQuestions[0].display_order + 1
        : 0;

      const { data, error } = await (supabase as any)
        .from('lookbook_questions')
        .insert({
          workspace_id: workspaceId,
          project_id: projectId,
          label,
          is_long: isLong,
          display_order: nextDisplayOrder,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding question:', error);
        toast({
          title: 'Error',
          description: 'Failed to add question',
          variant: 'destructive',
        });
        return false;
      }

      setQuestions((prev) => [...prev, data].sort((a, b) => a.display_order - b.display_order));

      // Log audit event for lookbook question creation
      if (workspaceId && user && data) {
        await logInsert(workspaceId, user.id, 'lookbook_questions', data.id, data, 'LookBook');
      }

      return true;
    } catch (error) {
      console.error('Error adding question:', error);
      return false;
    }
  };

  const updateQuestion = async (questionId: string, updates: { label?: string; is_long?: boolean; display_order?: number }) => {
    if (!workspaceId || !user) {
      toast({
        title: 'Error',
        description: 'Cannot update question: missing required information',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await (supabase as any)
        .from('lookbook_questions')
        .update({
          ...updates,
          updated_by: user.id,
        })
        .eq('id', questionId)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error updating question:', error);
        toast({
          title: 'Error',
          description: 'Failed to update question',
          variant: 'destructive',
        });
        return false;
      }

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
          .sort((a, b) => a.display_order - b.display_order)
      );
      return true;
    } catch (error) {
      console.error('Error updating question:', error);
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
      // Fetch before data for audit log
      const { data: beforeData } = await (supabase as any)
        .from('lookbook_questions')
        .select('*')
        .eq('id', questionId)
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      const { error } = await (supabase as any)
        .from('lookbook_questions')
        .delete()
        .eq('id', questionId)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error deleting question:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete question',
          variant: 'destructive',
        });
        return false;
      }

      // Log audit event for lookbook question deletion
      if (workspaceId && user && beforeData) {
        await logDelete(workspaceId, user.id, 'lookbook_questions', questionId, beforeData, 'LookBook');
      }

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  };

  const reorderQuestions = async (questionIds: string[]) => {
    if (!workspaceId || !user) {
      return false;
    }

    try {
      // Update display_order for each question
      const updates = questionIds.map((id, index) =>
        (supabase as any)
          .from('lookbook_questions')
          .update({ display_order: index, updated_by: user.id })
          .eq('id', id)
          .eq('workspace_id', workspaceId)
      );

      await Promise.all(updates);

      // Reload questions to get updated order
      const { data, error } = await (supabase as any)
        .from('lookbook_questions')
        .select('*')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
      return true;
    } catch (error) {
      console.error('Error reordering questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder questions',
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
  };
}

