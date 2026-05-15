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

export const LEAD_STATE_DESCRIPTIONS_AZ: Partial<Record<LeadState, string>> = {
  submitted: "Sorğun göndərildi. Dilerlər yoxlayır.",
  official_offer: "Diler sənə rəsmi qiymət göndərdi.",
  expired: "Bu təklifin müddəti bitib. İstəsən, yeni təklif istə.",
  no_response: "Diler vaxtında cavab vermədi.",
};

export function leadStateDescriptionAz(state: LeadState): string | undefined {
  return LEAD_STATE_DESCRIPTIONS_AZ[state];
}
