// import React, { useState, useEffect } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";
// import { User, Session } from '@supabase/supabase-js';

// export default function SignUp() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [name, setName] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [user, setUser] = useState<User | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [isInviteFlow, setIsInviteFlow] = useState(false);
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   // Handle invite token from URL
//   useEffect(() => {
//     const handleInvite = async () => {
//       const hashParams = new URLSearchParams(window.location.hash.substring(1));
//       const accessToken = hashParams.get('access_token');
//       const refreshToken = hashParams.get('refresh_token');
//       const type = hashParams.get('type');

//       if (type === 'invite' || (accessToken && refreshToken)) {
//         setIsInviteFlow(true);
//       }

//       if (accessToken && refreshToken) {
//         // Establish session from invite tokens
//         const { error } = await supabase.auth.setSession({
//           access_token: accessToken,
//           refresh_token: refreshToken,
//         });

//         if (!error) {
//           const { data: { user } } = await supabase.auth.getUser();
//           if (user?.email) {
//             setEmail(user.email);
//           }
//           // Clean URL hash to keep things tidy
//           window.history.replaceState(null, '', window.location.pathname + window.location.search);
//         }
//       }
//     };

//     handleInvite();
//   }, []);

//   useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (event, session) => {
//         setSession(session);
//         setUser(session?.user ?? null);
//       }
//     );

//     // Check for existing session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setUser(session?.user ?? null);

//       // Only redirect if already authenticated AND definitely not in invite flow
//       // Check if session exists but also check if URL has invite tokens
//       const hashParams = new URLSearchParams(window.location.hash.substring(1));
//       const hasInviteTokens = hashParams.get('type') === 'invite' ||
//                               (hashParams.get('access_token') && hashParams.get('refresh_token'));

//       if (session?.user && !hasInviteTokens && !isInviteFlow) {
//         navigate('/');
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate, isInviteFlow]);

//   const handleSignUp = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!email || !password || !confirmPassword || !name) {
//       toast({
//         title: "Missing Information",
//         description: "Please fill in all fields",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (password !== confirmPassword) {
//       toast({
//         title: "Password Mismatch",
//         description: "Passwords do not match",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (password.length < 6) {
//       toast({
//         title: "Password Too Short",
//         description: "Password must be at least 6 characters long",
//         variant: "destructive",
//       });
//       return;
//     }

//     setLoading(true);

//     try {
//       // Check if this is an invite completion
//       if (isInviteFlow && user) {
//         // Complete invite by setting password and updating user metadata
//         const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
//           password: password,
//           data: {
//             name: name,
//             display_name: name,
//           }
//         });

//         if (updateError) {
//           throw updateError;
//         }

//         // Update the public.users table with the name
//         if (updatedUser) {
//           const { error: profileError } = await supabase
//             .from('users')
//             .update({ name: name })
//             .eq('user_id', updatedUser.id);

//           if (profileError) {
//             console.error('Error updating profile:', profileError);
//             throw profileError;
//           }
//         }

//           toast({
//             title: "Account setup complete!",
//             description: "Welcome to the team!",
//           });

//           // Redirect to home after successful invite completion
//           setTimeout(() => navigate('/'), 1000);
//       } else {
//         // Regular signup flow
//         const redirectUrl = `${window.location.origin}/`;

//         const { error } = await supabase.auth.signUp({
//           email,
//           password,
//           options: {
//             emailRedirectTo: redirectUrl,
//             data: {
//               name: name,
//             }
//           }
//         });

//         if (error) {
//           throw error;
//         }

//         toast({
//           title: "Account Created",
//           description: "Please check your email to confirm your account",
//         });

//         // Clear form
//         setEmail('');
//         setPassword('');
//         setConfirmPassword('');
//         setName('');
//       }
//     } catch (error: any) {
//       let errorMessage = "An error occurred during sign up";

