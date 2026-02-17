import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { getMaterialsTaxRate, updateMaterialsTaxRate } from '@/queries/workspaces';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to get and update the materials tax rate for the current workspace
 * Returns the tax rate as a decimal (e.g., 0.06 for 6%)
 */
export function useWorkspaceTaxRate() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [taxRate, setTaxRate] = useState<number>(0.06); // Default to 6%
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch tax rate when workspace changes
  useEffect(() => {
    const fetchTaxRate = async () => {
      if (!currentWorkspace?.id) {
        setTaxRate(0.06); // Default
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const rate = await getMaterialsTaxRate(currentWorkspace.id);
        setTaxRate(rate);
      } catch (err) {
        console.error('Error fetching tax rate:', err);
        setError(err as Error);
        setTaxRate(0.06); // Fallback to default
      } finally {
        setLoading(false);
      }
    };

    fetchTaxRate();
  }, [currentWorkspace?.id]);

  const updateTaxRate = async (newRate: number) => {
    if (!currentWorkspace?.id || !user?.id) {
      throw new Error('Workspace or user not available');
    }

    try {
      setError(null);
      await updateMaterialsTaxRate(currentWorkspace.id, newRate, user.id);
      setTaxRate(newRate);
    } catch (err) {
      console.error('Error updating tax rate:', err);
      setError(err as Error);
      throw err;
    }
  };

  return {
    taxRate,
    updateTaxRate,
    loading,
    error,
  };
}
