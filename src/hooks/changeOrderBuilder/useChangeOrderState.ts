import { useState, useEffect } from 'react';

interface UseChangeOrderStateParams {
  projectId: string;
  workspaceId: string | undefined;
  editingVersionId: string | null | undefined;
}

export function useChangeOrderState({ projectId, workspaceId, editingVersionId }: UseChangeOrderStateParams) {
  const [multiplier, setMultiplier] = useState(1); // Change orders always use multiplier of 1
  const [draftName, setDraftName] = useState<string>('');
  const [loadedChangeOrderName, setLoadedChangeOrderName] = useState<string | null>(null);

  // For change orders, always keep multiplier at 1
  useEffect(() => {
    setMultiplier(1);
  }, []);

  // Note: Change order names should always be empty when creating new change orders
  // The user must manually enter a name before saving

  return {
    multiplier,
    setMultiplier,
    draftName,
    setDraftName,
    loadedChangeOrderName,
    setLoadedChangeOrderName,
  };
}
