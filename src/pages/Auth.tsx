import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { CheckCircle2 } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check if redirected from password reset
  const resetSuccess = searchParams.get('reset') === 'success';

  useEffect(() => {
    // Check if we're in a password recovery flow (check hash first, as per Supabase v2 recommendation)
    const checkIsPasswordRecovery = (): boolean => {
      // Check URL hash for recovery (Supabase v2 recommended approach)
      if (window.location.hash.includes('type=recovery')) {
        return true;
      }
      
      if (window.location.pathname === '/reset-password') {
        // Check hash fragments
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          if (hashParams.get('type') === 'recovery') {
            return true;
          }
        }
        
        // Check search params
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const code = urlParams.get('code');
        const tokenHash = urlParams.get('token_hash');
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        return type === 'recovery' || !!code || !!tokenHash || (!!accessToken && !!refreshToken);
      }
      return false;
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if this is a recovery flow
        const isRecovery = event === 'PASSWORD_RECOVERY' || checkIsPasswordRecovery();
        
        // Redirect to projects dashboard if authenticated
        // BUT: Do NOT redirect if we're in a password recovery flow
        if (event === 'SIGNED_IN' && isRecovery) {
          // 🚫 Do NOT redirect to dashboard - navigate to reset-password instead
          navigate('/reset-password');
          return;
        }
        
        if (session?.user && !isRecovery) {
          navigate('/projects');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Redirect to projects dashboard if already authenticated
      // BUT: Don't redirect if we're in a password recovery flow
      if (session?.user && !checkIsPasswordRecovery()) {
        navigate('/projects');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Successfully signed in!",
      });
    } catch (error: any) {
      let errorMessage = "An error occurred during sign in";
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and confirm your account";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      
      <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-[#0B294b]">
            Sign in to MasterView Portals
          </CardTitle>
          <p className="text-[#617b5d] mt-2 text-sm">
            Use your work email to access your projects, contracts, and change orders.
          </p>
        </CardHeader>
        <CardContent>
          {resetSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-300">
                Password reset successful! Please sign in with your new password.
              </p>
            </div>
          )}
          <form onSubmit={handleSignIn} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0B294b]">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <div className="text-center text-sm text-[#617b5d] pt-4 border-t border-[#cfcfcf] mt-4 space-y-2">
            <div>
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-[#2b8ac4] font-medium hover:text-[#46b7d7] hover:underline transition-colors"
              >
                Create account
              </button>
            </div>
            <div>
              Forgot your password?{" "}
              <button
                onClick={() => navigate("/forgot-password")}
                className="text-[#2b8ac4] font-medium hover:text-[#46b7d7] hover:underline transition-colors"
              >
                Reset it
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}