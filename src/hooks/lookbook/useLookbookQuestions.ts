import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LookbookAnswers } from '@/types/lookbook';

interface UseLookbookQuestionsProps {
  projectId: string;
  workspaceId: string | undefined;
  autoSaveDelay?: number;
}

export function useLookbookQuestions({
  projectId,
  workspaceId,
  autoSaveDelay = 1000,
}: UseLookbookQuestionsProps) {
  const [answers, setAnswers] = useState<LookbookAnswers>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load lookbook questions from database
  useEffect(() => {
    const loadLookbook = async () => {
      if (!projectId || !workspaceId) return;

      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('lookbooks')
          .select('*')
          .eq('project_id', projectId)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (error) {
          console.error('Error loading lookbook:', error);
          return;
        }

        if (data) {
          setAnswers({
            budget: data.budget || '',
            timeline: data.timeline || '',
            mainGoal: data.main_goal || '',
            liveInHome: data.live_in_home_during_project || '',
            houseTypeAge: data.house_types_and_age || '',
            projectFloor: data.project_floor || '',
            foundation: data.foundation || '',
            hoa: data.hoa_rules || '',
            pastRenos: data.past_renos_issues || '',
            finishesColors: data.finishes_and_colors || '',
            changesWanted: data.changes_wanted || '',
            style: data.style || '',
            inspo: data.inspiration_links || '',
            useOfSpace: data.use_of_space || '',
            kidsPets: data.kids_pets_access || '',
            storageNeeds: data.storage_needs || '',
            stayDuration: data.length_of_stay || '',
            electrical: data.electrical_updates || '',
            gasType: data.gas_type || '',
            water: data.water_source || '',
            hvac: data.hvac_issues || '',
            workRestrictions: data.work_restirctions || '',
            permits: data.permits || '',
          });
        }
      } catch (error) {
        console.error('Error loading lookbook:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && workspaceId) {
      loadLookbook();
    }
  }, [projectId, workspaceId]);

  // Auto-save answers to database when they change
  useEffect(() => {
    if (!projectId || !workspaceId || Object.keys(answers).length === 0) return;

    const timeoutId = setTimeout(async () => {
      await saveLookbook();
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [answers, projectId, workspaceId, autoSaveDelay]);

  const saveLookbook = async () => {
    if (!projectId || !workspaceId) {
      console.error('Cannot save lookbook: projectId or workspaceId is missing');
      return false;
    }

    try {
      const { error } = await (supabase as any)
        .from('lookbooks')
        .upsert(
          {
            project_id: projectId,
            workspace_id: workspaceId,
            budget: answers.budget || '',
            timeline: answers.timeline || '',
            main_goal: answers.mainGoal || '',
            live_in_home_during_project: answers.liveInHome || '',
            house_types_and_age: answers.houseTypeAge || '',
            project_floor: answers.projectFloor || '',
            foundation: answers.foundation || '',
            hoa_rules: answers.hoa || '',
            past_renos_issues: answers.pastRenos || '',
            finishes_and_colors: answers.finishesColors || '',
            changes_wanted: answers.changesWanted || '',
            style: answers.style || '',
            inspiration_links: answers.inspo || '',
            use_of_space: answers.useOfSpace || '',
            kids_pets_access: answers.kidsPets || '',
            storage_needs: answers.storageNeeds || '',
            length_of_stay: answers.stayDuration || '',
            electrical_updates: answers.electrical || '',
            gas_type: answers.gasType || '',
            water_source: answers.water || '',
            hvac_issues: answers.hvac || '',
            work_restirctions: answers.workRestrictions || '',
            permits: answers.permits || '',
          },
          { onConflict: 'project_id' }
        );

      if (error) {
        console.error('Error saving lookbook:', error);
        toast({
          title: 'Error',
          description: 'Failed to save lookbook data',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: 'Lookbook data saved successfully',
      });
      return true;
    } catch (error) {
      console.error('Error saving lookbook:', error);
      return false;
    }
  };

  const clearAnswers = async () => {
    if (!projectId || !workspaceId) return false;

    try {
      const { error } = await (supabase as any)
        .from('lookbooks')
        .delete()
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error clearing lookbook:', error);
        toast({
          title: 'Error',
          description: 'Failed to clear questions',
          variant: 'destructive',
        });
        return false;
      }

      setAnswers({});
      return true;
    } catch (error) {
      console.error('Error clearing lookbook:', error);
      return false;
    }
  };

  return {
    answers,
    setAnswers,
    isLoading,
    saveLookbook,
    clearAnswers,
  };
}

