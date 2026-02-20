import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedTabRoute } from "@/components/ProtectedTabRoute";
import { ProtectedProjectTabRoute } from "@/components/ProtectedProjectTabRoute";
import { ProtectedAdminTabRoute } from "@/components/ProtectedAdminTabRoute";
import Index from "./pages/Index";
import LandingWrapper from "./pages/landing/LandingWrapper";
import ProductFeaturesPage from "./pages/landing/ProductFeaturesPage";
import PricingPage from "./pages/landing/PricingPage";
import UpdatesPage from "./pages/landing/UpdatesPage";
import AboutPage from "./pages/landing/AboutPage";
import TeamPage from "./pages/landing/TeamPage";
import SupportPage from "./pages/landing/SupportPage";
import TermsPage from "./pages/landing/TermsPage";
import PrivacyPage from "./pages/landing/PrivacyPage";
import DocumentationPage from "./pages/landing/DocumentationPage";
import VideoTutorialsPage from "./pages/landing/VideoTutorialsPage";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import FinishSignUp from "./pages/FinishSignUp";
import NotFound from "./pages/NotFound";
import ChoosePlan from "./pages/ChoosePlan";
import SelectWorkspace from "./pages/SelectWorkspace";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { AppShell } from "./components/AppShell";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <OnboardingProvider>
              <Routes>
                {/* Public / Landing */}
                <Route path="/" element={<LandingWrapper />} />
                <Route path="/product/galaxy-of-features" element={<ProductFeaturesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/updates" element={<UpdatesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/documentation" element={<DocumentationPage />} />
                <Route path="/video-tutorials" element={<VideoTutorialsPage />} />

                {/* Auth */}
                <Route path="/login" element={<SignIn />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/finish-signup" element={<FinishSignUp />} />

                {/* Onboarding / Checkout (protected) */}
                <Route path="/choose-plan" element={
                  <ProtectedRoute>
                    <ChoosePlan />
                  </ProtectedRoute>
                } />
                <Route path="/select-workspace" element={
                  <ProtectedRoute>
                    <SelectWorkspace />
                  </ProtectedRoute>
                } />
                <Route path="/checkout/success" element={
                  <ProtectedRoute>
                    <CheckoutSuccess />
                  </ProtectedRoute>
                } />
                <Route path="/checkout/cancel" element={
                  <ProtectedRoute>
                    <CheckoutCancel />
                  </ProtectedRoute>
                } />

                {/* App (protected + subscription guarded) */}
                <Route path="/dashboard" element={
                  <AppShell>
                    <ProtectedRoute>
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedRoute>
                  </AppShell>
                } />
                <Route path="/projects" element={
                  <AppShell>
                    <ProtectedTabRoute requiredPermission="tab.projects.view">
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedTabRoute>
                  </AppShell>
                } />
                <Route path="/projects/:clientId/:projectId/:tab?" element={
                  <AppShell>
                    <ProtectedProjectTabRoute>
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedProjectTabRoute>
                  </AppShell>
                } />
                <Route path="/clients" element={
                  <AppShell>
                    <ProtectedTabRoute requiredPermission="tab.clients.view">
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedTabRoute>
                  </AppShell>
                } />
                <Route path="/calendar" element={
                  <AppShell>
                    <ProtectedTabRoute requiredPermission="tab.calendar.view">
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedTabRoute>
                  </AppShell>
                } />
                <Route path="/completed" element={
                  <AppShell>
                    <ProtectedTabRoute requiredPermission="tab.completed.view">
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedTabRoute>
                  </AppShell>
                } />
                <Route path="/lost" element={
                  <AppShell>
                    <ProtectedTabRoute requiredPermission="tab.lost.view">
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedTabRoute>
                  </AppShell>
                } />
                <Route path="/internalsupport" element={
                  <AppShell>
                    <ProtectedRoute>
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedRoute>
                  </AppShell>
                } />
                <Route path="/admin/:section?" element={
                  <AppShell>
                    <ProtectedAdminTabRoute>
                      <SubscriptionGuard>
                        <Index />
                      </SubscriptionGuard>
                    </ProtectedAdminTabRoute>
                  </AppShell>
                } />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </OnboardingProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
