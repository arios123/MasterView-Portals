import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasAcceptedLatestTerms, acceptTerms } from '@/queries/users';
import { CURRENT_TERMS_VERSION } from '@/utils/termsUtils';
import { TermsConsentDialog } from './TermsConsentDialog';

interface TermsCheckGateProps {
  children: React.ReactNode;
}

/**
 * Component that checks if user has accepted latest terms and shows modal if not
 * Blocks access until terms are accepted
 * Checks terms on: mount, route changes, and window focus events
 */
export function TermsCheckGate({ children }: TermsCheckGateProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checkingTerms, setCheckingTerms] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const isCheckingRef = useRef(false);

  // Extract check logic into a reusable function
  const checkTerms = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current || authLoading || !user) {
      if (!authLoading && !user) {
        setCheckingTerms(false);
      }
      return;
    }

    isCheckingRef.current = true;
    setCheckingTerms(true);

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
      isCheckingRef.current = false;
    }
  }, [user, authLoading]);

  // Check terms on mount and when user/authLoading changes
  useEffect(() => {
    checkTerms();
  }, [checkTerms]);

  // Check terms on route changes (navigation within dashboard)
  // But only if terms haven't been accepted yet - don't block navigation if already accepted
  useEffect(() => {
    if (!authLoading && user && !hasAccepted) {
      checkTerms();
    }
  }, [location.pathname, checkTerms, authLoading, user, hasAccepted]);

  // Check terms when window regains focus (user switches back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (!authLoading && user) {
        checkTerms();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkTerms, authLoading, user]);

  const handleAcceptTerms = async () => {
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

  // Show loading state only while checking auth or initial terms check
  // Don't block navigation if terms are already accepted
  if (authLoading || (checkingTerms && !hasAccepted)) {
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

