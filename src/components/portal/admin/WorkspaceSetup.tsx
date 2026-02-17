import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, X, Check, GripVertical, ChevronDown, Upload } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CompactColorPicker } from '@/components/ui/color-picker';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Can } from '@/components/Can';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import { appointmentTypesQueries } from '@/queries/appointmentTypes';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { projectStatusesQueries } from '@/queries/projectStatuses';
import { toast } from 'sonner';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';
import { PackageGroupsSection } from './PackageGroupsSection';
import { LookbookCategoriesSection } from './LookbookCategoriesSection';
import { LookbookDefaultQuestionsSection } from './LookbookDefaultQuestionsSection';
import { ProgressBarConfigSection } from './ProgressBarConfigSection';
import { DocumentGroupsSection } from './DocumentGroupsSection';
import { DocumentGroupTabConfigurationSection } from './DocumentGroupTabConfigurationSection';
import { AttachmentFoldersSection } from './AttachmentFoldersSection';
import { ThemeSection } from './ThemeSection';
import { useWorkspaceTaxRate } from '@/hooks/useWorkspaceTaxRate';
import Papa from 'papaparse';
import { bulkCreateClients } from '@/queries/clients';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SortableStatusItemProps {
  status: any;
  editingStatusId: string | null;
  editStatusName: string;
  editStatusColor: string;
  setEditStatusName: (name: string) => void;
  setEditStatusColor: (color: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (status: any) => void;
  onDelete: (status: any) => void;
  canEdit: boolean;
}

function SortableStatusItem({
  status,
  editingStatusId,
  editStatusName,
  editStatusColor,
  setEditStatusName,
  setEditStatusColor,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  canEdit,
}: SortableStatusItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id, disabled: !canEdit || editingStatusId === status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
    >
      {editingStatusId === status.id ? (
        // Edit Mode
        <div className="flex items-center gap-3 flex-1">
          {status.is_required ? (
            // For required statuses, show name as read-only
            <div className="max-w-xs px-3 py-2 border rounded-md bg-muted">
              <span className="font-medium">{status.name}</span>
              <span className="text-xs text-muted-foreground ml-2">(name cannot be changed)</span>
            </div>
          ) : (
            // For custom statuses, allow name editing
            <Input
              value={editStatusName}
              onChange={(e) => setEditStatusName(e.target.value)}
              className="max-w-xs"
              autoFocus
            />
          )}
          <CompactColorPicker
            color={editStatusColor}
            onChange={setEditStatusColor}
            disabled={!canEdit}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onSaveEdit}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          <div className="flex items-center gap-3 flex-1">
            {canEdit && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: status.color }}
            />
            <span className="font-medium">{status.name}</span>
            {status.is_required && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Required
              </span>
            )}
            <AccountabilityInfo
              created_by={status.created_by}
              created_at={status.created_at}
              updated_by={status.updated_by}
              updated_at={status.updated_at}
            />
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStartEdit(status)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(status)}
                disabled={status.is_required}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function WorkspaceSetup() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canEdit = can('tab.admin_workspacesetup.edit');
  
  // Component-level permission checks
  const canViewProjectStatus = can('component.adminworkspacesetup_projectstatus.view');
  const canEditProjectStatus = can('component.adminworkspacesetup_projectstatus.edit');
  const canViewProgressBar = can('component.adminworkspacesetup_progressbar.view');
  const canEditProgressBar = can('component.adminworkspacesetup_progressbar.edit');
  const canViewPackageGroups = can('component.adminworkspacesetup_packagegroups.view');
  const canEditPackageGroups = can('component.adminworkspacesetup_packagegroups.edit');
  const canViewLookbookCategories = can('component.adminworkspacesetup_lookbookcategories.view');
  const canEditLookbookCategories = can('component.adminworkspacesetup_lookbookcategories.edit');
  const canViewDocumentGroups = can('component.adminworkspacesetup_documentgroups.view');
  const canEditDocumentGroups = can('component.adminworkspacesetup_documentgroups.edit');
  const canViewAttachmentFolders = can('component.adminworkspacesetup_attachmentfolders.view');
  const canEditAttachmentFolders = can('component.adminworkspacesetup_attachmentfolders.edit');
  const canViewCalendarAppointmentTypes = can('component.adminworkspacesetup_calendarappointmenttypes.view');
  const canEditCalendarAppointmentTypes = can('component.adminworkspacesetup_calendarappointmenttypes.edit');
  const canViewTaxes = can('component.adminworkspacesetup_taxes.view');
  const canEditTaxes = can('component.adminworkspacesetup_taxes.edit');
  const canViewImportClients = can('component.adminworkspacesetup_importclients.view');
  const canEditImportClients = can('component.adminworkspacesetup_importclients.edit');

  // Effective edit permissions (component-level overrides tab-level)
  const projectStatusEditEnabled = canViewProjectStatus && canEditProjectStatus;
  const calendarAppointmentTypesEditEnabled = canViewCalendarAppointmentTypes && canEditCalendarAppointmentTypes;
  const taxesEditEnabled = canViewTaxes && canEditTaxes;
  
  // Tax rate hook
  const { taxRate, updateTaxRate, loading: taxRateLoading } = useWorkspaceTaxRate();
  const [taxRateInput, setTaxRateInput] = useState<string>('');
  const [isSavingTaxRate, setIsSavingTaxRate] = useState(false);
  
  // Initialize tax rate input when tax rate is loaded
  useEffect(() => {
    if (taxRate !== undefined && !taxRateLoading) {
      setTaxRateInput((taxRate * 100).toFixed(2));
    }
  }, [taxRate, taxRateLoading]);
  
  const workspaceId = currentWorkspace?.id;
  const { appointmentTypes, loading: appointmentTypesLoading, refetch: refetchAppointmentTypes } = useAppointmentTypes(workspaceId);
  const { projectStatuses, loading: projectStatusesLoading, refetch: refetchProjectStatuses } = useProjectStatuses(workspaceId);

  // Appointment Types state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#8b5cf6');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<{ id: string; name: string } | null>(null);

  // Project Status state
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#8b5cf6');
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editStatusName, setEditStatusName] = useState('');
  const [editStatusColor, setEditStatusColor] = useState('');
  const [statusDeleteDialogOpen, setStatusDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<{ id: string; name: string } | null>(null);

  // Collapsible state for all sections (all start collapsed)
  const [isProjectStatusOpen, setIsProjectStatusOpen] = useState(false);
  const [isProgressBarOpen, setIsProgressBarOpen] = useState(false);
  const [isPackageGroupsOpen, setIsPackageGroupsOpen] = useState(false);
  const [isLookbookCategoriesOpen, setIsLookbookCategoriesOpen] = useState(false);
  const [isLookbookDefaultQuestionsOpen, setIsLookbookDefaultQuestionsOpen] = useState(false);
  const [isDocumentGroupsOpen, setIsDocumentGroupsOpen] = useState(false);
  const [isDocumentGroupTabConfigOpen, setIsDocumentGroupTabConfigOpen] = useState(false);
  const [isAttachmentFoldersOpen, setIsAttachmentFoldersOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isCalendarAppointmentTypesOpen, setIsCalendarAppointmentTypesOpen] = useState(false);
  const [isTaxesOpen, setIsTaxesOpen] = useState(false);

  // Client import state
  const [isClientImportOpen, setIsClientImportOpen] = useState(false);
  const [isClientImportConfirmOpen, setIsClientImportConfirmOpen] = useState(false);
  const [clientImportUploading, setClientImportUploading] = useState(false);
  const [pendingClients, setPendingClients] = useState<{ name: string; phone?: string; email?: string }[] | null>(null);
  const clientFileInputRef = useRef<HTMLInputElement | null>(null);

  // Theme section starts collapsed by default (isThemeOpen = false)
  // No auto-expansion during onboarding

  const handleCreate = async () => {
    if (!workspaceId || !user?.id) return;
    if (!newTypeName.trim()) {
      toast.error('Appointment type name is required');
      return;
    }

    setIsAdding(true);
    try {
      await appointmentTypesQueries.create(
        workspaceId,
        newTypeName.trim(),
        newTypeColor,
        user.id
      );
      toast.success('Appointment type created');
      setNewTypeName('');
      setNewTypeColor('#8b5cf6');
      await refetchAppointmentTypes();
    } catch (error: any) {
      console.error('Error creating appointment type:', error);
      if (error.message?.includes('unique')) {
        toast.error('An appointment type with this name already exists');
      } else {
        toast.error('Failed to create appointment type');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (type: any) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditColor(type.color);
  };

  const isEditingDefaultType = editingId 
    ? appointmentTypes.find(t => t.id === editingId)?.is_default 
    : false;

  const handleSaveEdit = async () => {
    if (!editingId || !user?.id) return;
    
    const editingType = appointmentTypes.find(t => t.id === editingId);
    const isDefault = editingType?.is_default;

    // For non-default types, validate name
    if (!isDefault && !editName.trim()) {
      toast.error('Appointment type name is required');
      return;
    }

    try {
      // For default types (Other), only update color
      // For custom types, update both name and color
      const updates = isDefault 
        ? { color: editColor }
        : { name: editName.trim(), color: editColor };

      await appointmentTypesQueries.update(
        editingId,
        updates,
        user.id
      );
      toast.success('Appointment type updated');
      setEditingId(null);
      await refetchAppointmentTypes();
    } catch (error: any) {
      console.error('Error updating appointment type:', error);
      if (error.message?.includes('unique')) {
        toast.error('An appointment type with this name already exists');
      } else {
        toast.error('Failed to update appointment type');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleDeleteClick = (type: any) => {
    if (type.is_default) {
      toast.error('"Other" is a required appointment type and cannot be deleted');
      return;
    }
    setTypeToDelete({ id: type.id, name: type.name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;

    try {
      await appointmentTypesQueries.delete(typeToDelete.id);
      toast.success('Appointment type deleted');
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      await refetchAppointmentTypes();
    } catch (error) {
      console.error('Error deleting appointment type:', error);
      toast.error('Failed to delete appointment type');
    }
  };

  // Project Status handlers
  const handleCreateStatus = async () => {
    if (!workspaceId || !user?.id) return;
    if (!newStatusName.trim()) {
      toast.error('Project status name is required');
      return;
    }

    setIsAddingStatus(true);
    try {
      // Get max display_order and add 1
      const maxOrder = projectStatuses.length > 0 
        ? Math.max(...projectStatuses.map(s => s.display_order))
        : 0;
      
      await projectStatusesQueries.create(
        workspaceId,
        newStatusName.trim(),
        newStatusColor,
        maxOrder + 1,
        user.id
      );
      toast.success('Project status created');
      setNewStatusName('');
      setNewStatusColor('#8b5cf6');
      await refetchProjectStatuses();
    } catch (error: any) {
      console.error('Error creating project status:', error);
      if (error.message?.includes('unique')) {
        toast.error('A project status with this name already exists');
      } else {
        toast.error('Failed to create project status');
      }
    } finally {
      setIsAddingStatus(false);
    }
  };

  const handleStartEditStatus = (status: any) => {
    setEditingStatusId(status.id);
    setEditStatusName(status.name);
    setEditStatusColor(status.color);
  };

  const handleSaveEditStatus = async () => {
    if (!editingStatusId || !user?.id) return;

    const editingStatus = projectStatuses.find(s => s.id === editingStatusId);
    const isRequired = editingStatus?.is_required;

    // For non-required statuses, validate name
    if (!isRequired && !editStatusName.trim()) {
      toast.error('Project status name is required');
      return;
    }

    try {
      // For required statuses (Sold, Completed, Lost), only update color
      // For custom statuses, update both name and color
      const updates = isRequired 
        ? { color: editStatusColor }
        : { name: editStatusName.trim(), color: editStatusColor };

      await projectStatusesQueries.update(
        editingStatusId,
        updates,
        user.id
      );
      toast.success('Project status updated');
      setEditingStatusId(null);
      setEditStatusName('');
      setEditStatusColor('');
      await refetchProjectStatuses();
    } catch (error: any) {
      console.error('Error updating project status:', error);
      if (error.message?.includes('unique')) {
        toast.error('A project status with this name already exists');
      } else {
        toast.error('Failed to update project status');
      }
    }
  };

  const handleCancelEditStatus = () => {
    setEditingStatusId(null);
    setEditStatusName('');
    setEditStatusColor('');
  };

  const handleDeleteStatusClick = (status: any) => {
    if (status.is_required) {
      toast.error('Required project statuses (Sold, Completed, Lost) cannot be deleted');
      return;
    }
    setStatusToDelete({ id: status.id, name: status.name });
    setStatusDeleteDialogOpen(true);
  };

  const handleConfirmDeleteStatus = async () => {
    if (!statusToDelete) return;

    try {
      await projectStatusesQueries.delete(statusToDelete.id);
      toast.success('Project status deleted');
      setStatusDeleteDialogOpen(false);
      setStatusToDelete(null);
      await refetchProjectStatuses();
    } catch (error: any) {
      console.error('Error deleting project status:', error);
      if (error.message?.includes('required')) {
        toast.error('Cannot delete required project status');
      } else {
        toast.error('Failed to delete project status');
      }
    }
  };

  const handleSaveTaxRate = async () => {
    const parsedRate = parseFloat(taxRateInput);
    
    // Validate input
    if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      toast.error('Tax rate must be between 0 and 100');
      return;
    }

    // Convert percentage to decimal
    const decimalRate = parsedRate / 100;

    setIsSavingTaxRate(true);
    try {
      await updateTaxRate(decimalRate);
      toast.success('Tax rate updated successfully');
    } catch (error: any) {
      console.error('Error updating tax rate:', error);
      toast.error(error.message || 'Failed to update tax rate');
      // Reset to current tax rate on error
      setTaxRateInput((taxRate * 100).toFixed(2));
    } finally {
      setIsSavingTaxRate(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !user?.id) return;
    
    if (active.id !== over.id) {
      const oldIndex = projectStatuses.findIndex((s) => s.id === active.id);
      const newIndex = projectStatuses.findIndex((s) => s.id === over.id);
      
      const newOrder = arrayMove(projectStatuses, oldIndex, newIndex);
      
      // Update display orders in database
      try {
        const updatePromises = newOrder.map((status, index) => 
          projectStatusesQueries.update(status.id, { display_order: index + 1 }, user.id)
        );
        await Promise.all(updatePromises);
        await refetchProjectStatuses();
      } catch (error) {
        console.error('Error reordering project statuses:', error);
        toast.error('Failed to reorder project statuses');
      }
    }
  };

  // Parse clients CSV (name,phone,email)
  const parseClientsCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());

    // Basic row-length safeguard (similar to other CSV imports)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 500) {
        throw new Error(`Row ${i + 1} exceeds 500 character limit (${lines[i].length} characters)`);
      }
    }

    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => value.replace(/^[\"']|[\"']$/g, '').trim(),
    });

    if (result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    const data = result.data as any[];
    if (!data.length) {
      throw new Error('CSV file is empty');
    }

    const firstRow = data[0];
    const requiredHeaders = ['name', 'phone', 'email'];
    const missingHeaders = requiredHeaders.filter((h) => !(h in firstRow));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const clients: { name: string; phone?: string; email?: string }[] = [];
    const errors: string[] = [];

    data.forEach((row, idx) => {
      const rowNumber = idx + 2; // account for header
      const name = (row.name || '').trim();
      const phone = (row.phone || '').trim();
      const email = (row.email || '').trim();

      if (!name) {
        errors.push(`Row ${rowNumber}: Name is required`);
        return;
      }

      clients.push({ name, phone: phone || undefined, email: email || undefined });
    });

    if (errors.length > 0) {
      throw new Error(`Validation errors:\n${errors.join('\n')}`);
    }

    return clients;
  };

  const handleClientsCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditImportClients || !workspaceId || !user?.id) {
      toast.error('You do not have permission to import clients or workspace/user is not available');
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

    setClientImportUploading(true);
    try {
      const text = await file.text();
      const clients = parseClientsCSV(text);

      if (!clients.length) {
        throw new Error('No valid clients found in CSV');
      }

      setPendingClients(clients);
      setIsClientImportOpen(false);
      setIsClientImportConfirmOpen(true);
    } catch (error: any) {
      console.error('Error uploading clients CSV:', error);
      toast.error(error?.message || 'Failed to upload clients CSV');
    } finally {
      event.target.value = '';
      setClientImportUploading(false);
    }
  };

  const handleConfirmClientImport = async () => {
    if (!canEditImportClients || !pendingClients || !workspaceId || !user?.id) {
      toast.error(!canEditImportClients ? 'You do not have permission to import clients' : 'Workspace or user not available');
      setIsClientImportConfirmOpen(false);
      return;
    }

    setClientImportUploading(true);
    try {
      await bulkCreateClients(workspaceId, pendingClients, user.id);
      toast.success(`Successfully imported ${pendingClients.length} client(s)`);
      setPendingClients(null);
      setIsClientImportConfirmOpen(false);
    } catch (error: any) {
      console.error('Error importing clients:', error);
      toast.error(error?.message || 'Failed to import clients');
    } finally {
      setClientImportUploading(false);
    }
  };

  if (appointmentTypesLoading || projectStatusesLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Can permission="component.adminworkspacesetup_importclients.view" fallback={null}>
          {canViewImportClients && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsClientImportOpen(true)}
              disabled={!canEditImportClients}
              title={!canEditImportClients ? "You don't have permission to import clients" : undefined}
            >
              <Upload className="h-4 w-4" />
              Import Clients
            </Button>
          )}
        </Can>
      </div>
      {/* Project Status Section */}
      <Can permission="component.adminworkspacesetup_projectstatus.view" fallback={null}>
        <Collapsible open={isProjectStatusOpen} onOpenChange={setIsProjectStatusOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Project Status</CardTitle>
                    <CardDescription>
                      Manage the project status types available in your workspace. 
                      "Sold", "Completed", and "Lost" are required statuses and cannot be deleted or renamed.
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isProjectStatusOpen && "transform rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
            {/* Add New Status */}
            {projectStatusEditEnabled && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <Label className="text-sm font-medium">Add New Project Status</Label>
              <div className="grid grid-cols-[1fr_120px_auto] gap-3 items-end">
                <div className="space-y-2">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="e.g., On Hold"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateStatus();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-2 items-center">
                    <CompactColorPicker
                      color={newStatusColor}
                      onChange={setNewStatusColor}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateStatus}
                  disabled={isAddingStatus || !newStatusName.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* List of Project Status */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projectStatuses.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {projectStatuses.map((status) => (
                  <SortableStatusItem
                    key={status.id}
                    status={status}
                    editingStatusId={editingStatusId}
                    editStatusName={editStatusName}
                    editStatusColor={editStatusColor}
                    setEditStatusName={setEditStatusName}
                    setEditStatusColor={setEditStatusColor}
                    onSaveEdit={handleSaveEditStatus}
                    onCancelEdit={handleCancelEditStatus}
                    onStartEdit={handleStartEditStatus}
                    onDelete={handleDeleteStatusClick}
                    canEdit={projectStatusEditEnabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </Can>

      {/* Progress Bar Configuration Section */}
      <Can permission="component.adminworkspacesetup_progressbar.view" fallback={null}>
        <Collapsible open={isProgressBarOpen} onOpenChange={setIsProgressBarOpen}>
          <ProgressBarConfigSection isCollapsible={true} isOpen={isProgressBarOpen} />
        </Collapsible>
      </Can>

      {/* Package Groups Section */}
      <Can permission="component.adminworkspacesetup_packagegroups.view" fallback={null}>
        <Collapsible open={isPackageGroupsOpen} onOpenChange={setIsPackageGroupsOpen}>
          <PackageGroupsSection isCollapsible={true} isOpen={isPackageGroupsOpen} />
        </Collapsible>
      </Can>

      {/* Lookbook Categories Section */}
      <Can permission="component.adminworkspacesetup_lookbookcategories.view" fallback={null}>
        <Collapsible open={isLookbookCategoriesOpen} onOpenChange={setIsLookbookCategoriesOpen}>
          <LookbookCategoriesSection isCollapsible={true} isOpen={isLookbookCategoriesOpen} />
        </Collapsible>
      </Can>

      {/* Lookbook Default Questions Section */}
      <Can permission="component.adminworkspacesetup_lookbookdefaultquestions.view" fallback={null}>
        <Collapsible open={isLookbookDefaultQuestionsOpen} onOpenChange={setIsLookbookDefaultQuestionsOpen}>
          <LookbookDefaultQuestionsSection isCollapsible={true} isOpen={isLookbookDefaultQuestionsOpen} />
        </Collapsible>
      </Can>

      {/* Document Groups Section */}
      <Can permission="component.adminworkspacesetup_documentgroups.view" fallback={null}>
        <Collapsible open={isDocumentGroupsOpen} onOpenChange={setIsDocumentGroupsOpen}>
          <DocumentGroupsSection isCollapsible={true} isOpen={isDocumentGroupsOpen} />
        </Collapsible>
      </Can>

      {/* Document Group Tab Configurations Section */}
      <Can permission="component.adminworkspacesetup_documentgroups.view" fallback={null}>
        <Collapsible open={isDocumentGroupTabConfigOpen} onOpenChange={setIsDocumentGroupTabConfigOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle>Document Group Tab Configurations</CardTitle>
                  <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isDocumentGroupTabConfigOpen && "transform rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <DocumentGroupTabConfigurationSection />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </Can>

      {/* Attachment Folders Section */}
      <Can permission="component.adminworkspacesetup_attachmentfolders.view" fallback={null}>
        <Collapsible open={isAttachmentFoldersOpen} onOpenChange={setIsAttachmentFoldersOpen}>
          <AttachmentFoldersSection isCollapsible={true} isOpen={isAttachmentFoldersOpen} />
        </Collapsible>
      </Can>

      {/* Theme Customization Section */}
      <Can permission="component.adminworkspacesetup_themecustomization.view" fallback={null}>
        <Collapsible open={isThemeOpen} onOpenChange={setIsThemeOpen}>
          <ThemeSection isCollapsible={true} isOpen={isThemeOpen} />
        </Collapsible>
      </Can>

      {/* Calendar Appointment Types Section */}
      <Can permission="component.adminworkspacesetup_calendarappointmenttypes.view" fallback={null}>
        <Collapsible open={isCalendarAppointmentTypesOpen} onOpenChange={setIsCalendarAppointmentTypesOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Calendar Appointment Types</CardTitle>
                    <CardDescription>
                      Manage the appointment types available in your workspace calendar. 
                      "Other" is a required type and cannot be deleted.
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isCalendarAppointmentTypesOpen && "transform rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
            {/* Add New Type */}
            {calendarAppointmentTypesEditEnabled && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <Label className="text-sm font-medium">Add New Appointment Type</Label>
              <div className="grid grid-cols-[1fr_120px_auto] gap-3 items-end">
                <div className="space-y-2">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="e.g., Site Visit"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-2 items-center">
                    <CompactColorPicker
                      color={newTypeColor}
                      onChange={setNewTypeColor}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={isAdding || !newTypeName.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* List of Appointment Types */}
          <div className="space-y-2">
            {appointmentTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                {editingId === type.id ? (
                  // Edit Mode
                  <div className="flex items-center gap-3 flex-1">
                    {type.is_default ? (
                      // For "Other" type, show name as read-only
                      <div className="max-w-xs px-3 py-2 border rounded-md bg-muted">
                        <span className="font-medium">{type.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">(name cannot be changed)</span>
                      </div>
                    ) : (
                      // For custom types, allow name editing
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                    )}
                    <CompactColorPicker
                      color={editColor}
                      onChange={setEditColor}
                      disabled={!canEdit}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveEdit}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="font-medium">{type.name}</span>
                      {type.is_default && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                      <AccountabilityInfo
                        created_by={type.created_by}
                        created_at={type.created_at}
                        updated_by={type.updated_by}
                        updated_at={type.updated_at}
                      />
                    </div>
                    {calendarAppointmentTypesEditEnabled && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(type)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(type)}
                          disabled={type.is_default}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </Can>

      {/* Import Clients CSV Dialog */}
      <Dialog open={isClientImportOpen} onOpenChange={setIsClientImportOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Clients from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk create workspace clients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-left mt-2">
            <div className="space-y-2 text-left">
              <p className="font-medium text-center md:text-left">Your CSV must follow this format:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Header row is required.</li>
                <li>
                  <code>name</code> is required. <code>phone</code> and <code>email</code> may be left blank.
                </li>
                <li>
                  Clients will be created without any staff assignment. You can assign them later.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Example:</p>
              <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs overflow-x-auto border text-left">
                <code>name,phone,email</code>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center md:text-left">
              Tip: keep each row under 500 characters to avoid validation errors.
            </p>
          </div>
          <input
            ref={clientFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleClientsCSVUpload}
            className="hidden"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClientImportOpen(false)}
              disabled={clientImportUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => clientFileInputRef.current?.click()}
              className="gap-2"
              disabled={clientImportUploading}
            >
              <Upload className="h-4 w-4" />
              {clientImportUploading ? 'Uploading…' : 'Choose CSV file'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Clients Import Dialog */}
      <Dialog open={isClientImportConfirmOpen} onOpenChange={setIsClientImportConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              {pendingClients ? (
                <>You are about to import {pendingClients.length} client(s). Continue?</>
              ) : (
                'No clients to import.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClientImportConfirmOpen(false)}
              disabled={clientImportUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClientImport}
              disabled={clientImportUploading || !pendingClients}
            >
              {clientImportUploading ? 'Importing…' : 'Import Clients'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Taxes Section */}
      <Can permission="component.adminworkspacesetup_taxes.view" fallback={null}>
        <Collapsible open={isTaxesOpen} onOpenChange={setIsTaxesOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Taxes</CardTitle>
                    <CardDescription>
                      Configure tax settings for your workspace.
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isTaxesOpen && "transform rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Materials Tax Rate</Label>
                    <p className="text-xs text-muted-foreground">
                      Set the tax rate applied to materials in quotes, change orders, and contracts.
                    </p>
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs">Tax Rate (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={taxRateInput}
                          onChange={(e) => setTaxRateInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTaxRate();
                          }}
                          disabled={!taxesEditEnabled || taxRateLoading || isSavingTaxRate}
                          placeholder="6.00"
                          className="w-full"
                        />
                        {taxRateLoading ? (
                          <p className="text-xs text-muted-foreground">Loading...</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Current rate: {(taxRate * 100).toFixed(2)}%
                          </p>
                        )}
                      </div>
                      {taxesEditEnabled && (
                        <Button
                          onClick={handleSaveTaxRate}
                          disabled={isSavingTaxRate || taxRateLoading || !taxRateInput}
                          className="gap-2"
                        >
                          {isSavingTaxRate ? 'Saving...' : 'Save'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </Can>

      {/* Delete Confirmation Dialogs */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Appointment Type"
        description={
          typeToDelete
            ? `Are you sure you want to delete "${typeToDelete.name}"? This action cannot be undone.`
            : ''
        }
      />
      <ConfirmDeleteDialog
        open={statusDeleteDialogOpen}
        onOpenChange={setStatusDeleteDialogOpen}
        onConfirm={handleConfirmDeleteStatus}
        title="Delete Project Status"
        description={
          statusToDelete
            ? `Are you sure you want to delete "${statusToDelete.name}"? Projects using this status will have their status set to null. This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}

