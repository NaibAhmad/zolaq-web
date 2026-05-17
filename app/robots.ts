import type { MetadataRoute } from "next";

// Sprint 10B: env-aware robots policy.
// When STAGING_NO_INDEX=true (set on Vercel staging environment), emit a
// deny-all policy. Otherwise emit a permissive policy suitable for future
// public launch on the production host. The proxy.ts Proxy also attaches
// X-Robots-Tag: noindex,nofollow,noarchive on staging — defense in depth.

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const stagingNoIndex = process.env.STAGING_NO_INDEX === "true";

  if (stagingNoIndex) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dealer/", "/api/", "/profile/", "/auth/"],
    },
  };
}
