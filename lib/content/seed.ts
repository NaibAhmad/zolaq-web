// Mock content seed for Sprint 6. 2 news, 2 encyclopedia, 2 Q&A entries.
// Related trim_ids point at existing entries in lib/cars/seed.ts so the
// content → related model → /cars/{trim_id}?source=content flow works.
//
// Anchored at the same NOW_BASE used by other seed files (lib/leads/seed.ts),
// so timestamps line up with the rest of the mock state.

import type {
  EncyclopediaEntry,
  NewsArticle,
  QAEntry,
} from "./types";

const NOW_BASE = 1_715_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

export const NEWS_ARTICLES: readonly NewsArticle[] = [
  {
    content_id: "news_byd_han_baku_launch",
    type: "news",
    slug: "byd-han-ev-bakida-tanitildi",
    title: "BYD Han EV Bakıda rəsmi olaraq təqdim edildi",
    summary:
      "Premium AWD versiyası 610 km yürüş məsafəsi və 510 a.g. gücü ilə Azərbaycan bazarına daxil olur.",
    body: "BYD Han EV Premium AWD modeli Bakı şəhərində rəsmi diler vasitəsilə təqdim edildi. Yeni model 87 kWh batareya, ikiqat mühərrik və 610 km yürüş məsafəsi təklif edir. Test-sürüş üçün qeydiyyat artıq açıqdır.",
    related_trim_ids: ["trim_byd_han_ev_premium_awd_2025"],
    published_at: NOW_BASE - 3 * DAY,
    source_name: "Zolaq Redaksiyası",
  },
  {
    content_id: "news_volvo_xc60_t8_update",
    type: "news",
    slug: "volvo-xc60-t8-recharge-yenilik",
    title: "Volvo XC60 T8 Recharge — 2025 yeniləməsi",
    summary:
      "Plug-in hibrid versiya artıq genişlənmiş elektrik yürüş məsafəsi və yenilənmiş infotainment ilə təqdim olunur.",
    body: "Volvo XC60 T8 Recharge Plus 2025 modeli yeni batareya paketi ilə 78 km elektrik yürüş məsafəsinə çatır. Google built-in infotainment sistemi və yenilənmiş Pilot Assist sürücü köməkçisi standart komplektasiyaya daxildir.",
    related_trim_ids: ["trim_volvo_xc60_t8_recharge_plus_2025"],
    published_at: NOW_BASE - 7 * DAY,
    source_name: "Zolaq Redaksiyası",
  },
];

export const ENCYCLOPEDIA_ENTRIES: readonly EncyclopediaEntry[] = [
  {
    content_id: "enc_phev_vs_hev",
    type: "encyclopedia",
    slug: "phev-vs-hev-ferqi",
    title: "PHEV və HEV: hibrid texnologiyaları arasındakı fərq",
    summary:
      "Hangı hibrid sənin sürmə tərzinə daha uyğundur — şarjlanan plug-in, yoxsa adi hibrid?",
    body: "PHEV (plug-in hibrid) həm elektrik şəbəkəsindən şarjlanır, həm də benzin mühərrikinə malikdir — şəhərdaxili gediş-gəliş üçün 40–80 km elektrik diapazonu verir. HEV (adi hibrid) yalnız öz daxili sistemindən enerji bərpa edir və xarici şarj tələb etmir. Volvo XC60 T8 — PHEV nümunəsidir; Toyota Camry Hybrid — klassik HEV.",
    related_trim_ids: [
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_toyota_camry_25_hybrid_prestige_2025",
    ],
    published_at: NOW_BASE - 14 * DAY,
    topic_tags: ["energy_type", "phev", "hev"],
  },
  {
    content_id: "enc_erev_explained",
    type: "encyclopedia",
    slug: "erev-diapazon-genislendirici-elektrik",
    title: "EREV nədir? Diapazon genişləndirici elektrik avtomobillər",
    summary:
      "Li Auto L9 kimi modellərdə istifadə olunan EREV texnologiyasının iş prinsipi və üstünlükləri.",
    body: "EREV (Extended Range Electric Vehicle) — elektrik mühərriki ilə hərəkət edən, lakin batareya bitdikdə kiçik benzin generatoru vasitəsilə cərəyan istehsal edən avtomobil tipidir. Mühərrik təkərlərə birbaşa bağlı deyil. Li Auto L9 Max bu sinifin nümunəsidir: 1315 km ümumi yürüş məsafəsi.",
    related_trim_ids: ["trim_li_auto_l9_max_erev_6seat_2025"],
    published_at: NOW_BASE - 21 * DAY,
    topic_tags: ["energy_type", "erev"],
  },
];

export const QA_ENTRIES: readonly QAEntry[] = [
  {
    content_id: "qa_byd_han_charging",
    type: "qa",
    id: "qa-001",
    question: "BYD Han EV-ni Bakıda harada şarj etmək olar?",
    answer:
      "Bakıda 50+ DC sürətli şarj nöqtəsi mövcuddur. BYD Han EV CCS2 standartını dəstəkləyir və 30 dəqiqədə 30%-dən 80%-ə qədər şarj oluna bilər. Rəsmi diler həm də evdə Type 2 wallbox quraşdırılması üçün dəstək təklif edir.",
    related_trim_ids: ["trim_byd_han_ev_premium_awd_2025"],
    published_at: NOW_BASE - 5 * DAY,
  },
  {
    content_id: "qa_xc60_vs_camry",
    type: "qa",
    id: "qa-002",
    question:
      "Ailə üçün Volvo XC60 T8, yoxsa Toyota Camry Hybrid daha səmərəlidir?",
    answer:
      "XC60 T8 (PHEV) gündəlik şəhərdaxili məsafələri elektriklə qət etməyə imkan verir və evdə şarj edə bilirsənsə yanacaq xərclərini ciddi azaldır. Camry Hybrid (HEV) şarj tələb etmir, daha aşağı qiymət siniflidir və uzun yol səfərlərində daha sadədir. Səfər profilinə görə müqayisə səhifəsindən hər ikisini yan-yana yoxlamaq tövsiyə olunur.",
    related_trim_ids: [
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_toyota_camry_25_hybrid_prestige_2025",
    ],
    published_at: NOW_BASE - 10 * DAY,
  },
];
