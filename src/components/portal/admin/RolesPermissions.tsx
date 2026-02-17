import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ChevronDown, ChevronRight, Trash2, Info } from 'lucide-react';

type RoleRecord = {
  id: string;
  name: string;
};

type Permission = {
  key: string;
  description?: string;
};

type ComponentGroup = {
  components: Permission[];
};

type SubTabGroup = {
  subTabName: string;
  subTabPermissions: Permission[];
  components?: ComponentGroup;
};

type TabGroup = {
  tabName: string;
  tabPermissions?: Permission[];
  subTabs?: SubTabGroup[];
  components?: ComponentGroup;
};

// Define all permissions organized hierarchically: Tabs → Sub-tabs → Components
const PERMISSION_GROUPS: TabGroup[] = [
  {
    tabName: 'Projects',
    tabPermissions: [
      { key: 'tab.projects.view', description: 'View Projects tab' },
      { key: 'tab.projects.edit', description: 'Edit Projects tab' },
    ],
    subTabs: [
      {
        subTabName: 'Client Projects',
        subTabPermissions: [
          { key: 'tab.projects_clientprojects.view', description: 'View Client Projects tab' },
          { key: 'tab.projects_clientprojects.edit', description: 'Edit Client Projects tab' },
        ],
        components: {
          components: [
            { key: 'component.clientprojects_addproject.view', description: 'View add project' },
            { key: 'component.clientprojects_addproject.edit', description: 'Edit add project' },
            { key: 'component.clientprojects_setactive.view', description: 'View set active' },
            { key: 'component.clientprojects_setactive.edit', description: 'Edit set active' },
            { key: 'component.clientprojects_viewprices.view', description: 'View prices' },
          ],
        },
      },
      {
        subTabName: 'Activity',
        subTabPermissions: [
          { key: 'tab.projects_activity.view', description: 'View Activity tab' },
          { key: 'tab.projects_activity.edit', description: 'Edit Activity tab' },
        ],
        components: {
          components: [
            { key: 'component.activity_projectdocuments.view', description: 'View client documents' },
            { key: 'component.activity_projectdocuments.edit', description: 'Edit client documents' },
            { key: 'component.activity_assignstaff.view', description: 'View assign staff (Client Information)' },
            { key: 'component.activity_assignstaff.edit', description: 'Edit assign staff (Client Information)' },
            { key: 'component.activity_assigncrew.view', description: 'View assign crew (Project Information)' },
            { key: 'component.activity_assigncrew.edit', description: 'Edit assign crew (Project Information)' },
            { key: 'component.activity_viewprices.view', description: 'View prices' },
            { key: 'component.activity_deleteproject.view', description: 'View Delete project button (3-dot menu in Project Information)' },
            { key: 'component.activity_deleteclient.view', description: 'View Delete client button (3-dot menu in Client Information)' },
          ],
        },
      },
      {
        subTabName: 'LookBook',
        subTabPermissions: [
          { key: 'tab.projects_lookbook.view', description: 'View LookBook tab' },
          { key: 'tab.projects_lookbook.edit', description: 'Edit LookBook tab' },
        ],
        components: {
          components: [
            { key: 'component.lookbook_questionstab.view', description: 'View Questions tab' },
            { key: 'component.lookbook_questionstab.edit', description: 'Edit Questions tab' },
            { key: 'component.lookbook_selectiontab.view', description: 'View Selection tab' },
            { key: 'component.lookbook_selectiontab.edit', description: 'Edit Selection tab' },
            { key: 'component.lookbook_summarytab.view', description: 'View Summary tab' },
            { key: 'component.lookbook_summarytab.edit', description: 'Edit Summary tab' },
            { key: 'component.lookbook_projectdocuments.view', description: 'View client documents' },
            { key: 'component.lookbook_projectdocuments.edit', description: 'Edit client documents' },
          ],
        },
      },
      {
        subTabName: 'Contract Builder',
        subTabPermissions: [
          { key: 'tab.projects_contractbuilder.view', description: 'View Contract Builder tab' },
          { key: 'tab.projects_contractbuilder.edit', description: 'Edit Contract Builder tab' },
        ],
        components: {
          components: [
            { key: 'component.contractbuilder_quote.view', description: 'View quote section' },
            { key: 'component.contractbuilder_quote.edit', description: 'Edit quote section' },
            { key: 'component.contractbuilder_paymentsplit.view', description: 'View payment split' },
            { key: 'component.contractbuilder_paymentsplit.edit', description: 'Edit payment split' },
            { key: 'component.contractbuilder_timeframe.view', description: 'View timeframe (start date & construction time)' },
            { key: 'component.contractbuilder_timeframe.edit', description: 'Edit timeframe (start date & construction time)' },
            { key: 'component.contractbuilder_projectdocuments.view', description: 'View client documents' },
            { key: 'component.contractbuilder_projectdocuments.edit', description: 'Edit client documents' },
            { key: 'component.contractbuilder_viewprices.view', description: 'View prices' },
          ],
        },
      },
      {
        subTabName: 'Change Orders',
        subTabPermissions: [
          { key: 'tab.projects_changeorders.view', description: 'View Change Orders tab' },
          { key: 'tab.projects_changeorders.edit', description: 'Edit Change Orders tab' },
        ],
        components: {
          components: [
            { key: 'component.changeorders_quote.view', description: 'View quote section' },
            { key: 'component.changeorders_quote.edit', description: 'Edit quote section' },
            { key: 'component.changeorders_projectdocuments.view', description: 'View client documents' },
            { key: 'component.changeorders_projectdocuments.edit', description: 'Edit client documents' },
            { key: 'component.changeorders_viewprices.view', description: 'View prices' },
          ],
        },
      },
      {
        subTabName: 'Materials',
        subTabPermissions: [
          { key: 'tab.projects_materials.view', description: 'View Materials tab' },
          { key: 'tab.projects_materials.edit', description: 'Edit Materials tab' },
        ],
        components: {
          components: [
            { key: 'component.materials_pricetotals.view', description: 'View price totals' },
            { key: 'component.materials_projectdocuments.view', description: 'View client documents' },
            { key: 'component.materials_projectdocuments.edit', description: 'Edit client documents' },
            { key: 'component.materials_draftmaterials.view', description: 'View draft materials' },
            { key: 'component.materials_draftmaterials.edit', description: 'Edit draft materials' },
            { key: 'component.materials_draftmaterialsprices.view', description: 'View draft materials prices' },
            { key: 'component.materials_draftrevisedprices.view', description: 'View draft revised prices' },
            { key: 'component.materials_changeordermaterials.view', description: 'View change order materials' },
            { key: 'component.materials_changeordermaterials.edit', description: 'Edit change order materials' },
            { key: 'component.materials_changeordermaterialsprices.view', description: 'View change order materials prices' },
            { key: 'component.materials_changeorderrevisedprices.view', description: 'View change order revised prices' },
            { key: 'component.materials_savedraft.view', description: 'View save draft button (Materials)' },
            { key: 'component.materials_savedraft.edit', description: 'Edit save draft (Materials)' },
            { key: 'component.materials_savechangeorder.view', description: 'View save change order button' },
            { key: 'component.materials_savechangeorder.edit', description: 'Edit save change order' },
          ],
        },
      },
      {
        subTabName: 'Drafts',
        subTabPermissions: [
          { key: 'tab.projects_drafts.view', description: 'View Drafts tab' },
          { key: 'tab.projects_drafts.edit', description: 'Edit Drafts tab' },
        ],
        components: {
          components: [
            { key: 'component.drafts_drafts.view', description: 'View drafts list' },
            { key: 'component.drafts_changeorders.view', description: 'View change orders list' },
            { key: 'component.drafts_changeorderdelete.view', description: 'View delete icon for change orders' },
            { key: 'component.drafts_changeorderdelete.edit', description: 'Edit delete icon for change orders' },
            { key: 'component.drafts_changeorderssetactive.view', description: 'View set active controls' },
            { key: 'component.drafts_changeorderssetactive.edit', description: 'Edit set active controls' },
            { key: 'component.drafts_draftsetactive.view', description: 'View set active button for drafts' },
            { key: 'component.drafts_draftsetactive.edit', description: 'Edit set active button for drafts' },
            { key: 'component.drafts_draftdelete.view', description: 'View delete button for drafts' },
            { key: 'component.drafts_draftdelete.edit', description: 'Edit delete button for drafts' },
            { key: 'component.drafts_draftmarksold.view', description: 'View mark sold button for drafts' },
            { key: 'component.drafts_draftmarksold.edit', description: 'Edit mark sold button for drafts' },
          ],
        },
      },
      {
        subTabName: 'Payments',
        subTabPermissions: [
          { key: 'tab.projects_payments.view', description: 'View Payments tab' },
          { key: 'tab.projects_payments.edit', description: 'Edit Payments tab' },
        ],
        components: {
          components: [
            { key: 'component.payments_toptotals.view', description: 'View top totals' },
            { key: 'component.payments_incoming.view', description: 'View incoming payments' },
            { key: 'component.payments_incoming.edit', description: 'Edit incoming payments' },
            { key: 'component.payments_incomingviewprices.view', description: 'View incoming payment prices' },
            { key: 'component.payments_outgoing.view', description: 'View outgoing payments' },
            { key: 'component.payments_outgoing.edit', description: 'Edit outgoing payments' },
            { key: 'component.payments_outgoingviewprices.view', description: 'View outgoing payment prices' },
            { key: 'component.payments_projectsummary.view', description: 'View project summary' },
            { key: 'component.payments_projectdocuments.view', description: 'View client documents' },
            { key: 'component.payments_projectdocuments.edit', description: 'Edit client documents' },
          ],
        },
      },
      {
        subTabName: 'Attachments',
        subTabPermissions: [
          { key: 'tab.projects_attachments.view', description: 'View Attachments tab' },
          { key: 'tab.projects_attachments.edit', description: 'Edit Attachments tab' },
        ],
      },
    ],
  },
  {
    tabName: 'Clients',
    tabPermissions: [
      { key: 'tab.clients.view', description: 'View Clients tab' },
      { key: 'tab.clients.edit', description: 'Edit Clients tab' },
    ],
  },
  {
    tabName: 'Calendar',
    tabPermissions: [
      { key: 'tab.calendar.view', description: 'View Calendar tab' },
      { key: 'tab.calendar.edit', description: 'Edit Calendar tab' },
    ],
  },
  {
    tabName: 'Completed',
    tabPermissions: [
      { key: 'tab.completed.view', description: 'View Completed tab' },
      { key: 'tab.completed.edit', description: 'Edit Completed tab' },
    ],
  },
  {
    tabName: 'Lost',
    tabPermissions: [
      { key: 'tab.lost.view', description: 'View Lost tab' },
      { key: 'tab.lost.edit', description: 'Edit Lost tab' },
    ],
  },
  {
    tabName: 'Admin',
    tabPermissions: [
      { key: 'tab.admin.view', description: 'View Admin tab' },
      { key: 'tab.admin.edit', description: 'Edit Admin tab' },
    ],
    subTabs: [
      {
        subTabName: 'Staff',
        subTabPermissions: [
          { key: 'tab.admin_staff.view', description: 'View Staff tab' },
          { key: 'tab.admin_staff.edit', description: 'Edit Staff tab' },
        ],
      },
      {
        subTabName: 'Documents',
        subTabPermissions: [
          { key: 'tab.admin_documents.view', description: 'View Documents tab' },
          { key: 'tab.admin_documents.edit', description: 'Edit Documents tab' },
        ],
      },
      {
        subTabName: 'Pricing',
        subTabPermissions: [
          { key: 'tab.admin_pricing.view', description: 'View Pricing tab' },
          { key: 'tab.admin_pricing.edit', description: 'Edit Pricing tab' },
        ],
        components: {
          components: [
            { key: 'component.adminpricing_items.view', description: 'View items (manual add & CSV import)' },
            { key: 'component.adminpricing_items.edit', description: 'Edit items (manual add & CSV import)' },
            { key: 'component.adminpricing_packagecomposer.view', description: 'View package composer' },
            { key: 'component.adminpricing_packagecomposer.edit', description: 'Edit package composer' },
          ],
        },
      },
      {
        subTabName: 'Roles & Permissions',
        subTabPermissions: [
          { key: 'tab.admin_rolesandpermissions.view', description: 'View Roles & Permissions tab' },
          { key: 'tab.admin_rolesandpermissions.edit', description: 'Edit Roles & Permissions tab' },
        ],
      },
      {
        subTabName: 'LookBook',
        subTabPermissions: [
          { key: 'tab.admin_lookbook.view', description: 'View LookBook tab' },
          { key: 'tab.admin_lookbook.edit', description: 'Edit LookBook tab' },
        ],
      },
      {
        subTabName: 'Audit Log',
        subTabPermissions: [
          { key: 'tab.admin_auditlog.view', description: 'View Audit Log tab' },
          { key: 'tab.admin_auditlog.edit', description: 'Edit Audit Log tab' },
        ],
      },
      {
        subTabName: 'Workspace Setup',
        subTabPermissions: [
          { key: 'tab.admin_workspacesetup.view', description: 'View Workspace Setup tab' },
          { key: 'tab.admin_workspacesetup.edit', description: 'Edit Workspace Setup tab' },
        ],
        components: {
          components: [
            { key: 'component.adminworkspacesetup_projectstatus.view', description: 'View project status' },
            { key: 'component.adminworkspacesetup_projectstatus.edit', description: 'Edit project status' },
            { key: 'component.adminworkspacesetup_progressbar.view', description: 'View progress bar configuration' },
            { key: 'component.adminworkspacesetup_progressbar.edit', description: 'Edit progress bar configuration' },
            { key: 'component.adminworkspacesetup_packagegroups.view', description: 'View package groups' },
            { key: 'component.adminworkspacesetup_packagegroups.edit', description: 'Edit package groups' },
            { key: 'component.adminworkspacesetup_lookbookcategories.view', description: 'View lookbook categories' },
            { key: 'component.adminworkspacesetup_lookbookcategories.edit', description: 'Edit lookbook categories' },
            { key: 'component.adminworkspacesetup_documentgroups.view', description: 'View document groups' },
            { key: 'component.adminworkspacesetup_documentgroups.edit', description: 'Edit document groups' },
            { key: 'component.adminworkspacesetup_attachmentfolders.view', description: 'View attachment folders' },
            { key: 'component.adminworkspacesetup_attachmentfolders.edit', description: 'Edit attachment folders' },
            { key: 'component.adminworkspacesetup_calendarappointmenttypes.view', description: 'View calendar appointment types' },
            { key: 'component.adminworkspacesetup_calendarappointmenttypes.edit', description: 'Edit calendar appointment types' },
            { key: 'component.adminworkspacesetup_themecustomization.view', description: 'View theme customization' },
            { key: 'component.adminworkspacesetup_themecustomization.edit', description: 'Edit theme customization' },
            { key: 'component.adminworkspacesetup_importclients.view', description: 'View Import Clients button' },
            { key: 'component.adminworkspacesetup_importclients.edit', description: 'Use Import Clients (upload CSV, confirm import)' },
            { key: 'component.adminworkspacesetup_taxes.view', description: 'View taxes' },
            { key: 'component.adminworkspacesetup_taxes.edit', description: 'Edit taxes' },
          ],
        },
      },
    ],
  },
];

