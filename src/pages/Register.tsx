import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createWorkspace, fetchUserWorkspaceMembers } from "@/queries/workspaces";
import { acceptTerms } from "@/queries/users";
import { TermsConsentDialog } from "@/components/shared/TermsConsentDialog";
import { CURRENT_TERMS_VERSION } from "@/utils/termsUtils";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

// Generate a random slug similar to Slack (e.g., "company-name-abc123")
const generateRandomSlug = (companyName: string): string => {
  // Convert company name to URL-friendly format
  const baseSlug = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30); // Limit length
  
  // Generate random suffix (3 letters + 3 numbers)
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const randomLetters = Array.from({ length: 3 }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  const randomNumbers = Array.from({ length: 3 }, () => 
    numbers[Math.floor(Math.random() * numbers.length)]
  ).join('');
  
  return `${baseSlug}-${randomLetters}${randomNumbers}`;
};

// Check if slug is unique
const checkSlugUnique = async (slug: string): Promise<boolean> => {
  const { data, error } = await (supabase as any)
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  
  if (error) throw error;
  return !data; // Return true if slug doesn't exist (is unique)
};

// Generate a unique slug
const generateUniqueSlug = async (companyName: string): Promise<string> => {
  let slug = generateRandomSlug(companyName);
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!(await checkSlugUnique(slug)) && attempts < maxAttempts) {
    slug = generateRandomSlug(companyName);
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    // Fallback: add timestamp to ensure uniqueness
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  
  return slug;
};

type Step = 1 | 2;

