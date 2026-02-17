import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchPackageGroups } from '@/queries/packageGroups';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface PresetSelectorProps {
  packages: any[];
  onLoadPackage: (packageId: string) => void;
}

export function PresetSelector({
  packages,
  onLoadPackage,
}: PresetSelectorProps) {
  const { currentWorkspace } = useWorkspace();
  const [packageGroups, setPackageGroups] = useState<any[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Record<string, string>>({});

  // Load package groups
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchPackageGroups(currentWorkspace.id)
        .then(setPackageGroups)
        .catch(console.error);
    }
  }, [currentWorkspace?.id]);

  // Filter packages by group
  const getPackagesForGroup = (groupId: string) => {
    return packages.filter((p) => p.package_group_id === groupId);
  };

  const handlePackageSelect = (groupId: string, packageId: string) => {
    setSelectedPackages(prev => ({ ...prev, [groupId]: packageId }));
    onLoadPackage(packageId);
  };

  if (packageGroups.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No package groups configured.
      </div>
    );
  }

  return (
    <div>
      <Label className="text-sm font-medium text-muted-foreground mb-2 block">Package Presets</Label>
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(packageGroups.length, 5)}, minmax(0, 1fr))` }}>
        {packageGroups.map((group) => {
          const groupPackages = getPackagesForGroup(group.id);
          const selectedValue = selectedPackages[group.id];
          return (
            <Select
              key={group.id}
              value={selectedValue || undefined}
              onValueChange={(value) => handlePackageSelect(group.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={group.name} />
              </SelectTrigger>
              <SelectContent>
                {groupPackages.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No packages
                  </div>
                ) : (
                  groupPackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          );
        })}
      </div>
    </div>
  );
}

