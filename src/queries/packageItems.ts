import { supabase } from '@/integrations/supabase/client';
import { PackageItem } from '@/stores/adminStore';

/**
 * Fetch all package items for a specific package
 */
export async function fetchPackageItems(packageId: string): Promise<PackageItem[]> {
  const { data, error } = await supabase
    .from('package_items')
    .select('*')
    .eq('package_id', packageId);
  
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    packageId: row.package_id,
    itemId: row.item_id,
    itemType: row.item_type as 'material' | 'labor',
    quantity: Number(row.quantity),
    unitPriceOverride: row.unit_price_override ? Number(row.unit_price_override) : undefined,
    nameOverride: row.name_override || undefined,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new package item
 */
export async function createPackageItem(
  packageId: string,
  itemId: string,
  itemType: 'material' | 'labor',
  quantity: number,
  workspaceId: string,
  userId: string,
  unitPriceOverride?: number
): Promise<PackageItem> {
  const { data, error } = await supabase
    .from('package_items')
    .insert({
      package_id: packageId,
      item_id: itemId,
      item_type: itemType,
      quantity,
      unit_price_override: unitPriceOverride,
      workspace_id: workspaceId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    packageId: data.package_id,
    itemId: data.item_id,
    itemType: data.item_type as 'material' | 'labor',
    quantity: Number(data.quantity),
    unitPriceOverride: data.unit_price_override ? Number(data.unit_price_override) : undefined,
    nameOverride: data.name_override || undefined,
    workspaceId: data.workspace_id,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

/**
 * Update a package item
 */
export async function updatePackageItem(
  id: string,
  updates: { quantity?: number; unit_price_override?: number | null; name_override?: string | null },
  userId: string
): Promise<PackageItem> {
  // Filter out name_override if column doesn't exist (graceful degradation)
  const updatePayload: any = {
    ...updates,
    updated_by: userId,
    updated_at: new Date().toISOString()
  };
  
  // Only include name_override if it's provided (the migration should be run, but handle gracefully)
  const { data, error } = await supabase
    .from('package_items')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    // If error is about missing column, filter it out and retry without name_override
    if (error.message?.includes("name_override") || error.code === 'PGRST204') {
      console.warn('name_override column not found, updating without it. Please run the migration.');
      const { name_override, ...updatesWithoutName } = updates;
      const { data: retryData, error: retryError } = await supabase
        .from('package_items')
        .update({
          ...updatesWithoutName,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (retryError) throw retryError;
      // Return data without nameOverride since column doesn't exist
      return {
        id: retryData.id,
        packageId: retryData.package_id,
        itemId: retryData.item_id,
        itemType: retryData.item_type as 'material' | 'labor',
        quantity: Number(retryData.quantity),
        unitPriceOverride: retryData.unit_price_override ? Number(retryData.unit_price_override) : undefined,
        nameOverride: undefined, // Column doesn't exist
        workspaceId: retryData.workspace_id,
        createdBy: retryData.created_by,
        createdAt: retryData.created_at,
        updatedBy: retryData.updated_by,
        updatedAt: retryData.updated_at,
      };
    }
    throw error;
  }
  
  return {
    id: data.id,
    packageId: data.package_id,
    itemId: data.item_id,
    itemType: data.item_type as 'material' | 'labor',
    quantity: Number(data.quantity),
    unitPriceOverride: data.unit_price_override ? Number(data.unit_price_override) : undefined,
    nameOverride: data.name_override || undefined,
    workspaceId: data.workspace_id,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a package item
 */
export async function deletePackageItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('package_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Delete all package items for a specific package
 */
export async function deleteAllPackageItems(packageId: string): Promise<void> {
  const { error } = await supabase
    .from('package_items')
    .delete()
    .eq('package_id', packageId);
  
  if (error) throw error;
}

/**
 * Fetch package items with full item details (materials and labor)
 */
export async function fetchPackageItemsWithDetails(packageId: string, workspaceId: string) {
  const items = await fetchPackageItems(packageId);
  
  if (items.length === 0) return [];
  
  // Separate material and labor IDs
  const materialIds = items.filter(i => i.itemType === 'material').map(i => i.itemId);
  const laborIds = items.filter(i => i.itemType === 'labor').map(i => i.itemId);
  
  // Fetch material details
  // Handle both workspace_id match and NULL workspace_id (for backward compatibility)
  const materialsPromise = materialIds.length > 0
    ? supabase
        .from('material_options')
        .select('*')
        .in('id', materialIds)
        .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    : Promise.resolve({ data: [], error: null });
  
  // Fetch labor details
  // Handle both workspace_id match and NULL workspace_id (for backward compatibility)
  const laborPromise = laborIds.length > 0
    ? supabase
        .from('labor_options')
        .select('*')
        .in('id', laborIds)
        .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    : Promise.resolve({ data: [], error: null });
  
  const [materialsRes, laborRes] = await Promise.all([materialsPromise, laborPromise]);
  
  if (materialsRes.error) {
    console.error('Error fetching material options:', materialsRes.error);
    throw materialsRes.error;
  }
  if (laborRes.error) {
    console.error('Error fetching labor options:', laborRes.error);
    throw laborRes.error;
  }
  
  // Map items with their details
  return items.map(item => {
    const details = item.itemType === 'material'
      ? materialsRes.data?.find(m => m.id === item.itemId)
      : laborRes.data?.find(l => l.id === item.itemId);
    
    if (!details) {
      console.warn(`Could not find ${item.itemType} option with id ${item.itemId} for package ${packageId}`);
    }
    
    // Extract name and unit_price (Supabase returns snake_case)
    // Use nameOverride if available, otherwise use the item's default name
    const itemName = item.nameOverride || details?.name || '';
    const itemUnitPrice = details?.unit_price || 0;
    
    return {
      ...item,
      name: itemName || 'Unknown',
      baseUnitPrice: Number(itemUnitPrice) || 0,
    };
  });
}

