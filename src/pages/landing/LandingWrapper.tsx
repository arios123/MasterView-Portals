import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Landing from "../Landing";

export default function LandingWrapper() {
  const { user, loading, isPasswordRecovery } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if recovery is detected in URL (before context state might be set)
    const checkRecoveryInUrl = () => {
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const type = params.get("type");
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        return type === "recovery" || !!code || !!tokenHash;
      }
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("type") === "recovery" || !!searchParams.get("code") || !!searchParams.get("token_hash");
    };

    const hasRecoveryInUrl = checkRecoveryInUrl();

    // If we detect recovery in URL OR in context, redirect to reset-password immediately
    // This should happen even before user is fully loaded (hash detection is immediate)
    if (hasRecoveryInUrl || isPasswordRecovery) {
      // Use window.location.href to preserve hash fragments (React Router navigate() loses them)
      window.location.href = '/reset-password' + window.location.hash + window.location.search;
      return;
    }

    // If user is authenticated, redirect to projects dashboard (only if NOT in recovery)
    if (!loading && user && !isPasswordRecovery && !hasRecoveryInUrl) {
      navigate("/projects", { replace: true });
    }
  }, [user, loading, navigate, isPasswordRecovery]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e7ebed] to-white flex items-center justify-center">
        <div className="text-[#617b5d]">Loading...</div>
      </div>
    );
  }

  // Show landing page only if not authenticated
  if (!user) {
    return <Landing />;
  }

  // This shouldn't render, but just in case
  return null;
}

