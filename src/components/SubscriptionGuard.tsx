import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasActiveSubscription } from '@/queries/subscriptions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isDemoMode } from '@/utils/demoMode';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * SubscriptionGuard - Restricts access to workspace features if subscription is not active
 * Shows a message and redirect option if subscription is incomplete/unpaid
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const demoMode = isDemoMode();

  useEffect(() => {
    if (demoMode) {
      // In demo mode, bypass subscription check
      setHasAccess(true);
      setChecking(false);
      return;
    }

    const checkSubscription = async () => {
      if (authLoading || workspaceLoading) {
        return;
      }

      if (!user || !currentWorkspace) {
        setChecking(false);
        return;
      }

      try {
        const isActive = await hasActiveSubscription(currentWorkspace.id);
        setHasAccess(isActive);
      } catch (error) {
        console.error('Error checking subscription:', error);
        // On error, allow access (fail open) but log the error
        setHasAccess(true);
      } finally {
        setChecking(false);
      }
    };

    checkSubscription();
  }, [user, currentWorkspace, authLoading, workspaceLoading, demoMode]);

  // Show loading state while checking
  if (checking || authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
              <p className="text-slate-600">Checking subscription status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no workspace, don't block (let other guards handle it)
  if (!currentWorkspace) {
    return <>{children}</>;
  }

  // Treat missing owner_id (legacy workspaces) as owner access for the logged-in user
  // so they can complete subscription setup. Otherwise require match.
  const isOwner = !!(
    user &&
    currentWorkspace &&
    (
      !currentWorkspace.owner_id ||
      currentWorkspace.owner_id === user.id
    )
  );

  // If subscription is not active, show access denied message
  if (!hasAccess) {
    // Render the normal portal shell (children) so the workspace switcher / header stay available,
    // and overlay a blocking panel over the main content area (leaving a bit of space at the top).
    return (
      <>
        {children}
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-gradient-to-br from-slate-50/95 to-slate-100/95 flex items-center justify-center p-4">
          {/* Sign Out Button - Top Right of overlay */}
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-slate-600 hover:text-red-600 bg-white/90 hover:bg-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-slate-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Subscription Required</CardTitle>
              <CardDescription className="mt-2">
                Your workspace requires an active subscription to access features.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isOwner ? (
                <>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Complete your subscription setup to access your workspace</p>
                    <p>• Start with a 1-month free trial</p>
                    <p>• Cancel anytime</p>
                  </div>

                  <Button
                    onClick={() => navigate(`/choose-plan?workspace_id=${currentWorkspace.id}`)}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Complete Subscription Setup
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• This workspace needs an active subscription.</p>
                  <p>• Please contact the workspace owner to complete subscription setup.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Subscription is active, allow access
  return <>{children}</>;
}

