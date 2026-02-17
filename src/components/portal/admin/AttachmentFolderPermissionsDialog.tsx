import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAttachmentFolderPermissions,
  bulkUpdateFolderPermissions,
  AttachmentFolderPermission,
} from '@/queries/attachmentFolderPermissions';
import { Shield } from 'lucide-react';

interface AttachmentFolderPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  onPermissionsUpdated?: () => void;
}

type Role = {
  id: string;
  name: string;
};

type PermissionState = {
  roleId: string;
  roleName: string;
  canView: boolean;
  canEdit: boolean;
};

export function AttachmentFolderPermissionsDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  onPermissionsUpdated,
}: AttachmentFolderPermissionsDialogProps) {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const workspaceId = currentWorkspace?.id;

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionState[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch roles and permissions when dialog opens
  useEffect(() => {
    if (open && workspaceId && folderId) {
      loadData();
    }
  }, [open, workspaceId, folderId]);

  const loadData = async () => {
    if (!workspaceId || !folderId) return;

    setLoading(true);
    try {
      // Fetch all roles in the workspace
      const { data: rolesData, error: rolesError } = await (supabase as any)
        .from('roles')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
        toast.error('Failed to load roles');
        setRoles([]);
        setPermissions([]);
        return;
      }

      const rolesList = rolesData || [];
      setRoles(rolesList);

      // Fetch existing permissions for this folder
      let existingPermissions: AttachmentFolderPermission[] = [];
      try {
        existingPermissions = await fetchAttachmentFolderPermissions(folderId, workspaceId);
      } catch (permError: any) {
        console.error('Error loading permissions:', permError);
        // Continue with empty permissions - user can still set them
        toast.error('Failed to load existing permissions, but you can still set them');
      }
      
      // Create permission state for all roles
      const permissionMap = new Map<string, AttachmentFolderPermission>();
      existingPermissions.forEach(perm => {
        permissionMap.set(perm.roleId, perm);
      });

      const permissionStates: PermissionState[] = rolesList.map((role: Role) => {
        const existing = permissionMap.get(role.id);
        const isAdmin = role.name === 'Admin';
        return {
          roleId: role.id,
          roleName: role.name,
          // Admin always has view+edit
          canView: isAdmin ? true : (existing?.canView ?? false),
          canEdit: isAdmin ? true : (existing?.canEdit ?? false),
        };
      });

      setPermissions(permissionStates);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleView = (roleId: string, roleName: string) => {
    // Admin role permissions cannot be changed
    if (roleName === 'Admin') return;
    
    setPermissions(prev => prev.map(p => {
      if (p.roleId === roleId) {
        return { ...p, canView: !p.canView };
      }
      return p;
    }));
  };

  const handleToggleEdit = (roleId: string, roleName: string) => {
    // Admin role permissions cannot be changed
    if (roleName === 'Admin') return;
    
    setPermissions(prev => prev.map(p => {
      if (p.roleId === roleId) {
        const newCanEdit = !p.canEdit;
        // If enabling edit, also enable view (edit implies view)
        return { ...p, canEdit: newCanEdit, canView: newCanEdit || p.canView };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    if (!workspaceId || !user?.id) return;

    setSaving(true);
    try {
      // Ensure Admin always has view+edit permissions
      const permissionsToSave = permissions.map(p => {
        const isAdmin = p.roleName === 'Admin';
        return {
          roleId: p.roleId,
          canView: isAdmin ? true : p.canView,
          canEdit: isAdmin ? true : p.canEdit,
        };
      });

      await bulkUpdateFolderPermissions(folderId, permissionsToSave, user.id);
      toast.success('Permissions updated successfully');
      onPermissionsUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error(error.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Folder Permissions: {folderName}
          </DialogTitle>
          <DialogDescription>
            Control which roles can view and edit files in this folder. Edit permission includes upload and delete.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading permissions...</div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 border-b font-medium text-sm">
                <div>Role</div>
                <div className="text-center">View</div>
                <div className="text-center">Edit</div>
              </div>
              <div className="divide-y">
                {permissions.map((perm) => {
                  const isAdmin = perm.roleName === 'Admin';
                  return (
                    <div key={perm.roleId} className="grid grid-cols-3 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                      <Label htmlFor={`view-${perm.roleId}`} className="font-medium cursor-pointer">
                        {perm.roleName}
                        {isAdmin && <span className="text-xs text-muted-foreground ml-2">(always enabled)</span>}
                      </Label>
                      <div className="flex justify-center">
                        <Checkbox
                          id={`view-${perm.roleId}`}
                          checked={perm.canView}
                          onCheckedChange={() => handleToggleView(perm.roleId, perm.roleName)}
                          disabled={isAdmin || perm.canEdit} // Admin always enabled, can't disable view if edit is enabled
                        />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox
                          id={`edit-${perm.roleId}`}
                          checked={perm.canEdit}
                          onCheckedChange={() => handleToggleEdit(perm.roleId, perm.roleName)}
                          disabled={isAdmin} // Admin always enabled
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {permissions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No roles found in this workspace. Create roles in Roles & Permissions first.
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>View:</strong> Users can see the folder and download files</p>
              <p>• <strong>Edit:</strong> Users can upload and delete files (includes view)</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

