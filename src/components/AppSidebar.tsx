import { FolderKanban, Users, CalendarDays, CheckCircle2, XCircle, Settings, Menu, ChevronDown, LifeBuoy, FileText, Video, ExternalLink } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  availableTabs: string[];
}

const tabIcons: Record<string, any> = {
  Projects: FolderKanban,
  Clients: Users,
  Calendar: CalendarDays,
  Completed: CheckCircle2,
  Lost: XCircle,
  Admin: Settings,
  Support: LifeBuoy,
};

// Map tabs to permission keys (new system: scope.target.action)
const tabToPermission: Record<string, string> = {
  Projects: 'tab.projects.view',
  Clients: 'tab.clients.view',
  Calendar: 'tab.calendar.view',
  Completed: 'tab.completed.view',
  Lost: 'tab.lost.view',
  Admin: 'tab.admin.view', // Admin tab uses route permission
};

export function AppSidebar({ activeTab, onTabChange, availableTabs }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { can } = usePermissions();
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();

  // Filter tabs based on permissions
  const visibleTabs = availableTabs.filter((tab) => {
    // Use new permission system: check for tab.{name}.view permission
    const permission = tabToPermission[tab];
    if (permission) {
      return can(permission);
    }
    
    // Default to visible if no permission mapping exists
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 font-bold text-lg hover:opacity-80 transition-opacity cursor-pointer">
                  <span>{currentWorkspace?.name || "Select Workspace"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Switch Workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.length === 0 ? (
                  <DropdownMenuItem disabled>No workspaces available</DropdownMenuItem>
                ) : (
                  workspaces.map((workspace) => {
                    const isCurrentWorkspace = currentWorkspace?.id === workspace.id;
                    return (
                      <DropdownMenuItem
                        key={workspace.id}
                        onClick={async () => {
                          await switchWorkspace(workspace.id);
                          // Refresh the page to reload all data for the new workspace
                          window.location.reload();
                        }}
                        className={isCurrentWorkspace ? "bg-slate-100 dark:bg-slate-800 font-semibold" : ""}
                      >
                        {workspace.name}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <SidebarTrigger className={isCollapsed ? "mx-auto" : ""}>
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleTabs.map((tab) => {
                const Icon = tabIcons[tab];
                const isActive = activeTab === tab;

                return (
                  <SidebarMenuItem key={tab}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(tab)}
                      isActive={isActive}
                      tooltip={isCollapsed ? tab : undefined}
                      data-onboarding-highlight={tab === 'Projects' ? 'projects-tab' : tab === 'Admin' ? 'admin-tab' : undefined}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{tab}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={isCollapsed ? "Documentation" : undefined}>
                  <a href="/documentation" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Documentation</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={isCollapsed ? "Video Tutorials" : undefined}>
                  <a href="/video-tutorials" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Video className="h-4 w-4" />
                    <span>Video Tutorials</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
