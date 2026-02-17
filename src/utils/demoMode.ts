import { toast } from 'sonner';

/**
 * Detects if the app is running in demo mode
 * Demo mode is enabled when:
 * - VITE_APP_MODE === "demo" OR
 * - window.location.hostname starts with "demo."
 */
export const isDemoMode = (): boolean => {
  if (import.meta.env.VITE_APP_MODE === "demo") return true;
  if (typeof window !== "undefined" && window.location.hostname.startsWith("demo.")) {
    return true;
  }
  return false;
};

/**
 * Prevents write actions in demo mode
 * Shows a toast and returns true if action should be blocked
 * @param actionName Optional name of the action being blocked (for debugging)
 * @returns true if action should be blocked, false otherwise
 */
export const blockDemoWrite = (actionName?: string): boolean => {
  if (!isDemoMode()) return false;
  
  toast.error("Demo mode is read-only. Changes are not saved.");
  return true;
};

