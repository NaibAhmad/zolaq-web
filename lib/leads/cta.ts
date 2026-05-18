// Single source of truth for the primary CTA shown on lead status surfaces
// (LeadNextActionCard + LeadDetailView action row). Mirrors Sprint 7D §4.
//
// Action keys are the same set already wired into LeadDetailView's
// API dispatcher (POST /api/profile/leads/{id}/{action}). "open-whatsapp" is
// a client-only action that does not call the API — it just opens wa.me.

import type { TranslationKey } from "@/lib/i18n/types";
import type { LeadState } from "./types";

export type LeadCtaActionKey =
  | "request-test-drive"
  | "request-second-offer"
  | "whatsapp-handoff"
  | "open-whatsapp"
  | "close";

export type LeadCtaVariant = "primary" | "whatsapp" | "info";

export type LeadPrimaryCta = {
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  action: LeadCtaActionKey | null;
  variant: LeadCtaVariant;
  disabled: boolean;
};

type CtaContext = {
  preferredContact?: "phone" | "whatsapp";
};

export function getLeadPrimaryCta(
  state: LeadState,
  ctx: CtaContext = {},
): LeadPrimaryCta | null {
  switch (state) {
    case "submitted":
      if (ctx.preferredContact === "whatsapp") {
        return {
          labelKey: "leads.ctaSubmittedWhatsappLabel",
          descriptionKey: "leads.ctaSubmittedWhatsappDesc",
          action: "whatsapp-handoff",
          variant: "whatsapp",
          disabled: false,
        };
      }
      return {
        labelKey: "leads.ctaSubmittedWaitLabel",
        descriptionKey: "leads.ctaSubmittedWaitDesc",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "dealer_opened":
      return {
        labelKey: "leads.ctaDealerOpenedLabel",
        descriptionKey: "leads.ctaDealerOpenedDesc",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "official_offer":
      return {
        labelKey: "leads.ctaOfficialOfferLabel",
        descriptionKey: "leads.ctaOfficialOfferDesc",
        action: "request-test-drive",
        variant: "primary",
        disabled: false,
      };

    case "test_drive_requested":
      return {
        labelKey: "leads.ctaTestDriveRequestedLabel",
        descriptionKey: "leads.ctaTestDriveRequestedDesc",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "test_drive_confirmed":
      return {
        labelKey: "leads.ctaTestDriveConfirmedLabel",
        descriptionKey: "leads.ctaTestDriveConfirmedDesc",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "whatsapp_handoff":
      return {
        labelKey: "leads.ctaWhatsappLabel",
        descriptionKey: "leads.ctaWhatsappDesc",
        action: "open-whatsapp",
        variant: "whatsapp",
        disabled: false,
      };

    case "expired":
      return {
        labelKey: "leads.ctaExpiredLabel",
        descriptionKey: "leads.ctaExpiredDesc",
        action: "request-second-offer",
        variant: "primary",
        disabled: false,
      };

    case "no_response":
      return {
        labelKey: "leads.ctaNoResponseLabel",
        descriptionKey: "leads.ctaNoResponseDesc",
        action: "request-second-offer",
        variant: "primary",
        disabled: false,
      };

    case "second_offer":
      return {
        labelKey: "leads.ctaSecondOfferLabel",
        descriptionKey: "leads.ctaSecondOfferDesc",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "draft":
    case "accepted":
    case "closed":
      return null;
  }
}

// State-machine action keys that should still be reachable as secondary
// (ghost) buttons next to the primary CTA. We filter via canTransition() in
// the consumer; this list defines which keys are eligible at all.
export const SECONDARY_ACTION_KEYS: Record<LeadCtaActionKey, TranslationKey> = {
  "request-test-drive": "leads.actionRequestTestDrive",
  "request-second-offer": "leads.actionRequestSecondOffer",
  "whatsapp-handoff": "leads.actionWhatsappHandoff",
  "open-whatsapp": "leads.actionOpenWhatsapp",
  close: "leads.actionClose",
};

// The state target that each CTA action transitions the lead into. Used so
// the consumer can run canTransition(currentState, ACTION_TO_STATE[action])
// to decide which secondary buttons to render.
export const LEAD_ACTION_TO_STATE: Record<
  Exclude<LeadCtaActionKey, "open-whatsapp">,
  LeadState
> = {
  "request-test-drive": "test_drive_requested",
  "request-second-offer": "second_offer",
  "whatsapp-handoff": "whatsapp_handoff",
  close: "closed",
};
