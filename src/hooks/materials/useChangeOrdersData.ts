import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChangeOrder, Item } from '@/types/materials';

export interface UseChangeOrdersDataOptions {
  /** Sold contract (active version materials). When set, itemsA = sold contract + this CO's version_materials deltas (quantity is delta in DB). */
  soldContractMaterials?: Item[];
  soldContractKey?: string;
}

/**
 * Change orders saved from the Change Order tab store quantity as DELTA in version_materials
 * (0 = no change). So we must apply deltas to the sold contract to get correct "In Contract" qty/price.
 */
export function useChangeOrdersData(
  activeChangeOrders: any[],
  options?: UseChangeOrdersDataOptions
) {
  const { soldContractMaterials, soldContractKey } = options ?? {};
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadChangeOrders = async () => {
      if (activeChangeOrders.length === 0) {
        setChangeOrders([]);
        return;
      }

      setLoading(true);
      try {
        const changeOrdersData = await Promise.all(
          activeChangeOrders.map(async (co) => {
            const { data: materialData } = await supabase
              .from('version_materials')
              .select('id, material_id, quantity, price, item_name, baseline_version_material_id')
              .eq('version_id', co.version_id);

            let itemsA: Item[];
            let soldContractTotal: number | undefined;
            if (soldContractMaterials !== undefined) {
              soldContractTotal = soldContractMaterials.reduce((sum, i) => sum + i.qty * i.price, 0);
              // Start with a copy of the full sold contract
              const soldMap = new Map(soldContractMaterials.map((i) => [i.id, { ...i }]));
              const coveredSoldIds = new Set<string>();
              const newItems: Item[] = [];

              // Apply deltas from this CO's version_materials on top
              for (const row of materialData || []) {
                const qty = Number(row.quantity);
                const price = Number(row.price);
                const name = row.item_name?.trim() || 'Unknown';
                const baselineId = row.baseline_version_material_id;

                if (baselineId != null) {
                  const sold = soldMap.get(baselineId);
                  if (sold) {
                    // Apply delta: qty is delta (sold.qty + delta), price is absolute
                    sold.qty = sold.qty + qty;
                    sold.price = price;
                    sold.name = name;
                    coveredSoldIds.add(baselineId);
                  } else {
                    // Baseline ref doesn't match a sold item — include as-is
                    newItems.push({ id: row.id, name, qty, price });
                  }
                } else {
                  // New item added by this CO (no baseline link)
                  newItems.push({ id: row.id, name, qty, price });
                }
              }

              // Build itemsA: all sold contract items (with deltas applied where applicable) + new items
              itemsA = [...soldContractMaterials.map((s) => soldMap.get(s.id)!), ...newItems];
            } else {
              itemsA = (materialData || []).map((item: any) => ({
                id: item.id,
                name: item.item_name || 'Unknown',
                qty: Number(item.quantity),
                price: Number(item.price),
              }));
            }

            return {
              id: co.version_id,
              title: co.name || 'Change Order',
              itemsA,
              itemsB: [],
              soldContractTotal,
            };
          })
        );

        setChangeOrders(changeOrdersData);
      } catch (error) {
        console.error('Error loading change orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChangeOrders();
  }, [activeChangeOrders, soldContractKey]);

  return { changeOrders, loading };
}

