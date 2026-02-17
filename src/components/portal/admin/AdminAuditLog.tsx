import { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAuditLogs,
  getAuditLogCount,
  getAuditLogResourceTypes,
  getAuditLogUsers,
  type AuditLog,
  type AuditLogFilters,
} from '@/queries/auditLogs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CalendarIcon, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ACTIONS = ['insert', 'update', 'delete'] as const;
const ITEMS_PER_PAGE = 50;

export function AdminAuditLog() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const workspaceId = currentWorkspace?.id;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true); // Start with true to show loading initially
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Options for filters
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string | null }>>([]);

  // Load filter options
  useEffect(() => {
    if (!workspaceId) return;

    const loadFilterOptions = async () => {
      try {
        const [types, userList] = await Promise.all([
          getAuditLogResourceTypes(workspaceId),
          getAuditLogUsers(workspaceId),
        ]);
        setResourceTypes(types);
        setUsers(userList);
      } catch (error: any) {
        console.error('Error loading filter options:', error);
        // Silently fail - filters will just be empty
      }
    };

    loadFilterOptions();
  }, [workspaceId]);

  // Load audit logs
  useEffect(() => {
    if (!workspaceId) {
      console.log('AdminAuditLog: No workspaceId available');
      setLoading(false);
      return;
    }

    console.log('AdminAuditLog: Loading logs for workspace:', workspaceId);
    const loadLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: AuditLogFilters = {};
        
        if (resourceTypeFilter !== 'all') {
          filters.resourceType = resourceTypeFilter;
        }
        if (actionFilter !== 'all') {
          filters.action = actionFilter as 'insert' | 'update' | 'delete';
        }
        if (userFilter !== 'all') {
          filters.userId = userFilter;
        }
        if (startDate) {
          filters.startDate = startDate;
        }
        if (endDate) {
          filters.endDate = endDate;
        }

        const [logsData, count] = await Promise.all([
          fetchAuditLogs(workspaceId, filters, ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
          getAuditLogCount(workspaceId, filters),
        ]);

        setLogs(logsData);
        setTotalCount(count);
      } catch (error: any) {
        console.error('Error loading audit logs:', error);
        // Check if it's a table not found error
        if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation') || error?.message?.includes('audit_logs')) {
          const errorMsg = 'Audit log table not found. Please run database migrations.';
          setError(errorMsg);
          toast.error(errorMsg);
        } else {
          const errorMsg = error?.message || 'Failed to load audit logs';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [workspaceId, resourceTypeFilter, actionFilter, userFilter, startDate, endDate, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const clearFilters = () => {
    setResourceTypeFilter('all');
    setActionFilter('all');
    setUserFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
  };

  const hasActiveFilters = resourceTypeFilter !== 'all' || actionFilter !== 'all' || userFilter !== 'all' || startDate || endDate;

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'insert':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatJsonData = (data: Record<string, any> | null): string => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  // Show message if workspace is not available
  if (!workspaceId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No workspace selected. Please select a workspace to view audit logs.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            Track all user actions and changes within this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resource Types</SelectItem>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Table */}
          {error ? (
            <div className="text-center py-8">
              <div className="text-destructive mb-2 font-medium">{error}</div>
              <div className="text-sm text-muted-foreground">
                Please check the browser console for more details.
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
          ) : (
            <>
              <ScrollArea className="h-[600px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource Type</TableHead>
                      <TableHead>Resource ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {log.user_name || log.user_email || 'Unknown User'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.resource_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.resource_id ? `${log.resource_id.substring(0, 8)}...` : 'N/A'}
                        </TableCell>
                        <TableCell>{log.resource_location || 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount} logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage + 1} of {totalPages || 1}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog && (
                <>
                  {selectedLog.created_at ? format(new Date(selectedLog.created_at), 'PPpp') : 'N/A'} •{' '}
                  {selectedLog.user_name || selectedLog.user_email || 'Unknown User'} •{' '}
                  {selectedLog.action}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Resource Type</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLog.resource_type}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Resource ID</div>
                  <div className="text-sm font-mono text-muted-foreground">
                    {selectedLog.resource_id}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Location</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLog.resource_location || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Action</div>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
              </div>

              {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Changed Fields</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.changed_fields.map((field) => (
                      <Badge key={field} variant="outline">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Before Data</div>
                  <ScrollArea className="h-64 rounded-md border p-4 bg-muted/50">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                      {formatJsonData(selectedLog.before_data)}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">After Data</div>
                  <ScrollArea className="h-64 rounded-md border p-4 bg-muted/50">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                      {formatJsonData(selectedLog.after_data)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

