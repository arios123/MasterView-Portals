import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Project, EventItem } from "@/types";
import { USERS, ROLE_TABS, CLIENTS } from "@/constants";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { usePrice } from "@/contexts/PriceContext";
import { ProjectCard } from "@/components/portal/ProjectCard";
import { CompletedProjectCard } from "@/components/portal/CompletedProjectCard";
import { ClientProfile } from "@/components/portal/ClientProfile";
import { CalendarTab } from "@/components/portal/CalendarTab";
import { AdminTab } from "@/components/portal/AdminTab";
import { NewClientDialog } from "@/components/portal/NewClientDialog";
import { NoWorkspaceLimbo } from "@/components/portal/NoWorkspaceLimbo";
import { useAdminStore, Role } from "@/stores/adminStore";
import { Can } from "@/components/Can";
import { usePermissions } from "@/hooks/usePermissions";
import { TermsCheckGate } from "@/components/shared/TermsCheckGate";
import { 
  fetchClientsWithActiveProjects, 
  fetchClientsNotAssignedToUser,
  fetchClientsAssignedToUserOrCrew,
  fetchClientById
} from "@/queries/clients";
import { fetchClientAssignments } from "@/queries/clientAssignments";
import { fetchProjectCrewAssignments } from "@/queries/projectCrewAssignments";
import { 
  fetchUserProjects, 
  mapProjectWithTotals, 
  loadProjectById, 
  updateProjectStatus as updateProjectStatusQuery,
  updateProjectQuickNote,
  touchProjectLastUsed
} from "@/queries/projects";
import { fetchUserById, fetchUsersByIds } from "@/queries/users";
import { getUserPermissions } from "@/queries/permissions";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { canChangeToStatus } from "@/utils/statusPermissions";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Renovation Portal — Stable Build (refactored)
 *
 * This version has been refactored into smaller, focused components
 * and organized with proper separation of concerns.
 */

