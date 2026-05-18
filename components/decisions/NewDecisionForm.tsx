"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ApiError, apiPost } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import type {
  Decision,
  SavedCarWithTrim,
} from "@/lib/decisions/types";

type Props = {
  saved: SavedCarWithTrim[];
  onCreated?: (decision: Decision) => void;
};

export function NewDecisionForm({ saved, onCreated }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [primaryTrimId, setPrimaryTrimId] = useState(
    saved[0]?.trim_id ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimOptions = useMemo(
    () =>
      saved.map((s) => ({
        value: s.trim_id,
        label: `${s.trim.brand_name} · ${s.trim.model_name} (${s.trim.year})`,
      })),
    [saved],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!primaryTrimId) {
      setError(t("profileDecisions.formNoSaved"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiPost<{ decision: Decision }>(
        "/api/profile/decisions",
        {
          primary_trim_id: primaryTrimId,
          candidate_trim_ids: saved.map((s) => s.trim_id),
          title: title.trim() || undefined,
        },
      );
      setTitle("");
      setOpen(false);
      onCreated?.(data.decision);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("profileDecisions.formCreateFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        {t("profileDecisions.newDecision")}
      </Button>
    );
  }

  return (
    <Card padding="lg" tone="raised" as="section">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="decision-title"
          label={t("profileDecisions.formTitleLabel")}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder={t("profileDecisions.formTitlePlaceholder")}
        />

        <Select
          id="decision-trim"
          label={t("profileDecisions.formPrimaryLabel")}
          value={primaryTrimId}
          onChange={(e) => setPrimaryTrimId(e.target.value)}
          required
          placeholderOption={saved.length === 0 ? t("profileDecisions.formNoSavedShort") : undefined}
          options={trimOptions}
        />

        {error ? (
          <p
            role="alert"
            className="rounded-[var(--radius)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || saved.length === 0}
          >
            {submitting ? t("profileDecisions.formCreating") : t("profileDecisions.formCreate")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
          >
            {t("profileDecisions.formCancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
