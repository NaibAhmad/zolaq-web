"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiPost } from "@/lib/api";
import { ROUTES, otpHref } from "@/lib/routes";
import {
  isLeadSourceSurface,
  isPreferredContact,
  type Lead,
  type LeadSourceSurface,
  type PreferredContact,
} from "@/lib/leads/types";

type Props = {
  trimId: string;
  sourceSurface: LeadSourceSurface;
};

type FormFields = {
  name: string;
  phone: string;
  preferred_contact: PreferredContact;
  note: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

const PENDING_KEY = "zlq.pending_lead";
const PENDING_TTL_MS = 10 * 60 * 1000;

type PendingPayload = {
  trim_id: string;
  source_surface: LeadSourceSurface;
  name?: string;
  preferred_contact?: PreferredContact;
  note?: string;
  expires_at: number;
};

function readPending(): PendingPayload | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingPayload>;
    if (
      typeof parsed.trim_id !== "string" ||
      !isLeadSourceSurface(parsed.source_surface) ||
      typeof parsed.expires_at !== "number"
    ) {
      return null;
    }
    if (parsed.expires_at <= Date.now()) return null;
    return {
      trim_id: parsed.trim_id,
      source_surface: parsed.source_surface,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      preferred_contact: isPreferredContact(parsed.preferred_contact)
        ? parsed.preferred_contact
        : undefined,
      note: typeof parsed.note === "string" ? parsed.note : undefined,
      expires_at: parsed.expires_at,
    };
  } catch {
    return null;
  }
}

function clearPending() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_KEY);
}

