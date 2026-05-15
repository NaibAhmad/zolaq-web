// Canonical MVP routes. Source of truth: docs/reference Step 6 v2 ROUTES_FINAL.md.
// Public `carId` is an alias for canonical `trim_id` in backend, DB, API, analytics.

export const ROUTES = {
  home: "/",

  cars: "/cars",
  car: (carId: string) => `/cars/${carId}`,

  compare: "/compare",
  compareWith: (ids: string[]) => `/compare?ids=${ids.join(",")}`,

  dealers: "/dealers",
  dealer: (dealerId: string) => `/dealers/${dealerId}`,

  news: "/news",
  newsItem: (slug: string) => `/news/${slug}`,

  encyclopedia: "/encyclopedia",
  encyclopediaItem: (slug: string) => `/encyclopedia/${slug}`,

  qa: "/qa",
  qaItem: (id: string) => `/qa/${id}`,

  authOtp: "/auth/otp",

  profile: "/profile",
  profileHistory: "/profile/history",
  profileSaved: "/profile/saved",
  profileViewed: "/profile/viewed",
  profileLeads: "/profile/leads",
  profileLead: (leadId: string) => `/profile/leads/${leadId}`,
  profileLeadTestDrive: (leadId: string) => `/profile/leads/${leadId}/test-drive`,
  profileLeadWhatsapp: (leadId: string) => `/profile/leads/${leadId}/whatsapp`,
  profileDecisions: "/profile/decisions",
  profileDecision: (decisionId: string) => `/profile/decisions/${decisionId}`,
} as const;

export const PROTECTED_ROUTE_PREFIXES = ["/profile"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
