import { useState, useEffect } from 'react';
import { useAdminStore, Role, FeatureKey } from '@/stores/adminStore';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function PermissionsMatrix() {
  const { permissions, setPermission, savePermissions, loadPermissions } = useAdminStore();
  const { workspaceId } = useWorkspace();
  const roles: Role[] = [];
  const features: { key: FeatureKey; label: string }[] = [
    { key: 'activity', label: 'Activity' },
    { key: 'lookbook', label: 'Lookbook' },
    { key: 'contractBuilder', label: 'Contract Builder' },
    { key: 'changeOrder', label: 'Change Order' },
    { key: 'materials', label: 'Materials' },
    { key: 'drafts', label: 'Drafts' },
    { key: 'payments', label: 'Payments' },
    { key: 'viewPrice', label: 'View Price' },
    { key: 'clientProjects', label: 'Client Projects' },
    { key: 'attachments', label: 'Attachments' },
  ];

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Load permissions on mount
  useEffect(() => {
    if (workspaceId) {
      loadPermissions(workspaceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const handleSave = async () => {
    if (!workspaceId) {
      console.error('Cannot save permissions: workspaceId is required');
      return;
    }
    setSaving(true);
    try {
      await savePermissions(workspaceId);
      setDirty(false);
    } catch (error) {
      // Error already handled in savePermissions
    } finally {
      setSaving(false);
    }
  };

  const set = (role: Role, key: FeatureKey, level: 'visible' | 'read' | 'write', v: boolean) => { 
    setDirty(true); 
    setPermission(role, key, level, v); 
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Configure features per role</div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
          <Button variant="ghost" onClick={() => window.location.reload()}>Discard</Button>
        </div>
      </div>
      <div className="rounded-lg border overflow-auto">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Feature</th>
              {roles.map((r) => (
                <th key={r} className="px-3 py-2 text-left">
                  <div className="flex flex-col gap-1">
                    <span>{r}</span>
                    <div className="text-xs text-muted-foreground font-normal text-center">
                      Visible/Read/Write
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.key} className="border-t">
                <td className="px-3 py-2 font-medium">{f.label}</td>
                {roles.map((r) => {
                  const row = permissions.find((p) => p.role === r)!;
                  const perm = row.features[f.key];
                  // For viewPrice, disable read and write checkboxes
                  const isViewPrice = f.key === 'viewPrice';
                  return (
                    <td key={r} className="px-3 py-2">
                      <div className="flex gap-1 items-center justify-center">
                        <Checkbox 
                          checked={perm.visible} 
                          onCheckedChange={(v) => set(r, f.key, 'visible', !!v)} 
                          aria-label={`${f.label} visible for ${r}`}
                          className="w-4 h-4 rounded-sm border-gray-300 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500"
                        />
                        <Checkbox 
                          checked={perm.read} 
                          disabled={!perm.visible || isViewPrice}
                          onCheckedChange={(v) => {
                            if (v) {
                              set(r, f.key, 'read', true);
                            } else {
                              set(r, f.key, 'read', false);
                            }
                          }} 
                          aria-label={`${f.label} read for ${r}`}
                          className="w-4 h-4 rounded-sm border-gray-300 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500"
                        />
                        <Checkbox 
                          checked={perm.write} 
                          disabled={!perm.visible || isViewPrice}
                          onCheckedChange={(v) => {
                            if (v) {
                              set(r, f.key, 'write', true);
                            } else {
                              set(r, f.key, 'write', false);
                            }
                          }} 
                          aria-label={`${f.label} write for ${r}`}
                          className="w-4 h-4 rounded-sm border-gray-300 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
