"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { LeadOtpStep } from "@/components/leads/LeadOtpStep";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { OTP } from "@/lib/auth/constants";
import { useT } from "@/lib/i18n/client";
import { ROUTES } from "@/lib/routes";
import {
  type Lead,
  type LeadSourceSurface,
  type PreferredContact,
} from "@/lib/leads/types";
import { trackEvent } from "@/lib/tracking/track";

type LeadIntent = "price_request" | "test_drive";

type Props = {
  trimId: string;
  sourceSurface: LeadSourceSurface;
  intent?: LeadIntent;
};

type FormFields = {
  name: string;
  phone: string;
  preferred_contact: PreferredContact;
  note: string;
};

type FlowState =
  | { kind: "form"; error: string | null }
  | { kind: "requesting_otp" }
  | { kind: "otp"; otpSessionId: string; resendCountdown: number; otpBusy: boolean }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

const E164_RE = /^\+[1-9]\d{8,14}$/;
function normalizePhoneClient(input: string): string | null {
  const cleaned = input.replace(/[\s\-()]/g, "");
  return E164_RE.test(cleaned) ? cleaned : null;
}

async function submitLead(
  payload: {
    trim_id: string;
    source_surface: LeadSourceSurface;
    name?: string;
    preferred_contact?: PreferredContact;
    note?: string;
  },
  networkErrorFallback: string,
): Promise<
  { ok: true; leadId: string } | { ok: false; status: number; message: string }
> {
  try {
    const res = await apiPost<{ lead: Lead }>("/api/leads", payload);
    return { ok: true, leadId: res.lead.lead_id };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, status: err.status, message: err.message };
    }
    const message = err instanceof Error ? err.message : networkErrorFallback;
    return { ok: false, status: 0, message };
  }
}

