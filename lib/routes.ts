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
  authLogout: "/api/auth/logout",
  authMe: "/api/auth/me",

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
  profileBadges: "/profile/badges",

  // Sprint 8F public Q&A tabs use search params, not sub-routes, because
  // /qa/[id] is the existing dynamic segment for individual answers.
  qaTab: (tab: string) => (tab === "suallar" ? "/qa" : `/qa?tab=${tab}`),

  // Sprint 8E admin/dealer routes.
  adminAds: "/admin/ads",
  adminInvoices: "/admin/invoices",
  adminPayments: "/admin/payments",
  adminMarketPulse: "/admin/market-pulse",
  dealerAdRequests: "/dealer/ad-requests",
  dealerInvoices: "/dealer/invoices",
  dealerPaymentProof: "/dealer/payment-proof",
} as const;

export const PROTECTED_ROUTE_PREFIXES = ["/profile"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function otpHref({
  purpose,
  next,
}: {
  purpose?: "lead_submit" | "whatsapp_handoff" | "profile_access";
  next?: string;
} = {}): string {
  const params = new URLSearchParams();
  if (purpose) params.set("purpose", purpose);
  if (next) params.set("next", next);
  const qs = params.toString();
  return qs ? `${ROUTES.authOtp}?${qs}` : ROUTES.authOtp;
}
