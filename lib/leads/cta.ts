// Single source of truth for the primary CTA shown on lead status surfaces
// (LeadNextActionCard + LeadDetailView action row). Mirrors Sprint 7D §4.
//
// Action keys are the same set already wired into LeadDetailView's
// API dispatcher (POST /api/profile/leads/{id}/{action}). "open-whatsapp" is
// a client-only action that does not call the API — it just opens wa.me.

import type { LeadState } from "./types";

export type LeadCtaActionKey =
  | "request-test-drive"
  | "request-second-offer"
  | "whatsapp-handoff"
  | "open-whatsapp"
  | "close";

export type LeadCtaVariant = "primary" | "whatsapp" | "info";

export type LeadPrimaryCta = {
  label: string;
  description: string;
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
          label: "WhatsApp ilə davam et",
          description: "Daha sürətli cavab üçün dilerlə WhatsApp-da əlaqə saxla.",
          action: "whatsapp-handoff",
          variant: "whatsapp",
          disabled: false,
        };
      }
      return {
        label: "Cavab gələndə bildirik",
        description:
          "Diler adətən 1–2 saata cavab verir. Status dəyişən kimi sənə bildiriləcək.",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "dealer_opened":
      return {
        label: "Diler qiyməti hazırlayır",
        description:
          "Diler sorğunu açıb. Rəsmi qiymət hazır olan kimi burada görünəcək.",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "official_offer":
      return {
        label: "Test-sürüş sorğusu göndər",
        description:
          "Rəsmi təklifi nəzərdən keçir, sonra dilerdən test-sürüş istə.",
        action: "request-test-drive",
        variant: "primary",
        disabled: false,
      };

    case "test_drive_requested":
      return {
        label: "Diler təsdiqini gözləyirik",
        description:
          "Test-sürüş istəyin dilerə göndərildi. Diler 1 iş günü ərzində səninlə əlaqə saxlayacaq.",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "test_drive_confirmed":
      return {
        label: "Növbəti addım: diler ilə əlaqə",
        description:
          "Test-sürüş təsdiqləndi. Vaxt və yeri diler ilə razılaşdırılıb.",
        action: null,
        variant: "info",
        disabled: true,
      };

    case "whatsapp_handoff":
      return {
        label: "WhatsApp-ı yenidən aç",
        description: "Söhbət WhatsApp-da davam edir.",
        action: "open-whatsapp",
        variant: "whatsapp",
        disabled: false,
      };

    case "expired":
      return {
        label: "Yenilənmə istə",
        description:
          "Bu təklifin müddəti bitib. Dilerdən yeni təklif iste.",
        action: "request-second-offer",
        variant: "primary",
        disabled: false,
      };

    case "no_response":
      return {
        label: "Başqa təkliflə yoxla",
        description:
          "Diler vaxtında cavab vermədi. Yenidən başqa təklif istə.",
        action: "request-second-offer",
        variant: "primary",
        disabled: false,
      };

    case "second_offer":
      return {
        label: "Yeni təklif gözlənilir",
        description:
          "Yeni təklif üçün dilerlərə sorğu göndərildi. Cavab gələndə görəcəksən.",
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
export const SECONDARY_ACTION_LABELS: Record<LeadCtaActionKey, string> = {
  "request-test-drive": "Test-sürüş istə",
  "request-second-offer": "İkinci təklif istə",
  "whatsapp-handoff": "WhatsApp-da davam et",
  "open-whatsapp": "WhatsApp-ı aç",
  close: "Sorğunu bağla",
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