export function LeadFormLauncher({
  trimId,
  sourceSurface,
  intent = "price_request",
}: Props) {
  const router = useRouter();
  const t = useT();
  const isTestDrive = intent === "test_drive";

  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<FormFields>({
    name: "",
    phone: "",
    preferred_contact: "phone",
    note: "",
  });
  const [flow, setFlow] = useState<FlowState>({ kind: "form", error: null });
  const [verified, setVerified] = useState<boolean | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiGet<{ verified_at?: number | null }>(
          ROUTES.authMe,
        );
        if (cancelled) return;
        setVerified(typeof me.verified_at === "number");
      } catch {
        if (cancelled) return;
        setVerified(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open && flow.kind === "form") {
      nameInputRef.current?.focus();
    }
  }, [open, flow.kind]);

  const resetAll = useCallback(() => {
    setFields({ name: "", phone: "", preferred_contact: "phone", note: "" });
    setFlow({ kind: "form", error: null });
    setVerified(null);
  }, []);

  const isBusy =
    flow.kind === "requesting_otp" ||
    flow.kind === "submitting" ||
    (flow.kind === "otp" && flow.otpBusy);

  function closeModal() {
    if (isBusy) return;
    setOpen(false);
    resetAll();
  }

  const buildLeadPayload = useCallback(
    () => {
      const baseNote = fields.note.trim();
      const testDrivePrefix = t("leads.testDrivePrefix");
      const note = isTestDrive
        ? baseNote
          ? `${testDrivePrefix} ${baseNote}`
          : testDrivePrefix
        : baseNote || undefined;
      return {
        trim_id: trimId,
        source_surface: sourceSurface,
        name: fields.name.trim(),
        preferred_contact: fields.preferred_contact,
        note,
      };
    },
    [trimId, sourceSurface, fields, isTestDrive, t],
  );

  const finalizeLead = useCallback(async () => {
    setFlow({ kind: "submitting" });
    const payload = buildLeadPayload();
    const result = await submitLead(payload, t("leads.networkError"));
    if (result.ok) {
      trackEvent("lead_form_submitted", {
        lead_id: result.leadId,
        trim_id: trimId,
      });
      setOpen(false);
      resetAll();
      router.push(ROUTES.profileLead(result.leadId));
      return;
    }
    setFlow({
      kind: "error",
      message: result.message || t("leads.submitError"),
    });
  }, [buildLeadPayload, resetAll, router, trimId, t]);

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = fields.name.trim();
    if (name.length === 0) {
      setFlow({ kind: "form", error: t("leads.nameRequired") });
      return;
    }

    if (verified) {
      await finalizeLead();
      return;
    }

    const normalizedPhone = normalizePhoneClient(fields.phone);
    if (!normalizedPhone) {
      setFlow({ kind: "form", error: t("leads.phoneFormatError") });
      return;
    }

    setFlow({ kind: "requesting_otp" });
    try {
      const res = await apiPost<{
        otp_session_id: string;
        resend_after_seconds?: number;
      }>("/api/auth/otp/request", {
        phone: normalizedPhone,
        purpose: "lead_submit",
      });
      setFields((s) => ({ ...s, phone: normalizedPhone }));
      setFlow({
        kind: "otp",
        otpSessionId: res.otp_session_id,
        resendCountdown:
          res.resend_after_seconds ?? OTP.RESEND_COOLDOWN_SECONDS,
        otpBusy: false,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 429
            ? `${err.message}${
                typeof err.details.retry_after_seconds === "number"
                  ? ` — ${t("leads.retryAfter", { seconds: err.details.retry_after_seconds })}`
                  : ""
              }`
            : err.message
          : err instanceof Error
            ? err.message
            : t("leads.networkError");
      setFlow({ kind: "form", error: message });
    }
  }

  const validForm =
    fields.name.trim().length > 0 &&
    (verified === true || normalizePhoneClient(fields.phone) !== null);

  const submitButtonVariant =
    fields.preferred_contact === "whatsapp" ? "whatsapp" : "primary";

  const dismissible = !isBusy;

  const showOtp = flow.kind === "otp";
  const eyebrow = showOtp
    ? t("leads.otpEyebrow")
    : isTestDrive
      ? t("leads.testDriveEyebrow")
      : t("leads.quoteEyebrow");
  const title = showOtp
    ? t("leads.otpTitle")
    : isTestDrive
      ? t("leads.testDriveTitle")
      : t("leads.quoteTitle");

  const triggerVariant = isTestDrive ? "secondary" : "primary";
  const triggerLabel = isTestDrive
    ? t("actions.testDrive")
    : t("actions.officialQuote");

  return (
    <>
      <Button
        variant={triggerVariant}
        size="md"
        onClick={() => {
          resetAll();
          setOpen(true);
          trackEvent("lead_form_opened", {
            trim_id: trimId,
            surface: sourceSurface,
          });
        }}
      >
        {triggerLabel}
      </Button>

      <Modal
        open={open}
        onClose={closeModal}
        eyebrow={eyebrow}
        title={title}
        dismissible={dismissible}
      >
        {flow.kind === "submitting" || flow.kind === "requesting_otp" ? (
          <p className="py-6 text-center text-sm text-foreground-muted">
            {flow.kind === "requesting_otp"
              ? t("leads.codeSending")
              : t("leads.submitting")}
          </p>
        ) : flow.kind === "otp" ? (
          <LeadOtpStep
            phone={fields.phone}
            otpSessionId={flow.otpSessionId}
            initialResendCountdown={flow.resendCountdown}
            onSessionReplaced={({ otpSessionId, resendCountdown }) =>
              setFlow({
                kind: "otp",
                otpSessionId,
                resendCountdown,
                otpBusy: false,
              })
            }
            onBusyChange={(busy) =>
              setFlow((cur) => {
                if (cur.kind !== "otp" || cur.otpBusy === busy) return cur;
                return { ...cur, otpBusy: busy };
              })
            }
            onChangePhone={() => setFlow({ kind: "form", error: null })}
            onVerified={() => {
              void finalizeLead();
            }}
          />
        ) : (
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            {isTestDrive ? (
              <p className="rounded-[var(--radius)] border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
                {t("leads.testDriveBetaNote")}
              </p>
            ) : null}
            <Input
              id="lead-name"
              ref={nameInputRef}
              label={t("leads.nameLabel")}
              type="text"
              required
              maxLength={80}
              value={fields.name}
              onChange={(e) =>
                setFields((s) => ({ ...s, name: e.target.value }))
              }
            />

            {verified ? (
              <div className="rounded-[var(--radius)] border border-success/30 bg-success/5 px-3 py-2 text-sm text-foreground">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {t("leads.verifiedPhone")}
                </span>
                <span className="ml-2 font-medium">+994 ** *** ** **</span>
              </div>
            ) : (
              <Input
                id="lead-phone"
                label={t("leads.phoneLabel")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+994501234567"
                required
                value={fields.phone}
                onChange={(e) =>
                  setFields((s) => ({ ...s, phone: e.target.value }))
                }
              />
            )}

            <fieldset>
              <legend className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {t("leads.contactMethod")}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <ContactOption
                  checked={fields.preferred_contact === "phone"}
                  onChange={() =>
                    setFields((s) => ({ ...s, preferred_contact: "phone" }))
                  }
                  label={t("leads.contactPhone")}
                  icon="☎"
                />
                <ContactOption
                  checked={fields.preferred_contact === "whatsapp"}
                  onChange={() =>
                    setFields((s) => ({ ...s, preferred_contact: "whatsapp" }))
                  }
                  label={t("leads.contactWhatsapp")}
                  icon="✓"
                  accent="green"
                />
              </div>
            </fieldset>

            <Textarea
              id="lead-note"
              label={
                <>
                  {t("leads.noteLabel")}{" "}
                  <span className="lowercase opacity-70">
                    {t("leads.noteOptional")}
                  </span>
                </>
              }
              rows={3}
              maxLength={500}
              value={fields.note}
              onChange={(e) =>
                setFields((s) => ({ ...s, note: e.target.value }))
              }
            />

            {flow.kind === "form" && flow.error ? (
              <p
                role="alert"
                className="rounded-[var(--radius)] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
              >
                {flow.error}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                {t("leads.cancel")}
              </Button>
              <Button
                type="submit"
                variant={submitButtonVariant}
                disabled={!validForm}
              >
                {t("leads.submit")}
              </Button>
            </div>
          </form>
        )}

        {flow.kind === "error" ? (
          <div className="mt-4 space-y-3">
            <p
              role="alert"
              className="rounded-[var(--radius)] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
            >
              {flow.message}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFlow({ kind: "form", error: null })}
              >
                {t("leads.back")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function ContactOption({
  checked,
  onChange,
  label,
  icon,
  accent = "blue",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  icon: string;
  accent?: "blue" | "green";
}) {
  const activeRing =
    accent === "green"
      ? "border-accent-green ring-2 ring-accent-green/30"
      : "border-accent-blue ring-2 ring-accent-blue/20";
  const inactive = "border-border hover:border-foreground-muted";

  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border bg-surface px-3 py-2.5 text-sm font-medium transition-colors ${
        checked ? activeRing : inactive
      }`}
    >
      <input
        type="radio"
        name="preferred_contact"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span aria-hidden className="text-base">
        {icon}
      </span>
      <span>{label}</span>
    </label>
  );
}