// Helper function to collect all admin panel permissions
function getAllAdminPanelPermissions(): Set<string> {
  const adminPermissions = new Set<string>();
  
  // Find the Admin tab group
  const adminTabGroup = PERMISSION_GROUPS.find(group => group.tabName === 'Admin');
  if (!adminTabGroup) return adminPermissions;
  
  // Add tab-level admin permissions
  adminTabGroup.tabPermissions?.forEach(p => {
    adminPermissions.add(p.key);
  });
  
  // Add all sub-tab and component permissions
  adminTabGroup.subTabs?.forEach(subTab => {
    subTab.subTabPermissions.forEach(p => {
      adminPermissions.add(p.key);
    });
    subTab.components?.components.forEach(p => {
      adminPermissions.add(p.key);
    });
  });
  
  return adminPermissions;
}

// Helper component for permission description info icon
function PermissionInfo({ permissionKey, description }: { permissionKey: string; description?: string }) {
  if (!description) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
          aria-label={`View description for ${permissionKey}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="right" align="start">
        <div className="space-y-2">
          <div className="font-mono text-xs text-muted-foreground">{permissionKey}</div>
          <div className="text-sm">{description}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RolesPermissions() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { can } = usePermissions();

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [expandedSubTabs, setExpandedSubTabs] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [permissionDescriptions, setPermissionDescriptions] = useState<Map<string, string>>(new Map());
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);

  // Tab-level edit permission: controls ability to create roles
  const canEditTab = can('tab.admin_rolesandpermissions.edit');

  // Check if the selected role is Admin (cannot be edited)
  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isAdminRole = selectedRole?.name === 'Admin';

  useEffect(() => {
    if (workspaceId) {
      void fetchRoles();
      void fetchPermissionDescriptions();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (selectedRoleId && workspaceId) {
      void fetchRolePermissions(selectedRoleId);
    } else {
      setRolePermissions(new Set());
    }
  }, [selectedRoleId, workspaceId]);

  const fetchRoles = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('roles')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionDescriptions = async () => {
    setLoadingDescriptions(true);
    try {
      const { data, error } = await (supabase as any)
        .from('permissions')
        .select('key, description');

      if (error) throw error;

      const descriptionsMap = new Map<string, string>();
      if (data) {
        data.forEach((p: any) => {
          if (p.key && p.description) {
            descriptionsMap.set(p.key, p.description);
          }
        });
      }

      setPermissionDescriptions(descriptionsMap);
    } catch (error) {
      console.error('Error fetching permission descriptions:', error);
      // Don't show error toast - descriptions are optional
    } finally {
      setLoadingDescriptions(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    if (!workspaceId) return;
    setLoadingPermissions(true);
    try {
      // Fetch permissions for this role
      const { data, error } = await (supabase as any)
        .from('role_permissions')
        .select(`
          permission_id,
          permissions!inner (
            key
          )
        `)
        .eq('role_id', roleId);

      if (error) throw error;

      const permissionKeys = new Set<string>();
      if (data) {
        data.forEach((rp: any) => {
          if (rp.permissions?.key) {
            permissionKeys.add(rp.permissions.key);
          }
        });
      }

      // For Admin role, always ensure all admin panel permissions are included
      const selectedRole = roles.find(r => r.id === roleId);
      if (selectedRole?.name === 'Admin') {
        const adminPanelPermissions = getAllAdminPanelPermissions();
        adminPanelPermissions.forEach(key => permissionKeys.add(key));
      }

      setRolePermissions(permissionKeys);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const togglePermission = (permissionKey: string) => {
    if (!canEditTab) {
      toast.error('You do not have permission to edit permissions');
      return;
    }

    setRolePermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionKey)) {
        newSet.delete(permissionKey);
      } else {
        newSet.add(permissionKey);
      }
      return newSet;
    });
  };

  // Get all permission keys for a tab group
  const getTabPermissionKeys = (tabGroup: TabGroup): string[] => {
    const keys: string[] = [];
    
    // Add tab-level permissions
    tabGroup.tabPermissions?.forEach(p => keys.push(p.key));
    
    // Add sub-tab permissions
    tabGroup.subTabs?.forEach(subTab => {
      subTab.subTabPermissions.forEach(p => keys.push(p.key));
      subTab.components?.components.forEach(p => keys.push(p.key));
    });
    
    // Add direct components if no sub-tabs
    if (!tabGroup.subTabs && tabGroup.components) {
      tabGroup.components.components.forEach(p => keys.push(p.key));
    }
    
    return keys;
  };

  // Get all permission keys for a sub-tab
  const getSubTabPermissionKeys = (subTab: SubTabGroup): string[] => {
    const keys: string[] = [];
    
    // Add sub-tab permissions
    subTab.subTabPermissions.forEach(p => keys.push(p.key));
    
    // Add component permissions
    subTab.components?.components.forEach(p => keys.push(p.key));
    
    return keys;
  };

  // Toggle all permissions for a tab group
  const toggleTabPermissions = (tabGroup: TabGroup) => {
    if (!canEditTab) {
      toast.error('You do not have permission to edit permissions');
      return;
    }

    const tabKeys = getTabPermissionKeys(tabGroup);
    if (tabKeys.length === 0) return;

    // Check if all permissions in this tab are selected
    const allSelected = tabKeys.every(key => {
      // Skip admin panel permissions if editing Admin role
      if (isAdminRole) {
        const isAdminPanelPermission = getAllAdminPanelPermissions().has(key);
        if (isAdminPanelPermission) return true; // Always considered "selected" for Admin
      }
      return rolePermissions.has(key);
    });

    setRolePermissions((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all (except admin panel permissions for Admin role)
        tabKeys.forEach(key => {
          if (isAdminRole) {
            const isAdminPanelPermission = getAllAdminPanelPermissions().has(key);
            if (!isAdminPanelPermission) {
              newSet.delete(key);
            }
          } else {
            newSet.delete(key);
          }
        });
      } else {
        // Select all
        tabKeys.forEach(key => {
          if (isAdminRole) {
            const isAdminPanelPermission = getAllAdminPanelPermissions().has(key);
            if (!isAdminPanelPermission) {
              newSet.add(key);
            }
          } else {
            newSet.add(key);
          }
        });
      }
      return newSet;
    });
  };

  // Toggle all permissions for a sub-tab
  const toggleSubTabPermissions = (subTab: SubTabGroup) => {
    if (!canEditTab) {
      toast.error('You do not have permission to edit permissions');
      return;
    }

    const subTabKeys = getSubTabPermissionKeys(subTab);
    if (subTabKeys.length === 0) return;

    // Check if all permissions in this sub-tab are selected
    const allSelected = subTabKeys.every(key => {
      // Skip admin panel permissions if editing Admin role
      if (isAdminRole) {
        const isAdminPanelPermission = getAllAdminPanelPermissions().has(key);
        if (isAdminPanelPermission) return true; // Always considered "selected" for Admin
      }
      return rolePermissions.has(key);
    });

    setRolePermissions((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all (except admin panel permissions for Admin role)
        subTabKeys.forEach(key => {
          if (isAdminRole) {
            const isAdminPanelPermission = getAllAdminPanelPermissions().has(key);
            if (!isAdminPanelPermission) {
              newSet.delete(key);
            }
          } else {
            newSet.delete(key);
          }
        });
      } else {
        // Select all
        subTabKeys.forEach(key => {
          if (isAdminRole) {
            const isAdminPanelPermission = getAllAdminPanelPermissions().has(key);
            if (!isAdminPanelPermission) {
              newSet.add(key);
            }
          } else {
            newSet.add(key);
          }
        });
      }
      return newSet;
    });
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleId || !workspaceId || !canEditTab) {
      toast.error('Cannot save permissions');
      return;
    }

    setSavingPermissions(true);
    try {
      // For Admin role, always ensure all admin panel permissions are included
      let permissionKeys = Array.from(rolePermissions);
      if (isAdminRole) {
        const adminPanelPermissions = getAllAdminPanelPermissions();
        // Merge admin panel permissions with selected permissions
        permissionKeys = Array.from(new Set([...permissionKeys, ...adminPanelPermissions]));
      }
      const { data: permissionsData, error: permissionsError } = await (supabase as any)
        .from('permissions')
        .select('id, key')
        .in('key', permissionKeys);

      if (permissionsError) throw permissionsError;

      const permissionIdMap = new Map<string, string>();
      permissionsData?.forEach((p: any) => {
        permissionIdMap.set(p.key, p.id);
      });

      // Get current role permissions
      const { data: currentRolePermissions, error: currentError } = await (supabase as any)
        .from('role_permissions')
        .select('id, permission_id, permissions!inner(key)')
        .eq('role_id', selectedRoleId);

      if (currentError) throw currentError;

      const currentPermissionIds = new Set(
        currentRolePermissions?.map((rp: any) => rp.permission_id) || []
      );
      const currentPermissionKeys = new Set<string>(
        currentRolePermissions?.map((rp: any) => rp.permissions?.key).filter((k): k is string => typeof k === 'string') || []
      );

      // Determine what to add and what to remove
      const toAdd: string[] = [];
      const toRemove: string[] = [];

      // Find permissions to add
      permissionKeys.forEach((key) => {
        if (!currentPermissionKeys.has(key)) {
          const permissionId = permissionIdMap.get(key);
          if (permissionId) {
            toAdd.push(permissionId);
          }
        }
      });

      // Find permissions to remove
      currentPermissionKeys.forEach((key) => {
        if (!rolePermissions.has(key)) {
          const rp = currentRolePermissions?.find((rp: any) => rp.permissions?.key === key);
          if (rp) {
            toRemove.push(rp.id);
          }
        }
      });

      // Remove permissions
      if (toRemove.length > 0) {
        const { error: deleteError } = await (supabase as any)
          .from('role_permissions')
          .delete()
          .in('id', toRemove);

        if (deleteError) throw deleteError;
      }

      // Add new permissions
      if (toAdd.length > 0) {
        const inserts = toAdd.map((permissionId) => ({
          role_id: selectedRoleId,
          permission_id: permissionId,
        }));

        const { error: insertError } = await (supabase as any)
          .from('role_permissions')
          .insert(inserts);

        if (insertError) throw insertError;
      }

      toast.success('Permissions saved successfully');
    } catch (error) {
      console.error('Error saving role permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const toggleTabExpansion = (tabName: string) => {
    setExpandedTabs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tabName)) {
        newSet.delete(tabName);
      } else {
        newSet.add(tabName);
      }
      return newSet;
    });
  };

  const toggleSubTabExpansion = (subTabKey: string) => {
    setExpandedSubTabs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subTabKey)) {
        newSet.delete(subTabKey);
      } else {
        newSet.add(subTabKey);
      }
      return newSet;
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, role: RoleRecord) => {
    e.stopPropagation(); // Prevent row click from firing
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete || !workspaceId || !canEditTab) {
      toast.error('Cannot delete role');
      return;
    }

    setDeleting(true);
    try {
      // Delete the role (cascade will handle role_permissions and workspace_member_roles)
      const { error } = await (supabase as any)
        .from('roles')
        .delete()
        .eq('id', roleToDelete.id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Remove from local state
      setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
      
      // If the deleted role was selected, clear selection
      if (selectedRoleId === roleToDelete.id) {
        setSelectedRoleId(null);
        setRolePermissions(new Set());
      }

      toast.success('Role deleted successfully');
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateRole = async () => {
    if (!canEditTab) {
      toast.error('You do not have permission to create roles');
      return;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    const rawName = newRoleName.trim();
    if (!rawName) {
      toast.error('Role name is required');
      return;
    }

    // Normalize role name (lowercase for uniqueness, but store as entered)
    const normalized = rawName.toLowerCase();

    // Check if role already exists in this workspace (case-insensitive)
    const exists = roles.some(r => r.name.toLowerCase() === normalized);
    if (exists) {
      toast.error('A role with that name already exists in this workspace');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await (supabase as any)
        .from('roles')
        .insert({
          name: rawName,
          workspace_id: workspaceId,
        })
        .select('id, name')
        .single();

      if (error) throw error;

      setRoles(prev => [...prev, data]);
      setNewRoleName('');
      toast.success('Role created');
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact create-role form */}
      <Card className="border rounded-xl shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Roles &amp; Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <Input
              placeholder="New role name (e.g. Sales, Field Manager)"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="md:max-w-xs"
              disabled={!canEditTab}
            />
            <Button
              size="sm"
              onClick={handleCreateRole}
              disabled={creating || !workspaceId || !canEditTab}
            >
              {creating ? 'Creating…' : 'Create Role'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Names must be unique
          </p>
        </CardContent>
      </Card>

      {/* Roles list with permissions editor */}
      <Card className="border rounded-xl shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Roles &amp; Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-4 text-muted-foreground">Loading roles…</div>
          ) : roles.length === 0 ? (
            <div className="py-4 text-muted-foreground">No roles defined yet for this workspace.</div>
          ) : (
            <div className="space-y-2">
              {roles.map((role) => {
                const isAdmin = role.name === 'Admin';
                return (
                  <div key={role.id} className="border rounded-lg">
                    <div
                      onClick={() => setSelectedRoleId(selectedRoleId === role.id ? null : role.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {selectedRoleId === role.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{role.name}</span>
                        {isAdmin && (
                          <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                            Always has all admin panel permissions
                          </span>
                        )}
                      </div>
                      {!isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteClick(e, role)}
                          disabled={!canEditTab || deleting}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {selectedRoleId === role.id && (
                      <div className="p-4 border-t bg-muted/20">
                        {loadingPermissions ? (
                          <div className="py-4 text-muted-foreground text-sm">Loading permissions…</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-muted-foreground">
                                Select permissions for this role
                              </p>
                              <Button
                                size="sm"
                                onClick={saveRolePermissions}
                                disabled={savingPermissions || !canEditTab}
                              >
                                {savingPermissions ? 'Saving…' : 'Save Permissions'}
                              </Button>
                            </div>

                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                              {PERMISSION_GROUPS
                                .filter((tabGroup) => {
                                  // Hide Admin tab group when editing Admin role
                                  if (isAdminRole && tabGroup.tabName === 'Admin') {
                                    return false;
                                  }
                                  return true;
                                })
                                .map((tabGroup) => {
                                  const tabKey = tabGroup.tabName;
                                  const isTabExpanded = expandedTabs.has(tabKey);
                                  
                                  return (
                                  <div key={tabKey} className="border rounded-lg">
                                    {/* Tab Level */}
                                    <div className="flex items-center justify-between">
                                      <button
                                        onClick={() => toggleTabExpansion(tabKey)}
                                        className="flex-1 flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                                      >
                                        <span className="font-medium text-sm">{tabGroup.tabName}</span>
                                        {isTabExpanded ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                      </button>
                                      {isTabExpanded && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTabPermissions(tabGroup);
                                          }}
                                          disabled={!canEditTab || (isAdminRole && tabGroup.tabName === 'Admin')}
                                          className="h-8 px-2 text-xs mr-2"
                                        >
                                          Toggle All
                                        </Button>
                                      )}
                                    </div>

                                    {isTabExpanded && (
                                      <div className="p-2 space-y-2 border-t">
                                        {/* Tab Permissions */}
                                        {tabGroup.tabPermissions?.map((permission) => {
                                          const dbDescription = permissionDescriptions.get(permission.key);
                                          const isAdminPanelPermission = getAllAdminPanelPermissions().has(permission.key);
                                          const isDisabled = !canEditTab || (isAdminRole && isAdminPanelPermission);
                                          return (
                                            <div
                                              key={permission.key}
                                              className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30"
                                            >
                                              <Checkbox
                                                id={permission.key}
                                                checked={rolePermissions.has(permission.key)}
                                                onCheckedChange={() => togglePermission(permission.key)}
                                                disabled={isDisabled}
                                              />
                                              <label
                                                htmlFor={permission.key}
                                                className="flex-1 text-sm cursor-pointer flex items-center gap-1"
                                              >
                                                <div className="font-mono text-xs text-muted-foreground">
                                                  {permission.key}
                                                </div>
                                                <PermissionInfo permissionKey={permission.key} description={dbDescription} />
                                              </label>
                                            </div>
                                          );
                                        })}

                                        {/* Sub-tabs */}
                                        {tabGroup.subTabs?.map((subTab) => {
                                          const subTabKey = `${tabKey}_${subTab.subTabName}`;
                                          const isSubTabExpanded = expandedSubTabs.has(subTabKey);
                                          
                                          return (
                                            <div key={subTabKey} className="border rounded-md ml-2">
                                              <div className="flex items-center justify-between">
                                                <button
                                                  onClick={() => toggleSubTabExpansion(subTabKey)}
                                                  className="flex-1 flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                                                >
                                                  <span className="font-medium text-xs">{subTab.subTabName}</span>
                                                  {isSubTabExpanded ? (
                                                    <ChevronDown className="h-3 w-3" />
                                                  ) : (
                                                    <ChevronRight className="h-3 w-3" />
                                                  )}
                                                </button>
                                                {isSubTabExpanded && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleSubTabPermissions(subTab);
                                                    }}
                                                    disabled={!canEditTab}
                                                    className="h-7 px-2 text-xs mr-2"
                                                  >
                                                    Toggle All
                                                  </Button>
                                                )}
                                              </div>

                                              {isSubTabExpanded && (
                                                <div className="p-2 space-y-2 border-t">
                                                  {/* Sub-tab Permissions */}
                                                  {subTab.subTabPermissions.map((permission) => {
                                                    const dbDescription = permissionDescriptions.get(permission.key);
                                                    const isAdminPanelPermission = getAllAdminPanelPermissions().has(permission.key);
                                                    const isDisabled = !canEditTab || (isAdminRole && isAdminPanelPermission);
                                                    return (
                                                      <div
                                                        key={permission.key}
                                                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30"
                                                      >
                                                        <Checkbox
                                                          id={permission.key}
                                                          checked={rolePermissions.has(permission.key)}
                                                          onCheckedChange={() => togglePermission(permission.key)}
                                                          disabled={isDisabled}
                                                        />
                                                        <label
                                                          htmlFor={permission.key}
                                                          className="flex-1 text-sm cursor-pointer flex items-center gap-1"
                                                        >
                                                          <div className="font-mono text-xs text-muted-foreground">
                                                            {permission.key}
                                                          </div>
                                                          <PermissionInfo permissionKey={permission.key} description={dbDescription} />
                                                        </label>
                                                      </div>
                                                    );
                                                  })}

                                                  {/* Components */}
                                                  {subTab.components?.components.map((permission) => {
                                                    const dbDescription = permissionDescriptions.get(permission.key);
                                                    const isAdminPanelPermission = getAllAdminPanelPermissions().has(permission.key);
                                                    const isDisabled = !canEditTab || (isAdminRole && isAdminPanelPermission);
                                                    return (
                                                      <div
                                                        key={permission.key}
                                                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30 ml-2"
                                                      >
                                                        <Checkbox
                                                          id={permission.key}
                                                          checked={rolePermissions.has(permission.key)}
                                                          onCheckedChange={() => togglePermission(permission.key)}
                                                          disabled={isDisabled}
                                                        />
                                                        <label
                                                          htmlFor={permission.key}
                                                          className="flex-1 text-sm cursor-pointer flex items-center gap-1"
                                                        >
                                                          <div className="font-mono text-xs text-muted-foreground">
                                                            {permission.key}
                                                          </div>
                                                          <PermissionInfo permissionKey={permission.key} description={dbDescription} />
                                                        </label>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}

                                        {/* Direct Components (if tab has components but no sub-tabs) */}
                                        {!tabGroup.subTabs && tabGroup.components?.components.map((permission) => {
                                          const dbDescription = permissionDescriptions.get(permission.key);
                                          const isAdminPanelPermission = getAllAdminPanelPermissions().has(permission.key);
                                          const isDisabled = !canEditTab || (isAdminRole && isAdminPanelPermission);
                                          return (
                                            <div
                                              key={permission.key}
                                              className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30"
                                            >
                                              <Checkbox
                                                id={permission.key}
                                                checked={rolePermissions.has(permission.key)}
                                                onCheckedChange={() => togglePermission(permission.key)}
                                                disabled={isDisabled}
                                              />
                                              <label
                                                htmlFor={permission.key}
                                                className="flex-1 text-sm cursor-pointer flex items-center gap-1"
                                              >
                                                <div className="font-mono text-xs text-muted-foreground">
                                                  {permission.key}
                                                </div>
                                                <PermissionInfo permissionKey={permission.key} description={dbDescription} />
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Role Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
              Users assigned to this role will lose their permissions until they are assigned to a new role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


