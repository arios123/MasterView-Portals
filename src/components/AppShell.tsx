import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { PriceContext } from "@/contexts/PriceContext";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchUserById } from "@/queries/users";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - Persistent layout wrapper for the dashboard
 * 
 * This component ensures that the sidebar and header remain visible
 * even when guards are loading or checking permissions.
 * 
 * Responsibilities:
 * - Provides SidebarProvider wrapper
 * - Renders AppSidebar (desktop) and MobileSidebar (via Header on mobile)
 * - Renders Header with theme toggle, user menu, etc.
 * - Provides main content area for children (guards + pages)
 */
const DEFAULT_TAB_TITLE = "MasterView Portals";

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // Update browser tab title based on current workspace
  useEffect(() => {
    if (currentWorkspace?.name) {
      document.title = `${currentWorkspace.name}`;
    } else {
      document.title = DEFAULT_TAB_TITLE;
    }
    return () => {
      document.title = DEFAULT_TAB_TITLE;
    };
  }, [currentWorkspace?.name]);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [dark, setDark] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [hidePrices, setHidePrices] = useState(false);

  // Fetch user's name from database
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const data = await fetchUserById(user.id);
        if (data) {
          setUserName(data.name || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Determine active tab from route (same logic as Index.tsx)
  const getTabFromPath = (pathname: string): string => {
    if (pathname.startsWith('/projects') && !pathname.includes('/projects/')) return 'Projects';
    if (pathname.startsWith('/clients')) return 'Clients';
    if (pathname.startsWith('/calendar')) return 'Calendar';
    if (pathname.startsWith('/completed')) return 'Completed';
    if (pathname.startsWith('/lost')) return 'Lost';
    if (pathname.startsWith('/internalsupport')) return 'Support';
    if (pathname.startsWith('/admin')) return 'Admin';
    return 'Projects'; // default
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));

  // Get available tabs based on permissions (simplified - will be enhanced by child components)
  const allPossibleTabs = ['Projects', 'Clients', 'Calendar', 'Completed', 'Lost', 'Support', 'Admin'];
  const tabs = allPossibleTabs; // For now, show all tabs; permissions will be checked in AppSidebar

  const handleTabChange = (tab: string) => {
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
  };

  return (
    <PriceContext.Provider value={{ hidden: hidePrices, setHidden: setHidePrices }}>
    <SidebarProvider>
      <div className={(dark ? "dark " : "") + "bg-background text-foreground min-h-screen flex w-full"}>
        {/* Desktop Sidebar - hidden on mobile */}
        {!isMobile && (
          <AppSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            availableTabs={tabs}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header
            userName={userName}
            dark={dark}
            setDark={setDark}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            availableTabs={tabs}
          />

          {/* Content Area - Guards and Pages render here */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
    </PriceContext.Provider>
  );
}
