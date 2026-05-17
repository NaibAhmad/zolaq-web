"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Sprint 9F: shared real-password form for /admin/login and /dealer/login.
// Posts JSON to the chosen endpoint and follows up with a hard redirect on
// success so the new HttpOnly session cookie is picked up by the server.

type Props = {
  panel: "admin" | "dealer";
  endpoint: string;
  redirectTo?: string;
};

const PANEL_TITLE: Record<Props["panel"], string> = {
  admin: "Zolaq Admin paneli",
  dealer: "Zolaq Diler paneli",
};

const DEFAULT_REDIRECT: Record<Props["panel"], string> = {
  admin: "/admin/dashboard",
  dealer: "/dealer/dashboard",
};

export function PasswordSignInForm({ panel, endpoint, redirectTo }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password, redirect_to: redirectTo }),
      });
      if (res.ok) {
        const next = redirectTo && redirectTo.startsWith("/")
          ? redirectTo
          : DEFAULT_REDIRECT[panel];
        window.location.assign(next);
        return;
      }
      if (res.status === 503) {
        setError("Giriş xidməti hazırda əlçatan deyil.");
      } else if (res.status === 423) {
        setError("Çox sayda uğursuz cəhd. Bir az sonra yenidən cəhd edin.");
      } else {
        setError("Etibarsız giriş məlumatları.");
      }
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6"
      noValidate
    >
      <h2 className="text-base font-semibold">{PANEL_TITLE[panel]}</h2>
      <Input
        type="email"
        name="email"
        autoComplete="email"
        label="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
      />
      <Input
        type="password"
        name="password"
        autoComplete="current-password"
        label="Şifrə"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
        error={error ?? undefined}
      />
      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? "Giriş..." : "Daxil ol"}
      </Button>
    </form>
  );
}
