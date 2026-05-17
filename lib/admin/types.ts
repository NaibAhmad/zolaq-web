// Sprint 8A admin/internal types.

import type { AdminRole } from "@/lib/auth/constants";

export type AdminUser = {
  admin_id: string;
  name: string;
  role: AdminRole;
  email?: string;
};

export type AuditActorType = "admin" | "dealer" | "system";

export type AuditAction =
  // admin catalog actions
  | "brand.create"
  | "brand.update"
  | "model.create"
  | "model.update"
  | "trim.create"
  | "trim.update"
  | "price.create"
  | "price.update"
  // dealer record
  | "dealer.create"
  | "dealer.update"
  | "dealer.verify"
  // offers + approval workflow
  | "offer.create"
  | "offer.update"
  | "offer.submit"
  | "offer.approve"
  | "offer.reject"
  | "offer.request_revision"
  | "offer.publish"
  // submissions
  | "submission.create"
  | "submission.resubmit"
  | "submission.approve"
  | "submission.reject"
  | "submission.request_revision"
  // content
  | "content.create"
  | "content.update"
  | "content.publish"
  | "content.unpublish"
  // auth
  | "admin.login"
  | "admin.logout"
  | "dealer.login"
  | "dealer.logout"
  // Sprint 9E auth/security events
  | "admin.login.failed"
  | "admin.login.blocked_production_mock"
  | "dealer.login.failed"
  | "dealer.login.blocked_production_mock"
  | "auth.forbidden"
  | "auth.dealer_scope_violation"
  | "otp.requested"
  | "otp.rate_limited"
  | "otp.verified"
  | "otp.failed"
  | "otp.expired"
  | "otp.locked"
  // Sprint 8E ads / invoices / payments
  | "ad_request.create"
  | "ad_request.submit"
  | "ad_request.update"
  | "ad_request.approve"
  | "ad_request.reject"
  | "ad_request.request_revision"
  | "ad_request.activate"
  | "ad_request.pause"
  | "ad_request.expire"
  | "ad_request.cancel"
  | "ad_request.label_change"
  | "ad_request.placement_change"
  | "invoice.create"
  | "invoice.send"
  | "invoice.mark_paid"
  | "invoice.cancel"
  | "invoice.mark_overdue"
  | "payment.upload"
  | "payment.approve"
  | "payment.reject"
  // Sprint 8F bazar nəbzi + P0-lite gamification
  | "bazar_topic.create"
  | "bazar_topic.update"
  | "bazar_topic.publish"
  | "bazar_topic.close"
  | "bazar_topic.resolve"
  | "bazar_topic.archive"
  | "bazar_topic.reject"
  | "bazar_vote.cast"
  | "badge.grant"
  | "point.grant"
  | "point.reverse"
  // Sprint 9C generations CRUD
  | "generation.create"
  | "generation.update"
  | "generation.archive"
  // Sprint 9C TrimSpec advanced fields
  | "trim_spec.update"
  // Sprint 9D media upload + approval
  | "media.upload"
  | "media.approve"
  | "media.reject"
  | "media.archive";

export type AuditLogEntry = {
  audit_id: string;
  actor_type: AuditActorType;
  actor_id: string;
  role: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
  created_at: number;
};

export type OfferReviewAction = "approve" | "reject" | "request_revision";
