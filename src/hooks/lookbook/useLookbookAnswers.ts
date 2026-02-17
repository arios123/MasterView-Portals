import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LookbookAnswers } from '@/types/lookbook';
import { logInsert, logUpdate } from '@/lib/auditLog';

interface UseLookbookAnswersProps {
  projectId: string;
  workspaceId: string | undefined;
  questionIds: string[]; // Array of question IDs to load answers for
  autoSaveDelay?: number;
}

export function useLookbookAnswers({
  projectId,
  workspaceId,
  questionIds,
  autoSaveDelay = 1000,
}: UseLookbookAnswersProps) {
  const [answers, setAnswers] = useState<LookbookAnswers>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load answers for this project
  useEffect(() => {
    const loadAnswers = async () => {
      if (!projectId || !workspaceId || questionIds.length === 0) {
        setAnswers({});
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('lookbook_answers')
          .select('question_id, answer_text')
          .eq('project_id', projectId)
          .eq('workspace_id', workspaceId)
          .in('question_id', questionIds);

        if (error) {
          console.error('Error loading lookbook answers:', error);
          return;
        }

        // Convert array to Record<question_id, answer_text>
        const answersMap: LookbookAnswers = {};
        (data || []).forEach((answer: { question_id: string; answer_text: string }) => {
          answersMap[answer.question_id] = answer.answer_text;
        });
        setAnswers(answersMap);
      } catch (error) {
        console.error('Error loading lookbook answers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnswers();
  }, [projectId, workspaceId, JSON.stringify(questionIds)]); // Use JSON.stringify to avoid infinite loops

  // Auto-save answers when they change
  useEffect(() => {
    if (!projectId || !workspaceId || !user || Object.keys(answers).length === 0) return;

    const timeoutId = setTimeout(async () => {
      await saveAnswers();
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [answers, projectId, workspaceId, autoSaveDelay, user]);

  const saveAnswers = async () => {
    if (!projectId || !workspaceId || !user) {
      console.error('Cannot save answers: projectId, workspaceId, or user is missing');
      return false;
    }

    try {
      // Fetch existing answers to determine if this is insert or update
      const { data: existingAnswers } = await (supabase as any)
        .from('lookbook_answers')
        .select('question_id, answer_text')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .in('question_id', Object.keys(answers));

      const existingMap = new Map(
        (existingAnswers || []).map((a: any) => [a.question_id, a.answer_text])
      );

      // Upsert each answer and log audit events
      const upserts = await Promise.all(
        Object.entries(answers).map(async ([questionId, answerText]) => {
          const isUpdate = existingMap.has(questionId);
          const beforeText = existingMap.get(questionId) || '';

          // Fetch before data for updates
          let beforeData = null;
          if (isUpdate) {
            const { data } = await (supabase as any)
              .from('lookbook_answers')
              .select('*')
              .eq('question_id', questionId)
              .eq('project_id', projectId)
              .eq('workspace_id', workspaceId)
              .maybeSingle();
            beforeData = data;
          }

          const result = await (supabase as any)
            .from('lookbook_answers')
            .upsert(
              {
                question_id: questionId,
                project_id: projectId,
                workspace_id: workspaceId,
                answer_text: answerText || '',
                updated_by: user.id,
              },
              { onConflict: 'question_id,project_id' }
            )
            .select()
            .single();

          // Log audit event
          if (result.data) {
            if (isUpdate && beforeData && beforeText !== answerText) {
              // Only log if answer actually changed
              await logUpdate(workspaceId, user.id, 'lookbook_answers', result.data.id || questionId, beforeData, result.data, 'LookBook');
            } else if (!isUpdate) {
              await logInsert(workspaceId, user.id, 'lookbook_answers', result.data.id || questionId, result.data, 'LookBook');
            }
          }

          return result;
        })
      );

      return true;
    } catch (error) {
      console.error('Error saving lookbook answers:', error);
      toast({
        title: 'Error',
        description: 'Failed to save answers',
        variant: 'destructive',
      });
      return false;
    }
  };

  const clearAnswers = async () => {
    if (!projectId || !workspaceId) return false;

    try {
      const { error } = await (supabase as any)
        .from('lookbook_answers')
        .delete()
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error clearing answers:', error);
        toast({
          title: 'Error',
          description: 'Failed to clear answers',
          variant: 'destructive',
        });
        return false;
      }

      setAnswers({});
      return true;
    } catch (error) {
      console.error('Error clearing answers:', error);
      return false;
    }
  };

  return {
    answers,
    setAnswers,
    isLoading,
    saveAnswers,
    clearAnswers,
  };
}

