"use client";

// Sprint 1 verification artifact: exercises `lib/api.ts` end-to-end against
// `/api/auth/me` and demonstrates LoadingState / ErrorState. Delete when
// Sprint 5 fills in the real Decision Center on `/profile`.

import { useEffect, useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import { LoadingState } from "@/components/state/LoadingState";
import { ErrorState } from "@/components/state/ErrorState";
import { useT } from "@/lib/i18n/client";

type Me = {
  user_id: string;
  phone_hash: string;
  verified_at: number;
  purpose: string;
};

export function SessionProbe() {
  const t = useT();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<Me>("/api/auth/me")
      .then((r) => {
        if (cancelled) return;
        setMe(r);
        setPending(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", t("errors.unknown")));
        setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, t]);

  function retry() {
    setError(null);
    setMe(null);
    setPending(true);
    setReloadKey((k) => k + 1);
  }

  if (pending) return <LoadingState />;

  if (error) {
    return (
      <ErrorState
        message={error.message}
        code={error.code}
        onRetry={retry}
      />
    );
  }

  if (!me) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-12 text-sm text-foreground-muted">
      <p className="font-medium text-foreground">Probe — /api/auth/me OK</p>
      <p>
        user_id:{" "}
        <span className="font-mono text-foreground">{me.user_id}</span>
      </p>
      <p>
        purpose:{" "}
        <span className="font-mono text-foreground">{me.purpose}</span>
      </p>
    </div>
  );
}
