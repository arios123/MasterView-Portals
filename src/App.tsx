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
// import SecurityPage from "./pages/landing/SecurityPage";
import TermsPage from "./pages/landing/TermsPage";
import PrivacyPage from "./pages/landing/PrivacyPage";
import DocumentationPage from "./pages/landing/DocumentationPage";
import VideoTutorialsPage from "./pages/landing/VideoTutorialsPage";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ChoosePlan from "./pages/ChoosePlan";
import SelectWorkspace from "./pages/SelectWorkspace";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { AppShell } from "./components/AppShell";

// Configure QueryClient to prevent auto-refetch on window focus/reconnect
// This prevents the page from reloading data when switching browser tabs or staying idle
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: false, // Don't refetch when network reconnects
      refetchOnMount: false, // Don't refetch when component remounts (only refetch manually)
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (formerly cacheTime)
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
            <Route path="/" element={<LandingWrapper />} />
            <Route path="/product/galaxy-of-features" element={<ProductFeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/support" element={<SupportPage />} />
            {/* <Route path="/security" element={<SecurityPage />} /> */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/video-tutorials" element={<VideoTutorialsPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route 
              path="/dashboard" 
              element={
                <AppShell>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <AppShell>
                  <ProtectedTabRoute requiredPermission="tab.projects.view">
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedTabRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/projects/:clientId/:projectId/:tab?" 
              element={
                <AppShell>
                  <ProtectedProjectTabRoute>
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedProjectTabRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <AppShell>
                  <ProtectedTabRoute requiredPermission="tab.clients.view">
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedTabRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <AppShell>
                  <ProtectedTabRoute requiredPermission="tab.calendar.view">
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedTabRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/completed" 
              element={
                <AppShell>
                  <ProtectedTabRoute requiredPermission="tab.completed.view">
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedTabRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/lost" 
              element={
                <AppShell>
                  <ProtectedTabRoute requiredPermission="tab.lost.view">
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedTabRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/internalsupport" 
              element={
                <AppShell>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/:section?" 
              element={
                <AppShell>
                  <ProtectedAdminTabRoute>
                    <SubscriptionGuard>
                      <Index />
                    </SubscriptionGuard>
                  </ProtectedAdminTabRoute>
                </AppShell>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
