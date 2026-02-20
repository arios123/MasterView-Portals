import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { acceptTerms } from "@/queries/users";
import { TermsConsentDialog } from "@/components/shared/TermsConsentDialog";
import { CURRENT_TERMS_VERSION } from "@/utils/termsUtils";
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { getPendingWorkspaceInvites, completeWorkspaceInvite, clearInviteMetadata, PendingInvite } from "@/queries/workspaceInvites";
import { WorkspaceInviteSelectionDialog } from "@/components/shared/WorkspaceInviteSelectionDialog";

type PageState = 'loading' | 'invalid' | 'conflict' | 'form';

function extractTokenParams() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  return {
    accessToken: searchParams.get("access_token") || hashParams.get("access_token"),
    refreshToken: searchParams.get("refresh_token") || hashParams.get("refresh_token"),
    type: searchParams.get("type") || hashParams.get("type"),
    token: searchParams.get("token") || hashParams.get("token"),
    tokenHash: searchParams.get("token_hash") || hashParams.get("token_hash"),
    email: searchParams.get("email") || hashParams.get("email"),
    code: searchParams.get("code") || hashParams.get("code"),
  };
}

function hasInviteTokens(params: ReturnType<typeof extractTokenParams>): boolean {
  return !!(
    params.code ||
    params.tokenHash ||
    (params.token && params.email) ||
    (params.accessToken && params.refreshToken)
  );
}

