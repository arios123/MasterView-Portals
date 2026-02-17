import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Building2, User } from 'lucide-react';
import { PendingInvite } from '@/queries/workspaceInvites';

interface WorkspaceInviteSelectionDialogProps {
  open: boolean;
  invites: PendingInvite[];
  onComplete: (selectedInvites: PendingInvite[]) => Promise<void>;
  loading?: boolean;
}

export function WorkspaceInviteSelectionDialog({
  open,
  invites,
  onComplete,
  loading = false,
}: WorkspaceInviteSelectionDialogProps) {
  const [selectedInvites, setSelectedInvites] = useState<Set<string>>(new Set());

  // Initialize with all invites selected by default when dialog opens
  useEffect(() => {
    if (open && invites.length > 0) {
      setSelectedInvites(new Set(invites.map(inv => inv.workspaceId)));
    }
  }, [open, invites]);

  const handleToggleInvite = (workspaceId: string) => {
    setSelectedInvites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceId)) {
        newSet.delete(workspaceId);
      } else {
        newSet.add(workspaceId);
      }
      return newSet;
    });
  };

  const handleComplete = async () => {
    const selected = invites.filter(inv => selectedInvites.has(inv.workspaceId));
    if (selected.length > 0) {
      await onComplete(selected);
    }
  };

  const allSelected = selectedInvites.size === invites.length && invites.length > 0;
  const someSelected = selectedInvites.size > 0 && selectedInvites.size < invites.length;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workspace Invitations</DialogTitle>
          <DialogDescription>
            You've been invited to join {invites.length} workspace{invites.length > 1 ? 's' : ''}. 
            Select which ones you'd like to join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending invitations found.
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.workspaceId}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`invite-${invite.workspaceId}`}
                    checked={selectedInvites.has(invite.workspaceId)}
                    onCheckedChange={() => handleToggleInvite(invite.workspaceId)}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={`invite-${invite.workspaceId}`}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {invite.workspaceName || 'Unknown Workspace'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Role: {invite.role}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              // Select all or none
              if (allSelected) {
                setSelectedInvites(new Set());
              } else {
                setSelectedInvites(new Set(invites.map(inv => inv.workspaceId)));
              }
            }}
            disabled={invites.length === 0 || loading}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            onClick={handleComplete}
            disabled={selectedInvites.size === 0 || loading}
          >
            {loading ? 'Joining...' : `Join ${selectedInvites.size} Workspace${selectedInvites.size > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

