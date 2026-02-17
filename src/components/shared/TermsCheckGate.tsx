import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasAcceptedLatestTerms, acceptTerms } from '@/queries/users';
import { CURRENT_TERMS_VERSION } from '@/utils/termsUtils';
import { TermsConsentDialog } from './TermsConsentDialog';
import { isDemoMode } from '@/utils/demoMode';

interface TermsCheckGateProps {
  children: React.ReactNode;
}

const DEMO_TERMS_ACCEPTED_KEY = 'demo_terms_accepted';

/**
 * Component that checks if user has accepted latest terms and shows modal if not
 * Blocks access until terms are accepted
 * In demo mode, uses sessionStorage instead of database
 */
export function TermsCheckGate({ children }: TermsCheckGateProps) {
  const { user, loading: authLoading } = useAuth();
  const [checkingTerms, setCheckingTerms] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const demoMode = isDemoMode();

  useEffect(() => {
    const checkTerms = async () => {
      // In demo mode, check sessionStorage
      if (demoMode) {
        const accepted = sessionStorage.getItem(DEMO_TERMS_ACCEPTED_KEY) === 'true';
        setHasAccepted(accepted);
        if (!accepted) {
          setShowTermsModal(true);
        }
        setCheckingTerms(false);
        return;
      }

      // Production mode: check database
      if (authLoading || !user) {
        setCheckingTerms(false);
        return;
      }

      try {
        const accepted = await hasAcceptedLatestTerms(user.id, CURRENT_TERMS_VERSION);
        setHasAccepted(accepted);
        
        if (!accepted) {
          setShowTermsModal(true);
        }
      } catch (error) {
        console.error('Error checking terms acceptance:', error);
        // On error, allow access (fail open) but log the error
        setHasAccepted(true);
      } finally {
        setCheckingTerms(false);
      }
    };

    checkTerms();
  }, [user, authLoading, demoMode]);

  const handleAcceptTerms = async () => {
    // In demo mode, store in sessionStorage
    if (demoMode) {
      sessionStorage.setItem(DEMO_TERMS_ACCEPTED_KEY, 'true');
      setHasAccepted(true);
      setShowTermsModal(false);
      return;
    }

    // Production mode: store in database
    if (!user) return;

    try {
      await acceptTerms(user.id, CURRENT_TERMS_VERSION);
      setHasAccepted(true);
      setShowTermsModal(false);
    } catch (error) {
      console.error('Error accepting terms:', error);
      // Still close modal and allow access on error
      setHasAccepted(true);
      setShowTermsModal(false);
    }
  };

  // Show loading state while checking auth or terms
  if (authLoading || checkingTerms) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // If no user, render children (will be handled by ProtectedRoute)
  if (!user) {
    return <>{children}</>;
  }

  // If user hasn't accepted terms, show blocking modal
  if (!hasAccepted) {
    return (
      <>
        {/* Block the UI with an overlay */}
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-2">Terms and Conditions Required</h2>
            <p className="text-slate-600 mb-4">
              You must accept the latest terms and conditions to continue using the application.
            </p>
            <button
              onClick={() => setShowTermsModal(true)}
              className="w-full bg-slate-900 text-white rounded-lg py-2 px-4 hover:bg-slate-800"
            >
              Review Terms and Conditions
            </button>
          </div>
        </div>

        <TermsConsentDialog
          open={showTermsModal}
          onOpenChange={setShowTermsModal}
          onAccept={handleAcceptTerms}
          termsVersion={CURRENT_TERMS_VERSION}
        />
      </>
    );
  }

  // User has accepted terms, render children
  return <>{children}</>;
}