//       if (error.message.includes('User already registered')) {
//         errorMessage = "An account with this email already exists";
//       } else if (error.message.includes('Password should be')) {
//         errorMessage = "Password does not meet requirements";
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       toast({
//         title: "Sign Up Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
//       <Card className="w-full max-w-md rounded-2xl border bg-white shadow-lg">
//         <CardHeader className="text-center pb-6">
//           <CardTitle className="text-2xl font-bold text-slate-900">
//             {isInviteFlow ? 'Complete Your Invitation' : 'Create Account'}
//           </CardTitle>
//           <p className="text-slate-600 mt-2">
//             {isInviteFlow
//               ? 'Set your name and password to complete your account setup'
//               : 'Complete your account setup with the invitation'}
//           </p>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSignUp} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">Full Name</Label>
//               <Input
//                 id="name"
//                 type="text"
//                 placeholder="Enter your full name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="rounded-xl"
//                 disabled={loading}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="rounded-xl"
//                 disabled={loading || isInviteFlow}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Create a password (min 6 characters)"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="rounded-xl"
//                 disabled={loading}
//                 required
//                 minLength={6}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="confirmPassword">Confirm Password</Label>
//               <Input
//                 id="confirmPassword"
//                 type="password"
//                 placeholder="Confirm your password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 className="rounded-xl"
//                 disabled={loading}
//                 required
//                 minLength={6}
//               />
//             </div>
//             <Button
//               type="submit"
//               className="w-full rounded-xl bg-black text-white hover:bg-gray-900"
//               disabled={loading}
//             >
//               {loading ? "Setting up account..." : isInviteFlow ? "Complete Setup" : "Create Account"}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { acceptTerms } from "@/queries/users";
import { TermsConsentDialog } from "@/components/shared/TermsConsentDialog";
import { CURRENT_TERMS_VERSION } from "@/utils/termsUtils";
import { FileText, CheckCircle2 } from "lucide-react";
import { getPendingWorkspaceInvites, completeWorkspaceInvite, clearInviteMetadata, PendingInvite } from "@/queries/workspaceInvites";
import { WorkspaceInviteSelectionDialog } from "@/components/shared/WorkspaceInviteSelectionDialog";

const SignUp = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [completingInvites, setCompletingInvites] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");
  const email = searchParams.get("email");

  useEffect(() => {
    const init = async () => {
      try {
        // 1) Support PKCE/code exchange (some email templates use `code`)
        const code = searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.session) throw error || new Error("No session from exchangeCodeForSession");
          setValidToken(true);
          return;
        }

        // 2) Invite flow with token_hash
        if (type === "invite" && tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "invite",
          });
          if (error || !data.session) throw error || new Error("No session from verifyOtp (invite)");
          setValidToken(true);
          return;
        }
        // 3) Invite flow with token + email (some templates)
        if (type === "invite" && token && email) {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "invite",
          });
          if (error || !data.session) throw error || new Error("No session from verifyOtp (invite token)");
          setValidToken(true);
          return;
        }

        // 4) Access/refresh tokens (recovery or older flows)
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error || !data.session) throw error || new Error("No session from setSession");
          setValidToken(true);
          return;
        }

        // If we reach here, not enough data to create a session
        setValidToken(false);
      } catch (err) {
        console.error("Invite link verification failed:", err);
        setValidToken(false);
      }
    };

    init();
  }, [accessToken, refreshToken, type, tokenHash, token, email, searchParams]);

  const handleTermsAccept = async () => {
    try {
      // Get current user session
      const { data: { user } } = await supabase.auth.getUser();
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

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword || !name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    // Check if terms are accepted
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Ensure we have a valid session before updating password

      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const code = searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.session) throw error || new Error("Unable to establish session from code");
          session = data.session;
        } else if (type === "invite" && tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "invite",
          });
          if (error || !data.session) throw error || new Error("Unable to establish session from invite link");
          session = data.session;
        } else if (type === "invite" && token && email) {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "invite",
          });
          if (error || !data.session) throw error || new Error("Unable to establish session from invite token");
          session = data.session;
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error || !data.session) throw error || new Error("Unable to establish session from tokens");
          session = data.session;
        } else {
          throw new Error("Authentication session missing");
        }
      }

      // Get existing user metadata BEFORE updating to preserve invite information
      // Try to get from session first (most reliable), then fall back to getUser()
      let existingMetadata: Record<string, any> = {};
      
      // First, check the session that was just established - this is the most reliable source
      if (session?.user?.user_metadata) {
        existingMetadata = { ...session.user.user_metadata };
      } else {
        // Fall back to getUser() if session metadata not available
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        existingMetadata = currentUser?.user_metadata || {};
      }
      
      console.log('Existing metadata before password update:', existingMetadata);
      console.log('Session user metadata:', session?.user?.user_metadata);
      
      // Merge new data with existing metadata to preserve invite info (workspace_id, role, invited_by, pending_invites)
      // Supabase's updateUser merges metadata, so we just need to add our new fields while preserving existing ones
      // IMPORTANT: We explicitly preserve invite fields even if they're not in existingMetadata yet
      // (They might be in raw_user_meta_data in the database but not yet in user_metadata)
      const mergedMetadata = {
        ...existingMetadata, // Preserve all existing metadata first
        name: name, // Add/update name
        display_name: name, // Add/update display_name
        // Preserve invite fields if they exist (they might be in session metadata but not in existingMetadata)
        ...(session?.user?.user_metadata?.workspace_id && { workspace_id: session.user.user_metadata.workspace_id }),
        ...(session?.user?.user_metadata?.role && { role: session.user.user_metadata.role }),
        ...(session?.user?.user_metadata?.invited_by && { invited_by: session.user.user_metadata.invited_by }),
        ...(session?.user?.user_metadata?.pending_invites && { pending_invites: session.user.user_metadata.pending_invites }),
      };
      
      console.log('Merged metadata to save:', mergedMetadata);

      // Update the user's password and display name now that a session is established
      // Preserve all existing metadata including invite information
      const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: mergedMetadata
      });

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }
      
      console.log('User updated successfully. Updated user metadata:', updatedUser?.user_metadata);

      // Refresh user data to ensure we have the latest metadata
      // Also refresh the session to ensure we have the latest data
      const { data: { session: refreshedSession }, error: sessionRefreshError } = await supabase.auth.refreshSession();
      if (sessionRefreshError) {
        console.warn('Error refreshing session:', sessionRefreshError);
      }
      
      const { data: { user: refreshedUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !refreshedUser) {
        console.error('Error getting refreshed user:', userError);
        throw new Error('Failed to refresh user data');
      }

      // Update the name in the users table
      if (refreshedUser) {
        const { error: profileError } = await supabase
          .from('users')
          .update({ name: name })
          .eq('user_id', refreshedUser.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          throw profileError;
        }

        // Record terms acceptance (already accepted in UI, but ensure it's saved)
        try {
          await acceptTerms(refreshedUser.id, CURRENT_TERMS_VERSION);
        } catch (termsError) {
          console.warn('Could not record terms acceptance:', termsError);
          // Continue anyway - user has already accepted in UI
        }

        // Check for pending workspace invites using refreshed user data
        let invites = await getPendingWorkspaceInvites(refreshedUser.id);
        
        console.log('Invite metadata after password update:', refreshedUser.user_metadata);
        console.log('Session metadata:', session?.user?.user_metadata);
        console.log('Found invites from getPendingWorkspaceInvites:', invites);
        
        // Fallback: If no invites found in refreshed user metadata, check the original session metadata
        // This handles cases where metadata might have been lost during update
        if (invites.length === 0) {
          // Try session metadata first
          if (session?.user?.user_metadata) {
            const sessionMetadata = session.user.user_metadata;
            console.log('Checking session metadata for invite info:', sessionMetadata);
            if (sessionMetadata.workspace_id && sessionMetadata.role) {
              console.log('Found invite info in session metadata, adding to invites');
              invites.push({
                workspaceId: sessionMetadata.workspace_id,
                role: sessionMetadata.role,
                invitedBy: sessionMetadata.invited_by,
              });
            }
          }
          
          // If still no invites, try reading from the refreshed session
          if (invites.length === 0 && refreshedSession?.user?.user_metadata) {
            const refreshedSessionMetadata = refreshedSession.user.user_metadata;
            console.log('Checking refreshed session metadata for invite info:', refreshedSessionMetadata);
            if (refreshedSessionMetadata.workspace_id && refreshedSessionMetadata.role) {
              console.log('Found invite info in refreshed session metadata, adding to invites');
              invites.push({
                workspaceId: refreshedSessionMetadata.workspace_id,
                role: refreshedSessionMetadata.role,
                invitedBy: refreshedSessionMetadata.invited_by,
              });
            }
          }
        }
        
        if (invites.length > 0) {
          // Store invites and show dialog
          setPendingInvites(invites);
          
          if (invites.length === 1) {
            // Single invite - show selection dialog (user requested this)
            setInviteDialogOpen(true);
            return; // Don't sign out yet, wait for user to complete invite
          } else {
            // Multiple invites - show selection dialog
            setInviteDialogOpen(true);
            return; // Don't sign out yet, wait for user to select invites
          }
        }
      }

      // No invites - normal signup flow
      toast({
        title: "Success",
        description: "Password set successfully! You can now log in.",
      });

      // Sign out the user so they can log in with their new password
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error("Password set error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInvites = async (selectedInvites: PendingInvite[]) => {
    setCompletingInvites(true);
    const results: Array<{ success: boolean; message: string; workspaceId: string }> = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }

      // Complete each selected invite
      for (const invite of selectedInvites) {
        const result = await completeWorkspaceInvite(user.id, invite.workspaceId, invite.role);
        results.push({
          ...result,
          workspaceId: invite.workspaceId,
        });

        // Clear invite metadata for completed invites
        if (result.success) {
          await clearInviteMetadata(invite.workspaceId);
        }
      }

      // Show results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast({
          title: "Success",
          description: `Successfully joined ${successful.length} workspace${successful.length > 1 ? 's' : ''}!`,
        });
      }

      if (failed.length > 0) {
        failed.forEach(failure => {
          toast({
            title: "Error",
            description: failure.message,
            variant: "destructive",
          });
        });
      }

      // Close dialog and proceed
      setInviteDialogOpen(false);
      setPendingInvites([]);

      // Sign out and redirect to login
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error('Error completing invites:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete workspace invitations",
        variant: "destructive",
      });
    } finally {
      setCompletingInvites(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute w-64 h-64 bg-emerald-400/30 blur-3xl rounded-full -top-10 -left-10" />
          <div className="absolute w-80 h-80 bg-cyan-400/25 blur-3xl rounded-full bottom-0 right-10" />
        </div>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 relative z-10"></div>
      </div>
    );
  }
  console.log("testing");
  if (validToken === false) {
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
          <CardHeader>
            <CardTitle className="text-destructive text-white">Invalid Link</CardTitle>
            <CardDescription className="text-slate-300">
              This link is invalid or has expired. Please contact your administrator for a new invite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/login")} 
              className="w-full rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all duration-200"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl font-bold text-white">Set Your Password</CardTitle>
          <CardDescription className="text-slate-300 mt-2">
            Create a password for your account to complete the setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                required
                minLength={6}
              />
            </div>

            {/* Terms and Conditions Consent */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {termsAccepted ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-emerald-500 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                    disabled
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Terms and Conditions Accepted
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-slate-600 text-slate-200 bg-slate-700/50 hover:bg-slate-700"
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
              {loading ? "Setting Password..." : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Terms Consent Dialog */}
      <TermsConsentDialog
        open={termsDialogOpen}
        onOpenChange={setTermsDialogOpen}
        onAccept={handleTermsAccept}
        termsVersion={CURRENT_TERMS_VERSION}
      />

      {/* Workspace Invite Selection Dialog */}
      <WorkspaceInviteSelectionDialog
        open={inviteDialogOpen}
        invites={pendingInvites}
        onComplete={handleCompleteInvites}
        loading={completingInvites}
      />
    </div>
  );
};

export default SignUp;