export default function Register() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: User information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Workspace information
  const [companyName, setCompanyName] = useState('');
  
  // Terms consent state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  
  // Check if user has workspaces and redirect accordingly
  useEffect(() => {
    const checkWorkspaces = async () => {
      if (!authLoading && user) {
        try {
          const workspaces = await fetchUserWorkspaceMembers(user.id);
          // If user has workspaces, they've completed onboarding - redirect to dashboard
          if (workspaces && workspaces.length > 0) {
            navigate('/projects');
          } else {
            // User is authenticated but has no workspaces - move to step 2
            setStep(2);
            // Try to get user info to pre-fill
            const { data: userData } = await (supabase as any)
              .from('users')
              .select('name, email')
              .eq('user_id', user.id)
              .single();
            
            if (userData) {
              if (userData.name) setName(userData.name);
              if (userData.email) setEmail(userData.email);
            }
          }
        } catch (error) {
          console.error("Error checking workspaces:", error);
          // If error, assume no workspaces and move to step 2
          setStep(2);
        }
      }
    };
    
    checkWorkspaces();
  }, [user, authLoading, navigate]);
  
  const progress = (step / 2) * 100;
  
  if (authLoading) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white flex items-center justify-center"
        style={{ backgroundColor: 'rgb(15 23 42)' }}
      >
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }
  
  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }
    
    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }
    
    if (!password) {
      toast({
        title: "Validation Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return false;
    }
    
    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = (): boolean => {
    if (!companyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your company name",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleTermsAccept = async () => {
    try {
      // If user is already authenticated, record terms acceptance
      if (user) {
        await acceptTerms(user.id, CURRENT_TERMS_VERSION);
      }
      setTermsAccepted(true);
      toast({
        title: "Terms Accepted",
        description: "You have accepted the terms and conditions",
      });
    } catch (error: any) {
      console.error("Error accepting terms:", error);
      toast({
        title: "Error",
        description: "Failed to record terms acceptance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStep1Next = async () => {
    if (!validateStep1()) return;
    
    // Check if terms are accepted
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      return;
    }
    
    // If user is already authenticated, just move to step 2
    if (user) {
      setStep(2);
      return;
    }
    
    setLoading(true);
    
    try {
      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });
      
      if (signUpError) {
        // Handle specific error cases
        const errorMsg = signUpError.message.toLowerCase();
        if (errorMsg.includes('already registered') || 
            errorMsg.includes('user already registered') ||
            errorMsg.includes('email address is already registered')) {
          toast({
            title: "Account Already Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          setLoading(false);
          return;
        }
        throw signUpError;
      }
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }
      
      // Wait a moment for the trigger to create the user record
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the user's name in the users table if needed
      const { error: updateError } = await (supabase as any)
        .from('users')
        .update({ name: name.trim() })
        .eq('user_id', authData.user.id);
      
      if (updateError) {
        console.warn("Could not update user name:", updateError);
        // Continue anyway - the trigger should have created it
      }
      
      // Record terms acceptance for the new user
      try {
        await acceptTerms(authData.user.id, CURRENT_TERMS_VERSION);
      } catch (termsError) {
        console.warn("Could not record terms acceptance:", termsError);
        // Continue anyway - user has already accepted in UI
      }
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully",
      });
      
      setStep(2);
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      // Handle specific error messages
      const errorMsg = error.message?.toLowerCase() || '';
      let errorMessage = error.message || "An error occurred during sign up";
      
      if (errorMsg.includes('already registered') || 
          errorMsg.includes('user already registered') ||
          errorMsg.includes('email address is already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
        toast({
          title: "Account Already Exists",
          description: errorMessage,
          variant: "destructive",
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleStep2Complete = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("User not authenticated. Please try signing up again.");
      }
      
      // Generate unique slug
      const slug = await generateUniqueSlug(companyName.trim());
      
      // Create workspace and add user as Admin
      const workspace = await createWorkspace(companyName.trim(), slug, user.id);
      
      toast({
        title: "Workspace Created",
        description: "Your workspace has been created successfully. Please complete subscription setup.",
      });
      
      // Redirect to choose plan page to set up subscription
      navigate(`/choose-plan?workspace_id=${workspace.id}`);
    } catch (error: any) {
      console.error("Workspace creation error:", error);
      toast({
        title: "Workspace Creation Failed",
        description: error.message || "An error occurred while creating your workspace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'rgb(15 23 42)' }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute w-64 h-64 bg-emerald-400/30 blur-3xl rounded-full -top-10 -left-10" />
        <div className="absolute w-80 h-80 bg-cyan-400/25 blur-3xl rounded-full bottom-0 right-10" />
      </div>
      
      <Card className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800/95 backdrop-blur-sm shadow-xl relative z-10">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-white">
            {step === 1 ? "Create Your Account" : "Create Your Workspace"}
          </CardTitle>
          <CardDescription className="mt-2 text-slate-300">
            {step === 1 
              ? "Get started by creating your account"
              : "Set up your workspace to begin managing projects"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span className={step >= 1 ? "font-medium text-white" : ""}>
                Account
              </span>
              <span className={step >= 2 ? "font-medium text-white" : ""}>
                Workspace
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleStep1Next(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                  disabled={loading}
                  required
                />
              </div>
              
              {/* Terms and Conditions Consent */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {termsAccepted ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl border-emerald-500 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
                      disabled
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Terms and Conditions Accepted
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl border-slate-500 bg-slate-700/50 text-white hover:bg-slate-600 hover:text-white"
                      onClick={() => setTermsDialogOpen(true)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Review Terms and Conditions
                    </Button>
                  )}
                </div>
                {!termsAccepted && (
                  <p className="text-xs text-slate-400 text-center">
                    You must accept the terms and conditions to continue
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all duration-200"
                disabled={loading || !termsAccepted}
              >
                {loading ? "Creating Account..." : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}
          
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleStep2Complete(); }} className="space-y-4">
              {user && (
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 mb-4">
                  <p className="text-sm text-slate-200">
                    Welcome back! Complete your workspace setup to continue.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-slate-200">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-slate-400">
                  This will be your workspace name. You can change it later.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl border-slate-600 text-slate-200 hover:bg-slate-700"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Complete Setup"}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
          
          <div className="text-center text-sm text-slate-300 pt-4 border-t border-slate-700 space-y-2">
            {user ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Signed in as {user.email}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    setName('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setCompanyName('');
                    setStep(1);
                  }}
                  className="text-xs text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <LogOut className="mr-1 h-3 w-3" />
                  Sign out and start over
                </Button>
              </div>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-white font-medium hover:text-emerald-400 hover:underline transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms Consent Dialog */}
      <TermsConsentDialog
        open={termsDialogOpen}
        onOpenChange={setTermsDialogOpen}
        onAccept={handleTermsAccept}
        termsVersion={CURRENT_TERMS_VERSION}
      />
    </div>
  );
}

