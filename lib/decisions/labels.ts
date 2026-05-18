// Azerbaijani labels for the Decision domain. Mirrors lib/leads/labels.ts.
// Sprint 10I-D: added EN/RU sibling tables and locale-aware helpers so the
// founder demo renders the user's selected locale across decision surfaces.

import type { Locale } from "@/lib/i18n/locales";
import type {
  DecisionHistoryEventType,
  DecisionStatus,
  NextBestActionCode,
  ReadinessFactorKey,
} from "./types";

export const DECISION_STATUS_LABELS_AZ: Record<DecisionStatus, string> = {
  active: "Aktiv",
  decided: "Qərar verildi",
  abandoned: "İmtina edildi",
  closed: "Bağlandı",
};

const DECISION_STATUS_LABELS_EN: Record<DecisionStatus, string> = {
  active: "Active",
  decided: "Decided",
  abandoned: "Abandoned",
  closed: "Closed",
};

const DECISION_STATUS_LABELS_RU: Record<DecisionStatus, string> = {
  active: "Активно",
  decided: "Решено",
  abandoned: "Отменено",
  closed: "Закрыто",
};

const DECISION_STATUS_BY_LOCALE: Record<Locale, Record<DecisionStatus, string>> = {
  az: DECISION_STATUS_LABELS_AZ,
  en: DECISION_STATUS_LABELS_EN,
  ru: DECISION_STATUS_LABELS_RU,
};

export function decisionStatusLabel(
  status: DecisionStatus,
  locale: Locale,
): string {
  return (
    DECISION_STATUS_BY_LOCALE[locale]?.[status] ??
    DECISION_STATUS_LABELS_AZ[status]
  );
}

export const DECISION_HISTORY_EVENT_LABELS_AZ: Record<
  DecisionHistoryEventType,
  string
> = {
  search: "Axtarış",
  viewed_model: "Modelə baxış",
  saved_car: "Maşın saxlandı",
  comparison_created: "Müqayisə yaradıldı",
  lead_submitted: "Sorğu göndərildi",
  dealer_replied: "Diler cavab verdi",
  official_offer_received: "Rəsmi təklif alındı",
  whatsapp_clicked: "WhatsApp keçidi",
  test_drive_requested: "Test-sürüş soruldu",
  price_changed: "Qiymət dəyişdi",
  conflict_detected: "Ziddiyyət aşkarlandı",
  offer_expired: "Təklif müddəti bitib",
};

const DECISION_HISTORY_EVENT_LABELS_EN: Record<
  DecisionHistoryEventType,
  string
> = {
  search: "Search",
  viewed_model: "Model viewed",
  saved_car: "Car saved",
  comparison_created: "Comparison created",
  lead_submitted: "Request sent",
  dealer_replied: "Dealer replied",
  official_offer_received: "Official offer received",
  whatsapp_clicked: "WhatsApp opened",
  test_drive_requested: "Test drive requested",
  price_changed: "Price changed",
  conflict_detected: "Conflict detected",
  offer_expired: "Offer expired",
};

const DECISION_HISTORY_EVENT_LABELS_RU: Record<
  DecisionHistoryEventType,
  string
> = {
  search: "Поиск",
  viewed_model: "Просмотр модели",
  saved_car: "Автомобиль сохранён",
  comparison_created: "Создано сравнение",
  lead_submitted: "Запрос отправлен",
  dealer_replied: "Дилер ответил",
  official_offer_received: "Получено официальное предложение",
  whatsapp_clicked: "Переход в WhatsApp",
  test_drive_requested: "Запрошен тест-драйв",
  price_changed: "Цена изменилась",
  conflict_detected: "Обнаружено противоречие",
  offer_expired: "Срок предложения истёк",
};

const DECISION_HISTORY_EVENT_BY_LOCALE: Record<
  Locale,
  Record<DecisionHistoryEventType, string>
> = {
  az: DECISION_HISTORY_EVENT_LABELS_AZ,
  en: DECISION_HISTORY_EVENT_LABELS_EN,
  ru: DECISION_HISTORY_EVENT_LABELS_RU,
};

export function decisionHistoryEventLabel(
  type: DecisionHistoryEventType,
  locale: Locale,
): string {
  return (
    DECISION_HISTORY_EVENT_BY_LOCALE[locale]?.[type] ??
    DECISION_HISTORY_EVENT_LABELS_AZ[type]
  );
}

export const READINESS_FACTOR_LABELS_AZ: Record<ReadinessFactorKey, string> = {
  profile_completeness: "Profil tamamlanması",
  research_activity: "Araşdırma aktivliyi",
  compare_activity: "Müqayisə aktivliyi",
  official_offers: "Rəsmi təkliflər",
  test_drive_stage: "Test-sürüş mərhələsi",
  budget_match: "Büdcə uyğunluğu",
};

const READINESS_FACTOR_LABELS_EN: Record<ReadinessFactorKey, string> = {
  profile_completeness: "Profile completeness",
  research_activity: "Research activity",
  compare_activity: "Compare activity",
  official_offers: "Official offers",
  test_drive_stage: "Test drive stage",
  budget_match: "Budget match",
};

