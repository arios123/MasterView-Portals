import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Role = 'Admin' | 'Designer' | 'Accounting' | 'PM' | 'Crew' | 'Driver';
export type FeatureKey =
  | 'activity'
  | 'lookbook'
  | 'contractBuilder'
  | 'changeOrder'
  | 'materials'
  | 'drafts'
  | 'payments'
  | 'viewPrice'
  | 'clientProjects'
  | 'attachments';

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

export type DocumentTemplate = {
  id: string;
  name: string;
  kind: 'Quote' | 'Scope of Work' | 'Contract' | 'Change Order' | 'Email' | 'Text';
  isDefault?: boolean;
};

export type PriceItem = {
  id: string;
  type: 'Labor' | 'Material';
  code: string;
  description: string;
  unitPrice: number;
};

export type PackageGroup = {
  id: string;
  workspaceId: string;
  name: string;
  displayOrder: number;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
};

export type DocumentGroup = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  displayOrder: number;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
};

export type AttachmentFolder = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  displayOrder: number;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
};

export type PackageItem = {
  id: string;
  packageId: string;
  itemId: string;
  itemType: 'material' | 'labor';
  quantity: number;
  unitPriceOverride?: number;
  nameOverride?: string;
  workspaceId: string;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
};

export type Package = {
  id: string;
  name: string;
  packageGroupId: string | null;
  zeroLabor: boolean;
  workspaceId: string;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
  // Optional for UI convenience - loaded separately
  items?: PackageItem[];
};

export type LookbookItem = {
  id: string;
  category: 'Kitchen' | 'Bathroom' | 'Tile' | 'Countertop' | 'Other';
  image: string;
  brand: string;
  style: string;
  finish: string;
  link?: string;
  price?: number;
};

type AdminState = {
  staff: Staff[];
  templates: DocumentTemplate[];
  priceItems: PriceItem[];
  packages: Package[];
  packageGroups: PackageGroup[];
  lookbook: LookbookItem[];
  addStaff: (s: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, s: Partial<Staff>) => void;
  removeStaff: (id: string) => void;
  addTemplate: (t: Omit<DocumentTemplate, 'id'>) => void;
  updateTemplate: (id: string, t: Partial<DocumentTemplate>) => void;
  duplicateTemplate: (id: string) => void;
  addPriceItems: (items: PriceItem[]) => void;
  setPriceItems: (items: PriceItem[]) => void;
  addPackage: (p: Omit<Package, 'id'> | Package) => void;
  updatePackage: (id: string, p: Partial<Package>) => void;
  removePackage: (id: string) => void;
  setPackages: (packages: Package[]) => void;
  setPackageGroups: (groups: PackageGroup[]) => void;
  addPackageGroup: (group: PackageGroup) => void;
  updatePackageGroup: (id: string, updates: Partial<PackageGroup>) => void;
  removePackageGroup: (id: string) => void;
  upsertLookbookItem: (li: Partial<LookbookItem> & { id?: string }) => void;
  removeLookbookItem: (id: string) => void;
};

const uid = () => Math.random().toString(36).slice(2, 9);

export const useAdminStore = create<AdminState>((set, get) => ({
  staff: [],
  templates: [
    { id: uid(), name: 'Standard Quote', kind: 'Quote', isDefault: true },
    { id: uid(), name: 'Scope - Remodel', kind: 'Scope of Work' },
  ],
  priceItems: [],
  packages: [],
  packageGroups: [],
  lookbook: [
    { id: uid(), category: 'Bathroom', image: 'https://picsum.photos/seed/vanity/400/300', brand: 'Acme', style: 'Vanity', finish: 'Matte', link: 'https://example.com/vanity', price: 599 },
  ],

  addStaff: (s) => set((st) => ({ staff: [...st.staff, { id: uid(), ...s }] })),
  updateStaff: (id, s) => set((st) => ({ staff: st.staff.map((x) => (x.id === id ? { ...x, ...s } : x)) })),
  removeStaff: (id) => set((st) => ({ staff: st.staff.filter((x) => x.id !== id) })),

  addTemplate: (t) => set((st) => ({ templates: [...st.templates, { id: uid(), ...t }] })),
  updateTemplate: (id, t) => set((st) => ({ templates: st.templates.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
  duplicateTemplate: (id) =>
    set((st) => {
      const src = st.templates.find((t) => t.id === id);
      return src
        ? { templates: [...st.templates, { ...src, id: uid(), name: src.name + ' (Copy)', isDefault: false }] }
        : {} as any;
    }),

  addPriceItems: (items) => set((st) => {
    const existingIds = new Set(st.priceItems.map(i => i.id));
    const newItems = items.filter(i => !existingIds.has(i.id));
    return { priceItems: [...st.priceItems, ...newItems] };
  }),
  setPriceItems: (items) => set({ priceItems: items }),
  addPackage: (p) => set((st) => {
    // If package has an id, use it (from database), otherwise generate one
    const pkg = 'id' in p ? p as Package : { id: uid(), ...p } as Package;
    return { packages: [...st.packages, pkg] };
  }),
  updatePackage: (id, p) => set((st) => ({ packages: st.packages.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
  removePackage: (id) => set((st) => ({ packages: st.packages.filter((x) => x.id !== id) })),
  setPackages: (packages) => set({ packages }),
  
  setPackageGroups: (groups) => set({ packageGroups: groups }),
  addPackageGroup: (group) => set((st) => ({ packageGroups: [...st.packageGroups, group] })),
  updatePackageGroup: (id, updates) => set((st) => ({ 
    packageGroups: st.packageGroups.map((g) => (g.id === id ? { ...g, ...updates } : g)) 
  })),
  removePackageGroup: (id) => set((st) => ({ packageGroups: st.packageGroups.filter((g) => g.id !== id) })),

  upsertLookbookItem: (li) =>
    set((st) => {
      if (li.id) {
        return { lookbook: st.lookbook.map((x) => (x.id === li.id ? { ...x, ...li } as LookbookItem : x)) };
      }
      return { lookbook: [{ 
        id: uid(), 
        category: li.category || 'Other', 
        image: li.image || '', 
        brand: li.brand || '', 
        style: li.style || '', 
        finish: li.finish || '', 
        link: li.link, 
        price: li.price 
      } as LookbookItem, ...st.lookbook] };
    }),
  removeLookbookItem: (id) => set((st) => ({ lookbook: st.lookbook.filter((x) => x.id !== id) })),
}));
