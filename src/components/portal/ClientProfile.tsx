import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Project, LineItem, IncomingPayment, OutgoingPayment } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { QuoteBuilder } from "./QuoteBuilder";
import { ChangeOrderBuilder } from "./ChangeOrderBuilder";
import PaymentsTab from "./PaymentsTab";
import LookBookTab from "./LookBookTab";
import { ActivityTab } from "./ActivityTab";
import { DraftsTab } from "./DraftsTab";
import { MaterialsTab } from "./MaterialsTab";
import { ProjectsTab } from "./ProjectsTab";
import { AttachmentsTab } from "./AttachmentsTab";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Money } from "@/contexts/PriceContext";
import { computeTotals } from "@/utils/calculations";
import { useProjectVersions, useActiveDraft, useChangeOrders, usePayments, useAssignedUser } from "@/hooks/useProjectData";
import { useLocalStorageCache, useCacheKey, useClearProjectCache } from "@/hooks/useLocalStorageCache";
import { isDemoMode } from "@/utils/demoMode";
import { getMockDbProjects, getMockVersionMaterials, getMockVersionLabor, getMockMaterialOptions, getMockLaborOptions } from "@/utils/mockData";

export function ClientProfile({ project, onClose, hidePrices, setHidePrices, userRole }: { project: Project; onClose: () => void; hidePrices: boolean; setHidePrices: (value: boolean) => void; userRole: string }) {
  const params = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { currentWorkspace } = useWorkspace();
  const { projectStatuses } = useProjectStatuses(currentWorkspace?.id);
  const cacheKey = useCacheKey(); // Get cache key generator with user/workspace context
  const clearProjectCache = useClearProjectCache(); // Get project cache clearer with user/workspace context
  
  // Check if this is a client without a real project (project.id === project.clientId indicates placeholder)
  const isClientWithoutProject = project.id === project.clientId;
  
  // Get status names for logic checks
  const soldStatusName = projectStatuses.find(s => s.name === "Sold")?.name || "Sold";
  
  // If client has no project, default to Client Projects tab, otherwise use urlTab or Activity
  const urlTab = params.tab || (isClientWithoutProject ? 'Client Projects' : 'Activity');
  
  // Cache all temporary state to localStorage (with user/workspace scoping)
  const projectId = isClientWithoutProject ? '' : project.id;
  const [tab, setTab, clearTabCache] = useLocalStorageCache(
    cacheKey('clientprofile', projectId, undefined, 'tab'),
    urlTab
  );
  const [quoteItems, setQuoteItems, clearQuoteItemsCache] = useLocalStorageCache<LineItem[]>(
    cacheKey('clientprofile', projectId, 'Contract Builder', 'quoteItems'),
    []
  );
  const [changeItems, setChangeItems, clearChangeItemsCache] = useLocalStorageCache<LineItem[]>(
    cacheKey('clientprofile', projectId, 'Change Orders', 'changeItems'),
    []
  );
  const [baselineChangeItems, setBaselineChangeItems, clearBaselineChangeItemsCache] = useLocalStorageCache<LineItem[]>(
    cacheKey('clientprofile', projectId, 'Change Orders', 'baselineChangeItems'),
    []
  );
  const [selectedDraft, setSelectedDraft, clearSelectedDraftCache] = useLocalStorageCache<any>(
    cacheKey('clientprofile', projectId, undefined, 'selectedDraft'),
    null
  );
  const [selectedVersionId, setSelectedVersionId, clearSelectedVersionIdCache] = useLocalStorageCache<string | null>(
    cacheKey('clientprofile', projectId, undefined, 'selectedVersionId'),
    null
  );
  const [outgoing, setOutgoing, clearOutgoingCache] = useLocalStorageCache<OutgoingPayment[]>(
    cacheKey('clientprofile', projectId, 'Payments', 'outgoing'),
    []
  );
  const [incomingPayments, setIncomingPayments, clearIncomingPaymentsCache] = useLocalStorageCache<IncomingPayment[]>(
    cacheKey('clientprofile', projectId, 'Payments', 'incomingPayments'),
    []
  );
  const [editingDraftVersionId, setEditingDraftVersionId, clearEditingDraftVersionIdCache] = useLocalStorageCache<string | null>(
    cacheKey('clientprofile', projectId, undefined, 'editingDraftVersionId'),
    null
  );
  const [editingChangeOrderVersionId, setEditingChangeOrderVersionId, clearEditingChangeOrderVersionIdCache] = useLocalStorageCache<string | null>(
    cacheKey('clientprofile', projectId, 'Change Orders', 'editingChangeOrderVersionId'),
    null
  );
  
  const isUserActionRef = useRef(false);

  // Map tab names to permission keys (view)
  const tabToPermissionKey: Record<string, string> = {
    'Client Projects': 'tab.projects_clientprojects.view',
    'Activity': 'tab.projects_activity.view',
    'LookBook': 'tab.projects_lookbook.view',
    'Contract Builder': 'tab.projects_contractbuilder.view',
    'Change Orders': 'tab.projects_changeorders.view',
    'Materials': 'tab.projects_materials.view',
    'Drafts': 'tab.projects_drafts.view',
    'Payments': 'tab.projects_payments.view',
    'Attachments': 'tab.projects_attachments.view',
  };
  // Map tab names to edit permission keys
  const tabToEditPermissionKey: Record<string, string> = {
    'Client Projects': 'tab.projects_clientprojects.edit',
    'Activity': 'tab.projects_activity.edit',
    'LookBook': 'tab.projects_lookbook.edit',
    'Contract Builder': 'tab.projects_contractbuilder.edit',
    'Change Orders': 'tab.projects_changeorders.edit',
    'Materials': 'tab.projects_materials.edit',
    'Drafts': 'tab.projects_drafts.edit',
    'Payments': 'tab.projects_payments.edit',
    'Attachments': 'tab.projects_attachments.edit',
  };

  // Check if a tab is visible using new permission system
  const isTabVisible = (tabName: string): boolean => {
    const permissionKey = tabToPermissionKey[tabName];
    if (!permissionKey) return true; // Default to visible if not in mapping
    
    return can(permissionKey);
  };

  // Check if a tab has write access using new permission system
  // If there's no .edit permission, it's view-only (assuming .view exists)
  const hasWriteAccess = (tabName: string): boolean => {
    const editPermissionKey = tabToEditPermissionKey[tabName];
    if (!editPermissionKey) return false; // No edit permission mapping = view-only
    
    return can(editPermissionKey);
  };

  // Use custom hooks for data fetching - only fetch if there's a real project
  const { versions: projectVersions, isLoading, refetch: refetchVersions } = useProjectVersions(isClientWithoutProject ? '' : project.id);
  const { activeDraftItems, activeDraftMultiplier, activeVersionId, activeDraftName, refetch: refetchActiveDraft } = useActiveDraft(isClientWithoutProject ? '' : project.id, !isClientWithoutProject && (tab === "Activity" || tab === "Materials" || tab === "Contract Builder"));
  const { changeOrderVersions, activeChangeOrders, refetch: refetchChangeOrders } = useChangeOrders(isClientWithoutProject ? '' : project.id, !isClientWithoutProject && (tab === "Activity" || tab === "Change Orders" || tab === "Materials"));
  const { incoming, refetch: refetchPayments } = usePayments(isClientWithoutProject ? '' : project.id, !isClientWithoutProject && tab === "Payments");
  const assignedUserName = useAssignedUser(project.assignedUserId);

  const [currentDraftVersion, setCurrentDraftVersion] = useState<string | null>(null);

  // Update current draft version when active version changes
  useEffect(() => {
    if (activeVersionId) {
      setCurrentDraftVersion(activeVersionId);
    }
  }, [activeVersionId]);


  // Set initial route if tab param is missing
  useEffect(() => {
    if (!params.tab) {
      // If client has no project, default to Client Projects tab
      const defaultTab = isClientWithoutProject ? 'Client Projects' : tab;
      navigate(`/projects/${project.clientId}/${project.id}/${defaultTab}`, { replace: true });
    } else if (params.tab !== tab) {
      // Sync tab with route param if they differ (e.g., on initial mount with cached tab)
      setTab(params.tab);
    }
  }, []); // Only run on mount

  // Redirect if current tab is not visible, or if client has no project and tab is not Client Projects
  useEffect(() => {
    // If client has no project, only allow Client Projects tab
    if (isClientWithoutProject && tab !== 'Client Projects') {
      navigate(`/projects/${project.clientId}/${project.id}/Client Projects`, { replace: true });
      return;
    }
    
    if (!isTabVisible(tab)) {
      // Find first visible tab
      // If client has no project, only show Client Projects
      const availableTabs = isClientWithoutProject 
        ? ['Client Projects']
        : ['Client Projects','Activity','LookBook','Contract Builder','Change Orders','Materials','Drafts','Payments','Attachments'];
      
      const visibleTabs = availableTabs.filter((t) => {
        if (!isTabVisible(t)) return false;
        if (project.status !== soldStatusName && t === 'Change Orders') return false;
        if (project.status === soldStatusName && t === 'Contract Builder') return false;
        return true;
      });
      
      if (visibleTabs.length > 0) {
        const defaultTab = visibleTabs[0];
        navigate(`/projects/${project.clientId}/${project.id}/${defaultTab}`, { replace: true });
      }
    }
  }, [tab, isClientWithoutProject]);

  // Sync tab with route when route changes (browser back/forward)
  useEffect(() => {
    if (!isUserActionRef.current) {
      const urlTab = params.tab || 'Activity';
      if (urlTab !== tab) {
        setTab(urlTab);
      }
    }
    isUserActionRef.current = false;
  }, [params.tab]);

  // Update route when tab changes from user action
  const handleTabChange = (newTab: string) => {
    isUserActionRef.current = true;
    setTab(newTab);
    // Navigate to the new tab route
    navigate(`/projects/${project.clientId}/${project.id}/${newTab}`, { replace: true });
  };

  // Handle draft changes from Materials or Quote Builder
  const handleDraftChanged = async (newVersionId: string, newDraftName: string) => {
    console.log("Draft changed:", newVersionId, newDraftName);
    
    // Refetch active draft to get latest data
    await refetchActiveDraft();
    
    // Update current draft version
    setCurrentDraftVersion(newVersionId);
    
    // Set the newly saved draft as the editing draft (so it loads automatically)
    setEditingDraftVersionId(newVersionId);
    
    // Show notification
    toast.success(`Saved and now editing: ${newDraftName}`);
  };
  
  // Clear all cached state for this project (call after saves or project changes)
  const clearAllCachedState = () => {
    if (projectId) {
      if (projectId) clearProjectCache(projectId);
      // Also clear individual caches as fallback
      clearTabCache();
      clearQuoteItemsCache();
      clearChangeItemsCache();
      clearBaselineChangeItemsCache();
      clearSelectedDraftCache();
      clearSelectedVersionIdCache();
      clearOutgoingCache();
      clearIncomingPaymentsCache();
      clearEditingDraftVersionIdCache();
      clearEditingChangeOrderVersionIdCache();
    }
  };
  
  // Clear cache when project changes
  const previousProjectIdRef = useRef<string | undefined>(projectId);
  useEffect(() => {
    if (previousProjectIdRef.current && previousProjectIdRef.current !== projectId) {
      // Project changed - clear old project's cache
      if (previousProjectIdRef.current) clearProjectCache(previousProjectIdRef.current);
    }
    previousProjectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    // console.log('Tab changed to:', tab, 'Project ID:', project.id);
    if (tab === "Drafts") {
      refetchVersions();
    }
    if (tab === "Change Orders") {
      // Auto-load active draft for change orders
      loadActiveDraftForChangeOrders();
    }
  }, [tab, project.id, project.status]);

  const loadActiveDraftForChangeOrders = async () => {
    try {
      if (isDemoMode()) {
        const mockProjects = getMockDbProjects();
        const dbProject = mockProjects.find((p: any) => p.project_id === project.id);
        const activeVersionId = dbProject?.active_version;
        if (!activeVersionId) {
          setChangeItems([]);
          setBaselineChangeItems([]);
          return;
        }
        const versionLabor = getMockVersionLabor().filter((vl: any) => vl.version_id === activeVersionId);
        const versionMaterials = getMockVersionMaterials().filter((vm: any) => vm.version_id === activeVersionId);
        const laborOpts = getMockLaborOptions();
        const materialOpts = getMockMaterialOptions();
        const items: LineItem[] = [];
        versionLabor.forEach((item: any) => {
          const opt = laborOpts.find((l: any) => l.id === item.labor_id);
          items.push({
            id: item.labor_id,
            name: item.item_name || opt?.name || "Labor",
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: "labor",
          });
        });
        versionMaterials.forEach((item: any) => {
          const opt = materialOpts.find((m: any) => m.id === item.material_id);
          items.push({
            id: item.material_id,
            name: item.item_name || opt?.name || "Material",
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: "material",
          });
        });
        setChangeItems(items);
        setBaselineChangeItems(JSON.parse(JSON.stringify(items)));
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('active_version')
        .eq('project_id', project.id)
        .single();

      if (projectError || !projectData?.active_version) {
        setChangeItems([]);
        setBaselineChangeItems([]);
        return;
      }

      const activeVersionId = projectData.active_version;

      const { data: laborData } = await supabase
        .from('version_labor')
        .select('*, labor_options:labor_id (*)')
        .eq('version_id', activeVersionId);

      const { data: materialData } = await supabase
        .from('version_materials')
        .select('*, material_options:material_id (*)')
        .eq('version_id', activeVersionId);

      const items: LineItem[] = [];

      laborData?.forEach((item: any) => {
        if (item.labor_options) {
          items.push({
            id: item.labor_options.id,
            name: item.item_name || item.labor_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: 'labor'
          });
        }
      });

      materialData?.forEach((item: any) => {
        if (item.material_options) {
          items.push({
            id: item.material_options.id,
            name: item.item_name || item.material_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: 'material'
          });
        }
      });

      setChangeItems(items);
      setBaselineChangeItems(JSON.parse(JSON.stringify(items)));
    } catch (error) {
      console.error('Error loading active draft for change orders:', error);
      toast.error("Failed to load active draft");
    }
  };

  const handleMarkSold = async () => {
    try {
      // Find the status_id for "Sold" status
      const soldStatus = projectStatuses.find(s => s.name === soldStatusName);
      if (!soldStatus) {
        toast.error("Sold status not found");
        return;
      }

      const { error } = await supabase
        .from('projects')
        .update({ status_id: soldStatus.id })
        .eq('project_id', project.id);

      if (error) throw error;

      toast.success("Project marked as Sold!");
      
      // Update local project status
      project.status = soldStatusName;
      
      // Refetch project data and versions to show updated status
      // No need to reload the entire page
      await refetchVersions();
    } catch (error) {
      console.error('Error marking project as sold:', error);
      toast.error("Failed to mark project as sold");
    }
  };

  const handleMarkAsSold = async (versionId: string) => {
    try {
      // Find the status_id for "Sold" status
      const soldStatus = projectStatuses.find(s => s.name === soldStatusName);
      if (!soldStatus) {
        toast.error("Sold status not found");
        return;
      }

      // First, set the version as active
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          active_version: versionId,
          status_id: soldStatus.id
        })
        .eq('project_id', project.id);

      if (updateError) throw updateError;

      toast.success("Draft set as active and project marked as Sold!");
      
      // Update local project status
      project.status = soldStatusName;
      
      // Refetch project data and versions to show updated status
      // No need to reload the entire page
      await refetchVersions();
      await refetchActiveDraft();
    } catch (error) {
      console.error('Error marking project as sold:', error);
      toast.error("Failed to mark project as sold");
    }
  };




  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('draft')) {
      return 'bg-gray-50 border-gray-200';
    }
    if (status.toLowerCase().includes('change order')) {
      return 'bg-blue-50 border-blue-200';
    }
    return 'bg-white border-slate-200';
  };

  const getVersionStatusColor = (status: string, isActive: boolean) => {
    if (isActive && project.status === soldStatusName) {
      return 'bg-success/20 border-success/40';
    }
    if (isActive) {
      return 'bg-success/10 border-success/30';
    }
    if (status.toLowerCase().includes('draft')) {
      return 'bg-muted border-border';
    }
    if (status.toLowerCase().includes('change order')) {
      return 'bg-primary/5 border-primary/20';
    }
    return 'bg-card border-border';
  };

  const getDisplayStatus = (status: string, isActive: boolean, isChangeOrderActive?: boolean) => {
    if (isActive && project.status === soldStatusName) {
      return 'Sold';
    }
    if (isActive) {
      return `Active ${status}`;
    }
    if (isChangeOrderActive && status.toLowerCase().includes('change order')) {
      return `${status} (Active)`;
    }
    return status;
  };

  const handleToggleChangeOrderActive = async (versionId: string, currentActive: boolean) => {
    if (isDemoMode()) {
      toast.info("Updating change order status is disabled in demo mode.");
      return;
    }
    try {
      const { error } = await supabase
        .from('project_versions')
        .update({ is_active: !currentActive })
        .eq('version_id', versionId);

      if (error) throw error;

      toast.success(currentActive ? 'Change order marked as inactive' : 'Change order marked as active');
      await refetchVersions();
    } catch (error) {
      console.error('Error toggling change order active status:', error);
      toast.error('Failed to update change order status');
    }
  };

  const handleDraftSelect = (draft: any) => {
    setSelectedDraft(draft);
  };

  const handleVersionClick = async (version: any) => {
    try {
      if (isDemoMode()) {
        const versionLabor = getMockVersionLabor().filter((vl: any) => vl.version_id === version.version_id);
        const versionMaterials = getMockVersionMaterials().filter((vm: any) => vm.version_id === version.version_id);
        const laborOpts = getMockLaborOptions();
        const materialOpts = getMockMaterialOptions();
        const loadedItems: LineItem[] = [];
        versionLabor.forEach((item: any) => {
          const opt = laborOpts.find((l: any) => l.id === item.labor_id);
          loadedItems.push({
            id: item.labor_id,
            kind: "labor",
            name: item.item_name || opt?.name || "Labor",
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
          });
        });
        versionMaterials.forEach((item: any) => {
          const opt = materialOpts.find((m: any) => m.id === item.material_id);
          loadedItems.push({
            id: item.material_id,
            kind: "material",
            name: item.item_name || opt?.name || "Material",
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct || 0),
          });
        });
        const isChangeOrder = version.status?.toLowerCase().includes("change order");
        if (isChangeOrder) {
          setChangeItems(loadedItems);
          setSelectedDraft(version);
          setEditingChangeOrderVersionId(version.version_id);
          setTab("Change Orders");
        } else {
          setQuoteItems(loadedItems);
          setEditingDraftVersionId(version.version_id);
          setTab("Contract Builder");
        }
        toast.success(`Loaded ${version.status} - Version ${version.version_number}`);
        return;
      }

      // Fetch labor items for this version
      const { data: laborData, error: laborError } = await supabase
        .from('version_labor')
        .select(`
          *,
          labor_options (*)
        `)
        .eq('version_id', version.version_id);

      if (laborError) throw laborError;

      // Fetch material items for this version
      const { data: materialData, error: materialError } = await supabase
        .from('version_materials')
        .select(`
          *,
          material_options (*)
        `)
        .eq('version_id', version.version_id);

      if (materialError) throw materialError;

      // Convert to LineItem format
      const loadedItems: LineItem[] = [];

      if (laborData) {
        laborData.forEach((item: any) => {
          loadedItems.push({
            id: item.labor_id,
            kind: 'labor',
            name: item.item_name || item.labor_options?.name || '',
            qty: Number(item.quantity),
            unitPrice: Number(item.price)
          });
        });
      }

      if (materialData) {
        materialData.forEach((item: any) => {
          loadedItems.push({
            id: item.material_id,
            kind: 'material',
            name: item.item_name || item.material_options?.name || '',
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct || 0)
          });
        });
      }

      const isChangeOrder = version.status.toLowerCase().includes('change order');

      if (isChangeOrder) {
        setChangeItems(loadedItems);
        setSelectedDraft(version);
        setEditingChangeOrderVersionId(version.version_id);
        setTab('Change Orders');
      } else {
        setQuoteItems(loadedItems);
        setEditingDraftVersionId(version.version_id);
        setTab('Contract Builder');
      }

      toast.success(`Loaded ${version.status} - Version ${version.version_number}`);
    } catch (error) {
      console.error('Error loading version data:', error);
      toast.error("Failed to load version data");
    }
  };


  const handleSetAsActive = async () => {
    if (!selectedVersionId) {
      toast.error("Please select a draft version first");
      return;
    }

    // Check if project is sold - users without write access cannot modify sold projects
    if (project.status === soldStatusName) {
      toast.error("Cannot change active draft for sold projects.");
      return;
    }

    const selectedVersion = projectVersions.find(v => v.version_id === selectedVersionId);
    
    if (!selectedVersion) {
      toast.error("Selected version not found");
      return;
    }

    // Check if it's a draft (not a change order)
    if (!selectedVersion.status.toLowerCase().includes('draft')) {
      toast.error("Only draft versions can be set as active");
      return;
    }

    try {
      // Update the project's active_version
      const { error: updateError } = await supabase
        .from('projects')
        .update({ active_version: selectedVersionId } as any)
        .eq('project_id', project.id);

      if (updateError) throw updateError;

      toast.success("Active draft updated successfully!");
      
      // Refresh the versions list
      await refetchVersions();
      
      // Clear selection
      setSelectedVersionId(null);
    } catch (error) {
      console.error('Error setting active draft:', error);
      toast.error("Failed to set active draft");
    }
  };

  const handleDeleteVersion = async (versionId?: string) => {
    // Ensure we have a valid string UUID, not an event object or other value
    let versionIdToDelete: string | null = null;
    
    if (versionId && typeof versionId === 'string') {
      versionIdToDelete = versionId;
    } else if (selectedVersionId && typeof selectedVersionId === 'string') {
      versionIdToDelete = selectedVersionId;
    }
    
    if (!versionIdToDelete) {
      toast.error("Please select a version to delete");
      return;
    }

    try {
      // First, try to fetch the version from the database to verify it exists and get its details
      const { data: versionData, error: fetchError } = await supabase
        .from('project_versions')
        .select('*')
        .eq('version_id', versionIdToDelete)
        .eq('workspace_id', currentWorkspace?.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching version:', fetchError);
        toast.error("Failed to verify version");
        return;
      }

      if (!versionData) {
        toast.error("Version not found in database");
        return;
      }

      // Check if it's the active version by comparing with project's active_version
      const { data: projectData } = await supabase
        .from('projects')
        .select('active_version')
        .eq('project_id', project.id)
        .eq('workspace_id', currentWorkspace?.id)
        .single();

      const isActive = projectData?.active_version === versionIdToDelete;

      // Prevent deletion of active version
      if (isActive) {
        toast.error("Cannot delete the active version");
        return;
      }

      // Check if it's a change order
      const isChangeOrder = versionData.status?.toLowerCase().includes('change order');

      // Check if project is sold - users without write access cannot modify sold projects
      // Exception: Change orders can be deleted even from sold projects
      if (project.status === soldStatusName && !isChangeOrder) {
        toast.error("Cannot delete versions from sold projects.");
        return;
      }

      // Delete associated labor items
      const { error: laborError } = await supabase
        .from('version_labor')
        .delete()
        .eq('version_id', versionIdToDelete);

      if (laborError) throw laborError;

      // Delete associated material items
      const { error: materialError } = await supabase
        .from('version_materials')
        .delete()
        .eq('version_id', versionIdToDelete);

      if (materialError) throw materialError;

      // Delete material revisions
      const { error: revisionsError } = await supabase
        .from('material_revisions')
        .delete()
        .eq('version_id', versionIdToDelete);

      if (revisionsError) throw revisionsError;

      // Delete the version
      const { error: versionError } = await supabase
        .from('project_versions')
        .delete()
        .eq('version_id', versionIdToDelete)
        .eq('workspace_id', currentWorkspace?.id);

      if (versionError) throw versionError;

      toast.success("Version deleted successfully!");
      
      // Refresh the versions list
      await refetchVersions();
      
      // Clear selection if the deleted version was the selected one
      if (selectedVersionId === versionIdToDelete) {
        setSelectedVersionId(null);
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error("Failed to delete version");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* <div className="sticky top-0 bg-background border-b z-10 shadow-sm"> */}
          {/* </div> */}

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="flex justify-start border-b bg-transparent mb-0 overflow-x-auto">
            {/* If client has no project, only show Client Projects tab */}
            {(isClientWithoutProject 
              ? ['Client Projects'] 
              : ['Client Projects','Activity','LookBook','Contract Builder','Change Orders','Materials','Drafts','Payments','Attachments']
            ).filter((t) => {
              // Check permissions first - if not visible, hide the tab
              if (!isTabVisible(t)) return false;
              
              // If project is NOT sold, hide Change Orders
              if (project.status !== soldStatusName && t === 'Change Orders') return false;
              
              // If project IS sold, hide Contract Builder
              if (project.status === soldStatusName && t === 'Contract Builder') return false;
              
              return true;
            }).map((t)=> (
              <TabsTrigger 
                key={`tab-trigger-${t}`} 
                value={t} 
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-32">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsContent value="Activity" className="space-y-4">
            <ActivityTab
              project={project}
              assignedUserName={assignedUserName}
              activeDraftItems={activeDraftItems}
              activeDraftMultiplier={activeDraftMultiplier}
              activeDraftName={activeDraftName}
              activeDraftVersionId={activeVersionId}
              changeOrderVersions={changeOrderVersions}
              incoming={incoming}
              onMarkSold={handleMarkSold}
              readOnly={!hasWriteAccess('Activity')}
              onClientDeleted={onClose}
              onProjectDeleted={onClose}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="LookBook">
            <LookBookTab 
              projectId={project.id} 
              project={project}
              activeDraftItems={activeDraftItems}
              activeDraftMultiplier={activeDraftMultiplier}
              readOnly={!hasWriteAccess('LookBook')} 
              userRole={userRole} 
            />
          </TabsContent>

          <TabsContent value="Client Projects">
            <ProjectsTab
              currentProject={project} 
              onProjectChange={() => {
                // Close the profile and reload
                onClose();
              }}
              readOnly={!hasWriteAccess('Client Projects')}
            />
          </TabsContent>

          <TabsContent value="Contract Builder">
            <QuoteBuilder 
              items={quoteItems} 
              setItems={setQuoteItems} 
              project={project}
              editingVersionId={editingDraftVersionId}
              onClearEditing={() => {
                setEditingDraftVersionId(null);
                // When clearing editing state (creating new draft), items should only come from cache
                // No need to manually clear - useLocalStorageCache will handle it
                // Items will be empty array if no cache exists, or loaded from cache if available
              }}
              readOnly={project.status === soldStatusName || !hasWriteAccess('Contract Builder')}
              isSoldProject={project.status === soldStatusName}
              soldProjectMultiplier={activeDraftMultiplier}
              onDraftChanged={handleDraftChanged}
            />
          </TabsContent>

          <TabsContent value="Change Orders">
            <ChangeOrderBuilder 
              items={changeItems} 
              setItems={setChangeItems} 
              project={project} 
              selectedDraft={selectedDraft}
              onDraftSelect={handleDraftSelect}
              isSoldProject={project.status === soldStatusName}
              soldProjectMultiplier={activeDraftMultiplier}
              baselineItems={baselineChangeItems}
              editingVersionId={editingChangeOrderVersionId}
              onClearEditing={() => {
                setEditingChangeOrderVersionId(null);
                // Clear cached change order items after save
                clearChangeItemsCache();
                clearBaselineChangeItemsCache();
              }}
              readOnly={!hasWriteAccess('Change Orders')}
            />
          </TabsContent>

          <TabsContent value="Materials">
            <MaterialsTab 
              activeDraftMaterials={activeDraftItems
                .filter(item => item.kind === 'material')
                .map(item => ({
                  id: item.id,
                  name: item.name,
                  qty: item.qty,
                  price: item.unitPrice
                }))
              }
              versionId={activeVersionId}
              activeChangeOrders={activeChangeOrders}
              project={project}
              multiplier={activeDraftMultiplier}
              readOnly={!hasWriteAccess('Materials')}
              userRole={userRole}
              onDraftChanged={handleDraftChanged}
              isSoldProject={project.status === soldStatusName}
              activeDraftName={activeDraftName}
            />
          </TabsContent>

          <TabsContent value="Drafts" className="space-y-4">
            <DraftsTab
              project={project}
              projectVersions={projectVersions}
              selectedVersionId={selectedVersionId}
              userRole={userRole}
              onVersionClick={handleVersionClick}
              onToggleChangeOrderActive={handleToggleChangeOrderActive}
              onSetSelectedVersion={setSelectedVersionId}
              onSetAsActive={handleSetAsActive}
              onDeleteVersion={handleDeleteVersion}
              onMarkAsSold={handleMarkAsSold}
              getVersionStatusColor={getVersionStatusColor}
              getDisplayStatus={getDisplayStatus}
              readOnly={!hasWriteAccess('Drafts')}
            />
          </TabsContent>

          <TabsContent value="Payments">
            <div className="relative">
              <PaymentsTab 
                projectId={project.id}
                project={project}
                userRole={userRole}
                readOnly={project.status !== soldStatusName || !hasWriteAccess('Payments')}
              />
              {/* Overlay: Only blur if project is NOT sold AND user doesn't have write access */}
              {/* If project is sold, keep it readable even without edit permission */}
              {project.status !== 'Sold' && !hasWriteAccess('Payments') && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto cursor-not-allowed z-10" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="Attachments">
            <AttachmentsTab projectId={project.id} readOnly={!hasWriteAccess('Attachments')} />
          </TabsContent>
        </Tabs>
      </div>
      
    </div>
    </div>
  );
}