const READINESS_FACTOR_LABELS_RU: Record<ReadinessFactorKey, string> = {
  profile_completeness: "Заполненность профиля",
  research_activity: "Исследование",
  compare_activity: "Сравнение",
  official_offers: "Официальные предложения",
  test_drive_stage: "Этап тест-драйва",
  budget_match: "Соответствие бюджету",
};

const READINESS_FACTOR_BY_LOCALE: Record<
  Locale,
  Record<ReadinessFactorKey, string>
> = {
  az: READINESS_FACTOR_LABELS_AZ,
  en: READINESS_FACTOR_LABELS_EN,
  ru: READINESS_FACTOR_LABELS_RU,
};

export function readinessFactorLabel(
  key: ReadinessFactorKey,
  locale: Locale,
): string {
  return (
    READINESS_FACTOR_BY_LOCALE[locale]?.[key] ??
    READINESS_FACTOR_LABELS_AZ[key]
  );
}

export const NEXT_BEST_ACTION_LABELS_AZ: Record<
  NextBestActionCode,
  { title: string; description: string }
> = {
  complete_profile: {
    title: "Profilini tamamla",
    description:
      "Hesab məlumatların tam olsun ki, dilerlər səninlə daha tez əlaqə qura bilsin.",
  },
  view_cars: {
    title: "Maşınlara bax",
    description:
      "Bir neçə model nəzərdən keçirib araşdırmaya başla. Sonra ən bəyəndiklərini saxla.",
  },
  create_comparison: {
    title: "Maşınları müqayisə et",
    description:
      "Saxladığın maşınları müqayisəyə əlavə et və fərqləri yan-yana gör.",
  },
  request_offer: {
    title: "Rəsmi təklif istə",
    description:
      "Bəyəndiyin maşın üçün dilerə sorğu göndər ki, qiymət təklifini alasan.",
  },
  request_test_drive: {
    title: "Test-sürüş təyin et",
    description:
      "Təklif gəldi. Almazdan əvvəl maşını sınamaq üçün test-sürüş istə.",
  },
  review_offer: {
    title: "Təklifini yoxla",
    description: "Gələn rəsmi təklifi diqqətlə oxu və qərar verməyə hazırlaş.",
  },
  all_set: {
    title: "Hər şey hazırdır",
    description:
      "Qərar mərhələsi tamamlanır. Qərar İş Sahəsində seçimini yekunlaşdır.",
  },
};

const NEXT_BEST_ACTION_LABELS_EN: Record<
  NextBestActionCode,
  { title: string; description: string }
> = {
  complete_profile: {
    title: "Complete your profile",
    description:
      "Fill out your account info so dealers can reach you faster.",
  },
  view_cars: {
    title: "Browse cars",
    description:
      "Look through a few models to start your research. Save the ones you like.",
  },
  create_comparison: {
    title: "Compare cars",
    description:
      "Add your saved cars to compare and see the differences side by side.",
  },
  request_offer: {
    title: "Request an official offer",
    description:
      "Send a request to the dealer for your favorite car to receive a price offer.",
  },
  request_test_drive: {
    title: "Schedule a test drive",
    description:
      "The offer is in. Request a test drive before you buy to try the car out.",
  },
  review_offer: {
    title: "Review your offer",
    description:
      "Read the official offer carefully and get ready to decide.",
  },
  all_set: {
    title: "You're all set",
    description:
      "The decision stage is wrapping up. Finalize your pick in the Decision Workspace.",
  },
};

const NEXT_BEST_ACTION_LABELS_RU: Record<
  NextBestActionCode,
  { title: string; description: string }
> = {
  complete_profile: {
    title: "Заполните профиль",
    description:
      "Заполните данные аккаунта, чтобы дилеры быстрее с вами связывались.",
  },
  view_cars: {
    title: "Посмотрите автомобили",
    description:
      "Просмотрите несколько моделей, чтобы начать исследование. Сохраняйте те, что понравились.",
  },
  create_comparison: {
    title: "Сравните автомобили",
    description:
      "Добавьте сохранённые автомобили в сравнение и увидите различия рядом.",
  },
  request_offer: {
    title: "Запросите официальное предложение",
    description:
      "Отправьте запрос дилеру по выбранному автомобилю, чтобы получить цену.",
  },
  request_test_drive: {
    title: "Запишитесь на тест-драйв",
    description:
      "Предложение получено. Перед покупкой попробуйте автомобиль на тест-драйве.",
  },
  review_offer: {
    title: "Проверьте предложение",
    description:
      "Внимательно прочтите официальное предложение и подготовьтесь к решению.",
  },
  all_set: {
    title: "Всё готово",
    description:
      "Этап решения завершается. Финализируйте выбор в рабочей зоне решения.",
  },
};

const NEXT_BEST_ACTION_BY_LOCALE: Record<
  Locale,
  Record<NextBestActionCode, { title: string; description: string }>
> = {
  az: NEXT_BEST_ACTION_LABELS_AZ,
  en: NEXT_BEST_ACTION_LABELS_EN,
  ru: NEXT_BEST_ACTION_LABELS_RU,
};

export function nextBestActionLabel(
  code: NextBestActionCode,
  locale: Locale,
): { title: string; description: string } {
  return (
    NEXT_BEST_ACTION_BY_LOCALE[locale]?.[code] ??
    NEXT_BEST_ACTION_LABELS_AZ[code]
  );
}
