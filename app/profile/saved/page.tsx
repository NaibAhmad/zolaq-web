"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { ApiError, apiGet } from "@/lib/api";
import { ROUTES, otpHref } from "@/lib/routes";
import type { SavedCarWithTrim } from "@/lib/decisions/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; saved: SavedCarWithTrim[] };

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function ProfileSavedPage() {
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ saved: SavedCarWithTrim[] }>("/api/profile/saved")
      .then((data) => {
        if (!cancelled) setState({ status: "ready", saved: data.saved });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({ purpose: "profile_access", next: ROUTES.profileSaved })
          );
          return;
        }
        if (err instanceof ApiError) {
          setState({ status: "error", message: err.message, code: err.code });
          return;
        }
        const message = err instanceof Error ? err.message : "Şəbəkə xətası";
        setState({ status: "error", message, code: "NETWORK" });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, router]);

  if (state.status === "loading") {
    return <LoadingState label="Saxlanılan maşınlar yüklənir…" />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Saxlanılan maşınlar yüklənmədi"
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }
  if (state.saved.length === 0) {
    return (
      <EmptyState
        title="Hələ saxlanılan maşın yoxdur"
        note="Maşına baxarkən onu saxla — sonra burada müqayisə üçün toplayacaqsan."
        action={
          <Link
            href={ROUTES.cars}
            className="inline-flex items-center justify-center rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-accent-orange-fg hover:opacity-90"
          >
            Maşınlara bax
          </Link>
        }
      />
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Saxlanılan maşınlar
        </h1>
        <p className="text-sm text-foreground-muted">
          Müqayisə üçün topladığın maşınlar.
        </p>
      </header>
      <ul className="space-y-3">
        {state.saved.map((item) => (
          <li key={item.saved_id}>
            <Link
              href={ROUTES.car(item.trim_id)}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface-elevated p-4 hover:bg-surface md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.trim.brand_name} · {item.trim.model_name}
                </p>
                <p className="truncate text-xs text-foreground-muted">
                  {item.trim.display_name} · {item.trim.year}
                </p>
              </div>
              <time
                dateTime={new Date(item.created_at).toISOString()}
                className="text-xs text-foreground-muted"
              >
                {DATE_FMT.format(item.created_at)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
