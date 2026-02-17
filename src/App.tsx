import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
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
import SupportPage from "./pages/landing/SupportPage";
import SecurityPage from "./pages/landing/SecurityPage";
import TermsPage from "./pages/landing/TermsPage";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import ChoosePlan from "./pages/ChoosePlan";
import SelectWorkspace from "./pages/SelectWorkspace";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { DemoBanner } from "./components/DemoBanner";

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
        <DemoBanner />
        <AuthProvider>
          <WorkspaceProvider>
            <Routes>
            <Route path="/" element={<LandingWrapper />} />
            <Route path="/product/galaxy-of-features" element={<ProductFeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<SignUp />} />
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
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedTabRoute requiredPermission="tab.projects.view">
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedTabRoute>
              } 
            />
            <Route 
              path="/projects/:clientId/:projectId/:tab?" 
              element={
                <ProtectedProjectTabRoute>
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedProjectTabRoute>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <ProtectedTabRoute requiredPermission="tab.clients.view">
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedTabRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedTabRoute requiredPermission="tab.calendar.view">
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedTabRoute>
              } 
            />
            <Route 
              path="/completed" 
              element={
                <ProtectedTabRoute requiredPermission="tab.completed.view">
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedTabRoute>
              } 
            />
            <Route 
              path="/lost" 
              element={
                <ProtectedTabRoute requiredPermission="tab.lost.view">
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedTabRoute>
              } 
            />
            <Route 
              path="/internalsupport" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/:section?" 
              element={
                <ProtectedAdminTabRoute>
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedAdminTabRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
