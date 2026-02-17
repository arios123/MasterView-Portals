import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Wait a moment for webhook to process, then check subscription status
    const checkSubscription = async () => {
      if (!currentWorkspace) {
        // Refresh workspaces to get the newly created one
        await refreshWorkspaces();
        setChecking(false);
        setLoading(false);
        return;
      }

      // Give webhook time to process (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh workspaces to get updated subscription status
      await refreshWorkspaces();
      setChecking(false);
      setLoading(false);

      toast({
        title: 'Subscription Activated',
        description: 'Your subscription has been activated. Welcome!',
      });
    };

    checkSubscription();
  }, [user, currentWorkspace, navigate, refreshWorkspaces, toast]);

  const handleContinue = () => {
    navigate('/projects');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            {checking ? (
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {checking ? 'Processing...' : 'Payment Successful!'}
          </CardTitle>
          <CardDescription className="mt-2">
            {checking
              ? 'We\'re setting up your subscription. This will only take a moment.'
              : 'Your subscription has been activated. You now have full access to your workspace.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!checking && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ 1-month free trial started</p>
              <p>✓ Full access to all features</p>
              <p>✓ Subscription will renew automatically</p>
            </div>
          )}

          {!checking && (
            <Button
              onClick={handleContinue}
              className="w-full"
              size="lg"
            >
              Go to Dashboard
            </Button>
          )}

          {sessionId && (
            <p className="text-xs text-center text-muted-foreground">
              Session ID: {sessionId.substring(0, 20)}...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

