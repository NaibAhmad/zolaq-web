"use client";

import { useState } from "react";
import { ApiError, apiPost } from "@/lib/api";
import type {
  Decision,
  SavedCarWithTrim,
} from "@/lib/decisions/types";

type Props = {
  saved: SavedCarWithTrim[];
  onCreated?: (decision: Decision) => void;
};

export function NewDecisionForm({ saved, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [primaryTrimId, setPrimaryTrimId] = useState(
    saved[0]?.trim_id ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!primaryTrimId) {
      setError("Saxlanılan maşın siyahısı boşdur. Əvvəlcə maşın saxla.");
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
        }
      );
      setTitle("");
      setOpen(false);
      onCreated?.(data.decision);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Qərar yaradılmadı. Yenidən cəhd et.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-accent-orange-fg hover:opacity-90"
      >
        Yeni qərar yarat
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-surface-elevated p-4"
    >
      <div>
        <label
          htmlFor="decision-title"
          className="block text-xs font-medium text-foreground-muted"
        >
          Başlıq (istəyə görə)
        </label>
        <input
          id="decision-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="məs. Ailə üçün EV"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div>
        <label
          htmlFor="decision-trim"
          className="block text-xs font-medium text-foreground-muted"
        >
          Əsas maşın
        </label>
        <select
          id="decision-trim"
          value={primaryTrimId}
          onChange={(e) => setPrimaryTrimId(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
          required
        >
          {saved.length === 0 ? (
            <option value="">Saxlanılan maşın yoxdur</option>
          ) : (
            saved.map((s) => (
              <option key={s.saved_id} value={s.trim_id}>
                {s.trim.brand_name} · {s.trim.model_name} ({s.trim.year})
              </option>
            ))
          )}
        </select>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || saved.length === 0}
          className="inline-flex items-center justify-center rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-accent-orange-fg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Yaradılır…" : "Yarat"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated"
        >
          Ləğv et
        </button>
      </div>
    </form>
  );
}
