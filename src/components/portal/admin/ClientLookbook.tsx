import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Upload, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Can } from '@/components/Can';
import Papa from 'papaparse';
import { useLookbookCategories } from '@/hooks/lookbook/useLookbookCategories';
import { isDemoMode } from '@/utils/demoMode';

type LookbookItem = {
  id: string;
  category: string;
  image: string;
  brand: string;
  style: string;
  finish: string;
  link?: string;
  price?: number;
  model_number?: string;
  collection?: string;
};

export function ClientLookbook() {
  const { can } = usePermissions();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const canEdit = can('tab.admin_lookbook.view') && can('tab.admin_lookbook.edit');
  const { categories: workspaceCategories } = useLookbookCategories(workspaceId);
  const [lookbook, setLookbook] = useState<LookbookItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LookbookItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false);
  const [csvItems, setCsvItems] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspaceId) {
      fetchLookbookItems();
    }
  }, [workspaceId]);

  // Set default category when opening dialog for new item
  useEffect(() => {
    if (open && !editing && workspaceCategories.length > 0) {
      const otherCategory = workspaceCategories.find(c => c.isDefault);
      if (otherCategory && !selectedCategory) {
        setSelectedCategory(otherCategory.name);
      }
    }
  }, [open, editing, workspaceCategories, selectedCategory]);

  const fetchLookbookItems = async () => {
    if (!workspaceId) return;
    
    try {
      const { data, error } = await supabase
        .from('lookbook_options')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLookbook(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load lookbook items', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({ title: 'Error', description: 'You do not have permission to edit items', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData(e.currentTarget);
      let imageUrl = editing?.image || '';

      // Upload image if a new file was selected
      if (imageFile) {
        if (!workspaceId) {
          toast({ title: 'Error', description: 'Workspace is required to upload images', variant: 'destructive' });
          setUploading(false);
          return;
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${workspaceId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lookbook-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('lookbook-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Get the "Other" category name from workspace categories (should always exist)
      const otherCategory = workspaceCategories.find(c => c.isDefault);
      const defaultCategory = otherCategory?.name || 'Other';
      const category = selectedCategory || editing?.category || defaultCategory;
      const brand = String(fd.get('brand') || '');
      const style = String(fd.get('style') || '');
      const finish = String(fd.get('finish') || '');
      const link = String(fd.get('link') || '') || null;
      const price = Number(fd.get('price') || '') || null;
      const modelNumber = String(fd.get('model_number') || '').trim() || null;
      const collection = String(fd.get('collection') || '').trim() || null;

      if (!workspaceId) {
        toast({ title: 'Error', description: 'Workspace not available', variant: 'destructive' });
        setUploading(false);
        return;
      }

      // Use placeholder image if no image is provided (database requires non-null)
      const finalImageUrl = imageUrl || 'https://via.placeholder.com/400x300?text=No+Image';

      if (editing) {
        // Update existing item
        const { error } = await (supabase as any)
          .from('lookbook_options')
          .update({ category, image: finalImageUrl, brand, style, finish, link, price, model_number: modelNumber, collection })
          .eq('id', editing.id)
          .eq('workspace_id', workspaceId);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('lookbook_options')
          .insert({ category, image: finalImageUrl, brand, style, finish, link, price, model_number: modelNumber, collection, workspace_id: workspaceId });

        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Lookbook item saved' });
      await fetchLookbookItems();
      setOpen(false);
      setEditing(null);
      setImageFile(null);
      setSelectedCategory('');
    } catch (error) {
      console.error('Error saving lookbook item:', error);
      toast({ title: 'Error', description: 'Failed to save item', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit || !workspaceId) {
      toast({ title: 'Error', description: 'You do not have permission to delete items or workspace not available', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('lookbook_options')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Item deleted' });
      await fetchLookbookItems();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
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
        return value.replace(/^[\"']|[\"']$/g, '').trim();
      },
    });

    if (result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      toast({ title: 'Error', description: 'You do not have permission to import CSV', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseCSV(text) as any[];

      // Validate required headers
      if (data.length === 0) {
        throw new Error('CSV file is empty');
      }

      const requiredHeaders = ['category', 'brand', 'style', 'finish', 'link', 'price'];
      const firstRow = data[0];
      const missingHeaders = requiredHeaders.filter(h => !(h in firstRow));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Validate and transform items
      const validItems: any[] = [];
      const errors: string[] = [];

      data.forEach((row, idx) => {
        const category = row.category?.trim();
        
        // Validate category (required but can be any value)
        if (!category) {
          errors.push(`Row ${idx + 2}: Category is required`);
          return;
        }
        
        // Allow any category - items with categories not in workspace will appear under "Other"

        // Validate required fields
        if (!row.brand?.trim()) {
          errors.push(`Row ${idx + 2}: Brand is required`);
          return;
        }
        if (!row.style?.trim()) {
          errors.push(`Row ${idx + 2}: Style is required`);
          return;
        }
        if (!row.finish?.trim()) {
          errors.push(`Row ${idx + 2}: Finish is required`);
          return;
        }

        // Validate and trim optional fields
        const modelNumber = row.model_number?.trim();
        const collection = row.collection?.trim();
        
        // Validate max length
        if (modelNumber && modelNumber.length > 150) {
          errors.push(`Row ${idx + 2}: Model number exceeds 150 characters`);
          return;
        }
        if (collection && collection.length > 150) {
          errors.push(`Row ${idx + 2}: Collection exceeds 150 characters`);
          return;
        }

        validItems.push({
          category,
          brand: row.brand.trim(),
          style: row.style.trim(),
          finish: row.finish.trim(),
          link: row.link?.trim() || null,
          price: row.price ? parseFloat(row.price) : null,
          model_number: modelNumber || null,
          collection: collection || null,
          image: 'https://via.placeholder.com/400x300?text=No+Image' // Default placeholder
        });
      });

      if (errors.length > 0) {
        throw new Error(`Validation errors:\n${errors.join('\n')}`);
      }

      if (validItems.length === 0) {
        throw new Error('No valid items found in CSV');
      }

      setCsvItems(validItems);
      setCsvDialogOpen(false);
      setCsvConfirmOpen(true);
    } catch (error) {
      console.error('CSV parsing error:', error);
      toast({
        title: 'CSV Import Error',
        description: error instanceof Error ? error.message : 'Failed to parse CSV',
        variant: 'destructive',
      });
    }

    // Reset file input
    e.target.value = '';
  };

  const confirmCSVImport = async () => {
    if (!canEdit || !workspaceId) {
      toast({ title: 'Error', description: 'You do not have permission to import CSV or workspace not available', variant: 'destructive' });
      return;
    }

    try {
      // Add workspace_id to each CSV item
      const itemsWithWorkspace = csvItems.map(item => ({
        ...item,
        workspace_id: workspaceId
      }));

      const { error } = await supabase
        .from('lookbook_options')
        .insert(itemsWithWorkspace);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Imported ${csvItems.length} lookbook items`,
      });

      await fetchLookbookItems();
      setCsvConfirmOpen(false);
      setCsvItems([]);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Error',
        description: 'Failed to import items to database',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Grid of selections for clients</div>
        <div className="flex gap-2">
          <Can permission="tab.admin_lookbook.edit">
            <Button variant="outline" className="gap-2" onClick={() => setCsvDialogOpen(true)}>
              <FileUp className="w-4 h-4"/>Import CSV
            </Button>
            <Button className="gap-2" onClick={() => { 
              setEditing(null); 
              setImageFile(null); 
              setSelectedCategory(''); 
              setOpen(true); 
            }}>
              <Plus className="w-4 h-4"/>Add
            </Button>
          </Can>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : lookbook.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No lookbook items yet. Add one to get started!</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lookbook.map((i) => (
          <Card 
            key={i.id} 
            className={`overflow-hidden transition-shadow ${canEdit ? 'cursor-pointer hover:shadow-lg' : ''}`}
            onClick={canEdit ? () => { 
              setEditing(i); 
              setSelectedCategory(i.category); 
              setImageFile(null); 
              setOpen(true); 
            } : undefined}
          >
            {i.image ? (
              <img src={i.image} alt="Item" className="w-full h-40 object-cover"/>
            ) : (
              <div className="w-full h-40 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                No Image
              </div>
            )}
            <CardContent className="pt-3">
              <div className="font-medium">{i.brand} • {i.style}</div>
              <div className="text-sm text-muted-foreground">{i.finish}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm">{i.price ? `$${i.price}` : '—'}</div>
                <div className="flex gap-1">
                  {i.link && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      asChild 
                      aria-label="Open link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={i.link} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4"/>
                      </a>
                    </Button>
                  )}
                  {canEdit && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      aria-label="Delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(i.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4"/>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit item' : 'Add item'}</DialogTitle>
            <DialogDescription>Fill in the details for the lookbook item.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={selectedCategory || editing?.category} 
                  onValueChange={setSelectedCategory}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaceCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Upload Image</Label>
                <div className="flex gap-2 items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {imageFile ? imageFile.name : 'Choose file'}
                  </Button>
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {editing?.image && !imageFile && (
                  <p className="text-xs text-muted-foreground mt-1">Current image will be kept if no new file is uploaded</p>
                )}
              </div>

              <div>
                <Label>Brand</Label>
                <Input name="brand" defaultValue={editing?.brand} required />
              </div>

              <div>
                <Label>Style</Label>
                <Input name="style" defaultValue={editing?.style} required />
              </div>

              <div>
                <Label>Finish</Label>
                <Input name="finish" defaultValue={editing?.finish} required />
              </div>

              <div>
                <Label>Link</Label>
                <Input name="link" type="text" defaultValue={editing?.link} placeholder="https://..." />
              </div>

              <div>
                <Label>Price</Label>
                <Input name="price" type="number" step="0.01" defaultValue={editing?.price} placeholder="0.00" />
              </div>

              <div>
                <Label>Model #</Label>
                <Input 
                  name="model_number" 
                  defaultValue={editing?.model_number || ''} 
                  placeholder="Model number"
                  maxLength={150}
                />
              </div>

              <div>
                <Label>Collection</Label>
                <Input 
                  name="collection" 
                  defaultValue={editing?.collection || ''} 
                  placeholder="Collection name"
                  maxLength={150}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Lookbook Items from CSV</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 text-sm text-left">
                <div className="space-y-2 text-left">
                  <p className="font-medium text-center md:text-left">Your CSV must follow this format:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Header row is required.</li>
                    <li>
                      Required header columns (lowercase):{' '}
                      <code>category</code>, <code>brand</code>, <code>style</code>, <code>finish</code>, <code>link</code>, <code>price</code>.
                    </li>
                    <li>
                      Optional columns: <code>title</code>, <code>model_number</code>, <code>collection</code>.
                    </li>
                    <li>
                      Any <code>category</code> value is allowed. Categories not in your workspace will appear under{' '}
                      <span className="font-semibold">Other</span>.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Example:</p>
                  <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs overflow-x-auto border text-left">
                    <code>category,brand,style,finish,link,price</code>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center md:text-left">
                  Tip: keep each row under 500 characters to avoid validation errors.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <input
            ref={fileInputRef}
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
              disabled={isDemoMode()}
            >
              <Upload className="h-4 w-4" />
              Choose CSV file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Confirmation Dialog */}
      <Dialog open={csvConfirmOpen} onOpenChange={setCsvConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              You are about to import {csvItems.length} lookbook items. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCSVImport}>
              Import Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
