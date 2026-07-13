// Temporary product switch. Keep these routes unavailable until the features are ready to return.
export const DISABLED_DASHBOARD_ROUTES = ['/dashboard/discussion', '/dashboard/study-groups'] as const;

export function isDisabledDashboardRoute(pathname: string) {
  return DISABLED_DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
