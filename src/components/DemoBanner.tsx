import { isDemoMode } from '@/utils/demoMode';

/**
 * Demo Banner Component
 * Displays a sticky banner at the top of the page in demo mode
 */
export function DemoBanner() {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-md">
      You are viewing a demo workspace — changes are not saved
    </div>
  );
}

