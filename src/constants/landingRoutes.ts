/**
 * Landing routes where authenticated users should NOT be redirected to the app.
 * When a logged-in user visits any of these paths, they see the landing content
 * instead of being sent to the dashboard.
 */
export const LANDING_ROUTES_NO_REDIRECT: readonly string[] = [
  "/",
  "/product/galaxy-of-features",
  "/pricing",
  "/updates",
  "/about",
  "/team",
  "/support",
  "/terms",
  "/privacy",
  "/documentation",
  "/video-tutorials",
];

export function isLandingRouteNoRedirect(pathname: string): boolean {
  return LANDING_ROUTES_NO_REDIRECT.includes(pathname);
}
