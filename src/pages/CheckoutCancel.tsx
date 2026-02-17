import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { isDemoMode } from '@/utils/demoMode';

export default function CheckoutCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const workspaceId = searchParams.get('workspace_id');

  // Redirect away from billing in demo mode
  useEffect(() => {
    if (isDemoMode()) {
      navigate('/projects', { replace: true });
    }
  }, [navigate]);

  const handleRetry = () => {
    if (workspaceId) {
      navigate(`/choose-plan?workspace_id=${workspaceId}`);
    } else {
      navigate('/choose-plan');
    }
  };

  const handleGoBack = () => {
    navigate('/register');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Checkout Cancelled</CardTitle>
          <CardDescription className="mt-2">
            Your subscription setup was not completed. Your workspace is waiting for you to complete the subscription.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Your workspace has been created</p>
            <p>• Subscription setup is required to access features</p>
            <p>• You can retry the checkout process anytime</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              className="w-full"
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