export function LeadFormLauncher({ trimId, sourceSurface }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<FormFields>({
    name: "",
    phone: "",
    preferred_contact: "phone",
    note: "",
  });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const submitLead = useCallback(
    async (payload: {
      trim_id: string;
      source_surface: LeadSourceSurface;
      name?: string;
      preferred_contact?: PreferredContact;
      note?: string;
    }): Promise<{ ok: true; leadId: string } | { ok: false; status: number; message: string }> => {
      try {
        const res = await apiPost<{ lead: Lead }>("/api/leads", payload);
        return { ok: true, leadId: res.lead.lead_id };
      } catch (err) {
        if (err instanceof ApiError) {
          return { ok: false, status: err.status, message: err.message };
        }
        const message = err instanceof Error ? err.message : "Şəbəkə xətası";
        return { ok: false, status: 0, message };
      }
    },
    []
  );

  // Post-OTP auto-submit: when arriving back with ?lead_post_otp=1 and a
  // pending payload in sessionStorage, replay the submission.
  useEffect(() => {
    if (searchParams.get("lead_post_otp") !== "1") return;
    let cancelled = false;
    void (async () => {
      const pending = readPending();
      if (!pending) {
        if (!cancelled) router.replace(pathname);
        return;
      }
      if (cancelled) return;
      setOpen(true);
      setSubmitState({ status: "submitting" });
      const result = await submitLead({
        trim_id: pending.trim_id,
        source_surface: pending.source_surface,
        name: pending.name,
        preferred_contact: pending.preferred_contact,
        note: pending.note,
      });
      if (cancelled) return;
      clearPending();
      if (result.ok) {
        router.replace(ROUTES.profileLead(result.leadId));
        return;
      }
      router.replace(pathname);
      setSubmitState({
        status: "error",
        message: result.message || "Sorğu göndərmək alınmadı.",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, searchParams, submitLead]);

  useEffect(() => {
    if (open && submitState.status !== "submitting") {
      nameInputRef.current?.focus();
    }
  }, [open, submitState.status]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && submitState.status !== "submitting") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitState.status]);

  function resetForm() {
    setFields({ name: "", phone: "", preferred_contact: "phone", note: "" });
    setSubmitState({ status: "idle" });
  }

  function closeModal() {
    if (submitState.status === "submitting") return;
    setOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = fields.name.trim();
    if (name.length === 0) {
      setSubmitState({ status: "error", message: "Ad tələb olunur." });
      return;
    }
    setSubmitState({ status: "submitting" });

    const payload = {
      trim_id: trimId,
      source_surface: sourceSurface,
      name,
      preferred_contact: fields.preferred_contact,
      note: fields.note.trim() || undefined,
    };

    const result = await submitLead(payload);
    if (result.ok) {
      setOpen(false);
      router.push(ROUTES.profileLead(result.leadId));
      return;
    }

    if (result.status === 401) {
      // Guest path: stash payload + bounce to OTP. Phone is collected by OTP.
      const pending: PendingPayload = {
        trim_id: trimId,
        source_surface: sourceSurface,
        name,
        preferred_contact: fields.preferred_contact,
        note: payload.note,
        expires_at: Date.now() + PENDING_TTL_MS,
      };
      try {
        window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      } catch {
        /* sessionStorage unavailable; let OTP still proceed */
      }
      const next = `${pathname}?lead_post_otp=1`;
      router.push(otpHref({ purpose: "lead_submit", next }));
      return;
    }

    setSubmitState({
      status: "error",
      message: result.message || "Sorğu göndərmək alınmadı.",
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        className="inline-flex items-center justify-center rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-accent-orange-fg transition-opacity hover:opacity-90"
      >
        Rəsmi qiymət istə
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-form-title"
            className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2
                id="lead-form-title"
                className="text-lg font-semibold text-foreground"
              >
                Rəsmi qiymət istə
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitState.status === "submitting"}
                className="rounded-md p-1 text-foreground-muted hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Bağla"
              >
                ×
              </button>
            </div>

            {submitState.status === "submitting" ? (
              <p className="py-6 text-center text-sm text-foreground-muted">
                Sorğun göndərilir…
              </p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-foreground"
                    htmlFor="lead-name"
                  >
                    Ad
                  </label>
                  <input
                    id="lead-name"
                    ref={nameInputRef}
                    type="text"
                    required
                    maxLength={80}
                    value={fields.name}
                    onChange={(e) =>
                      setFields((s) => ({ ...s, name: e.target.value }))
                    }
                    className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-foreground outline-none focus:border-brand"
                  />
                </div>

                <fieldset>
                  <legend className="mb-1 block text-sm font-medium text-foreground">
                    Əlaqə üsulu
                  </legend>
                  <div className="flex gap-4 text-sm text-foreground">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="preferred_contact"
                        value="phone"
                        checked={fields.preferred_contact === "phone"}
                        onChange={() =>
                          setFields((s) => ({ ...s, preferred_contact: "phone" }))
                        }
                      />
                      Zəng
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="preferred_contact"
                        value="whatsapp"
                        checked={fields.preferred_contact === "whatsapp"}
                        onChange={() =>
                          setFields((s) => ({
                            ...s,
                            preferred_contact: "whatsapp",
                          }))
                        }
                      />
                      WhatsApp
                    </label>
                  </div>
                </fieldset>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-foreground"
                    htmlFor="lead-note"
                  >
                    Qeyd <span className="text-foreground-muted">(istəyə bağlı)</span>
                  </label>
                  <textarea
                    id="lead-note"
                    rows={3}
                    maxLength={500}
                    value={fields.note}
                    onChange={(e) =>
                      setFields((s) => ({ ...s, note: e.target.value }))
                    }
                    className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-foreground outline-none focus:border-brand"
                  />
                </div>

                <p className="text-xs text-foreground-muted">
                  Sorğunu təsdiqləmək üçün telefon nömrəni növbəti addımda
                  yoxlayacağıq.
                </p>

                {submitState.status === "error" ? (
                  <p role="alert" className="text-sm text-danger">
                    {submitState.message}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated"
                  >
                    İmtina
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-accent-orange-fg hover:opacity-90"
                  >
                    Sorğu göndər
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
