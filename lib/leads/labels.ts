// Azerbaijani labels for lead/sorğu states. Strings copied from
// docs/reference/.../LEAD_STATE_MACHINE.json (`label_az`). Keep in sync.

import type { LeadState } from "./types";

export const LEAD_STATE_LABELS_AZ: Record<LeadState, string> = {
  draft: "Hazırlanır",
  submitted: "Göndərildi",
  dealer_opened: "Diler açdı",
  official_offer: "Rəsmi təklif gəldi",
  test_drive_requested: "Test-sürüş soruldu",
  test_drive_confirmed: "Test-sürüş təsdiq",
  whatsapp_handoff: "WhatsApp xarici",
  expired: "Müddət bitib",
  no_response: "Diler cavab vermədi",
  second_offer: "Başqa təkliflə yoxla",
  accepted: "Rəsmi qəbul edildi",
  closed: "Bağlandı",
};

export function leadStateLabelAz(state: LeadState): string {
  return LEAD_STATE_LABELS_AZ[state];
}

export const LEAD_STATE_DESCRIPTIONS_AZ: Record<LeadState, string> = {
  draft: "Sorğu hələ göndərilməyib.",
  submitted: "Sorğun göndərildi. Diler adətən 1–2 saata cavab verir.",
  dealer_opened: "Diler sorğunu açdı və qiyməti hazırlayır.",
  official_offer: "Diler sənə rəsmi qiymət göndərdi.",
  test_drive_requested:
    "Test-sürüş soruldu. Diler təsdiqini gözləyirsən.",
  test_drive_confirmed:
    "Test-sürüş təsdiqləndi. Vaxt və yer diler ilə razılaşdırılıb.",
  whatsapp_handoff: "Söhbət WhatsApp-da davam edir.",
  expired:
    "Bu təklifin müddəti bitib. İstəsən, yenilənmə istə.",
  no_response:
    "Diler vaxtında cavab vermədi. Başqa təklif ala bilərsən.",
  second_offer:
    "Yeni təklif üçün dilerlərə yenidən sorğu göndərildi.",
  accepted:
    "Rəsmi qəbul edildi. Sənədlər diler tərəfindən hazırlanır.",
  closed: "Bu sorğu bağlanıb.",
};

export function leadStateDescriptionAz(state: LeadState): string | undefined {
  return LEAD_STATE_DESCRIPTIONS_AZ[state];
}

// Display label for the `source_surface` shown on lead detail meta.
import type { LeadSourceSurface } from "./types";

export const LEAD_SOURCE_SURFACE_LABELS_AZ: Record<LeadSourceSurface, string> = {
  car_detail: "Maşın səhifəsi",
  catalog: "Kataloq",
  compare: "Müqayisə",
  dealer_profile: "Diler səhifəsi",
  content: "Məqalə",
  decision_center: "Qərar mərkəzi",
};
