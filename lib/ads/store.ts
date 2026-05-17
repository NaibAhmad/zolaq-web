// Ad-request store. globalThis-pinned Map. Mirrors lib/admin/catalog-store.ts
// pattern. Every mutation calls writeAudit. State machine enforces:
//   - public-visible statuses (`approved | paid | active | paused`) require a
//     non-null `label`;
//   - dealer can only create + cancel own draft/submitted requests;
//   - status transitions follow ALLOWED_TRANSITIONS below.

import { randomUUID } from "node:crypto";
import { writeAudit } from "@/lib/admin/audit";
import { AD_REQUEST_SEED } from "./seed";
import { AD_PUBLIC_VISIBLE_STATUSES } from "./labels";
import type {
  AdLabel,
  AdPackageType,
  AdPlacementArea,
  AdRequest,
  AdStatus,
} from "./types";

type Store = { rows: Map<string, AdRequest> };
const g = globalThis as unknown as { __zlq_ads_store?: Store };
const store: Store =
  g.__zlq_ads_store ??
  (g.__zlq_ads_store = {
    rows: new Map(AD_REQUEST_SEED.map((r) => [r.ad_request_id, { ...r }])),
  });

const ALLOWED_TRANSITIONS: Record<AdStatus, readonly AdStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["under_review", "rejected", "cancelled"],
  under_review: ["invoice_required", "approved", "rejected", "cancelled"],
  invoice_required: ["invoice_sent", "cancelled"],
  invoice_sent: ["payment_uploaded", "cancelled"],
  payment_uploaded: ["paid", "rejected"],
  paid: ["approved", "active"],
  approved: ["active", "cancelled"],
  active: ["paused", "expired", "cancelled"],
  paused: ["active", "expired", "cancelled"],
  expired: [],
  rejected: [],
  cancelled: [],
};

export type CreateAdRequestInput = {
  dealer_id: string | null;
  initiated_by: "dealer" | "admin";
  submitted_by: string;
  package_type: AdPackageType;
  placement: AdPlacementArea;
  label?: AdLabel | null;
  campaign_note?: string;
  start_date?: string;
  end_date?: string;
  status?: AdStatus;
};

export function createAdRequest(
  input: CreateAdRequestInput,
  actor: { actor_type: "admin" | "dealer"; actor_id: string; role: string },
): AdRequest {
  const ad_request_id = `adr_${randomUUID()}`;
  const t = Date.now();
  const row: AdRequest = {
    ad_request_id,
    dealer_id: input.dealer_id,
    initiated_by: input.initiated_by,
    submitted_by: input.submitted_by,
    package_type: input.package_type,
    placement: input.placement,
    label: input.label ?? null,
    status: input.status ?? "draft",
    ...(input.campaign_note !== undefined && {
      campaign_note: input.campaign_note,
    }),
    ...(input.start_date !== undefined && { start_date: input.start_date }),
    ...(input.end_date !== undefined && { end_date: input.end_date }),
    created_at: t,
    updated_at: t,
  };
  store.rows.set(ad_request_id, row);
  writeAudit({
    actor_type: actor.actor_type,
    actor_id: actor.actor_id,
    role: actor.role,
    action: "ad_request.create",
    entity_type: "ad_request",
    entity_id: ad_request_id,
    after: { ...row },
  });
  return { ...row };
}

export type AdRequestFilter = {
  dealer_id?: string;
  status?: AdStatus | readonly AdStatus[];
  placement?: AdPlacementArea;
};

export function listAdRequests(filter: AdRequestFilter = {}): AdRequest[] {
  let rows = Array.from(store.rows.values());
  if (filter.dealer_id !== undefined) {
    rows = rows.filter((r) => r.dealer_id === filter.dealer_id);
  }
  if (filter.status) {
    const allowed = Array.isArray(filter.status) ? filter.status : [filter.status];
    rows = rows.filter((r) =>
      (allowed as readonly AdStatus[]).includes(r.status),
    );
  }
  if (filter.placement) {
    rows = rows.filter((r) => r.placement === filter.placement);
  }
  rows.sort((a, b) => b.updated_at - a.updated_at);
  return rows.map((r) => ({ ...r }));
}

export function getAdRequest(id: string): AdRequest | null {
  const r = store.rows.get(id);
  return r ? { ...r } : null;
}

export function getAdRequestForDealer(
  id: string,
  dealerId: string,
): AdRequest | null {
  const r = store.rows.get(id);
  if (!r || r.dealer_id !== dealerId) return null;
  return { ...r };
}

export type UpdateAdRequestPatch = Partial<
  Pick<
    AdRequest,
    | "label"
    | "placement"
    | "package_type"
    | "campaign_note"
    | "start_date"
    | "end_date"
    | "review_note"
    | "invoice_id"
  >