export default function PortalStable() {
  const { user } = useAuth();
  const { currentWorkspace, currentUserRole, loading: workspaceLoading, workspaces } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { appointmentTypes } = useAppointmentTypes(workspaceId);
  const { projectStatuses } = useProjectStatuses(workspaceId);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Apply workspace theme (only in portal)
  useWorkspaceTheme();
  
  // Get onboarding state from context
  const { state: onboardingState } = useOnboarding();
  
  // Get status names for logic checks
  const completedStatusName = projectStatuses.find(s => s.name === "Completed")?.name || "Completed";
  const lostStatusName = projectStatuses.find(s => s.name === "Lost")?.name || "Lost";
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [userRole, setUserRole] = useState<string>("");
  const { can, permissions } = usePermissions();
  
  // Determine active tab from route
  const getTabFromPath = (pathname: string): string => {
    if (pathname.startsWith('/projects') && !params.projectId) return 'Projects';
    if (pathname.startsWith('/clients')) return 'Clients';
    if (pathname.startsWith('/calendar')) return 'Calendar';
    if (pathname.startsWith('/completed')) return 'Completed';
    if (pathname.startsWith('/lost')) return 'Lost';
    if (pathname.startsWith('/internalsupport')) return 'Support';
    if (pathname.startsWith('/admin')) return 'Admin';
    return 'Projects'; // default
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));
  const isUserActionRef = useRef(false);
  const previousMainTabRef = useRef<string>(getTabFromPath(location.pathname));

  // Note: Root path (/) is now handled by LandingWrapper

  // Redirect /admin to first available admin tab (handled by AdminTab component)
  // AdminTab will determine the first available tab based on permissions
  useEffect(() => {
    if (location.pathname === '/admin' && !params.section) {
      // Let AdminTab component handle redirecting to first available tab
      // We'll redirect to a default, and AdminTab will correct it if needed
      navigate('/admin/staff', { replace: true });
    }
  }, [location.pathname, params.section, navigate]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [clientsWithProjects, setClientsWithProjects] = useState<Array<{
    clientId: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    activeProject: Project | null;
  }>>([]);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [clientProjectsLoading, setClientProjectsLoading] = useState(false);
  
  // Search states for each tab
  const [projectsSearch, setProjectsSearch] = useState("");
  const [clientsSearch, setClientsSearch] = useState("");
  const [completedSearch, setCompletedSearch] = useState("");
  const [lostSearch, setLostSearch] = useState("");
  const [profile, setProfile] = useState<Project | null>(null);
  const { hidden: hidePrices, setHidden: setHidePrices } = usePrice();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  // Get available tabs based on permissions instead of legacy ROLE_TABS
  const allPossibleTabs = ['Projects', 'Clients', 'Calendar', 'Completed', 'Lost', 'Support', 'Admin'];
  const tabs = allPossibleTabs.filter((tab) => {
    // Check for tab.{name}.view permission
    const permission = `tab.${tab.toLowerCase()}.view`;
    const hasPermission = can(permission);
    // Support tab intentionally has no permission gate; show it for all authenticated users
    if (tab === 'Support') return true;
    return hasPermission;
  });

  // Load and log user permissions on mount
  useEffect(() => {
    if (user && workspaceId) {
      getUserPermissions(user.id, workspaceId).then((permissions) => {
        // Permissions loaded
      }).catch((error) => {
        console.error('Error fetching user permissions:', error);
      });
    }
  }, [user, workspaceId]);

  // Get role from workspace context
  useEffect(() => {
    if (currentUserRole) {
      setUserRole(currentUserRole);
    } else {
      setUserRole(""); // No default
    }
  }, [currentUserRole]);

  // Fetch clients with their active projects assigned to current user
  const fetchClientsWithActiveProjectsHandler = async () => {
    if (!user || !workspaceId) return;

    setProjectsLoading(true);
    try {
      const clientsWithProjectsData = await fetchClientsWithActiveProjects(user.id, workspaceId);
      setClientsWithProjects(clientsWithProjectsData);
    } catch (error) {
      console.error("Error fetching clients with projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch clients from database",
        variant: "destructive",
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  // Fetch projects from database
  const fetchProjects = async () => {
    if (!user || !workspaceId) return;

    setProjectsLoading(true);
    try {
      const data = await fetchUserProjects(user.id, workspaceId);
      const mappedProjects: Project[] = await Promise.all(
        data.map(async (dbProject: any) => await mapProjectWithTotals(dbProject, workspaceId))
      );
      setProjects(mappedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects from database",
        variant: "destructive",
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  // Fetch clients where user is assigned staff OR projects where user is crew
  const fetchClientProjects = async () => {
    if (!user || !workspaceId) return;

    setClientProjectsLoading(true);
    try {
      // 1. Find all clients that ARE tied to this user (assigned staff or crew)
      const assignedOrCrewClients = await fetchClientsAssignedToUserOrCrew(user.id, workspaceId);
      const assignedClientIds = new Set(
        (assignedOrCrewClients || []).map((client: any) => client.client_id)
      );

      // 2. Fetch ALL clients in the workspace
      const { data: allClients, error: clientsError } = await (supabase as any)
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name");

      if (clientsError) throw clientsError;

      // 3. Keep only clients that are NOT assigned to this user and where user is NOT crew
      const clientsData = (allClients || []).filter(
        (client: any) => !assignedClientIds.has(client.client_id)
      );
      
      // First, get all active projects for these clients
      const projectsWithUsers = await Promise.all(
        clientsData
          .filter(client => client.active_project)
          .map(async (client) => {
            const { data: projectData, error } = await (supabase as any)
              .from("projects")
              .select("*")
              .eq("project_id", client.active_project)
              .eq("workspace_id", workspaceId)
              .maybeSingle();

            return { client, projectData, error };
          })
      );

      // Extract unique user IDs from projects' created_by field
      const userIds = [...new Set(
        projectsWithUsers
          .filter(p => p.projectData && !p.error)
          .map(p => p.projectData!.created_by)
          .filter(Boolean)
      )];

      // Fetch user data
      const usersData = userIds.length > 0 ? await fetchUsersByIds(userIds, workspaceId) : [];
      
      const usersMap = usersData.reduce(
        (acc, user) => {
          acc[user.user_id] = user;
          return acc;
        },
        {} as Record<string, any>,
      );

      // Map clients to projects and fetch assigned staff
      const mappedProjects: (Project & { assignedStaff?: Array<{ name: string | null; email: string | null }> })[] = await Promise.all(
        clientsData.map(async (client: any) => {
          let projectData = null;
          let projectStatus = "No Project";

          // Fetch crew for the active project (project-level crew assignments)
          let crew = "No crew assigned";
          let crewMembers: Array<{ name: string | null; email: string | null }> = [];
          
          if (client.active_project) {
            const found = projectsWithUsers.find(p => p.client.client_id === client.client_id);
            if (found && found.projectData && !found.error) {
              projectData = found.projectData;
              projectStatus = projectData.status || "Unknown";
              
              // Fetch crew for this project
              try {
                const crewAssignments = await fetchProjectCrewAssignments(projectData.project_id, workspaceId);
                crewMembers = crewAssignments
                  .map((a: any) => a.user)
                  .filter(Boolean)
                  .map((user: any) => ({
                    name: user.name,
                    email: user.email,
                  }));
                
                if (crewMembers.length > 0) {
                  crew = crewMembers.map(m => m.name || m.email || "Unknown").join(", ");
                }
              } catch (error) {
                console.error("Error fetching crew for project:", error);
              }
            }
          }

          return {
            id: projectData?.project_id || client.client_id,
            clientId: client.client_id,
            clientName: client.name,
            project: projectData?.name || projectData?.project_type || "No Active Project",
            residence: projectData?.address || client.email || "No address",
            crew: crew,
            note: projectData?.notes || "No notes",
            phaseIndex: 0,
            paid: 0,
            totalCost: 0,
            nextPayment: 0,
            dueStage: "TBD",
            status: projectStatus === "No Project" ? "Estimate" : (projectStatus as string),
            assignedUserId: projectData?.created_by || undefined,
            quickNote: "",
          };
        }),
      );

      setClientProjects(mappedProjects);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setClientProjectsLoading(false);
    }
  };

  const submitSupportRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast({
        title: "Missing info",
        description: "Please add a subject and a short message.",
        variant: "destructive",
      });
      return;
    }
    setSupportSubmitting(true);
    try {
      // Placeholder submission; wire to support channel/email/API later.
      toast({
        title: "Submitted",
        description: "We received your question. The MasterView Portals team will reach out.",
      });
      setSupportSubject('');
      setSupportMessage('');
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again or email support@masterviewportals.com.",
        variant: "destructive",
      });
    } finally {
      setSupportSubmitting(false);
    }
  };

  // Fetch data on initial load and when user/workspace changes
  // This will NOT refetch when switching browser tabs or staying idle
  useEffect(() => {
    if (!user || !workspaceId || workspaceLoading) return;

    fetchClientsWithActiveProjectsHandler();
    fetchProjects();
    fetchClientProjects();

    // Set up real-time subscription
    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "projects",
        },
        (payload) => {
          // Refetch projects when there's a change (only via real-time updates)
          fetchClientsWithActiveProjectsHandler();
          fetchProjects();
          fetchClientProjects();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
        },
        (payload) => {
          fetchClientsWithActiveProjectsHandler();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Only refetch when user, workspace, or workspace loading state changes
    // NOT when switching browser tabs or staying on page
  }, [user?.id, workspaceId, workspaceLoading]);

  const onChangeStatus = async (id: string, status: string) => {
    if (!workspaceId) return;
    
    // Check if user has edit permission for the relevant tab
    // Status changes can happen from Projects, Completed, or Lost tabs
    const hasProjectsEdit = can("tab.projects.view") && can("tab.projects.edit");
    const hasCompletedEdit = can("tab.completed.view") && can("tab.completed.edit");
    const hasLostEdit = can("tab.lost.view") && can("tab.lost.edit");
    
    if (!hasProjectsEdit && !hasCompletedEdit && !hasLostEdit) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit project status",
        variant: "destructive",
      });
      return;
    }
    
    // Find current project to get current status
    const currentProject = projects.find(p => p.id === id);
    const currentStatus = currentProject?.status || null;
    
    // Check if user has permission to change to this status
    if (!canChangeToStatus(status, currentStatus, can)) {
      toast({
        title: "Permission Denied",
        description: `You don't have permission to change status to "${status}"`,
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProjectStatusQuery(id, status, workspaceId, user?.id);
      
      // Update local state
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

      toast({
        title: "Status Updated",
        description: `Project status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating project status:", error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    }
  };

  const onQuickNoteSave = async (id: string, note: string) => {
    if (!workspaceId || !user) return;
    
    try {
      await updateProjectQuickNote(id, note, workspaceId, user.id);
      
      // Update projects state
      setProjects((prev) => prev.map((x) => (x.id === id ? { ...x, quickNote: note } : x)));
      // Also update clientsWithProjects if the project is in there
      setClientsWithProjects((prev) => 
        prev.map((client) => {
          if (client.activeProject && client.activeProject.id === id) {
            return {
              ...client,
              activeProject: {
                ...client.activeProject,
                quickNote: note,
              },
            };
          }
          return client;
        })
      );
    } catch (error) {
      console.error("Error saving quick note:", error);
      toast({
        title: "Error",
        description: "Failed to save quick note",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addEvent = (event: EventItem) => {
    setEvents((prev) => [...prev, event]);
  };

  const removeEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const onLogActivity = (clientId: string, line: string) => {
    // Log activity for client - could be extended to store in projects or separate activity log
  };

  // Build typeColors from database appointment types
  const typeColors = appointmentTypes.reduce(
    (acc, type) => {
      acc[type.id] = type.color;
      return acc;
    },
    {} as Record<string, string>,
  );

  const designerColors = USERS.reduce(
    (acc, user) => {
      acc[user.id] = "#666"; // Default color, could be customized per user
      return acc;
    },
    {} as Record<string, string>,
  );

  const canSeeAll = false;

  // Function to load a project by ID
  const loadProjectByIdHandler = async (projectId: string, clientIdFromRoute?: string): Promise<Project | null> => {
    if (!workspaceId) return null;
    return await loadProjectById(projectId, workspaceId, clientIdFromRoute);
  };

  // Restore profile from route params on mount or when route changes
  useEffect(() => {
    const { clientId, projectId } = params;
    if (projectId && clientId) {
      // Check if this is a client without a project (projectId === clientId)
      if (projectId === clientId) {
        // Check if we already have this client in clientsWithProjects
        const client = clientsWithProjects.find(c => c.clientId === clientId);
        if (client) {
          // Create a minimal Project object for clients without projects
          const minimalProject: Project = {
            id: client.clientId,
            clientId: client.clientId,
            clientName: client.clientName,
            project: "No Project",
            residence: "",
            crew: "",
            note: "",
            phaseIndex: 0,
            paid: 0,
            totalCost: 0,
            nextPayment: 0,
            dueStage: "",
            status: null,
            quickNote: "",
          };
          // Only set profile if it's different
          if (!profile || profile.id !== projectId || profile.clientId !== clientId) {
            setProfile(minimalProject);
          }
          // Ensure we're on the Client Projects tab
          const tab = params.tab || 'Client Projects';
          if (tab !== 'Client Projects') {
            navigate(`/projects/${clientId}/${projectId}/Client Projects`, { replace: true });
          }
        } else {
          // Client not found in list, try to fetch it directly
          if (workspaceId) {
            fetchClientById(clientId, workspaceId).then((clientData) => {
              if (clientData) {
                const minimalProject: Project = {
                  id: clientData.client_id,
                  clientId: clientData.client_id,
                  clientName: clientData.name,
                  project: "No Project",
                  residence: "",
                  crew: "",
                  note: "",
                  phaseIndex: 0,
                  paid: 0,
                  totalCost: 0,
                  nextPayment: 0,
                  dueStage: "",
                  status: null,
                  quickNote: "",
                };
                setProfile(minimalProject);
                const tab = params.tab || 'Client Projects';
                if (tab !== 'Client Projects') {
                  navigate(`/projects/${clientId}/${projectId}/Client Projects`, { replace: true });
                }
              }
            }).catch((error) => {
              console.error("Error fetching client:", error);
            });
          }
        }
      } else {
        // Only load if we don't have a profile or if the profile ID doesn't match
        if (!profile || profile.id !== projectId) {
          loadProjectByIdHandler(projectId, clientId).then((project) => {
            if (project) {
              setProfile(project);
              if (user?.id && workspaceId) {
                touchProjectLastUsed(user.id, projectId, workspaceId);
              }
              // If clientId in route doesn't match project's clientId, update the route
              if (clientId && project.clientId && clientId !== project.clientId) {
                const tab = params.tab || 'Activity';
                navigate(`/projects/${project.clientId}/${project.id}/${tab}`, { replace: true });
              } else if (!clientId && project.clientId) {
                // If route is missing clientId but project has it, update the route
                const tab = params.tab || 'Activity';
                navigate(`/projects/${project.clientId}/${project.id}/${tab}`, { replace: true });
              }
            }
          });
        }
      }
    } else if (profile && !projectId) {
      // If route has no project but we have a profile, clear it
      // This handles browser back button
      setProfile(null);
    }
  }, [params.projectId, params.clientId, params.tab, clientsWithProjects, profile, user?.id, workspaceId]); // Depend on route params

  // Sync activeTab with route when route changes (browser back/forward)
  // Only refetch data when navigating via browser back/forward, not during onboarding
  useEffect(() => {
    if (!isUserActionRef.current) {
      const tabFromPath = getTabFromPath(location.pathname);
      const previousTab = previousMainTabRef.current;
      
      if (tabFromPath !== activeTab) {
        setActiveTab(tabFromPath);
        
        // Refetch data when navigating to a different MAIN tab via browser back/forward
        // but only if not during onboarding
        if (!onboardingState.active && previousTab !== tabFromPath && user && workspaceId && !workspaceLoading) {
          fetchClientsWithActiveProjectsHandler();
          fetchProjects();
          fetchClientProjects();
        }
        
        previousMainTabRef.current = tabFromPath;
      }
    }
    isUserActionRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, activeTab, user, workspaceId, workspaceLoading, onboardingState.active]);

  const handleTabChange = (tab: string) => {
    isUserActionRef.current = true;
    const previousTab = previousMainTabRef.current;
    
    // Only refetch data when switching to a different MAIN tab and not during onboarding
    // This ensures data is fresh when navigating between main sections
    if (!onboardingState.active && previousTab !== tab && user && workspaceId && !workspaceLoading) {
      fetchClientsWithActiveProjectsHandler();
      fetchProjects();
      fetchClientProjects();
    }
    
    previousMainTabRef.current = tab;
    setActiveTab(tab);
    
    // Navigate to the appropriate route
  const routeMap: Record<string, string> = {
      'Projects': '/projects',
      'Clients': '/clients',
      'Calendar': '/calendar',
      'Completed': '/completed',
      'Lost': '/lost',
    'Support': '/internalsupport',
      'Admin': '/admin',
    };
    
    const route = routeMap[tab] || '/projects';
    navigate(route);
    
    // Close profile when switching main tabs (unless we're navigating to a project)
    if (!params.projectId) {
      setProfile(null);
    }
  };

  // Update route when profile is opened
  const handleOpenProfile = (project: Project | null | undefined) => {
    if (!project) return;
    setProfile(project);
    // If project.id === project.clientId, it means there's no real project (client without projects)
    const isClientWithoutProject = project.id === project.clientId;
    if (isClientWithoutProject) {
      navigate(`/projects/${project.clientId}/${project.id}/Client Projects`);
    } else {
      if (user?.id && workspaceId) {
        touchProjectLastUsed(user.id, project.id, workspaceId);
      }
      navigate(`/projects/${project.clientId}/${project.id}`);
    }
  };

  // Navigate back when profile is closed
  const handleCloseProfile = () => {
    setProfile(null);
    // Navigate back to the main tab
    const routeMap: Record<string, string> = {
      'Projects': '/projects',
      'Clients': '/clients',
      'Calendar': '/calendar',
      'Completed': '/completed',
      'Lost': '/lost',
      'Support': '/internalsupport',
      'Admin': '/admin',
    };
    const route = routeMap[activeTab] || '/projects';
    navigate(route);
    fetchClientsWithActiveProjectsHandler();
  };

  // Onboarding is now managed by OnboardingContext - no logic needed here

  // Show limbo page if user has no workspaces (and not loading)
  if (!workspaceLoading && workspaces.length === 0) {
    return <NoWorkspaceLimbo />;
  }

  return (
    <TermsCheckGate>
              {!profile && (
                <div className="max-w-7xl mx-auto px-6 py-8 w-full">
                  {/* PROJECTS */}
                  {activeTab === "Projects" && (
                    <Can 
                      permission="tab.projects.view"
                      fallback={
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">You don't have permission to view projects.</div>
                        </div>
                      }
                      loading={
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">Loading permissions...</div>
                        </div>
                      }
                    >
                      <div className="space-y-4" data-onboarding-highlight={isMobile ? undefined : "projects-tab"}>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-2xl font-semibold">Clients</h2>
                          <Can permission="tab.projects.edit">
                            <NewClientDialog />
                          </Can>
                        </div>
                        {/* Search Bar */}
                        <div className="relative mb-3">
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search by client name or project name..."
                            value={projectsSearch}
                            onChange={(e) => setProjectsSearch(e.target.value)}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                        {projectsLoading ? (
                          <div className="text-center py-8">
                            <div className="text-muted-foreground">Loading clients...</div>
                          </div>
                        ) : clientsWithProjects.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-muted-foreground">No clients assigned to you yet.</div>
                            <div className="text-sm text-muted-foreground mt-2">
                              Create a new client to get started.
                            </div>
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-4">
                            {clientsWithProjects
                              .filter((c) => !c.activeProject || (c.activeProject.status !== completedStatusName && c.activeProject.status !== lostStatusName))
                              .filter((c) => {
                                if (!projectsSearch.trim()) return true;
                                const searchLower = projectsSearch.toLowerCase();
                                const clientNameMatch = c.clientName?.toLowerCase().includes(searchLower);
                                const projectNameMatch = c.activeProject?.project?.toLowerCase().includes(searchLower);
                                return clientNameMatch || projectNameMatch;
                              })
                              .map((client) => {
                                // If client has an active project, show the ProjectCard
                                if (client.activeProject) {
                                  return (
                                    <ProjectCard
                                      key={client.clientId}
                                      project={client.activeProject}
                                      onStatusChange={onChangeStatus}
                                      onQuickNoteSave={onQuickNoteSave}
                                      onProfileClick={can("tab.projects.view") ? handleOpenProfile : () => {}}
                                      userRole={userRole}
                                      canEdit={can("tab.projects.view") && can("tab.projects.edit")}
                                    />
                                  );
                                }
                                // If client has no active project, show a special card
                                return (
                                  <Card
                                    key={client.clientId}
                                    className="rounded-2xl border border-border bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => {
                                      if (can("tab.projects.view")) {
                                        // Create a minimal Project object for clients without projects
                                        const minimalProject: Project = {
                                          id: client.clientId, // Use clientId as id to indicate no project
                                          clientId: client.clientId,
                                          clientName: client.clientName,
                                          project: "No Project",
                                          residence: "",
                                          crew: "",
                                          note: "",
                                          phaseIndex: 0,
                                          paid: 0,
                                          totalCost: 0,
                                          nextPayment: 0,
                                          dueStage: "",
                                          status: null,
                                          quickNote: "",
                                        };
                                        handleOpenProfile(minimalProject);
                                      }
                                    }}
                                  >
                                    <CardHeader>
                                      <CardTitle className="flex items-center justify-between">
                                        <span>{client.clientName}</span>
                                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                          No Projects
                                        </span>
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-sm text-muted-foreground">
                                        This client doesn't have any projects yet. Click to create one.
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </Can>
                  )}

                  {/* CLIENTS */}
                  {activeTab === "Clients" && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold mb-4">Clients Not Assigned to Me</h2>
                      {/* Search Bar */}
                      <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search by client name or project name..."
                          value={clientsSearch}
                          onChange={(e) => setClientsSearch(e.target.value)}
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                      {clientProjectsLoading ? (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">Loading clients...</div>
                        </div>
                      ) : clientProjects.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">No clients found.</div>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {clientProjects
                            .filter((client) => {
                              if (!clientsSearch.trim()) return true;
                              const searchLower = clientsSearch.toLowerCase();
                              const clientNameMatch = client.clientName?.toLowerCase().includes(searchLower);
                              const projectNameMatch = client.project?.toLowerCase().includes(searchLower);
                              return clientNameMatch || projectNameMatch;
                            })
                            .map((client) => {
                            // Check if this client has a valid project (not just a client_id as id)
                            const hasValidProject = client.id !== client.clientId;
                            return (
                            <Card
                              key={client.id}
                              className="bg-card/80 backdrop-blur-sm border border-border rounded-xl shadow-sm transition-shadow cursor-pointer hover:shadow-md"
                              onClick={() => {
                                if (can("tab.projects.view")) {
                                  if (hasValidProject) {
                                    // Client has a project, open it normally
                                    handleOpenProfile(client);
                                  } else {
                                    // Client has no project, create minimal Project object and open Client Projects tab
                                    const minimalProject: Project = {
                                      id: client.clientId, // Use clientId as id to indicate no project
                                      clientId: client.clientId,
                                      clientName: client.clientName,
                                      project: "No Project",
                                      residence: client.residence || "",
                                      crew: "",
                                      note: "",
                                      phaseIndex: 0,
                                      paid: 0,
                                      totalCost: 0,
                                      nextPayment: 0,
                                      dueStage: "",
                                      status: null,
                                      quickNote: "",
                                    };
                                    handleOpenProfile(minimalProject);
                                  }
                                }
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div>
                                    <h3 className="font-semibold text-lg text-foreground">{client.clientName}</h3>
                                    <p className="text-sm text-muted-foreground">{client.residence}</p>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Active Project</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {hasValidProject ? client.project : "No Project"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Status</p>
                                      {hasValidProject ? (
                                        <p className="text-sm font-medium text-foreground">{client.status}</p>
                                      ) : (
                                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                          No Projects
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="pt-1">
                                    <p className="text-xs text-muted-foreground">Assigned Staff</p>
                                    <p className="text-sm text-muted-foreground">
                                      {(client as any).assignedStaff && (client as any).assignedStaff.length > 0
                                        ? (client as any).assignedStaff.map((staff: { name: string | null; email: string | null }, idx: number) => (
                                            <span key={idx}>
                                              {staff.name || staff.email || "Unknown"}
                                              {idx < (client as any).assignedStaff.length - 1 && ", "}
                                            </span>
                                          ))
                                        : "No assigned staff"}
                                    </p>
                                  </div>
                                  {!hasValidProject && (
                                    <div className="pt-2 text-xs text-muted-foreground italic">
                                      Click to create a new project
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CALENDAR */}
                  {activeTab === "Calendar" && (
                    <Can 
                      permission="tab.calendar.view"
                      fallback={
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">You don't have permission to view the calendar.</div>
                        </div>
                      }
                      loading={
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">Loading permissions...</div>
                        </div>
                      }
                    >
                      <CalendarTab
                        events={events}
                        addEvent={addEvent}
                        removeEvent={removeEvent}
                        clients={CLIENTS}
                        users={USERS}
                        meId={user?.id || ""}
                        meRole={userRole}
                        canSeeAll={canSeeAll}
                        onLogActivity={onLogActivity}
                        typeColors={typeColors}
                        designerColors={designerColors}
                        canEdit={can("tab.calendar.view") && can("tab.calendar.edit")}
                      />
                    </Can>
                  )}

                  {/* COMPLETED */}
                  {activeTab === "Completed" && (
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search by client name or project name..."
                          value={completedSearch}
                          onChange={(e) => setCompletedSearch(e.target.value)}
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                      {projectsLoading ? (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">Loading completed projects...</div>
                        </div>
                      ) : clientsWithProjects.filter((c) => c.activeProject?.status === completedStatusName).length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">No completed projects yet.</div>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {clientsWithProjects
                            .filter((c) => c.activeProject?.status === completedStatusName)
                            .filter((c) => {
                              if (!completedSearch.trim()) return true;
                              const searchLower = completedSearch.toLowerCase();
                              const clientNameMatch = c.clientName?.toLowerCase().includes(searchLower);
                              const projectNameMatch = c.activeProject?.project?.toLowerCase().includes(searchLower);
                              return clientNameMatch || projectNameMatch;
                            })
                            .map((client) => (
                              <CompletedProjectCard
                                key={client.clientId}
                                project={client.activeProject!}
                                onStatusChange={onChangeStatus}
                                onProfileClick={can("tab.projects.view") ? handleOpenProfile : undefined}
                                userRole={userRole}
                                canEdit={can("tab.completed.view") && can("tab.completed.edit")}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* LOST */}
                  {activeTab === "Lost" && (
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search by client name or project name..."
                          value={lostSearch}
                          onChange={(e) => setLostSearch(e.target.value)}
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                      {projectsLoading ? (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">Loading lost projects...</div>
                        </div>
                      ) : clientsWithProjects.filter((c) => c.activeProject?.status === lostStatusName).length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">No lost projects yet.</div>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {clientsWithProjects
                            .filter((c) => c.activeProject?.status === lostStatusName)
                            .filter((c) => {
                              if (!lostSearch.trim()) return true;
                              const searchLower = lostSearch.toLowerCase();
                              const clientNameMatch = c.clientName?.toLowerCase().includes(searchLower);
                              const projectNameMatch = c.activeProject?.project?.toLowerCase().includes(searchLower);
                              return clientNameMatch || projectNameMatch;
                            })
                            .map((client) => (
                              <CompletedProjectCard
                                key={client.clientId}
                                project={client.activeProject!}
                                onStatusChange={onChangeStatus}
                                onProfileClick={can("tab.projects.view") ? handleOpenProfile : undefined}
                                userRole={userRole}
                                canEdit={can("tab.lost.view") && can("tab.lost.edit")}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUPPORT */}
                  {activeTab === "Support" && (
                    <div className="space-y-4">
                      <Card className="border border-border shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <LifeBuoy className="h-5 w-5 text-foreground" />
                            Need help with MasterView Portals?
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-foreground">
                          <p>We're here to help. Reach out anytime and we'll respond promptly.</p>
                          <div className="space-y-1">
                            <p><span className="font-semibold">Email:</span> <a className="text-blue-600 underline" href="mailto:support@masterviewportals.com">support@masterviewportals.com</a></p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* <Card className="border border-border shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <LifeBuoy className="h-5 w-5 text-foreground" />
                            Submit a question or concern
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form className="space-y-3" onSubmit={submitSupportRequest}>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Subject</label>
                              <Input
                                value={supportSubject}
                                onChange={(e) => setSupportSubject(e.target.value)}
                                placeholder="Billing, access, feature request, etc."
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Message</label>
                              <Textarea
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Tell us what you need help with."
                                rows={5}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button type="submit" disabled={supportSubmitting}>
                                {supportSubmitting ? "Sending..." : "Submit"}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card> */}
                    </div>
                  )}

                  {/* ADMIN */}
                  {activeTab === "Admin" && (
                    <div>
                      <AdminTab />
                    </div>
                  )}
                </div>
              )}

        {profile && (
          <div data-onboarding-highlight="project-profile">
            <ClientProfile
              project={profile}
              onClose={handleCloseProfile}
              hidePrices={hidePrices}
              setHidePrices={setHidePrices}
              userRole={userRole}
            />
          </div>
        )}
    </TermsCheckGate>
  );
}
