import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Trash2 } from 'lucide-react';
import { Role } from '@/stores/adminStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { fetchAllUsers, updateUserRole as updateUserRoleQuery } from '@/queries/users';
import { inviteUser } from '@/queries/admin';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Can } from '@/components/Can';
import { supabase } from '@/integrations/supabase/client';

type User = {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  isOwner?: boolean;
};

export function StaffManagement() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { can } = usePermissions();
  const canEdit = can('tab.admin_staff.view') && can('tab.admin_staff.edit');
  const [staff, setStaff] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | 'All'>('All');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchStaff();
      fetchRoles();
    }
  }, [workspaceId]);

  const fetchRoles = async () => {
    if (!workspaceId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('roles')
        .select('name')
        .eq('workspace_id', workspaceId)
        .order('name');
      
      if (error) throw error;
      
      // Map role names to Role type (capitalize first letter)
      const roles = (data || []).map((r: any) => {
        const name = r.name;
        // Capitalize first letter
        return name.charAt(0).toUpperCase() + name.slice(1);
      }) as Role[];
      
      setAvailableRoles(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to default roles if fetch fails
      setAvailableRoles(['Admin', 'Designer', 'Accounting', 'PM', 'Crew', 'Driver']);
    }
  };

  const fetchStaff = async () => {
    if (!workspaceId) return;
    
    try {
      const data = await fetchAllUsers(workspaceId);
      setStaff(data as User[]);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    }
  };

  const filtered = useMemo(
    () => staff.filter((s) => (role === 'All' || s.role === role) && (s.name.toLowerCase().includes(q.toLowerCase()) || (s.email?.toLowerCase().includes(q.toLowerCase()) ?? false))),
    [staff, q, role]
  );

  const sendInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    // COMMENTED OUT IN DEMO MODE - demo is read-only
    const { blockDemoWrite } = await import('@/utils/demoMode');
    if (blockDemoWrite('send user invite')) {
      return;
    }

    const form = new FormData(e.currentTarget);
    setLoading(true);
    
    const email = String(form.get('email') || '');
    const userRole = (form.get('role') as Role) || '';
    
    try {
      // COMMENTED OUT IN DEMO MODE - demo is read-only
      await inviteUser(email, userRole, workspaceId);
      toast.success(`Invite sent to ${email}`);
      setOpen(false);
      fetchStaff();
    } catch (error: any) {
      toast.error(`Failed to send invite: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (id: string, newRole: string) => {
    if (!workspaceId || !canEdit) {
      toast.error('You do not have permission to update roles');
      return;
    }

    // COMMENTED OUT IN DEMO MODE - demo is read-only
    const { blockDemoWrite } = await import('@/utils/demoMode');
    if (blockDemoWrite('update user role')) {
      return;
    }
    
    try {
      // COMMENTED OUT IN DEMO MODE - demo is read-only
      await updateUserRoleQuery(id, newRole, workspaceId);
      toast.success('Role updated');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to update role');
      console.error(error);
    }
  };

  const deleteUser = async (id: string) => {
    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    if (!canEdit) {
      toast.error('You do not have permission to delete users');
      return;
    }

    try {
      // First, get the workspace_member id to clean up role assignments
      const { data: member, error: memberError } = await (supabase as any)
        .from('workspace_members')
        .select('id')
        .eq('user_id', id)
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (memberError) {
        toast.error('Failed to find workspace member');
        console.error(memberError);
        return;
      }

      if (!member) {
        toast.error('User is not a member of this workspace');
        return;
      }

      // Remove role assignments first (to avoid foreign key constraints)
      const { error: rolesError } = await (supabase as any)
        .from('workspace_member_roles')
        .delete()
        .eq('workspace_member_id', member.id);

      if (rolesError) {
        toast.error('Failed to remove role assignments');
        console.error(rolesError);
        return;
      }

      // Then remove user from workspace (remove from workspace_members, NOT from users table)
      const { error } = await (supabase as any)
        .from('workspace_members')
        .delete()
        .eq('id', member.id)
        .eq('workspace_id', workspaceId);
      
      if (error) {
        toast.error('Failed to remove user from workspace');
        console.error(error);
        return;
      }
      
      toast.success('User removed from workspace');
      fetchStaff();
    } catch (error: any) {
      toast.error('Failed to remove user from workspace');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2" />
          <Input className="pl-8" placeholder="Search staff…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={String(role)} onValueChange={(v: any) => setRole(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All roles</SelectItem>
            {availableRoles.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Can permission="tab.admin_staff.edit">
          <Button onClick={() => setOpen(true)} className="gap-2"><UserPlus className="w-4 h-4"/>Send Invite</Button>
        </Can>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full text-sm">
            <div className="grid grid-cols-12 font-medium py-2 border-b">
              <div className="col-span-3">Name</div>
              <div className="col-span-5">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <AnimatePresence initial={false}>
              {filtered.map((s) => (
                <motion.div
                  key={s.id}
                  className="grid grid-cols-12 items-center py-2 border-b"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <span>{s.name}</span>
                    {s.isOwner && (
                      <span className="inline-flex items-center rounded-full border border-red-500 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-red-600">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="col-span-5"><a href={`mailto:${s.email}`} className="underline underline-offset-2">{s.email || '—'}</a></div>
                  <div className="col-span-2">
                    <Select 
                      value={s.role || ''} 
                      onValueChange={(v: any) => updateUserRole(s.id, v)}
                      disabled={!canEdit || s.isOwner}
                    >
                      <SelectTrigger disabled={!canEdit || s.isOwner}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 text-right flex justify-end gap-2">
                    {canEdit && !s.isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteUser(s.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center text-muted-foreground">
                  No staff match your filters.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invite</DialogTitle>
            <DialogDescription>Send an authentication invite to a new team member.</DialogDescription>
          </DialogHeader>
          <form onSubmit={sendInvite} className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" required placeholder="colleague@example.com" />
              </div>
              <div>
                <Label>Role</Label>
                <Select name="role" defaultValue="">
                  <SelectTrigger><SelectValue placeholder="Pick a role"/></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
