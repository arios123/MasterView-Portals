import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, MoreVertical, Trash2 } from 'lucide-react';
import { Money, usePrice } from "@/contexts/PriceContext";
import { Project, LineItem } from "@/types";
import { computeTotals } from "@/utils/calculations";
import { usePermissions } from '@/hooks/usePermissions';
import { Can } from '@/components/Can';
import { ProjectDocumentsSection } from './ProjectDocumentsSection';
import { useClientAssignments } from '@/hooks/activity/useClientAssignments';
import { useClientData } from '@/hooks/materials/useClientData';
import { usePaymentSplits } from '@/hooks/activity/usePaymentSplits';
import { ClientAssignmentsSection } from './activity/ClientAssignmentsSection';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { updateProjectQuickNote, updateProjectNotes, fetchProjectById, updateProjectStatus, deleteProject } from '@/queries/projects';
import { useProjectCrewAssignments } from '@/hooks/activity/useProjectCrewAssignments';
import { ProjectCrewSection } from './activity/ProjectCrewSection';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { deleteClient } from '@/queries/clients';
import { filterAllowedStatuses, isStatusDropdownDisabled as checkStatusDropdownDisabled, canChangeToStatus } from '@/utils/statusPermissions';
import { toast } from 'sonner';
import { useWorkspaceTaxRate } from '@/hooks/useWorkspaceTaxRate';
import { isDemoMode } from '@/utils/demoMode';

interface ActivityTabProps {
  project: Project;
  assignedUserName: string;
  activeDraftItems: LineItem[];
  activeDraftMultiplier: number;
  activeDraftName: string;
  activeDraftVersionId: string | null;
  changeOrderVersions: any[];
  incoming: any[];
  onMarkSold: () => void;
  readOnly?: boolean;
  onClientDeleted?: () => void;
  onProjectDeleted?: () => void;
}

