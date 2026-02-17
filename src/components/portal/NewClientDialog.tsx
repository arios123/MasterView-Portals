import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/queries/clients";
import { createClientAssignments } from "@/queries/clientAssignments";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkspaceMember = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
};

interface NewClientDialogProps {
  /** Controlled open state for embedded mode */
  open?: boolean;
  /** Callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Callback when client is successfully created */
  onClientCreated?: (clientId: string) => void;
  /** Whether to show the trigger button (standalone mode) */
  showTrigger?: boolean;
}

export const NewClientDialog = ({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  onClientCreated,
  showTrigger = true 
}: NewClientDialogProps = {}) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Fetch workspace members when dialog opens
  useEffect(() => {
    const fetchMembers = async () => {
      if (!workspaceId || !open) return;
      
      try {
        // First, fetch workspace members
        const { data: membersData, error: membersError } = await (supabase as any)
          .from("workspace_members")
          .select("id, user_id")
          .eq("workspace_id", workspaceId);

        if (membersError) throw membersError;

        if (!membersData || membersData.length === 0) {
          setWorkspaceMembers([]);
          return;
        }

        // Extract user IDs
        const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);

        if (userIds.length === 0) {
          setWorkspaceMembers([]);
          return;
        }

        // Then fetch user details from public.users table
        const { data: usersData, error: usersError } = await (supabase as any)
          .from("users")
          .select("user_id, name, email")
          .in("user_id", userIds);

        if (usersError) throw usersError;

        // Create a map of user_id to user data
        type UserData = { user_id: string; name: string | null; email: string | null };
        const usersMap = new Map<string, UserData>(
          (usersData || []).map((u: any) => [u.user_id, u as UserData])
        );

        // Combine workspace_members with user data
        const members = membersData.map((member: any) => {
          const user = usersMap.get(member.user_id);
          return {
            id: member.id, // workspace_member id
            user_id: member.user_id,
            name: user?.name || null,
            email: user?.email || null,
          };
        });

        setWorkspaceMembers(members);
      } catch (error: any) {
        console.error("Error fetching workspace members:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load workspace members",
          variant: "destructive",
        });
      }
    };

    fetchMembers();
  }, [workspaceId, open, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a client",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Client name is required",
        variant: "destructive",
      });
      return;
    }

    if (!workspaceId) {
      toast({
        title: "Error",
        description: "Please select a workspace first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the client
      const newClient = await createClient(workspaceId, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
      }, user.id);

      // Create client assignments if any members are selected
      if (selectedMemberIds.length > 0) {
        await createClientAssignments(
          workspaceId,
          newClient.client_id,
          selectedMemberIds,
          user.id
        );
      }

      toast({
        title: "Success",
        description: "Client created successfully",
      });

      // Reset form and close dialog
      setFormData({ name: "", phone: "", email: "" });
      setSelectedMemberIds([]);
      setOpen(false);

      // Notify parent that client was created
      if (onClientCreated) {
        onClientCreated(newClient.client_id);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Client name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="client@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedStaff">Assigned Staff (Optional)</Label>
            <Select
              value={selectedMemberIds.length > 0 ? selectedMemberIds[0] : ""}
              onValueChange={(value) => {
                if (value && !selectedMemberIds.includes(value)) {
                  setSelectedMemberIds([...selectedMemberIds, value]);
                }
              }}
            >
              <SelectTrigger id="assignedStaff">
                <SelectValue placeholder="Select staff members..." />
              </SelectTrigger>
              <SelectContent>
                {workspaceMembers
                  .filter(member => !selectedMemberIds.includes(member.id))
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email || "Unknown"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedMemberIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedMemberIds.map((memberId) => {
                  const member = workspaceMembers.find(m => m.id === memberId);
                  return (
                    <div
                      key={memberId}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-sm"
                    >
                      <span>{member?.name || member?.email || "Unknown"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
                        }}
                        className="ml-1 text-slate-500 hover:text-slate-700"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
  );

  // If showTrigger is false, return only the dialog content (for embedded mode)
  if (!showTrigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  // Standalone mode with trigger button
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          New Client
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
};
