// Azerbaijani labels for lead/sorğu states. Strings copied from
// docs/reference/.../LEAD_STATE_MACHINE.json (`label_az`). Keep in sync.
// Sprint 10I-D: added EN/RU sibling tables + locale helpers.

import type { Locale } from "@/lib/i18n/locales";
import type { LeadState, LeadSourceSurface } from "./types";

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

const LEAD_STATE_LABELS_EN: Record<LeadState, string> = {
  draft: "Draft",
  submitted: "Submitted",
  dealer_opened: "Dealer opened",
  official_offer: "Official offer received",
  test_drive_requested: "Test drive requested",
  test_drive_confirmed: "Test drive confirmed",
  whatsapp_handoff: "WhatsApp handoff",
  expired: "Expired",
  no_response: "No response from dealer",
  second_offer: "Get a second offer",
  accepted: "Officially accepted",
  closed: "Closed",
};

const LEAD_STATE_LABELS_RU: Record<LeadState, string> = {
  draft: "Черновик",
  submitted: "Отправлено",
  dealer_opened: "Дилер открыл",
  official_offer: "Получено официальное предложение",
  test_drive_requested: "Запрошен тест-драйв",
  test_drive_confirmed: "Тест-драйв подтверждён",
  whatsapp_handoff: "Переход в WhatsApp",
  expired: "Срок истёк",
  no_response: "Дилер не ответил",
  second_offer: "Получить ещё одно предложение",
  accepted: "Официально принято",
  closed: "Закрыто",
};

const LEAD_STATE_BY_LOCALE: Record<Locale, Record<LeadState, string>> = {
  az: LEAD_STATE_LABELS_AZ,
  en: LEAD_STATE_LABELS_EN,
  ru: LEAD_STATE_LABELS_RU,
};

export function leadStateLabel(state: LeadState, locale: Locale): string {
  return LEAD_STATE_BY_LOCALE[locale]?.[state] ?? LEAD_STATE_LABELS_AZ[state];
}

// Legacy AZ-only accessor kept for callers that aren't locale-aware yet
// (admin/dealer panels handled in Phase B).
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

const LEAD_STATE_DESCRIPTIONS_EN: Record<LeadState, string> = {
  draft: "Request not sent yet.",
  submitted: "Your request was sent. Dealers usually reply within 1–2 hours.",
  dealer_opened: "The dealer opened the request and is preparing a price.",
  official_offer: "The dealer sent you an official price.",
  test_drive_requested:
    "A test drive was requested. Awaiting dealer confirmation.",
  test_drive_confirmed:
    "Test drive confirmed. Time and place agreed with the dealer.",
  whatsapp_handoff: "Conversation continues on WhatsApp.",
  expired: "This offer has expired. You can ask for a refresh.",
  no_response:
    "The dealer did not respond in time. You can get another offer.",
  second_offer: "A fresh request was sent to dealers for a new offer.",
  accepted: "Officially accepted. The dealer is preparing the documents.",
  closed: "This request is closed.",
};

const LEAD_STATE_DESCRIPTIONS_RU: Record<LeadState, string> = {
  draft: "Запрос ещё не отправлен.",
  submitted: "Ваш запрос отправлен. Дилер обычно отвечает в течение 1–2 часов.",
  dealer_opened: "Дилер открыл запрос и готовит цену.",
  official_offer: "Дилер отправил вам официальную цену.",
  test_drive_requested:
    "Запрошен тест-драйв. Ожидаем подтверждение дилера.",
  test_drive_confirmed:
    "Тест-драйв подтверждён. Время и место согласованы с дилером.",
  whatsapp_handoff: "Диалог продолжается в WhatsApp.",
  expired: "Срок предложения истёк. При желании можно запросить обновление.",
  no_response: "Дилер не ответил вовремя. Можно получить другое предложение.",
  second_offer: "Дилерам отправлен новый запрос на предложение.",
  accepted: "Официально принято. Документы готовит дилер.",
  closed: "Этот запрос закрыт.",
};

const LEAD_STATE_DESC_BY_LOCALE: Record<Locale, Record<LeadState, string>> = {
  az: LEAD_STATE_DESCRIPTIONS_AZ,
  en: LEAD_STATE_DESCRIPTIONS_EN,
  ru: LEAD_STATE_DESCRIPTIONS_RU,
};

export function leadStateDescription(
  state: LeadState,
  locale: Locale,
): string | undefined {
  return (
    LEAD_STATE_DESC_BY_LOCALE[locale]?.[state] ??
    LEAD_STATE_DESCRIPTIONS_AZ[state]
  );
}

export function leadStateDescriptionAz(state: LeadState): string | undefined {
  return LEAD_STATE_DESCRIPTIONS_AZ[state];
}

// Display label for the `source_surface` shown on lead detail meta.
export const LEAD_SOURCE_SURFACE_LABELS_AZ: Record<LeadSourceSurface, string> = {
  car_detail: "Maşın səhifəsi",
  catalog: "Kataloq",
  compare: "Müqayisə",
  dealer_profile: "Diler səhifəsi",
  content: "Məqalə",
  decision_center: "Qərar mərkəzi",
};

const LEAD_SOURCE_SURFACE_LABELS_EN: Record<LeadSourceSurface, string> = {
  car_detail: "Car page",
  catalog: "Catalog",
  compare: "Compare",
  dealer_profile: "Dealer page",
  content: "Article",
  decision_center: "Decision Center",
};

const LEAD_SOURCE_SURFACE_LABELS_RU: Record<LeadSourceSurface, string> = {
  car_detail: "Страница авто",
  catalog: "Каталог",
  compare: "Сравнение",
  dealer_profile: "Страница дилера",
  content: "Статья",
  decision_center: "Центр решений",
};

const LEAD_SOURCE_SURFACE_BY_LOCALE: Record<
  Locale,
  Record<LeadSourceSurface, string>
> = {
  az: LEAD_SOURCE_SURFACE_LABELS_AZ,
  en: LEAD_SOURCE_SURFACE_LABELS_EN,
  ru: LEAD_SOURCE_SURFACE_LABELS_RU,
};

export function leadSourceSurfaceLabel(
  surface: LeadSourceSurface,
  locale: Locale,
): string {
  return (
    LEAD_SOURCE_SURFACE_BY_LOCALE[locale]?.[surface] ??
    LEAD_SOURCE_SURFACE_LABELS_AZ[surface]
  );
}
