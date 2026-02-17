import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { hasActiveSubscription } from '@/queries/subscriptions';

export default function SelectWorkspace() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { workspaces, loading: workspaceLoading, switchWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [workspacesWithStatus, setWorkspacesWithStatus] = useState<Array<{
    id: string;
    name: string;
    isOwner: boolean;
    hasActiveSubscription: boolean;
  }>>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (authLoading || workspaceLoading) {
      return;
    }

    const loadWorkspaceStatuses = async () => {
      if (!user || workspaces.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Check subscription status and ownership for each workspace
        const statuses = await Promise.all(
          workspaces.map(async (workspace) => {
            // Check if user is owner
            const { data: workspaceData } = await supabase
              .from('workspaces')
              .select('owner_id')
              .eq('id', workspace.id)
              .single();

            const isOwner = !workspaceData?.owner_id || workspaceData.owner_id === user.id;
            
            // Check subscription status
            let hasActive = false;
            if (isOwner) {
              try {
                hasActive = await hasActiveSubscription(workspace.id);
              } catch (error) {
                console.error(`Error checking subscription for workspace ${workspace.id}:`, error);
              }
            }

            return {
              id: workspace.id,
              name: workspace.name,
              isOwner,
              hasActiveSubscription: hasActive,
            };
          })
        );

        setWorkspacesWithStatus(statuses);
      } catch (error) {
        console.error('Error loading workspace statuses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load workspace information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceStatuses();
  }, [user, workspaces, authLoading, workspaceLoading, navigate, toast]);

  const handleSelectWorkspace = async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId);
      navigate('/choose-plan');
    } catch (error) {
      console.error('Error switching workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch workspace',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || workspaceLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
              <p className="text-slate-600">Loading workspaces...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filter to only show workspaces where user is owner
  const ownedWorkspaces = workspacesWithStatus.filter(w => w.isOwner);
  const expiredWorkspaces = ownedWorkspaces.filter(w => !w.hasActiveSubscription);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Select Workspace</CardTitle>
          <CardDescription className="text-lg mt-2">
            Choose a workspace to manage its subscription
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {expiredWorkspaces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {ownedWorkspaces.length === 0
                  ? 'You do not own any workspaces.'
                  : 'All your workspaces have active subscriptions.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiredWorkspaces.map((workspace) => (
                <Card key={workspace.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{workspace.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Subscription expired or inactive
                        </p>
                      </div>
                      <Button
                        onClick={() => handleSelectWorkspace(workspace.id)}
                        size="lg"
                      >
                        Select & Pay
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => navigate('/projects')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

