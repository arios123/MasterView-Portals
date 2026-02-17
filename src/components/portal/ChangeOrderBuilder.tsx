import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LineItem, Project } from "@/types";
import { Money, usePrice } from "@/contexts/PriceContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Save, PlusCircle, Trash2, RotateCcw, GitCompare, Menu } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
// PaymentSplitter not used in change orders
import { Label } from "@/components/ui/label";
import { ProjectDocumentsSection } from "./ProjectDocumentsSection";
import { usePermissions } from "@/hooks/usePermissions";
import { Can } from "@/components/Can";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceTaxRate } from "@/hooks/useWorkspaceTaxRate";
import { rollForwardDraft } from "@/utils/draftRollForward";
import { isDemoMode } from "@/utils/demoMode";
import { getMockMaterialOptions, getMockLaborOptions, getMockVersionMaterials, getMockVersionLabor } from "@/utils/mockData";
import { CurrentChangeOrderCards } from "./changeOrderBuilder/CurrentChangeOrderCards";

export function ChangeOrderBuilder({
  items,
  setItems,
  project,
  selectedDraft = null,
  onDraftSelect = () => {},
  isSoldProject = false,
  soldProjectMultiplier = 1,
  baselineItems = [],
  editingVersionId = null,
  onClearEditing = () => {},
  saveRef = null,
  readOnly = false,
}: {
  items: LineItem[];
  setItems: (u: (p: LineItem[]) => LineItem[]) => void;
  project: Project;
  selectedDraft?: any;
  onDraftSelect?: (draft: any) => void;
  isSoldProject?: boolean;
  soldProjectMultiplier?: number;
  baselineItems?: LineItem[];
  editingVersionId?: string | null;
  onClearEditing?: () => void;
  saveRef?: React.MutableRefObject<(() => void) | null> | null;
  readOnly?: boolean;
}) {
  const [filterLabor, setFilterLabor] = useState("");
  const [filterMat, setFilterMat] = useState("");
  const [multiplier, setMultiplier] = useState(1); // Change orders always use multiplier of 1
  const [laborOptions, setLaborOptions] = useState<LineItem[]>([]);
  const [materialOptions, setMaterialOptions] = useState<LineItem[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [draftName, setDraftName] = useState<string>("");
  const [showChangesOnly, setShowChangesOnly] = useState(false);
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { hidden } = usePrice();
  const [clientData, setClientData] = useState<any>(null);
  const { can } = usePermissions();
  const isMobile = useIsMobile();
  const { taxRate } = useWorkspaceTaxRate();
  
  // Permission checks for change order components
  const canViewQuote = can("component.changeorders_quote.view");
  const canEditQuote = can("component.changeorders_quote.edit");
  const canViewClientDocuments = can("component.changeorders_projectdocuments.view");
  const canEditClientDocuments = can("component.changeorders_projectdocuments.edit");
  const canViewPrices = can("component.changeorders_viewprices.view");
  
  // Determine if change order should be read-only based on permissions
  // Component-level edit permission overrides tab-level readOnly
  const changeOrderReadOnly = !canEditQuote;
  
  // Determine if prices should be shown (both global hidden state and permission)
  const showPrices = !hidden && canViewPrices;

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (isDemoMode()) return;
      if (project.clientId && workspaceId) {
        try {
          const { data, error } = await (supabase as any)
            .from('clients')
            .select('*')
            .eq('client_id', project.clientId)
            .eq('workspace_id', workspaceId)
            .maybeSingle();

          if (error) {
            console.error('Error fetching client:', error);
          } else if (data) {
            setClientData(data);
          }
        } catch (error) {
          console.error('Error fetching client:', error);
        }
      }
    };
    fetchClientData();
  }, [project.clientId, workspaceId]);

  // For change orders, always keep multiplier at 1
  useEffect(() => {
      setMultiplier(1);
  }, []);

  // Load drafts for change orders (only if not a sold project)
  useEffect(() => {
    if (!isSoldProject && workspaceId) {
      fetchDrafts();
    }
  }, [project.id, isSoldProject, workspaceId]);

  // Load existing version when editingVersionId is provided
  useEffect(() => {
    const loadEditingVersion = async () => {
      if (isDemoMode()) return;
      if (editingVersionId && workspaceId) {
        // console.log("Loading version for editing:", editingVersionId);
        try {
          // Fetch the version details
          const { data: versionData, error: versionError } = await (supabase as any)
            .from("project_versions")
            .select("*")
            .eq("version_id", editingVersionId)
            .eq("workspace_id", workspaceId)
            .single();

          if (versionError) throw versionError;

          if (versionData) {
            await loadDraftItems(versionData);
          }
        } catch (error) {
          console.error("Error loading version for editing:", error);
          toast.error("Failed to load change order");
        }
      }
    };
    loadEditingVersion();
  }, [editingVersionId, workspaceId]);

  // Set default name when starting a new draft/change order
  useEffect(() => {
    const setDefaultName = async () => {
      if (!draftName && !editingVersionId && workspaceId) {
        if (isDemoMode()) {
          setDraftName("Change Order 1");
          return;
        }
        try {
          // Count existing change orders
          const { data, error } = await (supabase as any)
            .from("project_versions")
            .select("status")
            .eq("project_id", project.id)
            .eq("workspace_id", workspaceId);

          if (!error && data) {
            const count = data.filter((v) =>
              v.status?.toLowerCase().includes("change order")
            ).length;

            const nextNumber = count + 1;
            const defaultName = `Change Order ${nextNumber}`;
            setDraftName(defaultName);
          } else {
            setDraftName("Change Order 1");
          }
        } catch (err) {
          console.error("Error counting versions:", err);
          setDraftName("Change Order 1");
        }
      }
    };
    setDefaultName();
  }, [project.id, editingVersionId, draftName, workspaceId]);

  const fetchDrafts = async () => {
    if (!workspaceId) return;
    if (isDemoMode()) {
      setDrafts([]);
      return;
    }
    try {
      const { data, error } = await (supabase as any)
        .from("project_versions")
        .select("*")
        .eq("project_id", project.id)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    }
  };

  const handleDraftSelection = (draftId: string) => {
    const selectedDraft = drafts.find((d) => d.version_id === draftId);
    if (selectedDraft) {
      loadDraftItems(selectedDraft);
      setSelectedDraftId(draftId);
    }
  };

  const loadDraftItems = async (draft: any) => {
    try {
      if (isDemoMode()) {
        const versionLabor = getMockVersionLabor().filter((vl) => vl.version_id === draft.version_id);
        const versionMaterials = getMockVersionMaterials().filter((vm) => vm.version_id === draft.version_id);
        const laborOpts = getMockLaborOptions();
        const materialOpts = getMockMaterialOptions();
        const draftItems: LineItem[] = [];

        versionLabor.forEach((item) => {
          const opt = laborOpts.find((l) => l.id === item.labor_id);
          draftItems.push({
            id: item.labor_id,
            name: item.item_name || opt?.name || "Labor",
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: "labor",
          });
        });
        versionMaterials.forEach((item) => {
          const opt = materialOpts.find((m) => m.id === item.material_id);
          draftItems.push({
            id: item.material_id,
            name: item.item_name || opt?.name || "Material",
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: "material",
          });
        });

        setItems(() => draftItems);
        setMultiplier(1);
        setDraftName(draft.name || draft.status || "");
        onDraftSelect(draft);
        toast.success(`Loaded ${draft.name || draft.status}`);
        return;
      }

      // Load labor items
      const { data: laborData, error: laborError } = await supabase
        .from("version_labor")
        .select(
          `
          *,
          labor_options:labor_id (*)
        `,
        )
        .eq("version_id", draft.version_id);

      if (laborError) throw laborError;

      // Load material items
      const { data: materialData, error: materialError } = await supabase
        .from("version_materials")
        .select(
          `
          *,
          material_options:material_id (*)
        `,
        )
        .eq("version_id", draft.version_id);

      if (materialError) throw materialError;

      // Convert to LineItem format
      const draftItems: LineItem[] = [];

      // Add labor items
      laborData?.forEach((item: any) => {
        if (item.labor_options) {
          draftItems.push({
            id: item.labor_options.id,
            name: item.item_name || item.labor_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: "labor",
          });
        }
      });

      // Add material items
      materialData?.forEach((item: any) => {
        if (item.material_options) {
          draftItems.push({
            id: item.material_options.id,
            name: item.item_name || item.material_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: "material",
          });
        }
      });

      setItems(() => draftItems);
      setMultiplier(1);
      setDraftName(draft.name || draft.status || "");
      onDraftSelect(draft);
      toast.success(`Loaded ${draft.name || draft.status}`);
    } catch (error) {
      console.error("Error loading draft items:", error);
      toast.error("Failed to load draft items");
    }
  };

  const saveAsNew = async () => {
    if (isDemoMode()) {
      toast.info("Saving is disabled in demo mode.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to save drafts");
      return;
    }

    if (!workspaceId) {
      toast.error("Workspace not available");
      return;
    }

    try {
      console.log("Items to save as new:", items);

      // For change orders, calculate delta items (exclude deleted from "current")
      let itemsToSave = items;
      if (baselineItems.length > 0) {
        const activeItems = items.filter((i) => !i.isDeleted);
        const currentItemIds = new Set(activeItems.map((i) => i.id));
        const removedItems = baselineItems.filter((baselineItem) => !currentItemIds.has(baselineItem.id));
        const baselineItemIds = new Set(baselineItems.map((i) => i.id));
        const addedItems = activeItems.filter((item) => !baselineItemIds.has(item.id));
        itemsToSave = [
          ...removedItems.map((item) => ({
            ...item,
            qty: -Math.abs(item.qty),
            unitPrice: Math.abs(item.unitPrice),
          })),
          ...addedItems,
        ];
      }

      if (itemsToSave.length === 0) {
        toast.error("No changes to save");
        return;
      }

      // Always create a new version (ignore editingVersionId)
      const { data: countData } = await (supabase as any)
        .from("project_versions")
        .select("status")
        .eq("project_id", project.id)
        .eq("workspace_id", workspaceId);

      const count =
        countData?.filter((v) =>
          v.status?.toLowerCase().includes("change order")
        ).length || 0;

      const nextNumber = count + 1;
      const newName = `Change Order ${nextNumber}`;

      const { data: versionData, error: versionError } = await supabase
        .from("project_versions")
        .insert({
          project_id: project.id,
          created_by: user.id,
          multiplier: 1,
          status: "Change Order",
          name: newName,
          payment_1_percentage: 0,
          payment_2_percentage: 0,
          payment_3_percentage: 0,
          payment_4_percentage: 0,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      const versionId = versionData.version_id;
      console.log("Created new version:", versionId);

      // Save labor items (only those with valid UUIDs)
      const laborItems = itemsToSave.filter(
        (item) =>
          item.kind === "labor" &&
          item.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id),
      );
      console.log("Labor items to save:", laborItems);

      if (laborItems.length > 0) {
        const laborInserts = laborItems.map((item) => ({
          version_id: versionId,
          labor_id: item.id,
          quantity: item.qty, // Can be negative for removed items in change orders
          price: item.unitPrice, // Always positive
          item_name: item.name, // Save the displayed name (may be edited)
        }));

        const { error: laborError } = await supabase.from("version_labor").insert(laborInserts);

        if (laborError) {
          console.error("Labor insert error:", laborError);
          throw laborError;
        }
      }

      // Save material items (only those with valid UUIDs)
      const materialItems = itemsToSave.filter(
        (item) =>
          item.kind === "material" &&
          item.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id),
      );
      console.log("Material items to save:", materialItems);

      if (materialItems.length > 0) {
        const materialInserts = materialItems.map((item) => ({
          version_id: versionId,
          material_id: item.id,
          quantity: item.qty, // Can be negative for removed items in change orders
          price: item.unitPrice, // Always positive
          waste_pct: item.wastePct || 0,
          item_name: item.name, // Save the displayed name (may be edited)
        }));

        const { error: materialError } = await supabase.from("version_materials").insert(materialInserts);

        if (materialError) {
          console.error("Material insert error:", materialError);
          throw materialError;
        }
      }

      const totalSaved = laborItems.length + materialItems.length;
      const totalItems = items.length;

      if (totalSaved === 0) {
        toast.error("No valid database items to save. Please add items from the catalog.");
        return;
      }

      // Change orders don't update active_version

      if (totalSaved < totalItems) {
        toast.success(
          `Change order saved as new! (${totalSaved}/${totalItems} items saved - only catalog items can be saved)`,
        );
      } else {
        toast.success("Change order saved as new successfully!");
      }

      // Clear editing state after saving as new (this also clears cached items)
      onClearEditing();
    } catch (error) {
      console.error("Error saving as new:", error);
      toast.error("Failed to save as new: " + (error as any)?.message || "Unknown error");
    }
  };

  const saveDraft = async () => {
    if (isDemoMode()) {
      toast.info("Saving is disabled in demo mode.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to save drafts");
      return;
    }

    if (!workspaceId) {
      toast.error("Workspace not available");
      return;
    }

    // Validate draft name is required
    if (!draftName || draftName.trim() === '') {
      toast.error("Please enter a change order name before saving");
      return;
    }

    // Change orders don't require payment validation

    try {
      console.log("Items to save:", items);

      // Calculate delta items for change orders (exclude deleted from "current")
      let itemsToSave = items;
      if (baselineItems.length > 0) {
        const activeItems = items.filter((i) => !i.isDeleted);
        const currentItemIds = new Set(activeItems.map((i) => i.id));
        const removedItems = baselineItems.filter((baselineItem) => !currentItemIds.has(baselineItem.id));
        const baselineItemIds = new Set(baselineItems.map((i) => i.id));
        const addedItems = activeItems.filter((item) => !baselineItemIds.has(item.id));
        itemsToSave = [
          ...removedItems.map((item) => ({
            ...item,
            qty: -Math.abs(item.qty),
            unitPrice: Math.abs(item.unitPrice),
          })),
          ...addedItems,
        ];
      }

      if (itemsToSave.length === 0) {
        toast.error("No changes to save");
        return;
      }

      let versionId: string;

      // If editing an existing change order, use roll-forward logic to preserve Materials tab state
      if (editingVersionId) {
        // First check if the version still exists (might have been deleted)
        const { data: existingVersion, error: checkError } = await (supabase as any)
          .from("project_versions")
          .select("version_id")
          .eq("version_id", editingVersionId)
          .maybeSingle();

        if (checkError || !existingVersion) {
          // Version was deleted, create a new change order from scratch instead
          console.log("Source version not found (may have been deleted), creating new change order");
          // Fall through to the else block to create a new change order
        } else {
          // Version exists, proceed with roll-forward
          console.log("Rolling forward change order from:", editingVersionId);
          
          const rollForwardResult = await rollForwardDraft({
            sourceVersionId: editingVersionId,
            projectId: project.id,
            workspaceId,
            userId: user.id,
            newDraftName: draftName.trim(),
            quoteItems: itemsToSave,
            multiplier: 1,
            paymentSplits: [0, 0, 0, 0],
            versionType: 'change-order',
          });

          if (!rollForwardResult.success || !rollForwardResult.newVersionId) {
            // If roll-forward failed because version was deleted, create new instead
            if (rollForwardResult.error?.includes("not found") || rollForwardResult.error?.includes("deleted")) {
              console.log("Source version was deleted, creating new change order instead");
              // Fall through to the else block to create a new change order
            } else {
              throw new Error(rollForwardResult.error || 'Failed to roll forward change order');
            }
          } else {
            versionId = rollForwardResult.newVersionId;
            console.log("Created new change order via roll-forward:", versionId);
            
            // Roll-forward already handled all materials and labor, so we're done
            toast.success(`Saved as ${rollForwardResult.newDraftName || draftName.trim()}!`);
            // Clear editing state after saving (this also clears cached items)
            onClearEditing();
            return;
          }
        }
      }
      
      // Create a brand-new change order (either no editingVersionId, or source was deleted)
      {
        // Create a brand-new change order (current behavior)
        console.log("Creating new change order");
        const { data: versionData, error: versionError } = await supabase
          .from("project_versions")
          .insert({
            project_id: project.id,
            created_by: user.id,
            multiplier: 1,
            status: "Change Order",
            name: draftName.trim(),
            workspace_id: workspaceId,
          })
          .select()
          .single();

        if (versionError) throw versionError;

        versionId = versionData.version_id;
        console.log("Created new change order:", versionId);
      }

      // Save labor items (only those with valid UUIDs) - only for new change orders
      const laborItems = itemsToSave.filter(
        (item) =>
          item.kind === "labor" &&
          item.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id),
      );
      console.log("Labor items to save:", laborItems);

      if (laborItems.length > 0) {
        const laborInserts = laborItems.map((item) => ({
          version_id: versionId,
          labor_id: item.id,
          quantity: item.qty, // Can be negative for removed items in change orders
          price: item.unitPrice, // Always positive
          item_name: item.name, // Save the displayed name (may be edited)
        }));

        const { error: laborError } = await supabase.from("version_labor").insert(laborInserts);

        if (laborError) {
          console.error("Labor insert error:", laborError);
          throw laborError;
        }
      }

      // Save material items (only those with valid UUIDs)
      const materialItems = itemsToSave.filter(
        (item) =>
          item.kind === "material" &&
          item.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id),
      );
      console.log("Material items to save:", materialItems);

      if (materialItems.length > 0) {
        const materialInserts = materialItems.map((item) => ({
          version_id: versionId,
          material_id: item.id,
          quantity: item.qty, // Can be negative for removed items in change orders
          price: item.unitPrice, // Always positive
          waste_pct: item.wastePct || 0,
          item_name: item.name, // Save the displayed name (may be edited)
        }));

        const { error: materialError } = await supabase.from("version_materials").insert(materialInserts);

        if (materialError) {
          console.error("Material insert error:", materialError);
          throw materialError;
        }
      }

      const totalSaved = laborItems.length + materialItems.length;
      const totalItems = items.length;

      if (totalSaved === 0) {
        toast.error("No valid database items to save. Please add items from the catalog.");
        return;
      }

      // Change orders don't update active_version

      if (totalSaved < totalItems) {
        toast.success(`Change order saved! (${totalSaved}/${totalItems} items saved - only catalog items can be saved)`);
      } else {
        toast.success(`Change order saved successfully!`);
      }
      
      // Clear editing state after saving (this also clears cached items)
      onClearEditing();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft: " + (error as any)?.message || "Unknown error");
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      if (!workspaceId) return;
      if (isDemoMode()) {
        const mockLabor = getMockLaborOptions();
        const mockMaterials = getMockMaterialOptions();
        setLaborOptions(
          mockLabor.map((item) => ({
            id: item.id,
            name: item.name,
            unitPrice: Number(item.price),
            qty: 1,
            kind: "labor" as const,
          }))
        );
        setMaterialOptions(
          mockMaterials.map((item) => ({
            id: item.id,
            name: item.name,
            unitPrice: Number(item.price),
            qty: 1,
            kind: "material" as const,
          }))
        );
        return;
      }
      // Fetch labor options
      const { data: laborData, error: laborError } = await (supabase as any)
        .from("labor_options")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (laborData && !laborError) {
        const formattedLabor = laborData.map((item: any) => ({
          id: item.id,
          name: item.name,
          unitPrice: Number(item.unit_price ?? item.price),
          qty: 1,
          kind: "labor" as const,
        }));
        setLaborOptions(formattedLabor);
      }

      // Fetch material options
      const { data: materialData, error: materialError } = await (supabase as any)
        .from("material_options")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (materialData && !materialError) {
        const formattedMaterials = materialData.map((item: any) => ({
          id: item.id,
          name: item.name,
          unitPrice: Number(item.unit_price ?? item.price),
          qty: 1,
          kind: "material" as const,
        }));
        setMaterialOptions(formattedMaterials);
      }
    };

    fetchOptions();
  }, [workspaceId]);

  // Expose saveDraft function to parent via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = saveDraft;
    }
  }, [saveDraft, saveRef]);

  // Filter out options that are already in the quote
  const availableLaborOptions = useMemo(() => {
    const itemIds = new Set(items.map((item) => item.id));
    return laborOptions.filter((option) => !itemIds.has(option.id));
  }, [laborOptions, items]);

  const availableMaterialOptions = useMemo(() => {
    const itemIds = new Set(items.map((item) => item.id));
    return materialOptions.filter((option) => !itemIds.has(option.id));
  }, [materialOptions, items]);

  const addItem = (it: LineItem) => {
    if (changeOrderReadOnly) return; // Prevent adding items when read-only
    // Keep the original database ID for labor/material options, generate new ID for local items
    const newItem = {
      ...it,
      id: it.id && it.id.length === 36 && it.id.includes("-") ? it.id : Math.random().toString(36).slice(2),
    };
    setItems((prev) => [...prev, newItem]);
  };
  const removeItem = (id: string) => {
    if (changeOrderReadOnly) return;
    const baselineItemIds = new Set(baselineItems.map((item) => item.id));
    const isInBaseline = baselineItemIds.has(id);
    if (isInBaseline) {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isDeleted: true } : x)));
    } else {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }
  };

  const restoreItem = (id: string) => {
    if (changeOrderReadOnly) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isDeleted: false } : x)));
  };

  const updateItemName = (id: string, name: string) => {
    const baselineItemIds = new Set(baselineItems.map((item) => item.id));
    if (baselineItemIds.has(id)) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
  };

  const updateItemQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty } : x)));
  };

  const updateItemPrice = (id: string, unitPrice: number) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, unitPrice } : x)));
  };

  const startNewDraft = () => {
    onClearEditing();
    setSelectedDraftId("");
    setDraftName("");
    setIsDropdownOpen(false);
  };

  const resetToDefaults = () => {
    if (changeOrderReadOnly) return;
    setItems(() => []);
    setDraftName("");
    onClearEditing();
    setSelectedDraftId("");
    setIsDropdownOpen(false);
  };

  const rows = useMemo(
    () =>
      items.map((r) => {
        const waste = r.kind === "material" ? (r.wastePct ?? (/tile|countertop/i.test(r.name) ? 20 : 0)) : 0;
        const effectiveQty = r.isDeleted ? 0 : r.qty;
        const qtyWithWaste = r.kind === "material" ? effectiveQty * (1 + waste / 100) : effectiveQty;
        const total = qtyWithWaste * r.unitPrice;
        return { ...r, waste, qtyWithWaste, total } as any;
      }),
    [items],
  );

  // Calculate delta for change orders (exclude deleted items from "current")
  const { laborSub, matSub, tax, sub, grand } = useMemo(() => {
    if (baselineItems.length > 0 && !editingVersionId) {
      const activeItems = items.filter((item) => !item.isDeleted);
      const currentItemIds = new Set(activeItems.map((i) => i.id));
      const baselineItemIds = new Set(baselineItems.map((i) => i.id));
      const baselineMap = new Map(baselineItems.map((item) => [item.id, item]));

      const calculateItemTotal = (item: LineItem): number => {
        if (item.kind === "labor") return (item.qty || 0) * (item.unitPrice || 0);
        const waste = item.wastePct ?? (/tile|countertop/i.test(item.name) ? 20 : 0);
        const qtyWithWaste = (item.qty || 0) * (1 + waste / 100);
        return qtyWithWaste * (item.unitPrice || 0);
      };

      let deltaLabor = 0;
      let deltaMat = 0;
      activeItems.forEach((currentItem) => {
        const baselineItem = baselineMap.get(currentItem.id);
        const currentTotal = calculateItemTotal(currentItem);
        if (baselineItem) {
          const delta = currentTotal - calculateItemTotal(baselineItem);
          if (currentItem.kind === "labor") deltaLabor += delta;
          else deltaMat += delta;
        } else {
          if (currentItem.kind === "labor") deltaLabor += currentTotal;
          else deltaMat += currentTotal;
        }
      });
      baselineItems.forEach((baselineItem) => {
        if (!currentItemIds.has(baselineItem.id)) {
          const baselineTotal = calculateItemTotal(baselineItem);
          if (baselineItem.kind === "labor") deltaLabor -= baselineTotal;
          else deltaMat -= baselineTotal;
        }
      });

      const deltaTax = deltaMat * taxRate;
      const deltaSub = deltaLabor + deltaMat + deltaTax;
      const deltaGrand = deltaSub * multiplier;
      return { laborSub: deltaLabor, matSub: deltaMat, tax: deltaTax, sub: deltaSub, grand: deltaGrand };
    } else {
      const activeRows = rows.filter((r: any) => !r.isDeleted);
      const laborTotal = activeRows.filter((r: any) => r.kind === "labor").reduce((a: number, r: any) => a + r.total, 0);
      const matTotal = activeRows.filter((r: any) => r.kind === "material").reduce((a: number, r: any) => a + r.total, 0);
      const taxTotal = matTotal * taxRate;
      const subTotal = laborTotal + matTotal + taxTotal;
      const grandTotal = subTotal * multiplier;
      return { laborSub: laborTotal, matSub: matTotal, tax: taxTotal, sub: subTotal, grand: grandTotal };
    }
  }, [items, baselineItems, rows, multiplier, editingVersionId, taxRate]);

  const showQuoteContent = selectedDraftId || isSoldProject || isDemoMode();

  return (
    <>
    <Card className="rounded-2xl border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Change Order Builder</CardTitle>
            {editingVersionId ? (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                Editing Change Order → Will create new change order on save
              </span>
            ) : (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                Creating New Change Order
              </span>
            )}
          </div>
          {!changeOrderReadOnly && (
            isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Menu className="h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={startNewDraft} className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    New Change Order
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={resetToDefaults} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset Items
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowChangesOnly((v) => !v)} className="gap-2">
                    <GitCompare className="h-4 w-4" />
                    {showChangesOnly ? "Show All Items" : "Show Changes"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={startNewDraft} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  New Change Order
                </Button>
                <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset Items
                </Button>
                <Button
                  variant={showChangesOnly ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowChangesOnly((v) => !v)}
                  className="gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  {showChangesOnly ? "Show All Items" : "Show Changes"}
                </Button>
              </div>
            )
          )}
        </div>
        <div className="mt-4 space-y-4">
          {changeOrderReadOnly && (
            <div className="bg-muted/50 border border-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                📋 <strong>View Only Mode:</strong> You have read-only access. You can view the change order and generate documents, but cannot make edits.
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSoldProject && (
          <Card className="rounded-2xl border bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base">Select Draft to Modify</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isDropdownOpen}
                    className="w-full justify-between bg-background"
                  >
                    {selectedDraftId
                      ? (() => {
                          const draft = drafts.find((d) => d.version_id === selectedDraftId);
                          const statusLabel = draft?.is_active ? `${draft.status} (Active)` : draft?.status;
                          const displayName = draft?.name || statusLabel;
                          return displayName;
                        })()
                      : "Select a draft to modify..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-background border shadow-lg z-50">
                  <Command>
                    <CommandInput placeholder="Search drafts..." />
                    <CommandEmpty>No drafts found.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto">
                      {drafts.map((draft) => {
                        const statusLabel = draft.is_active ? `${draft.status} (Active)` : draft.status;
                        const displayName = draft.name || statusLabel;
                        return (
                          <CommandItem
                            key={draft.version_id}
                            value={displayName}
                            onSelect={() => {
                              handleDraftSelection(draft.version_id);
                              setIsDropdownOpen(false);
                            }}
                            className="hover:bg-gray-100 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDraftId === draft.version_id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <div className="font-medium">{displayName}</div>
                              <div className="text-xs text-muted-foreground">
                                {statusLabel} • Multiplier: {draft.multiplier}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        )}

        {showQuoteContent && (
          <div className="space-y-4">
            {/* Top: Options side by side - Show when canViewQuote is true, but hide Add button when read-only */}
            {canViewQuote && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="rounded-2xl border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Labor Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="Search labor..."
                      value={filterLabor}
                      onChange={(e) => setFilterLabor(e.target.value)}
                    />
                    <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                      {availableLaborOptions
                        .filter((l) => l.name.toLowerCase().includes(filterLabor.toLowerCase()))
                        .map((l) => (
                          <div key={l.id} className="border rounded-xl p-2">
                            <div className="font-medium text-sm">{l.name}</div>
                            {showPrices && (
                              <div className="text-xs text-muted-foreground">
                                <Money value={l.unitPrice} /> / ea
                              </div>
                            )}
                            {!changeOrderReadOnly && (
                              <Button size="sm" variant="outline" className="mt-2 rounded-xl" onClick={() => addItem(l)}>
                                Add →
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Material Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="Search materials..."
                      value={filterMat}
                      onChange={(e) => setFilterMat(e.target.value)}
                    />
                    <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                      {availableMaterialOptions
                        .filter((m) => m.name.toLowerCase().includes(filterMat.toLowerCase()))
                        .map((m) => (
                          <div key={m.id} className="border rounded-xl p-2">
                            <div className="font-medium text-sm">{m.name}</div>
                            {showPrices && (
                              <div className="text-xs text-muted-foreground">
                                <Money value={m.unitPrice} /> / unit
                              </div>
                            )}
                            {!changeOrderReadOnly && (
                              <Button size="sm" variant="outline" className="mt-2 rounded-xl" onClick={() => addItem(m)}>
                                Add →
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bottom: Current Change Order (main-style: strikethrough removed, highlight added/modified) */}
            {canViewQuote && (
              <CurrentChangeOrderCards
                rows={rows}
                baselineItems={baselineItems}
                onUpdateName={updateItemName}
                onUpdateQty={updateItemQty}
                onUpdatePrice={updateItemPrice}
                onRemoveItem={removeItem}
                onRestoreItem={restoreItem}
                readOnly={changeOrderReadOnly}
                showPrices={showPrices}
                showChangesOnly={showChangesOnly}
              />
            )}
          </div>
        )}

        {showQuoteContent && (
          <>
            {/* Totals - Change orders don't have payment splitter */}
            {canViewQuote && (
              <div className="grid grid-cols-1 gap-4">
                {/* Price Summary - only shown when showPrices is true */}
                {showPrices && (
                  <div className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div>
                        Labor Subtotal: <Money value={laborSub} />
                      </div>
                      <div>
                        Materials Subtotal: <Money value={matSub} />
                      </div>
                      <div>
                        Materials Tax ({(taxRate * 100).toFixed(2)}%): <Money value={tax} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Multiplier</span>
                      <Input
                        type="number"
                        className="w-24"
                        value={multiplier}
                        disabled={true}
                      />
                    </div>
                    <div className="font-semibold">
                      Change Order Total: <Money value={grand} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 hidden">
              <Button
                onClick={saveDraft}
                className="w-full bg-black text-white hover:bg-black/90 rounded-xl flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save Change Order
              </Button>
            </div>
          </>
        )}

        {!showQuoteContent && (
          <div className="text-center py-8 text-muted-foreground">
            Please select a draft above to begin creating a change order.
          </div>
        )}

        {/* Project Documents Section */}
        {showQuoteContent && canViewClientDocuments && (
            <div className="mt-6">
              <ProjectDocumentsSection
                projectId={project.id}
                project={project}
                clientData={clientData}
                activeDraftItems={items}
                activeDraftMultiplier={multiplier}
              tabIdentifier="change_order"
                title="Project Documents"
              readOnly={!canEditClientDocuments}
              />
            </div>
        )}
      </CardContent>
    </Card>
    
    {/* Save Button - Fixed at bottom */}
    {!readOnly && (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col md:flex-row md:items-center gap-3">
        <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[280px]">
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Change Order name..."
            className={`w-full ${!draftName || draftName.trim() === '' ? 'border-destructive' : ''}`}
            required
          />
          {(!draftName || draftName.trim() === '') && (
            <p className="text-xs text-destructive mt-1">Change order name is required</p>
          )}
        </div>
        <Button
          onClick={saveDraft}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground h-14 px-6"
        >
          <Save className="h-5 w-5 mr-2" />
          {editingVersionId ? 'Save as New Change Order' : 'Create Change Order'}
        </Button>
      </div>
    )}
    </>
  );
}
