import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineItem } from '@/types';
import { fetchPackageItemsWithDetails } from '@/queries/packageItems';

export function usePackages(workspaceId: string | undefined) {
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!workspaceId) return;
      try {
        const { data, error } = await (supabase as any)
          .from('packages')
          .select('*, package_groups(name)')
          .eq('workspace_id', workspaceId)
          .order('name', { ascending: true });

        if (error) throw error;
        setPackages(data || []);
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };
    fetchPackages();
  }, [workspaceId]);

  const loadPackageItems = async (packageId: string, workspaceId: string): Promise<LineItem[]> => {
    if (!workspaceId) {
      toast.error('Workspace not available');
      return [];
    }
    try {
      const pkg = packages.find((p) => p.id === packageId);
      if (!pkg) {
        toast.error('Package not found');
        return [];
      }

      // Fetch package items with details
      const packageItems = await fetchPackageItemsWithDetails(packageId, workspaceId);
      
      if (packageItems.length === 0) {
        toast.error('Package has no items');
        return [];
      }

      const newItems: LineItem[] = [];

      // Convert package items to LineItems
      packageItems.forEach((pi) => {
        // Skip labor if package has zero_labor flag
        if (pi.itemType === 'labor' && pkg.zero_labor) {
          return;
        }

        const unitPrice = pi.unitPriceOverride ?? pi.baseUnitPrice;
        // Use nameOverride if available, otherwise use the fetched name
        const itemName = pi.nameOverride || pi.name;
        newItems.push({
          id: pi.itemId,
          name: itemName,
          qty: pi.quantity,
          unitPrice,
          wastePct: pi.itemType === 'material' ? 0 : undefined,
          kind: pi.itemType,
        });
      });

      toast.success(`Added ${newItems.length} items from ${pkg.name}`);
      return newItems;
    } catch (error) {
      console.error('Error loading package items:', error);
      toast.error('Failed to load package items');
      return [];
    }
  };

  return { packages, loadPackageItems };
}

