"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OTP } from "@/lib/auth/constants";
import { useT } from "@/lib/i18n/client";

type LockReason = "max_attempts" | "expired" | "rate_limited" | "session_lost";

type OtpStatus =
  | "idle"
  | "requesting"
  | "verifying"
  | "error"
  | "locked";

type Props = {
  phone: string;
  otpSessionId: string;
  initialResendCountdown: number;
  onSessionReplaced: (next: { otpSessionId: string; resendCountdown: number }) => void;
  onVerified: () => void;
  onChangePhone: () => void;
  onBusyChange?: (busy: boolean) => void;
};

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export function LeadOtpStep({
  phone,
  otpSessionId,
  initialResendCountdown,
  onSessionReplaced,
  onVerified,
  onChangePhone,
  onBusyChange,
}: Props) {
  const t = useT();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [resendCountdown, setResendCountdown] = useState(initialResendCountdown);
  const [message, setMessage] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState<LockReason | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const onBusyChangeRef = useRef(onBusyChange);
  useEffect(() => {
    onBusyChangeRef.current = onBusyChange;
  });

  useEffect(() => {
    onBusyChangeRef.current?.(
      status === "requesting" || status === "verifying",
    );
  }, [status]);

  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => {
      setResendCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  const resend = useCallback(async () => {
    if (status === "requesting" || status === "verifying") return;
    setStatus("requesting");
    setMessage(null);
    const { ok, status: httpStatus, data } = await postJson<{
      otp_session_id?: string;
      resend_after_seconds?: number;
      error?: { code: string; message: string; details?: Record<string, unknown> };
    }>("/api/auth/otp/request", { phone, purpose: "lead_submit" });

    if (!ok) {
      if (httpStatus === 429) {
        const retry =
          (data.error?.details?.retry_after_seconds as number | undefined) ?? null;
        setStatus("locked");
        setLockReason("rate_limited");
        setRetryAfterSeconds(retry);
        setMessage(data.error?.message ?? t("auth.hourlyLimitExceeded"));
        return;
      }
      setStatus("idle");
      setMessage(data.error?.message ?? t("auth.requestFailed"));
      return;
    }

    if (data.otp_session_id) {
      onSessionReplaced({
        otpSessionId: data.otp_session_id,
        resendCountdown: data.resend_after_seconds ?? OTP.RESEND_COOLDOWN_SECONDS,
      });
    }
    setCode("");
    setResendCountdown(data.resend_after_seconds ?? OTP.RESEND_COOLDOWN_SECONDS);
    setStatus("idle");
    setMessage(null);
  }, [phone, status, onSessionReplaced, t]);

  const verify = useCallback(async () => {
    if (code.length !== OTP.CODE_LENGTH) return;
    setStatus("verifying");
    setMessage(null);
    const { ok, status: httpStatus, data } = await postJson<{
      verified?: boolean;
      attempts_remaining?: number;
      error?: { code: string; message: string; details?: Record<string, unknown> };
    }>("/api/auth/otp/verify", {
      otp_session_id: otpSessionId,
      code,
    });

    if (ok && data.verified) {
      onVerified();
      return;
    }

    if (httpStatus === 400 && data.verified === false) {
      const remaining = data.attempts_remaining ?? 0;
      setStatus("error");
      setCode("");
      setMessage(t("auth.codeInvalidRemaining", { remaining }));
      return;
    }

    const errCode = data.error?.code;
    if (errCode === "LOCKED" || errCode === "EXPIRED" || httpStatus === 404) {
      const reason: LockReason =
        errCode === "EXPIRED"
          ? "expired"
          : errCode === "LOCKED"
            ? "max_attempts"
            : "session_lost";
      setStatus("locked");
      setLockReason(reason);
      setMessage(data.error?.message ?? t("auth.sessionClosed"));
      return;
    }

    setStatus("error");
    setMessage(data.error?.message ?? t("auth.verificationFailed"));
  }, [code, otpSessionId, onVerified, t]);

  const isLocked = status === "locked";
  const resendDisabled =
    resendCountdown > 0 ||
    status === "requesting" ||
    status === "verifying" ||
    isLocked;

  if (isLocked) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground-muted">
          {t("auth.codeSentTo")} <span className="font-medium text-foreground">{phone}</span>
        </p>
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {lockReason === "expired" && t("auth.lockedExpired")}
          {lockReason === "max_attempts" && t("auth.lockedMaxAttempts")}
          {lockReason === "rate_limited" &&
            (retryAfterSeconds
              ? t("auth.lockedRateLimitedRetry", { seconds: retryAfterSeconds })
              : t("auth.lockedRateLimitedHourly"))}
          {lockReason === "session_lost" && t("auth.lockedSessionLost")}
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onChangePhone}>
            {t("auth.changePhone")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void verify();
      }}
    >
      <p className="text-sm text-foreground-muted">
        {t("auth.codeSentTo")}{" "}
        <span className="font-medium text-foreground">{phone}</span>
      </p>
      <Input
        id="lead-otp-code"
        ref={codeInputRef}
        label={t("auth.codeLengthLabel")}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={OTP.CODE_LENGTH}
        pattern="\d{6}"
        value={code}
        disabled={status === "verifying"}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, OTP.CODE_LENGTH);
          setCode(next);
          if (status === "error") {
            setStatus("idle");
            setMessage(null);
          }
        }}
        aria-invalid={status === "error"}
        inputClassName="h-12 font-mono tracking-[0.5em] text-center text-xl"
      />

      {message ? (
        <p
          role="alert"
          className={
            status === "error"
              ? "rounded-[var(--radius)] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
              : "text-sm text-foreground-muted"
          }
        >
          {message}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={resendDisabled}
          onClick={() => void resend()}
          className="text-accent-blue underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-foreground-muted disabled:no-underline"
        >
          {resendCountdown > 0
            ? t("auth.resendCountdown", { seconds: resendCountdown })
            : t("auth.resendCode")}
        </button>
        <button
          type="button"
          onClick={onChangePhone}
          disabled={status === "verifying" || status === "requesting"}
          className="text-foreground-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("auth.changePhone")}
        </button>
      </div>

      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={code.length !== OTP.CODE_LENGTH || status === "verifying"}
        >
          {status === "verifying" ? t("auth.verifying") : t("auth.verify")}
        </Button>
      </div>
    </form>
  );
}
