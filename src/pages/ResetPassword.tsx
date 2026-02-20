import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ArrowLeft } from "lucide-react";

type Phase = 'request' | 'email-sent' | 'set-password' | 'validating' | 'invalid';

function hasRecoveryParams(): boolean {
  if (window.location.hash.includes('type=recovery')) return true;

  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') return true;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const code = urlParams.get('code');
  const tokenHash = urlParams.get('token_hash');
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');

  return type === 'recovery' || !!code || !!tokenHash || (!!accessToken && !!refreshToken);
}

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>(() => {
    if (hasRecoveryParams()) return 'validating';
    const params = new URLSearchParams(window.location.search);
    if (params.get('link_error') === 'expired') return 'invalid';
    return 'request';
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clean up the link_error param from the URL so it doesn't persist on refresh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('link_error')) {
      window.history.replaceState(null, '', '/reset-password');
    }
  }, []);

  useEffect(() => {
    if (phase !== 'validating') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && hasRecoveryParams())) {
          setPhase('set-password');
        } else if (event === 'INITIAL_SESSION' && session && hasRecoveryParams()) {
          setPhase('set-password');
        }
      }
    );

    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && hasRecoveryParams()) {
        setPhase('set-password');
        return;
      }

      // Give Supabase time to process hash fragments and fire PASSWORD_RECOVERY
      setTimeout(async () => {
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession) {
          setPhase('set-password');
        } else {
          setPhase('invalid');
        }
      }, 2000);
    };

    verifySession();

    return () => subscription.unsubscribe();
  }, [phase]);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setPhase('email-sent');
      toast({
        title: "Email Sent",
        description: "If an account exists with this email, you will receive password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while sending the reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Session expired. Please request a new reset link.");
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Your password has been reset successfully!",
      });

      await supabase.auth.signOut();
      navigate("/login?reset=success");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Validating / Loading ---
  if (phase === 'validating') {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2b8ac4] relative z-10" />
      </div>
    );
  }

  // --- Invalid / Expired Link ---
  if (phase === 'invalid') {
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
              onClick={() => { setPhase('request'); window.history.replaceState(null, '', '/reset-password'); }}
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

  // --- Email Sent Confirmation ---
  if (phase === 'email-sent') {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[#0B294b]">
              Check your email
            </CardTitle>
            <p className="text-[#617b5d] mt-2 text-sm">
              We've sent password reset instructions to your email address.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-50 p-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-[#0B294b]">
                  An email has been sent to <strong className="font-semibold">{email}</strong>
                </p>
                <p className="text-sm text-[#8b8b8b]">
                  Please check your inbox and follow the instructions to reset your password.
                  The link will expire in 1 hour.
                </p>
              </div>
              <div className="space-y-2 pt-4">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Back to Sign In
                </Button>
                <Button
                  onClick={() => { setPhase('request'); setEmail(''); }}
                  variant="outline"
                  className="w-full rounded-xl border-[#cfcfcf] text-[#0B294b] bg-white hover:bg-[#e7ebed]"
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Set New Password Form ---
  if (phase === 'set-password') {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[#0B294b]">Set your new password</CardTitle>
            <CardDescription className="text-[#617b5d] mt-2 text-sm">
              Enter and confirm your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
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
                {loading ? "Setting Password..." : "Set Password"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/login")}
                variant="ghost"
                className="w-full rounded-xl text-[#617b5d] hover:text-[#0B294b] hover:bg-[#e7ebed]"
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

  // --- Request Reset Email Form (default) ---
  return (
    <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-[#0B294b]">
            Reset your password
          </CardTitle>
          <p className="text-[#617b5d] mt-2 text-sm">
            Enter your email and we'll send you a secure link to reset your password.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#0B294b]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl bg-white border-[#cfcfcf] text-[#0B294b] placeholder:text-[#8b8b8b] focus:border-[#2b8ac4] focus-visible:ring-[#2b8ac4]"
                disabled={loading}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/login")}
              variant="ghost"
              className="w-full rounded-xl text-[#617b5d] hover:text-[#0B294b] hover:bg-[#e7ebed]"
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
