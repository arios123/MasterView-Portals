import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import { checkOwnerOnboardingCompleted, markOwnerOnboardingCompleted } from '@/queries/onboarding';
import { onboardingSteps } from '@/components/onboarding/onboardingSteps';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

type OnboardingState = {
  active: boolean;
  step: number;
  flow: "workspace";
  workspaceId: string | null;
};

interface OnboardingContextType {
  state: OnboardingState;
  startOnboarding: (workspaceId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipAll: () => void;
  completeOnboarding: () => Promise<void>;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Track if we've already warned about missing context to avoid spam
let hasWarnedAboutContext = false;

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    // During hot reload or initial mount, context might briefly be undefined
    // Return a safe default instead of throwing immediately
    if (!hasWarnedAboutContext) {
      console.warn('useOnboarding called outside OnboardingProvider or during initialization');
      hasWarnedAboutContext = true;
    }
    return {
      state: {
        active: false,
        step: 0,
        flow: "workspace" as const,
        workspaceId: null,
      },
      startOnboarding: () => {},
      nextStep: () => {},
      previousStep: () => {},
      skipAll: async () => {},
      completeOnboarding: async () => {},
      mobileSidebarOpen: false,
      setMobileSidebarOpen: () => {},
    };
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  
  const [state, setState] = useState<OnboardingState>({
    active: false,
    step: 0,
    flow: "workspace",
    workspaceId: null,
  });
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const lastNavigatedStepRef = useRef<number>(-1);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();

  // Get localStorage key for current workspace
  const getStorageKey = (workspaceId: string) => `onboarding-${workspaceId}`;

  // Load onboarding state from localStorage
  const loadFromStorage = useCallback((workspaceId: string) => {
    try {
      const stored = localStorage.getItem(getStorageKey(workspaceId));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load onboarding state from localStorage:', error);
    }
    return null;
  }, []);

  // Save onboarding state to localStorage
  const saveToStorage = useCallback((workspaceId: string, step: number, completed: boolean) => {
    try {
      localStorage.setItem(
        getStorageKey(workspaceId),
        JSON.stringify({
          step,
          completed,
          lastUpdated: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to save onboarding state to localStorage:', error);
    }
  }, []);

  // Start onboarding for a workspace
  const startOnboarding = useCallback((workspaceId: string) => {
    setState({
      active: true,
      step: 0,
      flow: "workspace",
      workspaceId,
    });
    saveToStorage(workspaceId, 0, false);
  }, [saveToStorage]);

  // Move to next step
  const nextStep = useCallback(() => {
    setState((prev) => {
      if (!prev.workspaceId) return prev;
      
      const newStep = prev.step + 1;
      const isLastStep = newStep >= onboardingSteps.length - 1;
      
      if (isLastStep) {
        // This is the last step, will complete on next action
        saveToStorage(prev.workspaceId, newStep, false);
      } else {
        saveToStorage(prev.workspaceId, newStep, false);
      }
      
      return {
        ...prev,
        step: newStep,
      };
    });
  }, [saveToStorage]);

  // Move to previous step
  const previousStep = useCallback(() => {
    setState((prev) => {
      if (!prev.workspaceId || prev.step === 0) return prev;
      
      const newStep = prev.step - 1;
      saveToStorage(prev.workspaceId, newStep, false);
      
      return {
        ...prev,
        step: newStep,
      };
    });
  }, [saveToStorage]);

  // Skip all and complete
  const skipAll = useCallback(async () => {
    if (!state.workspaceId) return;
    await completeOnboarding();
  }, [state.workspaceId]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    if (!state.workspaceId || !user) return;

    try {
      // Mark as completed in database
      await markOwnerOnboardingCompleted(state.workspaceId);
      
      // Mark as completed in localStorage
      saveToStorage(state.workspaceId, state.step, true);
      
      // Deactivate onboarding
      setState({
        active: false,
        step: 0,
        flow: "workspace",
        workspaceId: null,
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Keep onboarding active and retry on next interaction
      // Don't change state, let user try again
    }
  }, [state.workspaceId, state.step, user, saveToStorage]);

  // Check and initialize onboarding when workspace changes
  useEffect(() => {
    const checkAndInitializeOnboarding = async () => {
      // Skip if still loading or missing required data
      if (workspaceLoading || !user || !currentWorkspace) {
        return;
      }

      // Don't auto-start onboarding when user is on checkout success page.
      // Wait until they click "Go to Dashboard"; onboarding will start after navigation.
      if (location.pathname === '/checkout/success') {
        return;
      }

      // Only workspace owners get onboarding
      const isOwner = currentWorkspace.owner_id === user.id;
      
      if (!isOwner) {
        // Not an owner, ensure onboarding is off
        if (state.active) {
          setState({
            active: false,
            step: 0,
            flow: "workspace",
            workspaceId: null,
          });
        }
        return;
      }

      // Check localStorage first
      const stored = loadFromStorage(currentWorkspace.id);
      
      // Check database completion status
      try {
        const dbCompleted = await checkOwnerOnboardingCompleted(currentWorkspace.id);
        
        // If completed in database, mark localStorage as completed too
        if (dbCompleted) {
          if (!stored || !stored.completed) {
            saveToStorage(currentWorkspace.id, 0, true);
          }
          // Ensure onboarding is off
          if (state.active && state.workspaceId === currentWorkspace.id) {
            setState({
              active: false,
              step: 0,
              flow: "workspace",
              workspaceId: null,
            });
          }
          return;
        }
        
        // Not completed in database
        // If we have valid localStorage state, resume from there
        if (stored && !stored.completed) {
          // Validate that the stored step is within bounds
          const validStep = stored.step >= 0 && stored.step < onboardingSteps.length;
          
          if (validStep) {
            setState({
              active: true,
              step: stored.step,
              flow: "workspace",
              workspaceId: currentWorkspace.id,
            });
            return;
          } else {
            // Invalid step (out of bounds), clear localStorage and start fresh
            localStorage.removeItem(getStorageKey(currentWorkspace.id));
          }
        }

        // No valid state found, start fresh
        // Small delay to ensure UI is rendered
        setTimeout(() => {
          startOnboarding(currentWorkspace.id);
        }, 500);
        
      } catch (error) {
        console.error('[Onboarding] Error checking onboarding status:', error);
      }
    };

    checkAndInitializeOnboarding();
  }, [currentWorkspace, user, workspaceLoading, location.pathname, loadFromStorage, saveToStorage, startOnboarding, state.active, state.workspaceId]);

  // Handle navigation based on current step
  useEffect(() => {
    if (!state.active || !state.workspaceId) {
      lastNavigatedStepRef.current = -1;
      return;
    }

    // Skip if we already navigated for this step
    if (lastNavigatedStepRef.current === state.step) {
      return;
    }

    const currentStepDef = onboardingSteps[state.step];
    if (!currentStepDef?.highlightTarget) return;

    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Debounce navigation to prevent rapid calls
    navigationTimeoutRef.current = setTimeout(() => {
      try {
        let targetPath: string | null = null;

        // Determine target path based on step
        if (state.step === 1 && currentStepDef.highlightTarget.includes('admin-tab')) {
          targetPath = '/admin/staff';
        } else if (state.step === 2 && (currentStepDef.highlightTarget.includes('admin-invite-button') || currentStepDef.highlightTarget.includes('admin-staff-tab'))) {
          targetPath = '/admin/staff';
        } else if (state.step === 3 && (currentStepDef.highlightTarget.includes('admin-pricing-add-items') || currentStepDef.highlightTarget.includes('admin-save-item-button') || currentStepDef.highlightTarget.includes('admin-pricing-tab'))) {
          targetPath = '/admin/pricing';
        } else if (state.step === 4 && currentStepDef.highlightTarget.includes('admin-workspace-setup-tab')) {
          targetPath = '/admin/workspacesetup';
        } else if (state.step === 5 && currentStepDef.highlightTarget.includes('admin-advanced-tab')) {
          targetPath = '/admin';
        } else if (state.step === 6 && currentStepDef.highlightTarget.includes('projects-tab')) {
          targetPath = '/projects';
        }

        // Only navigate if we have a target and we're not already there
        if (targetPath && location.pathname !== targetPath) {
          navigate(targetPath, { replace: true });
          lastNavigatedStepRef.current = state.step;
        } else if (targetPath && location.pathname === targetPath) {
          // Already at the target, just mark as navigated
          lastNavigatedStepRef.current = state.step;
        }
      } catch (error) {
        console.error('Navigation error during onboarding:', error);
      }
    }, 100); // 100ms debounce

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [state.step, state.active, state.workspaceId, navigate, location.pathname]);

  // Handle mobile sidebar opening for navigation steps
  useEffect(() => {
    if (!state.active || !state.workspaceId) {
      setMobileSidebarOpen(false);
      return;
    }

    const currentStepDef = onboardingSteps[state.step];
    if (!currentStepDef?.highlightTarget) {
      setMobileSidebarOpen(false);
      return;
    }

    // Steps that need the mobile sidebar open (navigation highlights)
    const needsSidebarSteps = [1, 6, 7]; // Steps 2, 7, 8 (admin-tab, projects-tab)
    
    if (needsSidebarSteps.includes(state.step)) {
      // Open drawer immediately to give maximum time for animation
      setMobileSidebarOpen(true);
    } else {
      setMobileSidebarOpen(false);
    }
  }, [state.step, state.active, state.workspaceId]);

  // Listen to storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!state.workspaceId) return;
      
      const key = getStorageKey(state.workspaceId);
      if (e.key === key && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          // If another tab completed onboarding, sync this tab
          if (newState.completed && state.active) {
            setState({
              active: false,
              step: 0,
              flow: "workspace",
              workspaceId: null,
            });
          }
        } catch (error) {
          console.error('Failed to sync onboarding state from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.workspaceId, state.active]);

  const value: OnboardingContextType = {
    state,
    startOnboarding,
    nextStep,
    previousStep,
    skipAll,
    completeOnboarding,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {/* Render modal inside provider */}
      {state.active && <OnboardingModal />}
      {children}
    </OnboardingContext.Provider>
  );
};
