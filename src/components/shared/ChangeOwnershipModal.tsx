import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchAllUsers } from '@/queries/users';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StaffMember {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  isOwner?: boolean;
}

interface ChangeOwnershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  currentOwnerId: string;
  onSelectUser: (userId: string) => void;
}

/**
 * Modal for changing workspace ownership
 * Shows all staff members with a "Make Owner" button for each
 */
export function ChangeOwnershipModal({
  open,
  onOpenChange,
  workspaceId,
  currentOwnerId,
  onSelectUser,
}: ChangeOwnershipModalProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && workspaceId) {
      fetchStaff();
    } else {
      setStaff([]);
    }
  }, [open, workspaceId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers(workspaceId);
      setStaff(data as StaffMember[]);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOwner = (userId: string) => {
    if (!userId) {
      toast.error('Invalid user selected');
      return;
    }
    onSelectUser(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Workspace Ownership</DialogTitle>
          <DialogDescription>
            Select a staff member to transfer workspace ownership to. This action is irreversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : staff.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No staff members found
            </p>
          ) : (
            <div className="space-y-2">
              {staff.map((member) => {
                const isCurrentOwner = member.user_id === currentOwnerId;
                return (
                  <Card key={member.id} className="p-4">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.email || 'No email'}
                              {member.role && ` • ${member.role}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrentOwner && (
                            <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                              Current Owner
                            </span>
                          )}
                          <Button
                            variant={isCurrentOwner ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleMakeOwner(member.user_id!)}
                            disabled={isCurrentOwner || !member.user_id}
                          >
                            {isCurrentOwner ? 'Current Owner' : 'Make Owner'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

