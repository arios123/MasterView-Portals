import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { PriceContext } from "@/contexts/PriceContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSidebar } from "./MobileSidebar";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { hasActiveSubscription } from "@/queries/subscriptions";

interface HeaderProps {
  userName: string;
  dark: boolean;
  setDark: (value: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  availableTabs: string[];
}

export function Header({
  userName,
  dark,
  setDark,
  activeTab,
  onTabChange,
  availableTabs,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();
  const priceContext = useContext(PriceContext);
  const { mobileSidebarOpen, setMobileSidebarOpen } = useOnboarding();
  const [hasActiveSub, setHasActiveSub] = useState(false); // Start hidden, show only if subscription is valid

  // Check subscription status for mobile sidebar
  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentWorkspace) {
        setHasActiveSub(true); // If no workspace, show tabs (let other guards handle it)
        return;
      }

      try {
        const isActive = await hasActiveSubscription(currentWorkspace.id);
        setHasActiveSub(isActive);
      } catch (error) {
        console.error('Error checking subscription in Header:', error);
        // Fail open - show tabs on error
        setHasActiveSub(true);
      }
    };

    checkSubscription();
  }, [currentWorkspace]);

  return (
    <div className="sticky top-0 z-20 backdrop-blur bg-background/90">
      <div className="px-6 py-3 flex items-center gap-3">
        {/* Mobile Sidebar Hamburger - only on mobile */}
        {isMobile && (
          <MobileSidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            availableTabs={availableTabs}
            onSignOut={signOut}
            externalOpen={mobileSidebarOpen}
            onOpenChange={setMobileSidebarOpen}
            hasActiveSubscription={hasActiveSub}
          />
        )}
        {user && (
          <div className="text-sm text-muted-foreground ml-4">
            Welcome, {userName || user.email}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark((d) => !d)}
            title="Theme"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          {priceContext && (
            <Switch checked={priceContext.hidden} onCheckedChange={priceContext.setHidden} />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            title="Sign Out"
            className="text-muted-foreground hover:text-destructive hidden md:inline-flex gap-2"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
