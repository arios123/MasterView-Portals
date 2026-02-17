import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Can } from '@/components/Can';
import { toast } from 'sonner';
import { useDocumentGroups } from '@/hooks/useDocumentGroups';
import {
  fetchDocumentGroupIdsForTab,
  saveDocumentGroupTabConfigurations,
  TabIdentifier,
} from '@/queries/documentGroupTabConfigurations';
import { Loader2 } from 'lucide-react';

const TAB_CONFIGURATIONS: Array<{ identifier: TabIdentifier; label: string }> = [
  { identifier: 'activity', label: 'Activity' },
  { identifier: 'lookbook', label: 'LookBook' },
  { identifier: 'contract_builder', label: 'Contract Builder' },
  { identifier: 'change_order', label: 'Change Orders' },
  { identifier: 'materials', label: 'Materials' },
  { identifier: 'payments', label: 'Payments' },
];

export function DocumentGroupTabConfigurationSection() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('component.adminworkspacesetup_documentgroups.view');
  const canEdit = can('component.adminworkspacesetup_documentgroups.edit');
  const canEditEnabled = canView && canEdit;

  const workspaceId = currentWorkspace?.id;
  const { groups, loading: groupsLoading } = useDocumentGroups();
  
  // State: Map of tab identifier -> array of selected document group IDs
  const [selectedGroupIds, setSelectedGroupIds] = useState<Record<TabIdentifier, string[]>>({
    activity: [],
    lookbook: [],
    contract_builder: [],
    change_order: [],
    materials: [],
    payments: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing configurations
  useEffect(() => {
    if (!workspaceId || !canView) return;

    setLoading(true);
    Promise.all(
      TAB_CONFIGURATIONS.map(async ({ identifier }) => {
        try {
          const groupIds = await fetchDocumentGroupIdsForTab(workspaceId, identifier);
          return { identifier, groupIds };
        } catch (error) {
          console.error(`Error loading configurations for ${identifier}:`, error);
          return { identifier, groupIds: [] };
        }
      })
    )
      .then(results => {
        const newSelected: Record<TabIdentifier, string[]> = {
          activity: [],
          lookbook: [],
          contract_builder: [],
          change_order: [],
          materials: [],
          payments: [],
        };
        results.forEach(({ identifier, groupIds }) => {
          newSelected[identifier] = groupIds;
        });
        setSelectedGroupIds(newSelected);
        setHasChanges(false);
      })
      .catch(error => {
        console.error('Error loading document group tab configurations:', error);
        toast.error('Failed to load configurations');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [workspaceId, canView]);

  const handleToggleGroup = (tabIdentifier: TabIdentifier, groupId: string) => {
    if (!canEditEnabled) return;

    setSelectedGroupIds(prev => {
      const currentIds = prev[tabIdentifier] || [];
      const newIds = currentIds.includes(groupId)
        ? currentIds.filter(id => id !== groupId)
        : [...currentIds, groupId];
      
      return {
        ...prev,
        [tabIdentifier]: newIds,
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!workspaceId || !user?.id || !hasChanges) return;

    setSaving(true);
    try {
      // Save configurations for all tabs
      await Promise.all(
        TAB_CONFIGURATIONS.map(({ identifier }) =>
          saveDocumentGroupTabConfigurations(
            workspaceId,
            identifier,
            selectedGroupIds[identifier] || [],
            user.id
          )
        )
      );
      toast.success('Document group tab configurations saved');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving document group tab configurations:', error);
      toast.error(error.message || 'Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return null;
  }

  if (groupsLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Group Tab Configurations</CardTitle>
          <CardDescription>
            Configure which document groups are available in each tab's client document component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
          <CardTitle>Document Group Tab Configurations</CardTitle>
          <CardDescription>
            Configure which document groups are available in each tab's client document component.
            If no groups are selected for a tab, no document groups will be available.
          </CardDescription>
          </div>
          {canEditEnabled && hasChanges && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {TAB_CONFIGURATIONS.map(({ identifier, label }) => (
            <AccordionItem key={identifier} value={identifier} className="border-b">
              <AccordionTrigger className="text-base font-semibold">
                {label}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-4 pt-2">
                  {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No document groups available. Create document groups first.
                    </p>
                  ) : (
                    groups.map(group => {
                      const isSelected = (selectedGroupIds[identifier] || []).includes(group.id);
                      return (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${identifier}-${group.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleToggleGroup(identifier, group.id)}
                            disabled={!canEditEnabled}
                          />
                          <Label
                            htmlFor={`${identifier}-${group.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {group.name}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