export function ActivityTab({
  project,
  assignedUserName,
  activeDraftItems,
  activeDraftMultiplier,
  activeDraftName,
  activeDraftVersionId,
  changeOrderVersions,
  incoming,
  onMarkSold,
  readOnly = false,
  onClientDeleted,
  onProjectDeleted,
  userRole
}: ActivityTabProps & { userRole?: string }) {
  const { can } = usePermissions();
  const { hidden } = usePrice();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { projectStatuses } = useProjectStatuses(currentWorkspace?.id);

  const { clientData } = useClientData(project.clientId);
  const paymentSplits = usePaymentSplits(activeDraftVersionId);
  const {
    assignedStaff,
    workspaceMembers: availableMembers,
    selectedMemberId,
    setSelectedMemberId,
    loading: loadingAssignments,
    handleAddStaff,
    handleRemoveStaff,
    handleUpdateStaff,
    currentStaffMemberId,
  } = useClientAssignments(project.clientId);

  const {
    crewMembers,
    workspaceMembers: availableCrewMembers,
    selectedMemberId: selectedCrewMemberId,
    setSelectedMemberId: setSelectedCrewMemberId,
    loading: loadingCrew,
    handleAddCrewMember,
    handleRemoveCrewMember,
  } = useProjectCrewAssignments(project.id);

  const [projectDetails, setProjectDetails] = useState<{ project_type: string | null } | null>(null);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!project.id || !currentWorkspace?.id) return;
      setLoadingProjectDetails(true);
      try {
        const projectData = await fetchProjectById(project.id, currentWorkspace.id);
        if (projectData) {
          setProjectDetails({
            project_type: (projectData as any).project_type || null,
          });
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setLoadingProjectDetails(false);
      }
    };
    fetchProjectDetails();
  }, [project.id, currentWorkspace?.id]);

  const [quickNote, setQuickNote] = useState(project.quickNote || '');
  const [notes, setNotes] = useState(project.note || '');
  const [isSavingQuickNote, setIsSavingQuickNote] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [deleteClientDialogOpen, setDeleteClientDialogOpen] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  useEffect(() => {
    setQuickNote(project.quickNote || '');
    setNotes(project.note || '');
  }, [project.quickNote, project.note]);

  const canViewClientDocuments = can('component.activity_projectdocuments.view');
  const canEditClientDocuments = can('component.activity_projectdocuments.edit');
  const clientDocumentsReadOnly = !canEditClientDocuments;

  const canViewAssignStaff = can('component.activity_assignstaff.view');
  const canEditAssignStaff = can('component.activity_assignstaff.edit');
  const assignStaffReadOnly = !canEditAssignStaff;

  const canViewAssignCrew = can('component.activity_assigncrew.view');
  const canEditAssignCrew = can('component.activity_assigncrew.edit');
  const assignCrewReadOnly = !canEditAssignCrew;

  const canViewPrices = can('component.activity_viewprices.view');

  const { taxRate } = useWorkspaceTaxRate();
  const labor = activeDraftItems.filter((i) => i.kind === "labor").reduce((a, i) => a + i.qty * i.unitPrice, 0);
  const mats = activeDraftItems
    .filter((i) => i.kind === "material")
    .reduce((a, i) => a + i.qty * (1 + ((i.wastePct || 0) / 100)) * i.unitPrice, 0);
  const tax = mats * taxRate;
  const contractTotal = (labor + mats + tax) * activeDraftMultiplier;

  const changeOrdersTotal = changeOrderVersions.filter(co => co.is_active).reduce((total, changeOrder) => {
    const { laborSub, matSub, tax: coTax } = computeTotals(changeOrder.items || [], taxRate);
    const sub = laborSub + matSub + coTax;
    const grand = sub * (Number(changeOrder.multiplier) || 1);
    return total + grand;
  }, 0);

  const projectTotal = contractTotal + changeOrdersTotal;
  const totalPaid = incoming.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = projectTotal - totalPaid;

  const allPayments = [
    { label: '1st Payment', percentage: paymentSplits[0], amount: projectTotal * (paymentSplits[0] / 100) },
    { label: '2nd Payment', percentage: paymentSplits[1], amount: projectTotal * (paymentSplits[1] / 100) },
    { label: '3rd Payment', percentage: paymentSplits[2], amount: projectTotal * (paymentSplits[2] / 100) },
    { label: 'Last Payment', percentage: paymentSplits[3], amount: projectTotal * (paymentSplits[3] / 100) }
  ];
  const activePayments = allPayments.filter(p => p.percentage > 0);
  const numberOfPayments = activePayments.length;

  const handleQuickNoteSave = async () => {
    if (readOnly || !currentWorkspace || !user) return;
    setIsSavingQuickNote(true);
    try {
      await updateProjectQuickNote(project.id, quickNote, currentWorkspace.id, user.id);
      toast.success("Quick note saved");
    } catch (error) {
      console.error("Error saving quick note:", error);
      toast.error("Failed to save quick note");
    } finally {
      setIsSavingQuickNote(false);
    }
  };

  const handleNotesSave = async () => {
    if (readOnly || !currentWorkspace || !user) return;
    setIsSavingNotes(true);
    try {
      await updateProjectNotes(project.id, notes, currentWorkspace.id, user.id);
      toast.success("Notes saved");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!currentWorkspace) return;

    if (!canChangeToStatus(newStatus, project.status, can)) {
      toast.error(`You don't have permission to change status to "${newStatus}"`);
      return;
    }

    try {
      await updateProjectStatus(project.id, newStatus, currentWorkspace.id);
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteClient = async () => {
    if (!currentWorkspace || !user) return;
    setIsDeletingClient(true);
    try {
      await deleteClient(project.clientId, currentWorkspace.id, user.id);
      toast.success("Client and all associated projects have been deleted");
      setDeleteClientDialogOpen(false);
      onClientDeleted?.();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      setIsDeletingClient(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!currentWorkspace || !user) return;
    setIsDeletingProject(true);
    try {
      await deleteProject(project.id, currentWorkspace.id, user.id);
      toast.success("Project has been deleted");
      setDeleteProjectDialogOpen(false);
      onProjectDeleted?.();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeletingProject(false);
    }
  };

  const allowedStatuses = filterAllowedStatuses(projectStatuses, project.status, can);
  const canEditActivity = can('tab.projects_activity.view') && can('tab.projects_activity.edit');
  const isStatusDropdownDisabled = checkStatusDropdownDisabled(project.status, can, canEditActivity && !readOnly);

  return (
    <div className="space-y-6">
      {canViewPrices && !hidden && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm mb-1">Project Total</p>
              <p className="text-xl font-semibold"><Money value={projectTotal} /></p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm mb-1">Contract Total</p>
              <p className="text-xl font-semibold"><Money value={contractTotal} /></p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm mb-1">Change Orders</p>
              <p className={`text-xl font-semibold ${changeOrdersTotal < 0 ? 'text-red-600' : changeOrdersTotal > 0 ? 'text-green-600' : ''}`}>
                {changeOrdersTotal !== 0 && (changeOrdersTotal > 0 ? '+' : '')}<Money value={changeOrdersTotal} />
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm mb-1">Total Paid</p>
              <p className="text-xl font-semibold text-green-600"><Money value={totalPaid} /></p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm mb-1">Balance</p>
              <p className="text-xl font-semibold text-orange-600"><Money value={balance} /></p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Project Information</CardTitle>
          {!readOnly && (
            <Can permission="component.activity_deleteproject.view" fallback={null}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => !isDemoMode() && setDeleteProjectDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                    disabled={isDemoMode()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Can>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Project Title</p>
              <p className="font-medium">{project.project || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{project.residence || 'N/A'}</p>
            </div>
            {projectDetails?.project_type && (
              <div>
                <p className="text-sm text-muted-foreground">Project Type</p>
                <p className="font-medium">{projectDetails.project_type}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <Select
                value={project.status || ""}
                onValueChange={handleStatusChange}
                disabled={isStatusDropdownDisabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={project.status || "No Status"} />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map(status => (
                    <SelectItem key={status.id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Can permission="component.activity_assigncrew.view" fallback={null}>
              <div className="md:col-span-2">
                <ProjectCrewSection
                  crewMembers={crewMembers}
                  availableMembers={availableCrewMembers}
                  selectedMemberId={selectedCrewMemberId}
                  onSelectMember={setSelectedCrewMemberId}
                  onAddCrewMember={handleAddCrewMember}
                  onRemoveCrewMember={handleRemoveCrewMember}
                  loading={loadingCrew}
                  readOnly={readOnly || assignCrewReadOnly}
                />
              </div>
            </Can>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Client Information</CardTitle>
          {!readOnly && (
            <Can permission="component.activity_deleteclient.view" fallback={null}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => !isDemoMode() && setDeleteClientDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                    disabled={isDemoMode()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Can>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client Name</p>
              <p className="font-medium">{clientData?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Project Address</p>
              <p className="font-medium">{project.residence || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium">{clientData?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{clientData?.email || 'N/A'}</p>
            </div>
            <Can permission="component.activity_assignstaff.view" fallback={null}>
              <ClientAssignmentsSection
                assignedStaff={assignedStaff}
                availableMembers={availableMembers}
                selectedMemberId={selectedMemberId}
                onSelectMember={setSelectedMemberId}
                onAddStaff={handleAddStaff}
                onRemoveStaff={handleRemoveStaff}
                onUpdateStaff={handleUpdateStaff}
                currentStaffMemberId={currentStaffMemberId}
                loading={loadingAssignments}
                readOnly={readOnly || assignStaffReadOnly}
              />
            </Can>
          </div>
        </CardContent>
      </Card>

      {canViewPrices && !hidden && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Number of Payments</p>
              <p className="font-medium">{numberOfPayments}</p>
            </div>
            <div className={`grid grid-cols-1 gap-4 ${numberOfPayments === 2 ? 'md:grid-cols-2' : numberOfPayments === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
              {activePayments.map((payment, index) => (
                <div key={index}>
                  <p className="text-sm text-muted-foreground">{payment.label} ({payment.percentage}%)</p>
                  <p className="font-medium"><Money value={payment.amount} /></p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Add quick notes here..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="min-h-[200px]"
              disabled={readOnly || isSavingQuickNote}
            />
            {!readOnly && (
              <Button
                onClick={handleQuickNoteSave}
                disabled={isSavingQuickNote}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Quick Notes
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Add notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[200px]"
              disabled={readOnly || isSavingNotes}
            />
            {!readOnly && (
              <Button
                onClick={handleNotesSave}
                disabled={isSavingNotes}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Notes
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Can permission="component.activity_projectdocuments.view" fallback={null}>
        <ProjectDocumentsSection
          projectId={project.id}
          project={project}
          clientData={clientData}
          activeDraftItems={activeDraftItems}
          activeDraftMultiplier={activeDraftMultiplier}
          tabIdentifier="activity"
          readOnly={clientDocumentsReadOnly}
          userRole={userRole}
        />
      </Can>

      <AlertDialog open={deleteClientDialogOpen} onOpenChange={setDeleteClientDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. The client will be permanently deleted, along with all projects associated with it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingClient}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteClient(); }}
              disabled={isDeletingClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingClient ? "Deleting…" : "Delete client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProjectDialogOpen} onOpenChange={setDeleteProjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. The project will be permanently deleted forever. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingProject}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteProject(); }}
              disabled={isDeletingProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingProject ? "Deleting…" : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
