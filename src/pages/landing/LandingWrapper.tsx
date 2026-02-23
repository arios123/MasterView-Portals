import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isLandingRouteNoRedirect } from "@/constants/landingRoutes";
import Landing from "../Landing";

export default function LandingWrapper() {
  const { user, loading, isPasswordRecovery } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for auth error in URL hash (e.g., expired OTP from password reset or invite link).
    // When a Supabase email link fails verification, Supabase redirects to the Site URL (root)
    // with error details in the hash — not to the original redirect_to. We intercept that here
    // and send the user to /reset-password which already has a nice "link expired" UI.
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorCode = hashParams.get("error_code");
      if (errorCode === "otp_expired" || hashParams.get("error") === "access_denied") {
        window.location.href = "/reset-password?link_error=expired";
        return;
      }
    }

    // Check if recovery is detected in URL (before context state might be set)
    const checkRecoveryInUrl = () => {
      // Only detect explicit type=recovery — code/token_hash alone could be invites
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        if (params.get("type") === "recovery") return true;
      }
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("type") === "recovery";
    };

    const hasRecoveryInUrl = checkRecoveryInUrl();

    // If we detect recovery in URL OR in context, redirect to set-password immediately
    // This should happen even before user is fully loaded (hash detection is immediate)
    if (hasRecoveryInUrl || isPasswordRecovery) {
      // Use window.location.href to preserve hash fragments (React Router navigate() loses them)
      window.location.href = '/reset-password' + window.location.hash + window.location.search;
      return;
    }

    // If user is authenticated, redirect to projects dashboard only when NOT on an allowlisted landing route
    if (!loading && user && !isPasswordRecovery && !hasRecoveryInUrl) {
      if (!isLandingRouteNoRedirect(location.pathname)) {
        navigate("/projects", { replace: true });
      }
    }
  }, [user, loading, navigate, isPasswordRecovery, location.pathname]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e7ebed] to-white flex items-center justify-center">
        <div className="text-[#617b5d]">Loading...</div>
      </div>
    );
  }

  // Show landing page when not authenticated, or when authenticated but on allowlisted route (e.g. "/")
  if (!user || isLandingRouteNoRedirect(location.pathname)) {
    return <Landing />;
  }

  // This shouldn't render, but just in case
  return null;
}

