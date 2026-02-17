import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { projectStatusesQueries } from "@/queries/projectStatuses";
import { Can } from "@/components/Can";
import { Project } from "@/types";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProjectCrewAssignments } from "@/queries/projectCrewAssignments";
import { useProjectCrewAssignments } from "@/hooks/activity/useProjectCrewAssignments";
import { usePrice } from "@/contexts/PriceContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface DbProject {
  project_id: string;
  client_id: string;
  name: string | null;
  project_type: string | null;
  address: string | null;
  notes: string | null;
  quick_note: string | null;
  status: string;
  created_at: string;
  active_version?: string | null;
  created_by?: string | null;
  assignedUserName?: string;
}

interface ProjectCost {
  projectId: string;
  totalCost: number;
}

interface ProjectsTabProps {
  currentProject: Project;
  onProjectChange?: () => void;
  readOnly?: boolean;
}

const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  project_type: z.string().min(1, "Project type is required"),
  address: z.string().min(1, "Address is required"),
  notes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectsTab({ currentProject, onProjectChange, readOnly = false }: ProjectsTabProps) {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const workspaceId = currentWorkspace?.id;
  const { projectStatuses } = useProjectStatuses(workspaceId);
  
  // Get status names for logic checks
  const soldStatusName = projectStatuses.find(s => s.name === "Sold")?.name || "Sold";
  const estimateStatusName = projectStatuses.find(s => s.name === "Estimate")?.name || "Estimate";
  const { can } = usePermissions();
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; name: string | null; email: string | null }>>([]);
  const [selectedCrewMemberIds, setSelectedCrewMemberIds] = useState<string[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Permission checks
  const canViewAddProject = can('component.clientprojects_addproject.view');
  const canEditAddProject = can('component.clientprojects_addproject.edit');
  const canViewSetActive = can('component.clientprojects_setactive.view');
  const canEditSetActive = can('component.clientprojects_setactive.edit');
  const canViewPrices = can('component.clientprojects_viewprices.view');
  const { hidden } = usePrice();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      project_type: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (workspaceId && currentProject.clientId) {
      fetchClientProjects();
      fetchActiveProject();
      fetchWorkspaceMembers();
    }
  }, [currentProject.clientId, workspaceId]);

  const fetchWorkspaceMembers = async () => {
    if (!workspaceId) return;

    try {
      const { data: membersData, error: membersError } = await (supabase as any)
        .from("workspace_members")
        .select("id, user_id")
        .eq("workspace_id", workspaceId);

      if (membersError) throw membersError;
      if (!membersData || membersData.length === 0) return;

      const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);
      if (userIds.length === 0) return;

      const { data: usersData, error: usersError } = await (supabase as any)
        .from("users")
        .select("user_id, name, email")
        .in("user_id", userIds);

      if (usersError) throw usersError;

      const membersMap = new Map(membersData.map((m: any) => [m.user_id, m.id]));
      const members = (usersData || []).map((u: any) => ({
        id: membersMap.get(u.user_id) || '',
        name: u.name,
        email: u.email,
      }));

      setWorkspaceMembers(members);
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  };

  useEffect(() => {
    // Only calculate project costs if user has permission to view prices
    if (projects.length > 0 && canViewPrices) {
      calculateProjectCosts();
    } else if (!canViewPrices) {
      // Clear costs if user doesn't have permission
      setProjectCosts([]);
    }
  }, [projects, canViewPrices]);

  const fetchActiveProject = async () => {
    if (!currentProject.clientId || !workspaceId) return;

    try {
      const { data, error } = await (supabase as any)
        .from('clients')
        .select('active_project')
        .eq('client_id', currentProject.clientId)
        .eq('workspace_id', workspaceId)
        .single();

      if (error) throw error;
      setActiveProjectId(data?.active_project || null);
    } catch (error) {
      console.error('Error fetching active project:', error);
    }
  };

  const fetchClientProjects = async () => {
    if (!currentProject.clientId || !workspaceId) {
      setLoading(false);
      setProjects([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('client_id', currentProject.clientId)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch assigned user names for each project (same pattern as useAssignedUser hook)
      const projectsWithUsers = await Promise.all(
        (data || []).map(async (project: DbProject) => {
          if (!project.created_by) {
            return { ...project, assignedUserName: 'Unassigned' };
          }

          try {
            const { data: userData, error: userError } = await (supabase as any)
              .from('users')
              .select('name')
              .eq('user_id', project.created_by)
              .maybeSingle();

            if (userError) {
              console.error('Error fetching assigned user:', userError);
              return { ...project, assignedUserName: 'Unknown User' };
            }

            return {
              ...project,
              assignedUserName: userData?.name || 'Unknown User'
            };
          } catch (error) {
            console.error('Error fetching assigned user:', error);
            return { ...project, assignedUserName: 'Unknown User' };
          }
        })
      );

      setProjects(projectsWithUsers);
    } catch (error) {
      console.error('Error fetching client projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectCosts = async () => {
    const results = await Promise.all(projects.map(async (proj) => {
      try {
        const { data, error } = await supabase.functions.invoke('project-total', {
          body: { projectId: proj.project_id }
        });
        if (error) {
          console.error('Function error for project', proj.name, error);
          return { projectId: proj.project_id, totalCost: 0 } as ProjectCost;
        }
        const total = (data as any)?.total ?? 0;
        return { projectId: proj.project_id, totalCost: Number(total) } as ProjectCost;
      } catch (e) {
        console.error('Error computing total for project', proj.name, e);
        return { projectId: proj.project_id, totalCost: 0 } as ProjectCost;
      }
    }));

    setProjectCosts(results);
  };

  const handleSetAsActive = async (projectId: string) => {
    // Check edit permission before setting active
    if (!canEditSetActive) {
      toast.error("You don't have permission to set active projects");
      return;
    }

    if (!currentProject.clientId || !workspaceId) return;

    try {
      const { error } = await (supabase as any)
        .from('clients')
        .update({ active_project: projectId })
        .eq('client_id', currentProject.clientId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      setActiveProjectId(projectId);
      toast.success("Project set as active!");
      
      // Notify parent to reload
      if (onProjectChange) {
        onProjectChange();
      }
    } catch (error) {
      console.error('Error setting active project:', error);
      toast.error("Failed to set active project");
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    // Check edit permission before submitting
    if (!canEditAddProject) {
      toast.error("You don't have permission to add projects");
      return;
    }

    if (!currentProject.clientId || !workspaceId) {
      toast.error("Workspace ID is required");
      return;
    }

    try {
      // Get default status_id for this workspace (first by display_order)
      const defaultStatusId = await projectStatusesQueries.getDefaultStatusId(workspaceId);
      
      if (!defaultStatusId) {
        toast.error("No project status available. Please create a status first.");
        return;
      }

      // Insert project and get the created project back
      // The trigger will automatically set the status text field based on status_id
      const { data: newProject, error: insertError } = await (supabase as any)
        .from('projects')
        .insert({
          name: data.name,
          project_type: data.project_type,
          address: data.address,
          notes: data.notes || null,
          client_id: currentProject.clientId,
          status_id: defaultStatusId,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Copy default questions to project
      try {
        const { error: copyError } = await (supabase as any)
          .rpc('copy_default_questions_to_project', {
            p_workspace_id: workspaceId,
            p_project_id: newProject.project_id,
            p_created_by: user?.id,
          });
        if (copyError) {
          console.error('Error copying default questions to project:', copyError);
          // Don't fail the whole operation if this fails
        }
      } catch (error) {
        console.error('Error copying default questions to project:', error);
        // Don't fail the whole operation if this fails
      }

      // Create crew assignments if any members are selected
      if (selectedCrewMemberIds.length > 0 && workspaceId) {
        try {
          await createProjectCrewAssignments(
            workspaceId,
            newProject.project_id,
            selectedCrewMemberIds,
            user?.id
          );
        } catch (error) {
          console.error('Error creating crew assignments:', error);
          // Don't fail the whole operation if this fails
        }
      }

      // Automatically set the new project as active for this client
      // Check if client currently has no active project, or if user has permission to set active
      if (canEditSetActive || !activeProjectId) {
        try {
          const { error: updateError } = await (supabase as any)
            .from('clients')
            .update({ active_project: newProject.project_id })
            .eq('client_id', currentProject.clientId)
            .eq('workspace_id', workspaceId);

          if (updateError) {
            console.error('Error setting project as active:', updateError);
            // Don't fail the whole operation if this fails
          } else {
            setActiveProjectId(newProject.project_id);
          }
        } catch (error) {
          console.error('Error setting project as active:', error);
          // Don't fail the whole operation if this fails
        }
      }

      toast.success("Project created successfully!");
      setIsDialogOpen(false);
      form.reset();
      setSelectedCrewMemberIds([]);
      fetchClientProjects();
      
      // Notify parent to reload if callback is provided
      if (onProjectChange) {
        onProjectChange();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Client Projects</h3>
        <Can 
          permission="component.clientprojects_addproject.view"
          fallback={null}
        >
          <Dialog open={isDialogOpen} onOpenChange={canEditAddProject ? setIsDialogOpen : undefined}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                disabled={!canEditAddProject}
                title={!canEditAddProject ? "You don't have permission to add projects" : undefined}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            {canEditAddProject && (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogDescription>
                    Create a new project for this client
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Kitchen Remodel" {...field} disabled={!canEditAddProject} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="project_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Kitchen" {...field} disabled={!canEditAddProject} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} disabled={!canEditAddProject} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional notes..." {...field} disabled={!canEditAddProject} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Label>Crew (Optional)</Label>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && !selectedCrewMemberIds.includes(value)) {
                            setSelectedCrewMemberIds([...selectedCrewMemberIds, value]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select crew members..." />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaceMembers
                            .filter(member => !selectedCrewMemberIds.includes(member.id))
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name || member.email || "Unknown"}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {selectedCrewMemberIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCrewMemberIds.map((memberId) => {
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
                                    setSelectedCrewMemberIds(selectedCrewMemberIds.filter(id => id !== memberId));
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
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={!canEditAddProject}
                      >
                        Create Project
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            )}
          </Dialog>
        </Can>
      </div>
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects found for this client.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((proj) => {
            const isActive = proj.project_id === activeProjectId;
            const projectCost = projectCosts.find(pc => pc.projectId === proj.project_id);
            
            return (
              <Card 
                key={proj.project_id} 
                className={isActive ? "border-primary bg-primary/5" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{currentProject.clientName} - {proj.name || 'Untitled Project'}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-normal px-3 py-1 rounded-full ${
                        proj.status === soldStatusName ? 'bg-success/10 text-success' : 
                        proj.status === estimateStatusName ? 'bg-primary/10 text-primary' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {proj.status || "No Status"}
                      </span>
                      {isActive && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {proj.project_type && (
                    <div className="text-sm">
                      <span className="font-medium">Type:</span> {proj.project_type}
                    </div>
                  )}
                  {proj.address && (
                    <div className="text-sm">
                      <span className="font-medium">Address:</span> {proj.address}
                    </div>
                  )}
                  <ProjectCrewManagement projectId={proj.project_id} />
                  {canViewPrices && !hidden && projectCost && (
                    <div className="text-sm font-semibold text-primary">
                      <span className="font-medium">Total Cost:</span> {projectCost.totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </div>
                  )}
                  {!isActive && canViewSetActive && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSetAsActive(proj.project_id)}
                      disabled={!canEditSetActive}
                      className="mt-2"
                      title={!canEditSetActive ? "You don't have permission to set active projects" : undefined}
                    >
                      Set as Active
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Component to display crew for an existing project (read-only, no manage button)
function ProjectCrewManagement({ 
  projectId, 
}: { 
  projectId: string; 
}) {
  const {
    crewMembers,
    loading,
  } = useProjectCrewAssignments(projectId);

  return (
    <div className="text-sm">
      <span className="font-medium">Crew:</span>{" "}
      {loading ? (
        <span className="text-muted-foreground">Loading...</span>
      ) : crewMembers.length > 0 ? (
        <span>{crewMembers.map(m => m.name || m.email || "Unknown").join(", ")}</span>
      ) : (
        <span className="text-muted-foreground">No crew assigned</span>
      )}
    </div>
  );
}
