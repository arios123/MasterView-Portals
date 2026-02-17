import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdvancedTabPasswordPrompt } from '@/components/shared/AdvancedTabPasswordPrompt';
import { ChangeOwnershipModal } from '@/components/shared/ChangeOwnershipModal';
import { ConfirmOwnershipChangeDialog } from '@/components/shared/ConfirmOwnershipChangeDialog';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { updateWorkspaceOwner } from '@/queries/workspaces';
import { fetchUserById } from '@/queries/users';
import { createBillingPortalSession } from '@/queries/subscriptions';
import { toast } from 'sonner';
import { Users, CreditCard, Loader2 } from 'lucide-react';

/**
 * Advanced admin section - Owner only with password protection
 * This section is only visible to workspace owners and requires password verification
 */
export function Advanced() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ section?: string }>();
  const [isVerified, setIsVerified] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showChangeOwnershipModal, setShowChangeOwnershipModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [isChangingOwnership, setIsChangingOwnership] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const ownerId = currentWorkspace?.owner_id;
  const workspaceId = currentWorkspace?.id;
  const isActiveTab = params.section === 'advanced';

  // Only check verification status if this tab is actually active
  // This prevents the password prompt from showing when other tabs are active
  useEffect(() => {
    // Don't run if this tab is not active
    if (!isActiveTab) {
      return;
    }

    if (!ownerId) {
      // No owner, shouldn't be here - redirect
      navigate('/admin/staff', { replace: true });
      return;
    }

    // Only allow password verification if current user IS the owner
    // This ensures we don't have session switching issues
    if (user?.id !== ownerId) {
      // User is not the owner, redirect
      navigate('/admin/staff', { replace: true });
      return;
    }

    checkVerificationStatus();
  }, [ownerId, user?.id, navigate, isActiveTab]);

  const checkVerificationStatus = () => {
    if (!ownerId) return;

    const verificationKey = `advanced_tab_verified_${ownerId}`;
    const stored = sessionStorage.getItem(verificationKey);

    if (stored) {
      try {
        const verification = JSON.parse(stored);
        const now = Date.now();

        // Check if verification is still valid (not expired)
        if (verification.expiresAt > now && verification.workspaceOwnerId === ownerId) {
          setIsVerified(true);
          setShowPasswordPrompt(false);
          return;
        } else {
          // Expired, remove it
          sessionStorage.removeItem(verificationKey);
        }
      } catch (err) {
        console.error('Error parsing verification token:', err);
        sessionStorage.removeItem(verificationKey);
      }
    }

    // Not verified or expired - show password prompt
    setIsVerified(false);
    setShowPasswordPrompt(true);
  };

  const handleVerified = () => {
    setIsVerified(true);
    setShowPasswordPrompt(false);
  };

  const handleCancel = () => {
    // Just close the password prompt - user can navigate away themselves
    setShowPasswordPrompt(false);
  };

  const handleSelectUser = async (userId: string) => {
    try {
      // Fetch user details to show in confirmation
      const user = await fetchUserById(userId);
      setSelectedUserId(userId);
      setSelectedUserName(user.name || user.email || 'Unknown User');
      setShowChangeOwnershipModal(false);
      setShowConfirmDialog(true);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user information');
    }
  };

  const handleConfirmOwnershipChange = async () => {
    if (!workspaceId || !selectedUserId) {
      toast.error('Missing required information');
      return;
    }

    setIsChangingOwnership(true);
    try {
      await updateWorkspaceOwner(workspaceId, selectedUserId);
      toast.success('Workspace ownership transferred successfully');
      
      // Clear verification token since ownership changed
      if (ownerId) {
        sessionStorage.removeItem(`advanced_tab_verified_${ownerId}`);
      }
      
      // Redirect to projects page
      navigate('/projects', { replace: true });
    } catch (error: any) {
      console.error('Error changing ownership:', error);
      toast.error(error?.message || 'Failed to transfer ownership');
      setIsChangingOwnership(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    setIsLoadingPortal(true);
    try {
      const { url } = await createBillingPortalSession(workspaceId);
      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      toast.error(
        'Failed to open subscription management. Please contact customer support at support@masterviewportals.com',
        { duration: 6000 }
      );
      setIsLoadingPortal(false);
    }
  };

  // Only show password prompt if this tab is active and not verified
  if (isActiveTab && showPasswordPrompt && !isVerified) {
    return (
      <>
        <AdvancedTabPasswordPrompt
          open={showPasswordPrompt}
          ownerId={ownerId!}
          onVerified={handleVerified}
          onCancel={handleCancel}
        />
        {/* Show empty state while prompt is open */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                Password verification required to access Advanced settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Show content only if verified and tab is active
  if (isActiveTab && !isVerified) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Password verification required to access Advanced settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If tab is not active, don't render anything (or render empty)
  if (!isActiveTab) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Advanced configuration options available to workspace owners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Workspace Ownership</h3>
              <p className="text-sm text-muted-foreground">
                Transfer workspace ownership to another staff member. This action is irreversible.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowChangeOwnershipModal(true)}
                className="w-full sm:w-auto"
              >
                <Users className="h-4 w-4 mr-2" />
                Change Ownership
              </Button>
            </div>

            <div className="pt-4 border-t space-y-2">
              <h3 className="text-sm font-medium">Subscription Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage your workspace subscription, update payment methods, view billing history, and cancel if needed.
              </p>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isLoadingPortal}
                className="w-full sm:w-auto"
              >
                {isLoadingPortal ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Ownership Modal */}
      {workspaceId && ownerId && (
        <ChangeOwnershipModal
          open={showChangeOwnershipModal}
          onOpenChange={setShowChangeOwnershipModal}
          workspaceId={workspaceId}
          currentOwnerId={ownerId}
          onSelectUser={handleSelectUser}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmOwnershipChangeDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmOwnershipChange}
        userName={selectedUserName || undefined}
      />
    </>
  );
}

