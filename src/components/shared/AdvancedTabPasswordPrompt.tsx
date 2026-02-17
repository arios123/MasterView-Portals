import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserById } from '@/queries/users';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface AdvancedTabPasswordPromptProps {
  open: boolean;
  ownerId: string;
  onVerified: () => void;
  onCancel: () => void;
}

/**
 * Password prompt modal for Advanced tab access
 * Verifies the workspace owner's password before allowing access
 */
export function AdvancedTabPasswordPrompt({
  open,
  ownerId,
  onVerified,
  onCancel,
}: AdvancedTabPasswordPromptProps) {
  const { user: currentUser } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch owner email when modal opens
  useEffect(() => {
    if (open && ownerId) {
      fetchOwnerEmail();
    } else {
      // Reset state when modal closes
      setPassword('');
      setError(null);
      setOwnerEmail(null);
    }
  }, [open, ownerId]);

  const fetchOwnerEmail = async () => {
    try {
      const user = await fetchUserById(ownerId);
      setOwnerEmail(user?.email || null);
    } catch (err) {
      console.error('Error fetching owner email:', err);
      setError('Unable to load owner information');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (!ownerEmail) {
      setError('Owner email not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Store current session before verification attempt
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Attempt to sign in with owner's email and provided password
      // This verifies the password is correct
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: ownerEmail,
        password: password,
      });

      if (signInError) {
        // Password is incorrect
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Incorrect password');
        } else {
          setError('Verification failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Password is correct - store verification token
      const verificationToken = {
        workspaceOwnerId: ownerId,
        verifiedAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      };

      sessionStorage.setItem(
        `advanced_tab_verified_${ownerId}`,
        JSON.stringify(verificationToken)
      );

      // If the current user is NOT the owner, we need to restore their session
      // If they ARE the owner, the session is already correct (they just re-authenticated)
      if (currentUser && currentUser.id !== ownerId && currentSession) {
        // Restore the original user's session
        // Note: This is a limitation - we'd need the original user's refresh token
        // For now, we'll only allow verification if current user IS the owner
        // This is enforced in the Advanced component
        console.warn('Password verification attempted by non-owner user');
        setError('Only the workspace owner can verify access');
        sessionStorage.removeItem(`advanced_tab_verified_${ownerId}`);
        setLoading(false);
        return;
      }
      
      toast.success('Password verified successfully');
      onVerified();
      setPassword('');
      setError(null);
    } catch (err: any) {
      console.error('Password verification error:', err);
      setError('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Advanced Tab Access</DialogTitle>
          <DialogDescription>
            This section requires workspace owner password verification for security.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleVerify}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Owner Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter workspace owner password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                disabled={loading || !ownerEmail}
                autoFocus
              />
              {ownerEmail && (
                <p className="text-xs text-muted-foreground">
                  Verifying password for: {ownerEmail}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !ownerEmail}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

