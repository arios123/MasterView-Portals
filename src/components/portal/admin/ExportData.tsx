import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Package, FolderKanban, Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { fetchAllClientsForExport } from '@/queries/clients';
import { fetchAllItemsForExport } from '@/queries/itemsExport';
import { fetchAllProjectsForExport } from '@/queries/projectsExport';
import { toast } from 'sonner';

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportData() {
  const { can } = usePermissions();
  const canEdit = can('tab.admin_exportdata.edit');
  const { currentWorkspace } = useWorkspace();
  const [exportingClients, setExportingClients] = useState(false);
  const [exportingItems, setExportingItems] = useState(false);
  const [exportingProjects, setExportingProjects] = useState(false);

  const handleExportClients = async () => {
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }
    setExportingClients(true);
    try {
      const rows = await fetchAllClientsForExport(currentWorkspace.id);
      const headers = ['name', 'phone', 'email', 'assigned_staff'];
      const csvLines = [
        headers.join(','),
        ...rows.map((row) =>
          headers.map((h) => escapeCsvValue(row[h as keyof typeof row] ?? '')).join(',')
        ),
      ];
      const csv = csvLines.join('\n');
      downloadCsv(csv, 'clients-export.csv');
      toast.success(`Exported ${rows.length} client(s)`);
    } catch (err: unknown) {
      console.error('Export clients error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export clients');
    } finally {
      setExportingClients(false);
    }
  };

  const handleExportItems = async () => {
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }
    setExportingItems(true);
    try {
      const rows = await fetchAllItemsForExport(currentWorkspace.id);
      const headers = ['type', 'name', 'unit_price'];
      const csvLines = [
        headers.join(','),
        ...rows.map((row) =>
          headers.map((h) => escapeCsvValue(row[h as keyof typeof row] ?? '')).join(',')
        ),
      ];
      const csv = csvLines.join('\n');
      downloadCsv(csv, 'items-export.csv');
      toast.success(`Exported ${rows.length} item(s)`);
    } catch (err: unknown) {
      console.error('Export items error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export items');
    } finally {
      setExportingItems(false);
    }
  };

  const handleExportProjects = async () => {
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }
    setExportingProjects(true);
    try {
      const rows = await fetchAllProjectsForExport(currentWorkspace.id);
      const headers = [
        'project_name',
        'project_type',
        'address',
        'client_name',
        'client_phone',
        'client_email',
        'notes',
        'quick_notes',
        'status',
        'project_total',
        'contract_total',
        'change_orders',
        'total_paid',
        'balance',
      ];
      const csvLines = [
        headers.join(','),
        ...rows.map((row) =>
          headers.map((h) => escapeCsvValue(row[h as keyof typeof row] ?? '')).join(',')
        ),
      ];
      const csv = csvLines.join('\n');
      downloadCsv(csv, 'projects-export.csv');
      toast.success(`Exported ${rows.length} project(s)`);
    } catch (err: unknown) {
      console.error('Export projects error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export projects');
    } finally {
      setExportingProjects(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Export workspace data as CSV files. Select what you want to export below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExportClients}
              disabled={!canEdit || exportingClients}
              className="flex items-center gap-3 min-w-[180px]"
            >
              {exportingClients ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Users className="h-5 w-5" />
              )}
              Export Clients
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleExportItems}
              disabled={!canEdit || exportingItems}
              className="flex items-center gap-3 min-w-[180px]"
            >
              {exportingItems ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Package className="h-5 w-5" />
              )}
              Export Items
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleExportProjects}
              disabled={!canEdit || exportingProjects}
              className="flex items-center gap-3 min-w-[180px]"
            >
              {exportingProjects ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FolderKanban className="h-5 w-5" />
              )}
              Export Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
