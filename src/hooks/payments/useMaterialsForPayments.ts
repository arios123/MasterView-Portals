import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Material } from '@/types/payments';

interface UseMaterialsForPaymentsProps {
  activeVersionId: string | null;
  activeChangeOrders: any[];
}

export function useMaterialsForPayments({
  activeVersionId,
  activeChangeOrders,
}: UseMaterialsForPaymentsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    const fetchRevisedMaterials = async () => {
      const allMaterials: Material[] = [];

      // Fetch revised materials from active draft
      if (activeVersionId) {
        const { data: draftRevisions } = await supabase
          .from('material_revisions')
          .select('*')
          .eq('version_id', activeVersionId);

        if (draftRevisions) {
          draftRevisions.forEach((rev: any) => {
            allMaterials.push({
              id: rev.id,
              name: rev.name,
              link: rev.link || undefined,
              price: Number(rev.price),
              qty: Number(rev.quantity),
              source: 'draft',
              versionId: activeVersionId,
              notes: rev.notes || undefined,
            });
          });
        }
      }

      // Fetch materials from active change orders
      if (activeChangeOrders.length > 0) {
        for (const co of activeChangeOrders) {
          // First try material_revisions
          const { data: coRevisions } = await supabase
            .from('material_revisions')
            .select('*')
            .eq('version_id', co.version_id);

          if (coRevisions && coRevisions.length > 0) {
            coRevisions.forEach((rev: any) => {
              allMaterials.push({
                id: rev.id,
                name: `${rev.name} (${co.name || 'CO'})`,
                link: rev.link || undefined,
                price: Number(rev.price),
                qty: Number(rev.quantity),
                source: 'changeOrder',
                versionId: co.version_id,
                notes: rev.notes || undefined,
              });
            });
          }

          // Also fetch from version_materials
          const { data: coMaterials } = await supabase
            .from('version_materials')
            .select('*, material_options(*)')
            .eq('version_id', co.version_id);

          if (coMaterials) {
            coMaterials.forEach((mat: any) => {
              allMaterials.push({
                id: mat.id,
                name: `${mat.material_options?.name || 'Material'} (${co.name || 'CO'})`,
                link: undefined,
                price: Number(mat.price),
                qty: Number(mat.quantity),
                source: 'changeOrder',
                versionId: co.version_id,
              });
            });
          }
        }
      }

      setMaterials(allMaterials);
    };

    fetchRevisedMaterials();
  }, [activeVersionId, activeChangeOrders]);

  return { materials };
}

