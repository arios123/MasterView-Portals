import { useState } from "react";
import { FolderKanban, Users, CalendarDays, CheckCircle2, XCircle, Settings, Menu, ChevronDown, LogOut, LifeBuoy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  availableTabs: string[];
  onSignOut: () => void;
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
  Admin: 'tab.admin.view',
};

export function MobileSidebar({ activeTab, onTabChange, availableTabs, onSignOut }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const { can } = usePermissions();
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const isMobile = useIsMobile();

  // Filter tabs based on permissions
  const visibleTabs = availableTabs.filter((tab) => {
    const permission = tabToPermission[tab];
    if (permission) {
      return can(permission);
    }
    return true;
  });

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Hamburger Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Slide-out Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg font-bold">
              {currentWorkspace?.name || "Select Workspace"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto">
            {/* Workspace Switcher */}
            <div className="p-4 border-b">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {currentWorkspace?.name || "Select Workspace"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                  </Button>
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
            </div>

            {/* Navigation Tabs */}
            <div className="flex-1 p-2">
              <nav className="space-y-1">
                {visibleTabs.map((tab) => {
                  const Icon = tabIcons[tab];
                  const isActive = activeTab === tab;

                  return (
                    <Button
                      key={tab}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-slate-100 dark:bg-slate-800 font-semibold"
                      )}
                      onClick={() => handleTabClick(tab)}
                    >
                      {Icon && <Icon className="h-4 w-4 mr-2" />}
                      <span>{tab}</span>
                    </Button>
                  );
                })}
                
                {/* Logout Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-600 hover:text-red-600 mt-1"
                  onClick={() => {
                    onSignOut();
                    setOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign Out</span>
                </Button>
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

