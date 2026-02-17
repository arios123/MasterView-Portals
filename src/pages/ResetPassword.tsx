import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Helper to check for recovery indicators (hash or search params)
    const checkRecoveryParams = () => {
      // Check URL hash first (Supabase v2 recommended)
      if (window.location.hash.includes('type=recovery')) {
        return true;
      }
      
      // Check hash fragments
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('type') === 'recovery') {
          return true;
        }
      }
      
      // Check search params
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get("type");
      const code = urlParams.get("code");
      const tokenHash = urlParams.get("token_hash");
      const accessToken = urlParams.get("access_token");
      const refreshToken = urlParams.get("refresh_token");

      return type === "recovery" || !!code || !!tokenHash || (!!accessToken && !!refreshToken);
    };

    // Verify session on /reset-password (Step 3 from user's guidance)
    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have recovery indicators, show the form
      if (checkRecoveryParams()) {
        setIsRecoveryFlow(true);
        return;
      }
      
      // If we have a session but no recovery indicators, wait for PASSWORD_RECOVERY event
      // This handles the case where Supabase has already processed the hash
      if (session && window.location.pathname === "/reset-password") {
        // Give it a moment for the PASSWORD_RECOVERY event to fire
        // If we're on reset-password with a session, we're likely in recovery
        setIsRecoveryFlow(true); // Optimistically set to true, will be corrected if event doesn't fire
        setTimeout(() => {
          // Check again after event should have fired
          if (!checkRecoveryParams()) {
            // Only set to false if we're sure there's no recovery (session might be from recovery)
            // But if we still have no session after timeout, then it's expired
            supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
              if (!currentSession) {
                setIsRecoveryFlow(false);
              }
              // If session exists, keep recovery flow true (PASSWORD_RECOVERY event should set it)
            });
          }
        }, 2000); // Give more time for PASSWORD_RECOVERY event
      } else if (!session && !checkRecoveryParams()) {
        // No session and no recovery indicators - invalid/expired link
        setIsRecoveryFlow(false);
      }
    };

    // Set recovery flow immediately if we have recovery params
    if (checkRecoveryParams()) {
      setIsRecoveryFlow(true);
    }

    // Listen for PASSWORD_RECOVERY event from Supabase - this is the key event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // This is the critical event - user clicked reset link
          setIsRecoveryFlow(true);
        } else if (event === "SIGNED_IN" && session) {
          // Check if this sign-in is part of a recovery flow
          // If we're on reset-password page and getting SIGNED_IN, likely recovery
          if (window.location.pathname === "/reset-password") {
            setIsRecoveryFlow(true);
          } else if (checkRecoveryParams()) {
            setIsRecoveryFlow(true);
          }
        } else if (event === "INITIAL_SESSION" && session && window.location.pathname === "/reset-password") {
          // INITIAL_SESSION with session on reset-password page - likely recovery
          setIsRecoveryFlow(true);
        } else if (session && checkRecoveryParams()) {
          // We have a session and recovery indicators
          setIsRecoveryFlow(true);
        }
      }
    );

    // Verify session on mount
    verifySession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verify we have a valid session (should exist from PASSWORD_RECOVERY event)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Session expired. Please request a new reset link.");
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully!",
      });

      // Step 5: Sign the user out after reset (best practice)
      await supabase.auth.signOut();
      
      // Redirect to login with success query param
      navigate("/login?reset=success");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isRecoveryFlow === null) {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2b8ac4] relative z-10"></div>
      </div>
    );
  }

  if (isRecoveryFlow === false) {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        
        <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#b91c1c]">Invalid or expired link</CardTitle>
            <CardDescription className="text-[#617b5d] text-sm">
              This password reset link is invalid or has expired. Password reset links expire after 1 hour.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => navigate("/forgot-password")} 
              className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Request New Reset Link
            </Button>
            <Button 
              onClick={() => navigate("/login")} 
              variant="outline"
              className="w-full rounded-xl border-[#cfcfcf] text-[#0B294b] bg-white hover:bg-[#e7ebed]"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      
      <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-[#0B294b]">Reset your password</CardTitle>
          <CardDescription className="text-[#617b5d] mt-2 text-sm">
            Enter and confirm your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0B294b]">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="rounded-xl bg-white border-[#cfcfcf] text-[#0B294b] placeholder:text-[#8b8b8b] focus:border-[#2b8ac4] focus-visible:ring-[#2b8ac4]"
                disabled={loading}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#0B294b]">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="rounded-xl bg-white border-[#cfcfcf] text-[#0B294b] placeholder:text-[#8b8b8b] focus:border-[#2b8ac4] focus-visible:ring-[#2b8ac4]"
                disabled={loading}
                required
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={loading}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/login")}
              variant="ghost"
              className="w-full rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
