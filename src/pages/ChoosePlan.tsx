import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession } from '@/queries/subscriptions';
import { Check, Loader2, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';

export default function ChoosePlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Redirect away from billing in demo mode
  useEffect(() => {
    if (isDemoMode()) {
      navigate('/projects', { replace: true });
    }
  }, [navigate]);

  // Use currentWorkspace as primary source (workspace switcher sets this)
  // URL param is only used if explicitly provided (for direct links)
  const workspaceIdFromUrl = searchParams.get('workspace_id');
  const workspaceId = workspaceIdFromUrl || currentWorkspace?.id;

  // Validate user is owner of the workspace
  useEffect(() => {
    const validateWorkspace = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (workspaceLoading) {
        return; // Wait for workspace to load
      }

      // If no workspace available, redirect to workspace selection
      if (!workspaceId) {
        navigate('/select-workspace');
        return;
      }

      // Validate user is the owner of this workspace
      try {
        const { data: workspace, error } = await supabase
          .from('workspaces')
          .select('owner_id')
          .eq('id', workspaceId)
          .single();

        if (error) throw error;

        if (!workspace) {
          toast({
            title: 'Error',
            description: 'Workspace not found',
            variant: 'destructive',
          });
          navigate('/select-workspace');
          return;
        }

        // Check if user is the owner
        // Legacy workspaces may have null owner_id, treat current user as owner in that case
        const userIsOwner = !workspace.owner_id || workspace.owner_id === user.id;
        
        if (!userIsOwner) {
          toast({
            title: 'Access Denied',
            description: 'Only the workspace owner can manage subscriptions',
            variant: 'destructive',
          });
          navigate('/select-workspace');
          return;
        }

        setIsOwner(true);
      } catch (error) {
        console.error('Error validating workspace:', error);
        toast({
          title: 'Error',
          description: 'Failed to validate workspace access',
          variant: 'destructive',
        });
        navigate('/select-workspace');
      } finally {
        setValidating(false);
      }
    };

    validateWorkspace();
  }, [user, workspaceId, workspaceLoading, navigate, toast]);

  const handleSubscribe = async () => {
    if (!workspaceId) {
      toast({
        title: 'Error',
        description: 'Workspace ID is required',
        variant: 'destructive',
      });
      return;
    }

    if (!isOwner) {
      toast({
        title: 'Access Denied',
        description: 'Only the workspace owner can manage subscriptions',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Explicitly use the validated workspaceId (from currentWorkspace or URL)
      const { url } = await createCheckoutSession(workspaceId);
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to create checkout session. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check for specific error types
      if (errorMessage.includes('Server configuration error') || errorMessage.includes('environment variables')) {
        errorMessage = 'Server configuration error. Please contact support.';
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('not authenticated')) {
        errorMessage = 'Please sign in to continue.';
        // Optionally redirect to login
        setTimeout(() => navigate('/login'), 2000);
      } else if (errorMessage.includes('not a member')) {
        errorMessage = 'You do not have access to this workspace.';
      } else if (errorMessage.includes('not the owner')) {
        errorMessage = 'Only the workspace owner can manage subscriptions.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Show loading while validating
  if (validating || workspaceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
              <p className="text-slate-600">Validating workspace access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workspaceId || !isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Choose Your Plan</CardTitle>
          <CardDescription className="text-lg mt-2">
            {currentWorkspace && (
              <span className="block mb-2">Workspace: <strong>{currentWorkspace.name}</strong></span>
            )}
            Start your 1-month free trial. No credit card required until trial ends.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Plan Card */}
          <Card className="border-2 border-slate-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Professional Plan</CardTitle>
                  <CardDescription className="mt-1">
                    Full access to all features
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">Free Trial</div>
                  <div className="text-sm text-muted-foreground">Then $X/month</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">1 Month Free Trial</div>
                    <div className="text-sm text-muted-foreground">
                      Full access during trial period
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">All Features Included</div>
                    <div className="text-sm text-muted-foreground">
                      Projects, clients, calendar, materials, and more
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Cancel Anytime</div>
                    <div className="text-sm text-muted-foreground">
                      No long-term commitment required
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Your workspace will be created, but you'll need to complete subscription setup to access it.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Start Free Trial
                    <CreditCard className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

