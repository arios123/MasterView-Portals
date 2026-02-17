import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { AccountabilityInfo } from "@/components/AccountabilityInfo";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

interface DraftsTabProps {
  project: any;
  projectVersions: any[];
  selectedVersionId: string | null;
  userRole: string;
  onVersionClick: (version: any) => void;
  onToggleChangeOrderActive: (versionId: string, currentActive: boolean) => void;
  onSetSelectedVersion: (versionId: string | null) => void;
  onSetAsActive: () => void;
  onDeleteVersion: (versionId?: string) => void;
  onMarkAsSold: (versionId: string) => void;
  getVersionStatusColor: (status: string, isActive: boolean, isChangeOrderActive?: boolean) => string;
  getDisplayStatus: (status: string, isActive: boolean, isChangeOrderActive?: boolean) => string;
  readOnly?: boolean;
}

export function DraftsTab({
  project,
  projectVersions,
  selectedVersionId,
  userRole,
  onVersionClick,
  onToggleChangeOrderActive,
  onSetSelectedVersion,
  onSetAsActive,
  onDeleteVersion,
  onMarkAsSold,
  getVersionStatusColor,
  getDisplayStatus,
  readOnly = false
}: DraftsTabProps) {
  const { can, loading: permissionsLoading } = usePermissions();
  const { currentWorkspace } = useWorkspace();
  const { projectStatuses } = useProjectStatuses(currentWorkspace?.id);
  
  // State for change order delete confirmation
  const [changeOrderDeleteDialogOpen, setChangeOrderDeleteDialogOpen] = useState(false);
  const [changeOrderToDelete, setChangeOrderToDelete] = useState<{ versionId: string; name: string } | null>(null);
  
  // Get status names for logic checks
  const soldStatusName = projectStatuses.find(s => s.name === "Sold")?.name || "Sold";
  
  // Permission checks for drafts and change orders
  const canViewDrafts = can("component.drafts_drafts.view");
  const canViewChangeOrders = can("component.drafts_changeorders.view");
  const canViewChangeOrderDelete = can("component.drafts_changeorderdelete.view");
  const canEditChangeOrderDelete = can("component.drafts_changeorderdelete.edit");
  const canViewChangeOrdersSetActive = can("component.drafts_changeorderssetactive.view");
  const canEditChangeOrdersSetActive = can("component.drafts_changeorderssetactive.edit");
  
  // Permission checks for draft actions
  const canViewDraftSetActive = can("component.drafts_draftsetactive.view");
  const canEditDraftSetActive = can("component.drafts_draftsetactive.edit");
  const canViewDraftDelete = can("component.drafts_draftdelete.view");
  const canEditDraftDelete = can("component.drafts_draftdelete.edit");
  const canViewDraftMarkSold = can("component.drafts_draftmarksold.view");
  const canEditDraftMarkSold = can("component.drafts_draftmarksold.edit");
  
  // Filter versions based on permissions
  const filteredVersions = projectVersions.filter((version) => {
    const isChangeOrder = version.status.toLowerCase().includes('change order');
    const isDraft = !isChangeOrder; // If it's not a change order, it's a draft
    
    if (isChangeOrder) {
      return canViewChangeOrders;
    } else {
      return canViewDrafts;
    }
  });
  
  const canModify = project.status !== soldStatusName && !readOnly;
  const selectedVersion = filteredVersions.find(v => v.version_id === selectedVersionId);
  const isDraft = selectedVersion?.status.toLowerCase().includes('draft');
  
  // Determine if buttons should be visible and enabled based on permissions
  // Buttons should ONLY be visible if the .view permission exists (strict check)
  // If .view permission is missing, button must NOT render
  // Top buttons should ONLY show for drafts, not change orders
  const showSetActiveButton = canViewDraftSetActive === true && isDraft === true;
  const enableSetActiveButton = canEditDraftSetActive === true && canModify === true;
  const showDeleteButton = canViewDraftDelete === true && isDraft === true; // Only show for drafts
  const enableDeleteButton = canEditDraftDelete === true && canModify === true && !selectedVersion?.isActive;
  const showMarkSoldButton = canViewDraftMarkSold === true && isDraft === true && project.status !== soldStatusName;
  const enableMarkSoldButton = canEditDraftMarkSold === true && canModify === true;
  
  // Only show button container if at least one button should be visible
  // Don't show buttons while permissions are loading
  const showAnyButton = !permissionsLoading && (showSetActiveButton === true || showDeleteButton === true || showMarkSoldButton === true);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-base">Project Versions</CardTitle>
            {/* Desktop: Show buttons in header */}
            {selectedVersionId && showAnyButton && (
              <div className="hidden md:flex flex-wrap gap-2">
                {showSetActiveButton && (
                  <Button 
                    onClick={onSetAsActive}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={!enableSetActiveButton}
                  >
                    Set as Active Draft
                  </Button>
                )}
                {showMarkSoldButton && (
                  <Button 
                    onClick={() => onMarkAsSold(selectedVersionId)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl bg-black text-white hover:bg-black/90"
                    disabled={!enableMarkSoldButton}
                  >
                    Mark as Sold
                  </Button>
                )}
                {showDeleteButton && (
                  <Button 
                    onClick={() => onDeleteVersion(selectedVersionId || undefined)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-red-600 hover:text-red-700"
                    disabled={!enableDeleteButton}
                  >
                    Delete Version
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredVersions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {projectVersions.length === 0 
                  ? "No versions found for this project"
                  : "No versions available based on your permissions"}
              </div>
            ) : (
              filteredVersions.map((version) => {
                const isChangeOrder = version.status.toLowerCase().includes('change order');
                
                return (
                  <div key={version.version_id} className="space-y-2">
                    <div 
                      className={`border rounded-xl p-3 ${getVersionStatusColor(version.status, version.isActive, version.is_active)} cursor-pointer hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex items-center gap-3">
                        {canModify && (
                          <Checkbox
                            checked={selectedVersionId === version.version_id}
                            onCheckedChange={(checked) => 
                              onSetSelectedVersion(checked ? version.version_id : null)
                            }
                          />
                        )}
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => onVersionClick(version)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium text-sm">
                                  {version.name || `${getDisplayStatus(version.status, version.isActive, version.is_active)} - Version ${version.version_number}`}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Created by {version.creator_name} on {format(new Date(version.created_at), 'MMM dd, yyyy')}
                                </div>
                              </div>
                              {/* Stop propagation so clicking the info icon doesn't trigger version click */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <AccountabilityInfo
                                  created_by={version.created_by}
                                  created_at={version.created_at}
                                  updated_by={version.updated_by}
                                  updated_at={version.updated_at}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {isChangeOrder && canViewChangeOrdersSetActive && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-foreground">Active</span>
                                  <Switch
                                    checked={version.is_active || false}
                                    onCheckedChange={() => onToggleChangeOrderActive(version.version_id, version.is_active || false)}
                                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
                                    disabled={!canEditChangeOrdersSetActive}
                                  />
                                </div>
                              )}
                              {isChangeOrder && canViewChangeOrderDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setChangeOrderToDelete({
                                      versionId: version.version_id,
                                      name: version.name || `${getDisplayStatus(version.status, version.isActive, version.is_active)} - Version ${version.version_number}`
                                    });
                                    setChangeOrderDeleteDialogOpen(true);
                                  }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={!canEditChangeOrderDelete}
                                  title="Delete change order"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Floating buttons at bottom right when draft is selected */}
      {selectedVersionId && showAnyButton && (
        <div className="fixed bottom-4 right-4 md:hidden z-50 flex flex-col gap-2">
          {showSetActiveButton && (
            <Button 
              onClick={onSetAsActive}
              variant="outline"
              size="sm"
              className="rounded-xl shadow-lg"
              disabled={!enableSetActiveButton}
            >
              Set as Active Draft
            </Button>
          )}
          {showMarkSoldButton && (
            <Button 
              onClick={() => onMarkAsSold(selectedVersionId)}
              variant="outline"
              size="sm"
              className="rounded-xl bg-black text-white hover:bg-black/90 shadow-lg"
              disabled={!enableMarkSoldButton}
            >
              Mark as Sold
            </Button>
          )}
          {showDeleteButton && (
            <Button 
              onClick={() => onDeleteVersion(selectedVersionId || undefined)}
              variant="outline"
              size="sm"
              className="rounded-xl text-red-600 hover:text-red-700 shadow-lg"
              disabled={!enableDeleteButton}
            >
              Delete Version
            </Button>
          )}
        </div>
      )}

      {/* Change Order Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={changeOrderDeleteDialogOpen}
        onOpenChange={(open) => {
          setChangeOrderDeleteDialogOpen(open);
          if (!open) {
            // Clear the change order to delete when dialog closes
            setChangeOrderToDelete(null);
            // Clear selection after deletion
            if (changeOrderToDelete) {
              onSetSelectedVersion(null);
            }
          }
        }}
        onConfirm={() => {
          if (changeOrderToDelete) {
            // Pass versionId directly to delete function to avoid state timing issues
            onDeleteVersion(changeOrderToDelete.versionId);
            setChangeOrderToDelete(null);
            setChangeOrderDeleteDialogOpen(false);
          }
        }}
        title="Delete Change Order"
        description={
          changeOrderToDelete
            ? `Are you sure you want to delete "${changeOrderToDelete.name}"? This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
