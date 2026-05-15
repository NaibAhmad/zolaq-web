// Azerbaijani labels for the Decision domain. Mirrors lib/leads/labels.ts.

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

export const READINESS_FACTOR_LABELS_AZ: Record<ReadinessFactorKey, string> = {
  profile_completeness: "Profil tamamlanması",
  research_activity: "Araşdırma aktivliyi",
  compare_activity: "Müqayisə aktivliyi",
  official_offers: "Rəsmi təkliflər",
  test_drive_stage: "Test-sürüş mərhələsi",
  budget_match: "Büdcə uyğunluğu",
};

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
