"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Section } from "@/components/ui/Section";
import { OTP, isOtpPurpose, type OtpPurpose } from "@/lib/auth/constants";
import { ROUTES } from "@/lib/routes";

type Status =
  | "idle"
  | "requesting"
  | "code_sent"
  | "verifying"
  | "verified"
  | "error"
  | "locked";

type LockReason = "max_attempts" | "expired" | "rate_limited" | "session_lost";

type UiState = {
  status: Status;
  otpSessionId: string | null;
  phone: string;
  code: string;
  attemptsRemaining: number;
  resendCountdown: number;
  message: string | null;
  lockReason: LockReason | null;
  retryAfterSeconds: number | null;
};

const INITIAL: UiState = {
  status: "idle",
  otpSessionId: null,
  phone: "",
  code: "",
  attemptsRemaining: OTP.MAX_ATTEMPTS,
  resendCountdown: 0,
  message: null,
  lockReason: null,
  retryAfterSeconds: null,
};

function sanitizeNext(next: string | null, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

async function postJson<T>(url: string, body: unknown): Promise<{
  ok: boolean;
  status: number;
  data: T;
}> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export function OtpForm() {
  const router = useRouter();
  const params = useSearchParams();

  const purpose: OtpPurpose = useMemo(() => {
    const p = params.get("purpose");
    return isOtpPurpose(p) ? p : "profile_access";
  }, [params]);

  const nextUrl = useMemo(
    () => sanitizeNext(params.get("next"), ROUTES.profile),
    [params],
  );

  const [state, setState] = useState<UiState>(INITIAL);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (state.resendCountdown <= 0) return;
    const t = setInterval(() => {
      setState((s) =>
        s.resendCountdown > 0
          ? { ...s, resendCountdown: s.resendCountdown - 1 }
          : s,
      );
    }, 1000);
    return () => clearInterval(t);
  }, [state.resendCountdown]);

  useEffect(() => {
    if (state.status === "code_sent") codeInputRef.current?.focus();
  }, [state.status]);

  async function requestCode() {
    setState((s) => ({ ...s, status: "requesting", message: null }));
    const { ok, status, data } = await postJson<{
      otp_session_id?: string;
      expires_in_seconds?: number;
      resend_after_seconds?: number;
      error?: { code: string; message: string; details?: Record<string, unknown> };
    }>("/api/auth/otp/request", { phone: state.phone, purpose });

    if (!ok) {
      if (status === 429) {
        const retry =
          (data.error?.details?.retry_after_seconds as number | undefined) ?? null;
        setState((s) => ({
          ...s,
          status: "locked",
          lockReason: "rate_limited",
          retryAfterSeconds: retry,
          message: data.error?.message ?? "Saatlıq OTP limiti aşılıb.",
        }));
        return;
      }
      setState((s) => ({
        ...s,
        status: "idle",
        message: data.error?.message ?? "Sorğu uğursuz oldu.",
      }));
      return;
    }

    setState((s) => ({
      ...s,
      status: "code_sent",
      otpSessionId: data.otp_session_id ?? null,
      attemptsRemaining: OTP.MAX_ATTEMPTS,
      resendCountdown: data.resend_after_seconds ?? OTP.RESEND_COOLDOWN_SECONDS,
      code: "",
      message: null,
      lockReason: null,
      retryAfterSeconds: null,
    }));
  }

  async function verifyCode() {
    if (!state.otpSessionId) return;
    setState((s) => ({ ...s, status: "verifying", message: null }));
    const { ok, status, data } = await postJson<{
      verified?: boolean;
      attempts_remaining?: number;
      user_id?: string;
      error?: { code: string; message: string; details?: Record<string, unknown> };
    }>("/api/auth/otp/verify", {
      otp_session_id: state.otpSessionId,
      code: state.code,
    });

    if (ok && data.verified) {
      setState((s) => ({ ...s, status: "verified", message: "Təsdiqləndi" }));
      router.replace(nextUrl);
      return;
    }

    if (status === 400 && data.verified === false) {
      const remaining = data.attempts_remaining ?? 0;
      setState((s) => ({
        ...s,
        status: "error",
        attemptsRemaining: remaining,
        message: `Kod yanlışdır — qalan cəhd: ${remaining}`,
        code: "",
      }));
      return;
    }

    const code = data.error?.code;
    if (code === "LOCKED" || code === "EXPIRED" || status === 404) {
      const reason: LockReason =
        code === "EXPIRED"
          ? "expired"
          : code === "LOCKED"
            ? "max_attempts"
            : "session_lost";
      setState((s) => ({
        ...s,
        status: "locked",
        lockReason: reason,
        message: data.error?.message ?? "Sessiya bağlandı.",
      }));
      return;
    }

    setState((s) => ({
      ...s,
      status: "error",
      message: data.error?.message ?? "Yoxlama uğursuz oldu.",
    }));
  }

  function reset() {
    setState(INITIAL);
  }

  const isPhoneStage =
    state.status === "idle" || state.status === "requesting";
  const isLocked = state.status === "locked";
  const resendDisabled =
    state.resendCountdown > 0 ||
    state.status === "requesting" ||
    state.status === "verifying" ||
    isLocked;

  const purposeCopy =
    purpose === "lead_submit"
      ? "Sorğunu tamamlamaq üçün telefon nömrəni təsdiqlə."
      : purpose === "whatsapp_handoff"
        ? "WhatsApp keçidini davam etdirmək üçün təsdiq."
        : "Profilə daxil olmaq üçün təsdiq.";

  return (
    <Section tone="light" padding="lg">
      <Container className="max-w-md">
        <Card padding="lg" tone="raised">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
            Zolaq OTP
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Telefon təsdiqi
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">{purposeCopy}</p>

          {isPhoneStage && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (state.status !== "idle") return;
                if (!state.phone.trim()) return;
                void requestCode();
              }}
            >
              <Input
                id="otp-phone"
                label="Telefon nömrəsi"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+994501234567"
                value={state.phone}
                disabled={state.status === "requesting"}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    phone: e.target.value,
                    message: null,
                  }))
                }
                inputClassName="h-12 text-base"
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={state.status === "requesting" || !state.phone.trim()}
              >
                {state.status === "requesting" ? "Kod göndərilir…" : "Kod göndər"}
              </Button>
              {state.message ? (
                <p className="rounded-[var(--radius)] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                  {state.message}
                </p>
              ) : null}
            </form>
          )}

          {(state.status === "code_sent" ||
            state.status === "verifying" ||
            state.status === "error") && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (state.code.length !== OTP.CODE_LENGTH) return;
                void verifyCode();
              }}
            >
              <p className="text-sm text-foreground-muted">
                Kod göndərildi:{" "}
                <span className="font-medium text-foreground">{state.phone}</span>
              </p>
              <Input
                id="otp-code"
                ref={codeInputRef}
                label="6 rəqəmli kod"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP.CODE_LENGTH}
                pattern="\d{6}"
                value={state.code}
                disabled={state.status === "verifying"}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    code: e.target.value
                      .replace(/\D/g, "")
                      .slice(0, OTP.CODE_LENGTH),
                    message: s.status === "error" ? null : s.message,
                    status: s.status === "error" ? "code_sent" : s.status,
                  }))
                }
                aria-invalid={state.status === "error"}
                inputClassName="h-12 font-mono tracking-[0.5em] text-center text-xl"
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={
                  state.status === "verifying" ||
                  state.code.length !== OTP.CODE_LENGTH
                }
              >
                {state.status === "verifying" ? "Yoxlanılır…" : "Təsdiqlə"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  disabled={resendDisabled}
                  onClick={() => void requestCode()}
                  className="text-accent-blue underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-foreground-muted disabled:no-underline"
                >
                  {state.resendCountdown > 0
                    ? `Yenidən göndər (${state.resendCountdown}s)`
                    : "Kodu yenidən göndər"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="text-foreground-muted hover:text-foreground"
                >
                  Telefonu dəyiş
                </button>
              </div>
              {state.message ? (
                <p
                  role="alert"
                  className={
                    state.status === "error"
                      ? "rounded-[var(--radius)] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
                      : "text-sm text-foreground-muted"
                  }
                >
                  {state.message}
                </p>
              ) : null}
            </form>
          )}

          {state.status === "verified" && (
            <div className="mt-6 rounded-[var(--radius)] border border-success/30 bg-success/10 px-4 py-3 text-success">
              Təsdiqləndi — yönləndirilirsiniz…
            </div>
          )}

          {isLocked && (
            <div className="mt-6 space-y-4">
              <div
                role="alert"
                className="rounded-[var(--radius)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
              >
                {state.lockReason === "expired" && "Kodun müddəti bitdi."}
                {state.lockReason === "max_attempts" &&
                  "Maksimum cəhd sayına çatdınız."}
                {state.lockReason === "rate_limited" &&
                  `Saatlıq limit aşılıb${
                    state.retryAfterSeconds
                      ? ` — ${state.retryAfterSeconds} saniyə sonra yenidən cəhd edin.`
                      : "."
                  }`}
                {state.lockReason === "session_lost" && "Sessiya tapılmadı."}
              </div>
              <Button variant="secondary" fullWidth onClick={reset}>
                Yenidən başla
              </Button>
            </div>
          )}
        </Card>
      </Container>
    </Section>
  );
}
