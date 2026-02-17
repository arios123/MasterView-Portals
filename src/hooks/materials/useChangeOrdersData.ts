import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChangeOrder, Item } from '@/types/materials';
import { isDemoMode } from '@/utils/demoMode';
import { getMockVersionMaterials } from '@/utils/mockData';

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

      if (isDemoMode()) {
        setLoading(true);
        try {
          const allMockMaterials = getMockVersionMaterials();
          const changeOrdersData: ChangeOrder[] = activeChangeOrders.map((co) => {
            const materialData = allMockMaterials.filter((vm: any) => vm.version_id === co.version_id);
            let itemsA: Item[];
            let soldContractTotal: number | undefined;

            if (soldContractMaterials !== undefined) {
              soldContractTotal = soldContractMaterials.reduce((sum, i) => sum + i.qty * i.price, 0);
              const soldMap = new Map(soldContractMaterials.map((i) => [i.id, { ...i }]));
              const newItems: Item[] = [];

              for (const row of materialData) {
                const qty = Number(row.quantity);
                const price = Number(row.price);
                const name = (row.item_name?.trim() || 'Unknown') as string;
                const baselineId = (row as any).baseline_version_material_id ?? null;

                if (baselineId != null) {
                  const sold = soldMap.get(baselineId);
                  if (sold) {
                    sold.qty = sold.qty + qty;
                    sold.price = price;
                    sold.name = name;
                  } else {
                    newItems.push({ id: row.id, name, qty, price });
                  }
                } else {
                  newItems.push({ id: row.id, name, qty, price });
                }
              }

              itemsA = [...soldContractMaterials.map((s) => soldMap.get(s.id)!), ...newItems];
            } else {
              itemsA = materialData.map((item: any) => ({
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
          });
          setChangeOrders(changeOrdersData);
        } catch (error) {
          console.error('Error loading change orders (demo):', error);
        } finally {
          setLoading(false);
        }
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
              const soldMap = new Map(soldContractMaterials.map((i) => [i.id, { ...i }]));
              const coveredSoldIds = new Set<string>();
              const newItems: Item[] = [];

              for (const row of materialData || []) {
                const qty = Number(row.quantity);
                const price = Number(row.price);
                const name = row.item_name?.trim() || 'Unknown';
                const baselineId = row.baseline_version_material_id;

                if (baselineId != null) {
                  const sold = soldMap.get(baselineId);
                  if (sold) {
                    sold.qty = sold.qty + qty;
                    sold.price = price;
                    sold.name = name;
                    coveredSoldIds.add(baselineId);
                  } else {
                    newItems.push({ id: row.id, name, qty, price });
                  }
                } else {
                  newItems.push({ id: row.id, name, qty, price });
                }
              }

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