export default function FinishSignUp() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [completingInvites, setCompletingInvites] = useState(false);
  const [conflictEmail, setConflictEmail] = useState<string | null>(null);
  // Store the session that was established during token consumption
  // so we can use it reliably in the form submission
  const [establishedSession, setEstablishedSession] = useState<any>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();

  // ------------------------------------------------------------------
  // Token consumption & session verification
  // ------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      const params = extractTokenParams();
      const hasTokens = hasInviteTokens(params);

      // --- No tokens in URL ---
      if (!hasTokens) {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // getSession() returns a cached JWT – verify the user still exists server-side
          const { error: userCheckError } = await supabase.auth.getUser();
          if (userCheckError) {
            console.warn("Cached session references a non-existent user, clearing:", userCheckError.message);
            await supabase.auth.signOut();
            setPageState('invalid');
            return;
          }

          // Already signed in with incomplete profile → show form
          if (!session.user.user_metadata?.name) {
            setEstablishedSession(session);
            setPageState('form');
            return;
          }
          // Signed in with complete profile → go to dashboard
          navigate("/projects", { replace: true });
          return;
        }

        // Not signed in, no tokens → invalid
        setPageState('invalid');
        return;
      }

      // --- Tokens present: check for session conflict ---
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        const inviteEmail = params.email;
        // If we can tell the invite is for a different user, show conflict
        if (inviteEmail && existingSession.user.email !== inviteEmail) {
          setConflictEmail(existingSession.user.email!);
          setPageState('conflict');
          return;
        }
        // Same user or can't tell → sign out first so token consumption works cleanly
        if (inviteEmail && existingSession.user.email === inviteEmail) {
          await supabase.auth.signOut();
        }
      }

      // --- Consume tokens ---
      try {
        let session = await tryConsumeTokens(params);

        if (!session) {
          // Fallback: Supabase may have auto-consumed hash tokens
          const { data: { session: autoSession } } = await supabase.auth.getSession();
          session = autoSession;
        }

        if (session?.user) {
          // Verify the user actually exists server-side before trusting the JWT
          const { error: userCheckError } = await supabase.auth.getUser();
          if (userCheckError) {
            console.warn("Session user does not exist on server, clearing:", userCheckError.message);
            await supabase.auth.signOut();
            setPageState('invalid');
            return;
          }

          window.history.replaceState(null, '', window.location.pathname);
          setEstablishedSession(session);
          setPageState('form');
          return;
        }

        setPageState('invalid');
      } catch (err) {
        console.error("Invite link verification failed:", err);
        // Last-resort fallback
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { error: userCheckError } = await supabase.auth.getUser();
            if (!userCheckError) {
              window.history.replaceState(null, '', window.location.pathname);
              setEstablishedSession(session);
              setPageState('form');
              return;
            }
            await supabase.auth.signOut();
          }
        } catch { /* ignore */ }
        setPageState('invalid');
      }
    };

    init();
  }, [navigate, location.pathname]);

  async function tryConsumeTokens(
    params: ReturnType<typeof extractTokenParams>
  ) {
    // 1) PKCE code exchange
    if (params.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (!error && data.session) return data.session;
    }

    // 2) Invite with token_hash
    if (params.type === "invite" && params.tokenHash) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: params.tokenHash,
        type: "invite",
      });
      if (!error && data.session) return data.session;
    }

    // 3) Invite with token + email
    if (params.type === "invite" && params.token && params.email) {
      const { data, error } = await supabase.auth.verifyOtp({
        email: params.email,
        token: params.token,
        type: "invite",
      });
      if (!error && data.session) return data.session;
    }

    // 4) Access / refresh tokens
    if (params.accessToken && params.refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
      });
      if (!error && data.session) return data.session;
    }

    return null;
  }

  // ------------------------------------------------------------------
  // Sign out current user and reload so invite can be consumed fresh
  // ------------------------------------------------------------------
  const handleSwitchAndAccept = async () => {
    const fullInviteUrl = window.location.href;
    await supabase.auth.signOut();
    window.location.href = fullInviteUrl;
  };

  // ------------------------------------------------------------------
  // Terms acceptance
  // ------------------------------------------------------------------
  const handleTermsAccept = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await acceptTerms(user.id, CURRENT_TERMS_VERSION);
      }
      setTermsAccepted(true);
      toast({ title: "Terms Accepted", description: "You have accepted the terms and conditions" });
    } catch (error: any) {
      console.error("Error accepting terms:", error);
      toast({
        title: "Error",
        description: "Failed to record terms acceptance. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Form submission: set password + name, complete invites
  // ------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword || !name) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long", variant: "destructive" });
      return;
    }
    if (!termsAccepted) {
      toast({ title: "Terms Required", description: "Please accept the terms and conditions to continue", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Ensure we have a valid session whose user still exists server-side
      let { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { error: userCheckError } = await supabase.auth.getUser();
        if (userCheckError) {
          console.warn("Session is stale, attempting recovery:", userCheckError.message);
          await supabase.auth.signOut();
          session = null;
        }
      }

      if (!session) {
        const params = extractTokenParams();
        const recovered = await tryConsumeTokens(params);
        if (!recovered) throw new Error("Your session has expired. Please use the invite link again to finish signing up.");
        session = recovered;
      }

      // Preserve existing metadata (contains invite info: workspace_id, role, etc.)
      const existingMetadata = {
        ...(session?.user?.user_metadata || {}),
      };

      const mergedMetadata = {
        ...existingMetadata,
        name: name.trim(),
        display_name: name.trim(),
        // Explicitly preserve invite fields from session
        ...(session?.user?.user_metadata?.workspace_id && { workspace_id: session.user.user_metadata.workspace_id }),
        ...(session?.user?.user_metadata?.role && { role: session.user.user_metadata.role }),
        ...(session?.user?.user_metadata?.invited_by && { invited_by: session.user.user_metadata.invited_by }),
        ...(session?.user?.user_metadata?.pending_invites && { pending_invites: session.user.user_metadata.pending_invites }),
      };

      // Update password and metadata
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: mergedMetadata,
      });
      if (updateError) throw updateError;

      // Refresh session to get latest data
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();

      const { data: { user: refreshedUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !refreshedUser) throw new Error("Failed to refresh user data");

      // Update users table
      const { error: profileError } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('user_id', refreshedUser.id);
      if (profileError) throw profileError;

      // Record terms acceptance
      try {
        await acceptTerms(refreshedUser.id, CURRENT_TERMS_VERSION);
      } catch (termsError) {
        console.warn("Could not record terms acceptance:", termsError);
      }

      // Check for pending workspace invites
      let invites = await getPendingWorkspaceInvites(refreshedUser.id);

      // Fallback: check session metadata if no invites found
      if (invites.length === 0) {
        const sources = [session?.user?.user_metadata, refreshedSession?.user?.user_metadata];
        for (const meta of sources) {
          if (meta?.workspace_id && meta?.role) {
            invites.push({
              workspaceId: meta.workspace_id,
              role: meta.role,
              invitedBy: meta.invited_by,
            });
            break;
          }
        }
      }

      if (invites.length > 0) {
        setPendingInvites(invites);
        setInviteDialogOpen(true);
        return; // Wait for user to complete invite selection
      }

      // No invites → sign out and go to login
      toast({ title: "Success", description: "Account setup complete! You can now sign in." });
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error("Finish sign up error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Complete workspace invites (from dialog)
  // ------------------------------------------------------------------
  const handleCompleteInvites = async (selectedInvites: PendingInvite[]) => {
    setCompletingInvites(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const results: Array<{ success: boolean; message: string; workspaceId: string }> = [];

      for (const invite of selectedInvites) {
        const result = await completeWorkspaceInvite(user.id, invite.workspaceId, invite.role);
        results.push({ ...result, workspaceId: invite.workspaceId });

        if (result.success) {
          await clearInviteMetadata(invite.workspaceId);
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast({
          title: "Success",
          description: `Successfully joined ${successful.length} workspace${successful.length > 1 ? 's' : ''}!`,
        });
      }
      failed.forEach(f => {
        toast({ title: "Error", description: f.message, variant: "destructive" });
      });

      setInviteDialogOpen(false);
      setPendingInvites([]);

      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error("Error completing invites:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete workspace invitations",
        variant: "destructive",
      });
    } finally {
      setCompletingInvites(false);
    }
  };

  // ==================================================================
  // RENDER
  // ==================================================================

  // --- Loading ---
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2b8ac4] relative z-10" />
      </div>
    );
  }

  // --- Invalid / Expired ---
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[#0B294b]">
              Invalid Invite Link
            </CardTitle>
            <p className="text-[#617b5d] mt-2 text-sm">
              This invite link is invalid or has expired. Please contact your administrator for a new invite.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/login")}
              className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Session Conflict ---
  if (pageState === 'conflict') {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#0B294b]">
              Already Signed In
            </CardTitle>
            <CardDescription className="text-[#617b5d] mt-2 text-sm">
              You're currently signed in as{" "}
              <strong className="text-[#0B294b]">{conflictEmail}</strong>.
              <br />
              To accept this invite, you'll need to sign out first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleSwitchAndAccept}
              className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Sign Out &amp; Accept Invite
            </Button>
            <Button
              onClick={() => navigate("/projects")}
              variant="outline"
              className="w-full rounded-xl border-[#cfcfcf] text-[#0B294b] hover:bg-[#e7ebed] transition-all duration-200"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Form: Set Name + Password + Terms ---
  return (
    <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-[#0B294b]">Finish setting up your account</CardTitle>
          <CardDescription className="text-[#617b5d] mt-2 text-sm">
            Set your name and password to complete your account setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#0B294b]">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="rounded-xl bg-white border-[#cfcfcf] text-[#0B294b] placeholder:text-[#8b8b8b] focus:border-[#2b8ac4] focus-visible:ring-[#2b8ac4]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0B294b]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="rounded-xl bg-white border-[#cfcfcf] text-[#0B294b] placeholder:text-[#8b8b8b] focus:border-[#2b8ac4] focus-visible:ring-[#2b8ac4]"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#0B294b]">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="rounded-xl bg-white border-[#cfcfcf] text-[#0B294b] placeholder:text-[#8b8b8b] focus:border-[#2b8ac4] focus-visible:ring-[#2b8ac4]"
                required
                minLength={6}
              />
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-2">
              {termsAccepted ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-[#96ab94] bg-[#96ab94]/10 text-[#0B294b]"
                  disabled
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Terms and conditions accepted
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-[#cfcfcf] bg-white text-[#0B294b] hover:bg-[#e7ebed]"
                  onClick={() => setTermsDialogOpen(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Review terms and conditions
                </Button>
              )}
              {!termsAccepted && (
                <p className="text-xs text-[#8b8b8b] text-center">
                  You must accept the terms and conditions to continue
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={loading || !termsAccepted}
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <TermsConsentDialog
        open={termsDialogOpen}
        onOpenChange={setTermsDialogOpen}
        onAccept={handleTermsAccept}
        termsVersion={CURRENT_TERMS_VERSION}
      />

      <WorkspaceInviteSelectionDialog
        open={inviteDialogOpen}
        invites={pendingInvites}
        onComplete={handleCompleteInvites}
        loading={completingInvites}
      />
    </div>
  );
}
