import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useAdminStore, Package, PackageGroup } from '@/stores/adminStore';
import { z } from 'zod';
import Papa from 'papaparse';
import { fetchPackageGroups } from '@/queries/packageGroups';
import { fetchPackageItems, createPackageItem, updatePackageItem, deletePackageItem } from '@/queries/packageItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Can } from '@/components/Can';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// PRESET_GROUPS removed - now loaded dynamically from database

const csvItemSchema = z.object({
  type: z.enum(['material', 'labor', 'Material', 'Labor']),
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  unit_price: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Unit price must be a valid number"
  })
});

function PackageComposer({ 
  packages, 
  onCreate, 
  onUpdate, 
  onDelete, 
  canEdit = false,
  workspaceId,
  userId 
}: { 
  packages: Package[]; 
  onCreate: (name: string, packageGroupId: string | null, onCreated: (id: string) => void) => void; 
  onUpdate: (id: string, p: Partial<Package>) => void; 
  onDelete: (id: string) => void; 
  canEdit?: boolean;
  workspaceId?: string;
  userId?: string;
}) {
  const { priceItems } = useAdminStore();
  const [name, setName] = useState('');
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [missingItemsDialog, setMissingItemsDialog] = useState<{ packageId: string; missingIds: string[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingField, setEditingField] = useState<{ type: 'quantity' | 'price' | 'name'; packageItemId: string } | null>(null);
  
  // Load package groups
  useEffect(() => {
    if (workspaceId) {
      fetchPackageGroups(workspaceId).then(setPackageGroups).catch(console.error);
    }
  }, [workspaceId]);
  
  // Filter packages by selected group
  const filteredPackages = selectedGroupId 
    ? packages.filter(p => p.packageGroupId === selectedGroupId)
    : packages;
  const current = filteredPackages.find(p => p.id === selectedPackageId);
  
  // Get package items for current package
  const packageItems = current?.items || [];
  
  // Load package items when package is selected
  useEffect(() => {
    if (selectedPackageId && workspaceId) {
      fetchPackageItems(selectedPackageId).then(items => {
        onUpdate(selectedPackageId, { items });
      }).catch(console.error);
    }
  }, [selectedPackageId, workspaceId]);
  
  // Check for missing items (items that no longer exist in price items)
  useEffect(() => {
    if (current && packageItems.length > 0 && !missingItemsDialog) {
      const missing = packageItems.filter(pi => 
        !priceItems.some(item => item.id === pi.itemId)
      );
      if (missing.length > 0) {
        setMissingItemsDialog({
          packageId: current.id,
          missingIds: missing.map(m => m.id)
        });
      }
    }
  }, [current?.id, packageItems.length, priceItems.length, missingItemsDialog]);
  
  // Calculate total
  const total = current ? packageItems.reduce((sum, pi) => {
    const item = priceItems.find((i) => i.id === pi.itemId);
    if (!item) return sum;
    const unitPrice = pi.unitPriceOverride ?? item.unitPrice;
    if (item.type === 'Labor' && current.zeroLabor) return sum;
    return sum + pi.quantity * unitPrice;
  }, 0) : 0;

  const addItem = async (itemId: string) => {
    if (!workspaceId || !userId) {
      toast.error('Workspace or user not available');
      return;
    }
    
    const priceItem = priceItems.find(i => i.id === itemId);
    if (!priceItem) return;
    
    if (current) {
      // Add item to existing package
      try {
        await createPackageItem(
          current.id,
          itemId,
          priceItem.type === 'Material' ? 'material' : 'labor',
          1,
          workspaceId,
          userId
        );
        // Reload package items
        const items = await fetchPackageItems(current.id);
        onUpdate(current.id, { items });
        toast.success('Item added to package');
      } catch (error: any) {
        console.error('Error adding item:', error);
        if (error.message?.includes('duplicate')) {
          toast.error('Item already in package');
        } else {
          toast.error('Failed to add item');
        }
      }
      return;
    }
    
    // Create new package first
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed, selectedGroupId || null, async (newId) => {
        setSelectedPackageId(newId);
        try {
          await createPackageItem(
            newId,
            itemId,
            priceItem.type === 'Material' ? 'material' : 'labor',
            1,
            workspaceId,
            userId
          );
          const items = await fetchPackageItems(newId);
          onUpdate(newId, { items });
        } catch (error) {
          console.error('Error adding first item:', error);
        }
      });
      setName('');
    } else {
      toast.error('Enter a package name or select a package first');
    }
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Package Group</Label>
          <Select value={selectedGroupId || 'all'} onValueChange={(v) => {
            setSelectedGroupId(v === 'all' ? '' : v);
            setSelectedPackageId('');
          }}>
            <SelectTrigger>
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {packageGroups.map(group => (
                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Existing Packages</Label>
          <Select value={selectedPackageId || undefined} onValueChange={setSelectedPackageId}>
            <SelectTrigger>
              <SelectValue placeholder={filteredPackages.length === 0 ? "No packages" : "Select package"} />
            </SelectTrigger>
            <SelectContent>
              {filteredPackages.map(pkg => (
                <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {canEdit && (
        <div className="flex items-center gap-2">
          <Input placeholder="New package name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => { 
            if (name.trim()) { 
              onCreate(name.trim(), selectedGroupId || null, (id) => {
                setSelectedPackageId(id);
              }); 
              setName(''); 
            } 
          }} className="gap-2"><Plus className="w-4 h-4"/>Create</Button>
        </div>
      )}
      <div className="rounded-lg border">
        {current && (
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="font-medium">{current.name}</div>
            <div className="flex items-center gap-3">
              {canEdit ? (
                <Label className="flex items-center gap-2"><Switch checked={current.zeroLabor} onCheckedChange={(v) => onUpdate(current.id, { zeroLabor: !!v })}/>Zero labor</Label>
              ) : (
                <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Zero labor: {current.zeroLabor ? 'Yes' : 'No'}
                </Label>
              )}
              <div className="text-sm">Total: <span className="font-semibold">${total.toFixed(2)}</span></div>
              {canEdit && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    onDelete(current.id);
                    setSelectedPackageId('');
                  }}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          <div className="p-3">
            <div className="text-xs uppercase text-muted-foreground mb-2">Available</div>
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="h-60 pr-2">
              {priceItems
                .filter(i => !packageItems.some(pi => pi.itemId === i.id))
                .filter(i => 
                  i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  i.type.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((i) => (
                  <div key={i.id} className="flex items-center justify-between py-1">
                    <span className="text-sm">
                      {i.description}
                      <span className="text-muted-foreground ml-2 text-xs">({i.type})</span>
                    </span>
                    {canEdit && (
                      <Button size="sm" variant="ghost" onClick={() => addItem(i.id)} disabled={!current && !name.trim()}>Add</Button>
                    )}
                  </div>
                ))}
              {priceItems
                .filter(i => !packageItems.some(pi => pi.itemId === i.id))
                .filter(i => 
                  i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  i.type.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && searchQuery && (
                  <div className="text-sm text-muted-foreground py-2">No items found matching "{searchQuery}"</div>
              )}
            </ScrollArea>
          </div>
          <div className="p-3">
            <div className="text-xs uppercase text-muted-foreground mb-2">In package</div>
            <ScrollArea className="h-60 pr-2">
              {!current && <div className="text-sm text-muted-foreground">Create or select a package to view items.</div>}
              {current && packageItems.length === 0 && <div className="text-sm text-muted-foreground">No items yet.</div>}
              {current && packageItems.map((pi) => {
                const i = priceItems.find((x) => x.id === pi.itemId);
                if (!i) return null; // Item no longer exists
                const unitPrice = pi.unitPriceOverride ?? i.unitPrice;
                const displayName = pi.nameOverride || i.description;
                return (
                  <div key={pi.id} className="flex items-center justify-between py-1 gap-2">
                    {/* Name with click-to-edit */}
                    {canEdit ? (
                      editingField?.type === 'name' && editingField.packageItemId === pi.id ? (
                        <Input
                          type="text"
                          autoFocus
                          className="h-7 flex-1 text-sm px-2"
                          defaultValue={displayName}
                          onBlur={async (e) => {
                            const newName = e.target.value.trim();
                            if (userId) {
                              try {
                                await updatePackageItem(pi.id, { name_override: newName || null }, userId);
                                const items = await fetchPackageItems(current.id);
                                onUpdate(current.id, { items });
                              } catch (error) {
                                console.error('Error updating name:', error);
                                toast.error('Failed to update name');
                              }
                            }
                            setEditingField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            } else if (e.key === 'Escape') {
                              setEditingField(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="text-sm flex-1 cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                          onClick={() => setEditingField({ type: 'name', packageItemId: pi.id })}
                        >
                          {displayName}
                        </span>
                      )
                    ) : (
                      <span className="text-sm flex-1">{displayName}</span>
                    )}
                    {canEdit ? (
                      <div className="flex items-center gap-2 text-xs">
                        {/* Quantity */}
                        {editingField?.type === 'quantity' && editingField.packageItemId === pi.id ? (
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            autoFocus
                            className="h-7 w-16 px-1 text-xs"
                            defaultValue={pi.quantity}
                            onBlur={async (e) => {
                              const nextQty = Math.max(0, parseInt(e.target.value || '0', 10) || 0);
                              if (userId) {
                                try {
                                  await updatePackageItem(pi.id, { quantity: nextQty }, userId);
                                  const items = await fetchPackageItems(current.id);
                                  onUpdate(current.id, { items });
                                } catch (error) {
                                  console.error('Error updating quantity:', error);
                                  toast.error('Failed to update quantity');
                                }
                              }
                              setEditingField(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              } else if (e.key === 'Escape') {
                                setEditingField(null);
                              }
                            }}
                          />
                        ) : (
                          <span
                            className="cursor-pointer select-none min-w-[2rem] text-center"
                            onClick={() => setEditingField({ type: 'quantity', packageItemId: pi.id })}
                          >
                            {pi.quantity}
                          </span>
                        )}
                        {/* Unit price */}
                        {editingField?.type === 'price' && editingField.packageItemId === pi.id ? (
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            autoFocus
                            className="h-7 w-20 px-1 text-xs"
                            defaultValue={unitPrice.toFixed(2)}
                            onBlur={async (e) => {
                              const nextPrice = Math.max(0, parseFloat(e.target.value || '0') || 0);
                              if (userId) {
                                try {
                                  await updatePackageItem(pi.id, { unit_price_override: nextPrice }, userId);
                                  const items = await fetchPackageItems(current.id);
                                  onUpdate(current.id, { items });
                                } catch (error) {
                                  console.error('Error updating price:', error);
                                  toast.error('Failed to update price');
                                }
                              }
                              setEditingField(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              } else if (e.key === 'Escape') {
                                setEditingField(null);
                              }
                            }}
                          />
                        ) : (
                          <span
                            className="cursor-pointer select-none min-w-[3rem] text-right"
                            onClick={() => setEditingField({ type: 'price', packageItemId: pi.id })}
                          >
                            ${unitPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs">
                        {pi.quantity} × ${unitPrice.toFixed(2)}
                      </span>
                    )}
                    {canEdit && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={async () => {
                          try {
                            await deletePackageItem(pi.id);
                            const items = await fetchPackageItems(current.id);
                            onUpdate(current.id, { items });
                            toast.success('Item removed from package');
                          } catch (error) {
                            console.error('Error removing item:', error);
                            toast.error('Failed to remove item');
                          }
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>
      </div>
      
      {/* Missing Items Dialog */}
      <AlertDialog open={!!missingItemsDialog} onOpenChange={(open) => !open && setMissingItemsDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Missing Items Detected</AlertDialogTitle>
            <AlertDialogDescription>
              {missingItemsDialog && (
                <div className="space-y-2">
                  <p>
                    {missingItemsDialog.missingIds.length} item{missingItemsDialog.missingIds.length !== 1 ? 's' : ''} in this package 
                    no longer exist{missingItemsDialog.missingIds.length === 1 ? 's' : ''} in the database. 
                    {missingItemsDialog.missingIds.length === 1 ? 'It has' : 'They have'} been removed from the package.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setMissingItemsDialog(null);
            }}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


export function PricingSection() {
  const { packages, addPackage, updatePackage, removePackage, priceItems, addPriceItems, setPackages, setPriceItems } = useAdminStore();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const isMobile = useIsMobile();
  const canEdit = can('tab.admin_pricing.view') && can('tab.admin_pricing.edit');
  
  // Component-level permission checks
  const canViewItems = can('component.adminpricing_items.view');
  const canEditItems = can('component.adminpricing_items.edit');
  const canViewPackageComposer = can('component.adminpricing_packagecomposer.view');
  const canEditPackageComposer = can('component.adminpricing_packagecomposer.edit');
  
  // Effective edit permissions (component-level overrides tab-level)
  const itemsEditEnabled = canViewItems && canEditItems;
  const packageComposerEditEnabled = canViewPackageComposer && canEditPackageComposer;
  
  const workspaceId = currentWorkspace?.id;
  const [q, setQ] = useState('');
  const [newItemType, setNewItemType] = useState<'material' | 'labor'>('material');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ materials: any[], labor: any[] } | null>(null);
  const [csvInstructionsOpen, setCsvInstructionsOpen] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchItems();
      fetchPackages();
    }
  }, [workspaceId]);

  const fetchPackages = async () => {
    if (!workspaceId) return;
    try {
      const { data, error} = await (supabase as any)
        .from('packages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true });

      if (error) throw error;

      const dbPackages = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        packageGroupId: p.package_group_id,
        zeroLabor: p.zero_labor,
        workspaceId: p.workspace_id,
        createdBy: p.created_by,
        createdAt: p.created_at,
        updatedBy: p.updated_by,
        updatedAt: p.updated_at,
        items: [] // Will be loaded on demand
      }));

      setPackages(dbPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load packages');
    }
  };

  const fetchItems = async () => {
    if (!workspaceId) return;
    try {
      const [materialsRes, laborRes] = await Promise.all([
        (supabase as any).from('material_options').select('*').eq('workspace_id', workspaceId),
        (supabase as any).from('labor_options').select('*').eq('workspace_id', workspaceId)
      ]);

      if (materialsRes.error) throw materialsRes.error;
      if (laborRes.error) throw laborRes.error;

      const materials = (materialsRes.data || []).map(m => ({
        id: m.id,
        type: 'Material' as const,
        code: m.id.slice(0, 8),
        description: m.name,
        unitPrice: Number(m.unit_price)
      }));

      const labor = (laborRes.data || []).map(l => ({
        id: l.id,
        type: 'Labor' as const,
        code: l.id.slice(0, 8),
        description: l.name,
        unitPrice: Number(l.unit_price)
      }));

      const combined = [...materials, ...labor];
      addPriceItems(combined);
    } catch (error) {
      console.error('Error fetching pricing items:', error);
      toast.error('Failed to load pricing items');
    }
  };

  const filtered = priceItems.filter((i) => i.description.toLowerCase().includes(q.toLowerCase()));

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filtered.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filtered.map(i => i.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!canEditItems) {
      toast.error('You do not have permission to delete items');
      return;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const itemsToDelete = Array.from(selectedItems);
      const materialsToDelete = itemsToDelete.filter(id => {
        const item = priceItems.find(i => i.id === id);
        return item?.type === 'Material';
      });
      const laborToDelete = itemsToDelete.filter(id => {
        const item = priceItems.find(i => i.id === id);
        return item?.type === 'Labor';
      });

      const deletePromises = [];
      
      if (materialsToDelete.length > 0) {
        deletePromises.push(
          (supabase as any).from('material_options').delete().in('id', materialsToDelete).eq('workspace_id', workspaceId)
        );
      }
      
      if (laborToDelete.length > 0) {
        deletePromises.push(
          (supabase as any).from('labor_options').delete().in('id', laborToDelete).eq('workspace_id', workspaceId)
        );
      }

      const results = await Promise.all(deletePromises);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }

      // Remove from local state
      const updatedItems = priceItems.filter(item => !selectedItems.has(item.id));
      setPriceItems(updatedItems);
      setSelectedItems(new Set());
      
      toast.success(`${itemsToDelete.length} item(s) deleted successfully`);
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error('Failed to delete items');
    }
  };

  const handleSaveNewItem = async () => {
    if (!canEditItems) {
      toast.error('You do not have permission to add items');
      return;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    if (!newItemName.trim() || !newItemPrice) {
      toast.error('Please fill in name and unit price');
      return;
    }

    try {
      const table = newItemType === 'material' ? 'material_options' : 'labor_options';
      const { data, error } = await supabase
        .from(table)
        .insert({
          name: newItemName.trim(),
          unit_price: parseFloat(newItemPrice),
          workspace_id: workspaceId
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newItem = {
        id: data.id,
        type: newItemType === 'material' ? 'Material' as const : 'Labor' as const,
        code: data.id.slice(0, 8),
        description: data.name,
        unitPrice: Number(data.unit_price)
      };
      addPriceItems([newItem]);

      // Reset form
      setNewItemName('');
      setNewItemPrice('');
      
      toast.success(`${newItemType === 'material' ? 'Material' : 'Labor'} added successfully`);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Check each line doesn't exceed 500 characters
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 500) {
        throw new Error(`Row ${i + 1} exceeds 500 character limit (${lines[i].length} characters)`);
      }
    }

    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => {
        // Remove surrounding quotes if present
        return value.replace(/^["']|["']$/g, '').trim();
      },
    });

    if (result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditItems) {
      toast.error('You do not have permission to import CSV');
      event.target.value = '';
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      // Validate all rows
      const validatedRows = [];
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const validated = csvItemSchema.parse(rows[i]);
          validatedRows.push(validated);
        } catch (error: any) {
          errors.push(`Row ${i + 2}: ${error.errors?.[0]?.message || 'Invalid data'}`);
        }
      }

      if (errors.length > 0) {
        toast.error(`Validation errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ''}`);
        event.target.value = '';
        setUploading(false);
        return;
      }

      // Separate materials and labor
      const materials = validatedRows.filter(r => r.type.toLowerCase() === 'material');
      const labor = validatedRows.filter(r => r.type.toLowerCase() === 'labor');

      // Show confirmation dialog
      setPendingImport({ materials, labor });
      event.target.value = '';
      setUploading(false);
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast.error(`Failed to upload CSV: ${error.message}`);
      event.target.value = '';
      setUploading(false);
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;

    if (!workspaceId) {
      toast.error('Workspace not available');
      setPendingImport(null);
      return;
    }

    setUploading(true);
    try {
      const { materials, labor } = pendingImport;
      const insertPromises = [];
      
      if (materials.length > 0) {
        insertPromises.push(
          supabase.from('material_options').insert(
            materials.map(m => ({
              name: m.name,
              unit_price: parseFloat(m.unit_price),
              workspace_id: workspaceId
            }))
          ).select()
        );
      }

      if (labor.length > 0) {
        insertPromises.push(
          supabase.from('labor_options').insert(
            labor.map(l => ({
              name: l.name,
              unit_price: parseFloat(l.unit_price),
              workspace_id: workspaceId
            }))
          ).select()
        );
      }

      const results = await Promise.all(insertPromises);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }

      // Refresh items from database
      await fetchItems();
      
      const totalItems = materials.length + labor.length;
      toast.success(`Successfully imported ${totalItems} item(s)`);
      setPendingImport(null);
    } catch (error: any) {
      console.error('Error importing items:', error);
      toast.error(`Failed to import items: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Can permission="component.adminpricing_items.view" fallback={null}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items</CardTitle>
              <div className="flex items-center gap-2">
                {canEditItems && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCsvInstructionsOpen(true)}
                      disabled={uploading}
                      className="gap-2"
                      data-onboarding-highlight="admin-pricing-add-items"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Import CSV'}
                    </Button>
                  </>
                )}
                {itemsEditEnabled && selectedItems.size > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteSelected}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete ({selectedItems.size})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} />
            
            {canEditItems && (
              <div className="grid grid-cols-4 gap-3 items-end" data-onboarding-highlight="admin-pricing-add-items">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={newItemType} onValueChange={(value: 'material' | 'labor') => setNewItemType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSaveNewItem}
                  data-onboarding-highlight="admin-save-item-button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Save Item
                </Button>
              </div>
            )}
            <div className="rounded-lg border overflow-hidden">
              {isMobile ? (
                /* Mobile: Horizontally scrollable container */
                <div className="overflow-x-auto">
                  <div className="min-w-full inline-block">
                    <div className={`grid ${itemsEditEnabled ? 'grid-cols-[40px_100px_1fr_90px_2fr]' : 'grid-cols-[100px_1fr_90px_2fr]'} bg-muted/50 px-3 py-2 text-xs font-medium gap-4 min-w-max`}>
                      {itemsEditEnabled && (
                        <div>
                          <input
                            type="checkbox"
                            checked={filtered.length > 0 && selectedItems.size === filtered.length}
                            onChange={toggleSelectAll}
                            className="cursor-pointer"
                          />
                        </div>
                      )}
                      <div className="whitespace-nowrap">Type</div>
                      <div className="whitespace-nowrap">Name</div>
                      <div className="text-right whitespace-nowrap">Unit Price</div>
                      <div className="whitespace-nowrap">ID</div>
                    </div>
                    <ScrollArea className="h-96">
                      {filtered.map((i) => (
                        <div key={i.id} className={`grid ${itemsEditEnabled ? 'grid-cols-[40px_100px_1fr_90px_2fr]' : 'grid-cols-[100px_1fr_90px_2fr]'} px-3 py-2 border-b text-sm items-center gap-4 min-w-max`}>
                          {itemsEditEnabled && (
                            <div>
                              <input
                                type="checkbox"
                                checked={selectedItems.has(i.id)}
                                onChange={() => toggleItemSelection(i.id)}
                                className="cursor-pointer"
                              />
                            </div>
                          )}
                          <div className="whitespace-nowrap">{i.type}</div>
                          <div className="whitespace-nowrap">{i.description}</div>
                          <div className="text-right whitespace-nowrap">${i.unitPrice.toFixed(2)}</div>
                          <div className="overflow-x-auto">
                            <code className="text-xs font-mono text-muted-foreground whitespace-nowrap">{i.id}</code>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                /* Desktop: Normal layout */
                <>
                  <div className={`grid ${itemsEditEnabled ? 'grid-cols-[40px_100px_1fr_90px_2fr]' : 'grid-cols-[100px_1fr_90px_2fr]'} bg-muted/50 px-3 py-2 text-xs font-medium gap-4`}>
                    {itemsEditEnabled && (
                      <div>
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && selectedItems.size === filtered.length}
                          onChange={toggleSelectAll}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                    <div>Type</div>
                    <div>Name</div>
                    <div className="text-right">Unit Price</div>
                    <div>ID</div>
                  </div>
                  <ScrollArea className="h-96">
                    {filtered.map((i) => (
                      <div key={i.id} className={`grid ${itemsEditEnabled ? 'grid-cols-[40px_100px_1fr_90px_2fr]' : 'grid-cols-[100px_1fr_90px_2fr]'} px-3 py-2 border-b text-sm items-center gap-4`}>
                        {itemsEditEnabled && (
                          <div>
                            <input
                              type="checkbox"
                              checked={selectedItems.has(i.id)}
                              onChange={() => toggleItemSelection(i.id)}
                              className="cursor-pointer"
                            />
                          </div>
                        )}
                        <div>{i.type}</div>
                        <div>{i.description}</div>
                        <div className="text-right">${i.unitPrice.toFixed(2)}</div>
                        <div className="overflow-x-auto">
                          <code className="text-xs font-mono text-muted-foreground whitespace-nowrap">{i.id}</code>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </Can>

      <Can permission="component.adminpricing_packagecomposer.view" fallback={null}>
        <Card>
          <CardHeader><CardTitle>Package composer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <PackageComposer 
              packages={packages}
              canEdit={packageComposerEditEnabled}
              workspaceId={workspaceId}
              userId={(user as any)?.id}
            onCreate={async (name, packageGroupId, onCreated) => {
              if (!packageComposerEditEnabled) {
                toast.error('You do not have permission to create packages');
                return;
              }
              if (!workspaceId || !(user as any)?.id) {
                toast.error('Workspace or user not available');
                return;
              }

              try {
                const { data, error } = await (supabase as any)
                  .from('packages')
                  .insert({
                    name,
                    package_group_id: packageGroupId,
                    zero_labor: false,
                    workspace_id: workspaceId,
                    created_by: (user as any).id,
                    updated_by: (user as any).id,
                  })
                  .select()
                  .single();

                if (error) throw error;

                addPackage({
                  id: data.id,
                  name: data.name,
                  packageGroupId: data.package_group_id,
                  zeroLabor: data.zero_labor,
                  workspaceId: data.workspace_id,
                  createdBy: data.created_by,
                  createdAt: data.created_at,
                  updatedBy: data.updated_by,
                  updatedAt: data.updated_at,
                  items: []
                });

                onCreated(data.id);
                toast.success('Package created');
              } catch (error) {
                console.error('Error creating package:', error);
                toast.error('Failed to create package');
              }
            }} 
            onUpdate={async (id, updates) => {
              // For items updates, just update local state (already saved to DB)
              if (updates.items !== undefined) {
                updatePackage(id, updates);
                return;
              }
              
              if (!packageComposerEditEnabled) {
                toast.error('You do not have permission to update packages');
                return;
              }

              if (!workspaceId || !(user as any)?.id) {
                toast.error('Workspace or user not available');
                return;
              }

              try {
                const dbUpdates: any = {
                  updated_by: (user as any).id,
                  updated_at: new Date().toISOString()
                };
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.zeroLabor !== undefined) dbUpdates.zero_labor = updates.zeroLabor;
                if (updates.packageGroupId !== undefined) dbUpdates.package_group_id = updates.packageGroupId;

                const { error } = await (supabase as any)
                  .from('packages')
                  .update(dbUpdates)
                  .eq('id', id)
                  .eq('workspace_id', workspaceId);

                if (error) throw error;

                updatePackage(id, updates);
              } catch (error) {
                console.error('Error updating package:', error);
                toast.error('Failed to update package');
              }
            }}
            onDelete={async (id) => {
              if (!packageComposerEditEnabled) {
                toast.error('You do not have permission to delete packages');
                return;
              }

              if (!workspaceId) {
                toast.error('Workspace not available');
                return;
              }

              try {
                const { error } = await (supabase as any)
                  .from('packages')
                  .delete()
                  .eq('id', id)
                  .eq('workspace_id', workspaceId);

                if (error) throw error;

                removePackage(id);
                toast.success('Package deleted');
              } catch (error) {
                console.error('Error deleting package:', error);
                toast.error('Failed to delete package');
              }
            }}
          />
          </CardContent>
        </Card>
      </Can>

      {/* CSV Import Instructions Dialog */}
      <AlertDialog open={csvInstructionsOpen} onOpenChange={setCsvInstructionsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import pricing from CSV</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 text-sm text-left">
                <div className="space-y-2 text-left">
                  <p className="font-medium text-center md:text-left">Your CSV must follow this format:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Header row is required.</li>
                    <li>Type column must be either Material or Labor.</li>
                    <li>Name column must be enclosed in double quotes.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Example:</p>
                  <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs overflow-x-auto border text-left">
                    <code>type,name,unit_price</code><br></br>
                    <code>Material,"2x4 Stud",12.50</code><br></br>
                    <code>Labor,"Installation",100.00</code>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center md:text-left">
                  Tip: keep each row under 500 characters to avoid validation errors.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Choose CSV file'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Confirmation Dialog */}
      <AlertDialog open={!!pendingImport} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingImport && (
                <div className="space-y-2">
                  <p>Found {pendingImport.materials.length + pendingImport.labor.length} item(s) in the CSV:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {pendingImport.materials.length > 0 && (
                      <li>{pendingImport.materials.length} Material{pendingImport.materials.length !== 1 ? 's' : ''}</li>
                    )}
                    {pendingImport.labor.length > 0 && (
                      <li>{pendingImport.labor.length} Labor item{pendingImport.labor.length !== 1 ? 's' : ''}</li>
                    )}
                  </ul>
                  <p className="mt-4">Do you want to add these items to the database?</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Import Items</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