>;

export function updateAdRequest(
  id: string,
  patch: UpdateAdRequestPatch,
  actor: { actor_type: "admin" | "dealer"; actor_id: string; role: string },
): AdRequest | null {
  const before = store.rows.get(id);
  if (!before) return null;
  // public-visible statuses must keep a non-null label.
  const nextLabel = patch.label === undefined ? before.label : patch.label;
  if (AD_PUBLIC_VISIBLE_STATUSES.has(before.status) && nextLabel === null) {
    throw new Error("LABEL_REQUIRED");
  }
  const next: AdRequest = {
    ...before,
    ...patch,
    updated_at: Date.now(),
  };
  store.rows.set(id, next);
  writeAudit({
    actor_type: actor.actor_type,
    actor_id: actor.actor_id,
    role: actor.role,
    action: "ad_request.update",
    entity_type: "ad_request",
    entity_id: id,
    before: { ...before },
    after: { ...next },
  });
  if (patch.label !== undefined && patch.label !== before.label) {
    writeAudit({
      actor_type: actor.actor_type,
      actor_id: actor.actor_id,
      role: actor.role,
      action: "ad_request.label_change",
      entity_type: "ad_request",
      entity_id: id,
      before: { label: before.label },
      after: { label: patch.label },
    });
  }
  if (patch.placement !== undefined && patch.placement !== before.placement) {
    writeAudit({
      actor_type: actor.actor_type,
      actor_id: actor.actor_id,
      role: actor.role,
      action: "ad_request.placement_change",
      entity_type: "ad_request",
      entity_id: id,
      before: { placement: before.placement },
      after: { placement: patch.placement },
    });
  }
  return { ...next };
}

export type TransitionResult =
  | { ok: true; row: AdRequest }
  | { ok: false; error: "not_found" | "invalid_transition" | "label_required" };

const TRANSITION_AUDIT_ACTION: Record<AdStatus, string> = {
  draft: "ad_request.update",
  submitted: "ad_request.submit",
  under_review: "ad_request.update",
  invoice_required: "ad_request.update",
  invoice_sent: "ad_request.update",
  payment_uploaded: "ad_request.update",
  paid: "ad_request.update",
  approved: "ad_request.approve",
  active: "ad_request.activate",
  paused: "ad_request.pause",
  expired: "ad_request.expire",
  rejected: "ad_request.reject",
  cancelled: "ad_request.cancel",
};

export function transitionAdStatus(input: {
  id: string;
  to: AdStatus;
  actor: { actor_type: "admin" | "dealer"; actor_id: string; role: string };
  note?: string;
  invoice_id?: string;
  rejection_reason?: string;
  request_revision?: boolean;
}): TransitionResult {
  const before = store.rows.get(input.id);
  if (!before) return { ok: false, error: "not_found" };
  const allowed = ALLOWED_TRANSITIONS[before.status];
  if (!allowed.includes(input.to)) {
    return { ok: false, error: "invalid_transition" };
  }
  if (AD_PUBLIC_VISIBLE_STATUSES.has(input.to) && !before.label) {
    return { ok: false, error: "label_required" };
  }
  const t = Date.now();
  const next: AdRequest = {
    ...before,
    status: input.to,
    updated_at: t,
    ...(input.note !== undefined && { review_note: input.note }),
    ...(input.invoice_id !== undefined && { invoice_id: input.invoice_id }),
    ...(input.rejection_reason !== undefined && {
      rejection_reason: input.rejection_reason,
    }),
    ...(input.to === "active" && {
      activated_at: t,
      activated_by: input.actor.actor_id,
    }),
    ...(input.to === "paused" && { paused_at: t }),
    ...(input.to === "expired" && { expired_at: t }),
    ...(input.actor.actor_type === "admin" && {
      reviewed_by: input.actor.actor_id,
    }),
  };
  store.rows.set(input.id, next);
  const action =
    input.request_revision === true
      ? "ad_request.request_revision"
      : TRANSITION_AUDIT_ACTION[input.to];
  writeAudit({
    actor_type: input.actor.actor_type,
    actor_id: input.actor.actor_id,
    role: input.actor.role,
    action: action as Parameters<typeof writeAudit>[0]["action"],
    entity_type: "ad_request",
    entity_id: input.id,
    before: { status: before.status, label: before.label },
    after: { status: next.status, label: next.label },
    ...(input.note !== undefined && { note: input.note }),
  });
  return { ok: true, row: { ...next } };
}

// Returns currently active sponsored placements for a given placement area —
// used by public surfaces to know what (labeled) sponsored items to render.
export function listActivePlacements(area: AdPlacementArea): AdRequest[] {
  return Array.from(store.rows.values())
    .filter((r) => r.placement === area && r.status === "active")
    .map((r) => ({ ...r }));
}
