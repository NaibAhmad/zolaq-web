// Mock content seed. Sprint 6 baseline = 2/2/2 (news/encyclopedia/Q&A).
// Sprint 10F demo expansion = 3/5/5 to meet local founder review targets.
// Related trim_ids point at existing entries in lib/cars/seed.ts so the
// content → related model → /cars/{trim_id}?source=content flow works.
//
// Anchored at the same NOW_BASE used by other seed files (lib/leads/seed.ts),
// so timestamps line up with the rest of the mock state.
//
// Adding a new entry: append a new object literal to NEWS_ARTICLES or
// ENCYCLOPEDIA_ENTRIES below. Required fields (title/summary/body/...) come
// from the type. Optional media/category/source fields render with safe
// placeholders when omitted — no page-component edits needed.

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
    excerpt:
      "BYD-nin premium sedanı 610 km yürüş və ikiqat mühərriklə rəsmi olaraq satışa çıxır.",
    body: "BYD Han EV Premium AWD modeli Bakı şəhərində rəsmi diler vasitəsilə təqdim edildi. Yeni model 87 kWh batareya, ikiqat mühərrik və 610 km yürüş məsafəsi təklif edir. Test-sürüş üçün qeydiyyat artıq açıqdır.",
    related_trim_ids: ["trim_byd_han_ev_premium_awd_2025"],
    related_model_reason:
      "BYD Han EV Premium AWD — yazıdakı yeni təqdim olunan model.",
    published_at: NOW_BASE - 3 * DAY,
    source_name: "Zolaq Redaksiyası",
    category: "Model",
  },
  {
    content_id: "news_volvo_xc60_t8_update",
    type: "news",
    slug: "volvo-xc60-t8-recharge-yenilik",
    title: "Volvo XC60 T8 Recharge — 2025 yeniləməsi",
    summary:
      "Plug-in hibrid versiya artıq genişlənmiş elektrik yürüş məsafəsi və yenilənmiş infotainment ilə təqdim olunur.",
    excerpt:
      "78 km elektrik yürüş, Google built-in infotainment və yenilənmiş Pilot Assist standart komplektasiyada.",
    body: "Volvo XC60 T8 Recharge Plus 2025 modeli yeni batareya paketi ilə 78 km elektrik yürüş məsafəsinə çatır. Google built-in infotainment sistemi və yenilənmiş Pilot Assist sürücü köməkçisi standart komplektasiyaya daxildir.",
    related_trim_ids: ["trim_volvo_xc60_t8_recharge_plus_2025"],
    related_model_reason:
      "Volvo XC60 T8 Recharge Plus 2025 — yenilənmiş PHEV versiya yazıdakı əsas modeldir.",
    published_at: NOW_BASE - 7 * DAY,
    source_name: "Zolaq Redaksiyası",
    category: "Yeniləmə",
  },
  // Sprint 10F: +1 news to reach Section A target of 3.
  {
    content_id: "news_hyundai_ioniq5_baku_arrival",
    type: "news",
    slug: "hyundai-ioniq5-bakida-satisha-cixdi",
    title: "Hyundai Ioniq 5 Long Range Bakıda rəsmi satışa çıxdı",
    summary:
      "800V arxitektura, 481 km yürüş və 18 dəqiqəlik sürətli şarj — yeni Ioniq 5 AWD versiyası Bakıda təqdim edildi.",
    excerpt:
      "Ioniq 5 Long Range AWD 325 a.g. güc və V2L (Vehicle-to-Load) funksiyası ilə yerli bazara daxil olur.",
    body: "Hyundai-nin elektrik platformasına əsaslanan Ioniq 5 Long Range AWD modeli Azərbaycan bazarında rəsmi diler tərəfindən təqdim edildi. 800V arxitektura sayəsində 350 kW DC sürətli şarj ilə 10%-dən 80%-ə təxminən 18 dəqiqəyə şarj olunur. Test-sürüş üçün qeydiyyat avqust ayından açıqdır.",
    related_trim_ids: ["trim_hyundai_ioniq5_long_range_awd_2025"],
    related_model_reason:
      "Hyundai Ioniq 5 Long Range AWD — yazıdakı yeni təqdim olunan model.",
    published_at: NOW_BASE - 1 * DAY,
    source_name: "Zolaq Redaksiyası",
    category: "Model",
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
    excerpt:
      "Plug-in hibrid (PHEV) və adi hibrid (HEV) — fərq, üstünlüklər və kimə nə uyğundur.",
    body: "PHEV (plug-in hibrid) həm elektrik şəbəkəsindən şarjlanır, həm də benzin mühərrikinə malikdir — şəhərdaxili gediş-gəliş üçün 40–80 km elektrik diapazonu verir. HEV (adi hibrid) yalnız öz daxili sistemindən enerji bərpa edir və xarici şarj tələb etmir. Volvo XC60 T8 — PHEV nümunəsidir; Toyota Camry Hybrid — klassik HEV.",
    related_trim_ids: [
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_toyota_camry_25_hybrid_prestige_2025",
    ],
    related_model_reason:
      "Volvo XC60 T8 Recharge — bu yazıdakı PHEV-in əsas nümunəsi.",
    published_at: NOW_BASE - 14 * DAY,
    topic_tags: ["energy_type", "phev", "hev"],
    category: "tech",
    source: { name: "Zolaq Tex", source_count: 6, verified: true },
  },
  {
    content_id: "enc_erev_explained",
    type: "encyclopedia",
    slug: "erev-diapazon-genislendirici-elektrik",
    title: "EREV nədir? Diapazon genişləndirici elektrik avtomobillər",
    summary:
      "Li Auto L9 kimi modellərdə istifadə olunan EREV texnologiyasının iş prinsipi və üstünlükləri.",
    excerpt:
      "EREV — şəhərdə tam EV, magistralda generator. 1100+ km tam diapazonun necə işlədiyi.",
    body: "EREV (Extended Range Electric Vehicle) — elektrik mühərriki ilə hərəkət edən, lakin batareya bitdikdə kiçik benzin generatoru vasitəsilə cərəyan istehsal edən avtomobil tipidir. Mühərrik təkərlərə birbaşa bağlı deyil. Li Auto L9 Max bu sinifin nümunəsidir: 1315 km ümumi yürüş məsafəsi.",
    related_trim_ids: ["trim_li_auto_l9_max_erev_6seat_2025"],
    related_model_reason:
      "Li Auto L9 Max — yazıdakı 1100+ km diapazonlu EREV nümunəsi.",
    published_at: NOW_BASE - 21 * DAY,
    topic_tags: ["energy_type", "erev"],
    category: "tech",
    stats: [
      { label: "EV rejimi", value: "150–250 km" },
      { label: "Tam aralıq", value: "900–1200+ km" },
      { label: "Generator", value: "1.3–1.5L benzin" },
      { label: "Şarj", value: "AC + DC" },
    ],
    source: { name: "Zolaq Tex", source_count: 6, verified: true },
  },
  // Sprint 10F: +3 encyclopedia entries to reach Section A target of 5.
  {
    content_id: "enc_ev_baku_charging_network",
    type: "encyclopedia",
    slug: "baku-elektrik-sarj-shebekesi",
    title: "Bakıda elektrik avtomobil şarj şəbəkəsi — 2026",
    summary:
      "Bakıda və Abşeron yarımadasında mövcud DC sürətli və AC ev şarj nöqtələri haqqında qısa bələdçi.",
    excerpt:
      "DC sürətli şarj, AC wallbox və mənzil daxili şarj seçimləri — hansı sənin sürmə tərzinə uyğundur?",
    body: "Bakıda və Abşeron ərazisində 50+ ictimai DC sürətli şarj nöqtəsi mövcuddur. CCS2 standartı əksər müasir EV modellərini dəstəkləyir. Evdə şarj üçün 7.4 kW AC wallbox təxminən 6–8 saatda 0%-dən 100%-ə şarj edir. Mənzil sakinləri üçün ümumi qida şəbəkəsindən istifadə yalnız çox uzun gecə şarjı (10–14 saat) üçün uyğundur. Şarj operatorları və paket variantları haqqında dilerlər məsləhət verir.",
    related_trim_ids: [
      "trim_byd_han_ev_premium_awd_2025",
      "trim_kia_ev6_gt_line_awd_2025",
      "trim_hyundai_ioniq5_long_range_awd_2025",
    ],
    related_model_reason:
      "BYD Han EV, Kia EV6 və Hyundai Ioniq 5 — CCS2 dəstəkləyən populyar EV nümunələri.",
    published_at: NOW_BASE - 5 * DAY,
    topic_tags: ["charging", "ev"],
    category: "charging",
    stats: [
      { label: "DC nöqtələri (Bakı)", value: "50+" },
      { label: "Şarj sürəti", value: "50–120 kW DC" },
      { label: "AC wallbox", value: "7.4–11 kW" },
      { label: "Standart", value: "CCS2 / Type 2" },
    ],
    source: { name: "Zolaq Tex", source_count: 4, verified: true },
  },
  {
    content_id: "enc_battery_warranty_basics",
    type: "encyclopedia",
    slug: "elektrik-batareya-zemanet",
    title: "Elektrik avtomobil batareyası zəmanəti — nəyə diqqət etməli?",
    summary:
      "Batareya zəmanəti, deqradasiya və alıcı üçün vacib müddələr haqqında qısa məlumat.",
    excerpt:
      "Tutum saxlanması (SoH), zəmanət müddəti və ikinci sahib transferi — alıcı çek-listi.",
    body: "EV və PHEV batareyaları üçün standart zəmanət 7–8 il və ya 150–200 min km arasındadır. Çoxu istehsalçı zəmanət dövrü ərzində batareyanın orijinal tutumun ən az 70%-ni saxlamasını öhdəliyə götürür (SoH — State of Health). Zəmanətin ikinci sahibə keçməsi şərtləri brendlər arasında dəyişir — alış öncəsi bunu yoxlamaq vacibdir. Hongqi E-HS9 üçün xüsusi 6-illik genişləndirilmiş zəmanət paketi mövcuddur.",
    related_trim_ids: [
      "trim_byd_han_ev_premium_awd_2025",
      "trim_byd_tang_ev_premium_awd_2025",
      "trim_hongqi_ehs9_ev_6year_2025",
    ],
    related_model_reason:
      "BYD Han, Tang və Hongqi E-HS9 — zəmanət paketləri ilə diqqət çəkən EV-lər.",
    published_at: NOW_BASE - 12 * DAY,
    topic_tags: ["battery", "warranty"],
    category: "battery",
    stats: [
      { label: "Tipik zəmanət", value: "7–8 il" },
      { label: "Yürüş limiti", value: "150–200 min km" },
      { label: "SoH limiti", value: "≥70%" },
    ],
    source: { name: "Zolaq Tex", source_count: 5, verified: true },
  },
  {
    content_id: "enc_test_drive_checklist",
    type: "encyclopedia",
    slug: "test-surusu-checklist",
    title: "Test-sürüş üçün 10 sual — alıcı kontrol siyahısı",
    summary:
      "Test-sürüş zamanı yoxlanılması vacib olan əsas məqamlar və sürücüyə verilməli suallar.",
    excerpt:
      "Sükan rahatlığı, fren həssaslığı, infotainment, regen rejimi və yedək yeri — qısa siyahı.",
    body: "Test-sürüş zamanı yalnız sürətə baxmaq kifayət deyil. Aşağıdakıları yoxla: 1) Sükan oturuş və görüş bucağı; 2) Frenin xətti davranışı; 3) Regen rejimlərinin (one-pedal) intensivliyi; 4) İnfotainment ekranının cavab müddəti; 5) Telefon Android Auto / Apple CarPlay bağlantısı; 6) Klima və sürət reqülyatoru düymələri; 7) Yedək vəziyyətdə görüş və kamera; 8) Ön və arxa oturacaqlarda baş və ayaq sahəsi; 9) Yük yeri ölçüsü və zərif qatlanma; 10) ADAS funksiyalarının fəaliyyət sərhədləri. EREV və PHEV üçün əlavə: tam EV rejimdə hərəkət edə bilmə müddəti.",
    related_trim_ids: [
      "trim_toyota_camry_25_hybrid_prestige_2025",
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_li_auto_l9_max_erev_6seat_2025",
    ],
    related_model_reason:
      "Test-sürüş üçün hazır olan əsas demo modellər — HEV, PHEV və EREV nümunələri.",
    published_at: NOW_BASE - 18 * DAY,
    topic_tags: ["driving", "buyer_guide"],
    category: "driving",
    source: { name: "Zolaq Redaksiyası", source_count: 3, verified: true },
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
  // Sprint 10F: +3 Q&A entries to reach Section A target of 5.
  {
    content_id: "qa_rav4_hybrid_vs_tucson_hybrid",
    type: "qa",
    id: "qa-003",
    question:
      "Toyota RAV4 Hybrid, yoxsa Hyundai Tucson Hybrid — hansı daha sərfəlidir?",
    answer:
      "RAV4 Hybrid (HEV) etibarlılığı ilə tanınır, yanacaq sərfiyyatı ortalama 5.5–6 L/100 km arasındadır və ikinci əl bazarda qiyməti yaxşı saxlanır. Tucson Hybrid N Line daha güclü (230 a.g.) və daha zəngin standart komplektasiya ilə təklif olunur — Hyundai-nin 5 illik zəmanəti ilə birlikdə. Hər iki model SUV seqmentində ailə istifadəsinə uyğundur; seçim büdcə və zəmanət üstünlüyünə görə dəyişir. Müqayisə üçün hər iki komplektasiyanı yan-yana qoş.",
    related_trim_ids: [
      "trim_toyota_rav4_25_hybrid_xse_2025",
      "trim_hyundai_tucson_hybrid_n_line_2025",
    ],
    published_at: NOW_BASE - 4 * DAY,
  },
  {
    content_id: "qa_ev6_vs_ioniq5",
    type: "qa",
    id: "qa-004",
    question: "Kia EV6 və Hyundai Ioniq 5 eyni platformadırsa, fərq nədir?",
    answer:
      "Hər iki model Hyundai-Kia E-GMP 800V platforması üzərində qurulub və 18 dəqiqəlik sürətli şarj imkanını paylaşır. Fərqlər: EV6 daha kupé profilli, idman xarakterli sürüş hissi və daha sıx oturuş paketi təklif edir. Ioniq 5 isə daha geniş daxili məkan, düz döşəmə və V2L (Vehicle-to-Load) funksiyası ilə xidmət hibridi kimi mövqelənir. Yürüş məsafələri demək olar ki, eynidir (~480–510 km).",
    related_trim_ids: [
      "trim_kia_ev6_gt_line_awd_2025",
      "trim_hyundai_ioniq5_long_range_awd_2025",
    ],
    published_at: NOW_BASE - 6 * DAY,
  },
  {
    content_id: "qa_phev_home_charging_apartment",
    type: "qa",
    id: "qa-005",
    question:
      "Mənzildə yaşayıram, PHEV almaq məntiqli olarmı?",
    answer:
      "Mənzildə yaşayan və ev wallbox quraşdırma imkanı olmayan istifadəçi üçün PHEV-in tam faydası məhdudlaşır — çünki gündəlik EV diapazonu (40–80 km) yalnız müntəzəm şarj zamanı yanacağa qənaət gətirir. İş yerində və ya yaxın ictimai AC nöqtələrində gündə bir dəfə şarj etmək imkanı varsa, PHEV hələ də mənalı seçimdir. Əks halda, klassik HEV (Toyota Camry / Corolla Hybrid, Toyota RAV4 Hybrid) şarjsız işləyir və daha az gündəlik narahatlıq yaradır.",
    related_trim_ids: [
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_volvo_s60_t8_polestar_2025",
      "trim_toyota_camry_25_hybrid_prestige_2025",
    ],
    published_at: NOW_BASE - 2 * DAY,
  },
];
