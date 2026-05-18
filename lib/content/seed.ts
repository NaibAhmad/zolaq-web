// Mock content seed. Sprint 6 baseline = 2/2/2 (news/encyclopedia/Q&A).
// Sprint 10F demo expansion = 3/5/5 to meet local founder review targets.
// Sprint 10I-D: title/summary/body/excerpt now carry AZ/EN/RU translations so
// the demo renders cleanly in the user's selected locale.
//
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
    title: {
      az: "BYD Han EV Bakıda rəsmi olaraq təqdim edildi",
      en: "BYD Han EV officially launched in Baku",
      ru: "BYD Han EV официально представлен в Баку",
    },
    summary: {
      az: "Premium AWD versiyası 610 km yürüş məsafəsi və 510 a.g. gücü ilə Azərbaycan bazarına daxil olur.",
      en: "The Premium AWD version enters Azerbaijan with 610 km of range and 510 hp.",
      ru: "Версия Premium AWD выходит на азербайджанский рынок с запасом хода 610 км и мощностью 510 л.с.",
    },
    excerpt: {
      az: "BYD-nin premium sedanı 610 km yürüş və ikiqat mühərriklə rəsmi olaraq satışa çıxır.",
      en: "BYD's premium sedan goes on sale with 610 km of range and dual motors.",
      ru: "Премиум-седан BYD поступает в продажу с запасом хода 610 км и двумя моторами.",
    },
    body: {
      az: "BYD Han EV Premium AWD modeli Bakı şəhərində rəsmi diler vasitəsilə təqdim edildi. Yeni model 87 kWh batareya, ikiqat mühərrik və 610 km yürüş məsafəsi təklif edir. Test-sürüş üçün qeydiyyat artıq açıqdır.",
      en: "The BYD Han EV Premium AWD has been introduced in Baku through the official dealer. The new model offers an 87 kWh battery, dual motors, and 610 km of range. Test-drive sign-up is already open.",
      ru: "Модель BYD Han EV Premium AWD представлена в Баку через официального дилера. Новинка предлагает аккумулятор 87 кВт·ч, два мотора и запас хода 610 км. Запись на тест-драйв уже открыта.",
    },
    related_trim_ids: ["trim_byd_han_ev_premium_awd_2025"],
    related_model_reason: {
      az: "BYD Han EV Premium AWD — yazıdakı yeni təqdim olunan model.",
      en: "BYD Han EV Premium AWD — the newly launched model in this article.",
      ru: "BYD Han EV Premium AWD — модель, представленная в этой статье.",
    },
    published_at: NOW_BASE - 3 * DAY,
    source_name: "Zolaq Redaksiyası",
    category: "Model",
  },
  {
    content_id: "news_volvo_xc60_t8_update",
    type: "news",
    slug: "volvo-xc60-t8-recharge-yenilik",
    title: {
      az: "Volvo XC60 T8 Recharge — 2025 yeniləməsi",
      en: "Volvo XC60 T8 Recharge — 2025 refresh",
      ru: "Volvo XC60 T8 Recharge — обновление 2025",
    },
    summary: {
      az: "Plug-in hibrid versiya artıq genişlənmiş elektrik yürüş məsafəsi və yenilənmiş infotainment ilə təqdim olunur.",
      en: "The plug-in hybrid arrives with extended electric range and refreshed infotainment.",
      ru: "Плагин-гибрид получает увеличенный запас хода на электротяге и обновлённый инфотейнмент.",
    },
    excerpt: {
      az: "78 km elektrik yürüş, Google built-in infotainment və yenilənmiş Pilot Assist standart komplektasiyada.",
      en: "78 km electric range, Google built-in infotainment, and updated Pilot Assist as standard.",
      ru: "78 км электрозапаса хода, встроенный Google инфотейнмент и обновлённый Pilot Assist в стандарте.",
    },
    body: {
      az: "Volvo XC60 T8 Recharge Plus 2025 modeli yeni batareya paketi ilə 78 km elektrik yürüş məsafəsinə çatır. Google built-in infotainment sistemi və yenilənmiş Pilot Assist sürücü köməkçisi standart komplektasiyaya daxildir.",
      en: "The Volvo XC60 T8 Recharge Plus 2025 reaches 78 km of electric range with its new battery pack. Google built-in infotainment and an updated Pilot Assist driver-assistance suite are now standard.",
      ru: "Volvo XC60 T8 Recharge Plus 2025 с новым аккумулятором обеспечивает 78 км запаса хода на электротяге. Встроенный Google инфотейнмент и обновлённый Pilot Assist входят в стандартную комплектацию.",
    },
    related_trim_ids: ["trim_volvo_xc60_t8_recharge_plus_2025"],
    related_model_reason: {
      az: "Volvo XC60 T8 Recharge Plus 2025 — yenilənmiş PHEV versiya yazıdakı əsas modeldir.",
      en: "Volvo XC60 T8 Recharge Plus 2025 — the refreshed PHEV that this article covers.",
      ru: "Volvo XC60 T8 Recharge Plus 2025 — обновлённый PHEV из этой статьи.",
    },
    published_at: NOW_BASE - 7 * DAY,
    source_name: "Zolaq Redaksiyası",
    category: "Yeniləmə",
  },
  {
    content_id: "news_hyundai_ioniq5_baku_arrival",
    type: "news",
    slug: "hyundai-ioniq5-bakida-satisha-cixdi",
    title: {
      az: "Hyundai Ioniq 5 Long Range Bakıda rəsmi satışa çıxdı",
      en: "Hyundai Ioniq 5 Long Range now on sale in Baku",
      ru: "Hyundai Ioniq 5 Long Range официально в продаже в Баку",
    },
    summary: {
      az: "800V arxitektura, 481 km yürüş və 18 dəqiqəlik sürətli şarj — yeni Ioniq 5 AWD versiyası Bakıda təqdim edildi.",
      en: "800V architecture, 481 km of range, and 18-minute fast charging — the new Ioniq 5 AWD has landed in Baku.",
      ru: "Архитектура 800 В, 481 км запаса хода и быстрая зарядка за 18 минут — новый Ioniq 5 AWD представлен в Баку.",
    },
    excerpt: {
      az: "Ioniq 5 Long Range AWD 325 a.g. güc və V2L (Vehicle-to-Load) funksiyası ilə yerli bazara daxil olur.",
      en: "Ioniq 5 Long Range AWD enters the local market with 325 hp and a V2L (Vehicle-to-Load) feature.",
      ru: "Ioniq 5 Long Range AWD выходит на местный рынок с 325 л.с. и функцией V2L (Vehicle-to-Load).",
    },
    body: {
      az: "Hyundai-nin elektrik platformasına əsaslanan Ioniq 5 Long Range AWD modeli Azərbaycan bazarında rəsmi diler tərəfindən təqdim edildi. 800V arxitektura sayəsində 350 kW DC sürətli şarj ilə 10%-dən 80%-ə təxminən 18 dəqiqəyə şarj olunur. Test-sürüş üçün qeydiyyat avqust ayından açıqdır.",
      en: "Hyundai's Ioniq 5 Long Range AWD, built on the dedicated EV platform, has been introduced in Azerbaijan by the official dealer. Thanks to the 800V architecture and 350 kW DC fast charging, the car charges from 10% to 80% in roughly 18 minutes. Test-drive sign-up opens in August.",
      ru: "Hyundai Ioniq 5 Long Range AWD на специальной EV-платформе представлен в Азербайджане официальным дилером. Архитектура 800 В и быстрая зарядка 350 кВт DC позволяют зарядить аккумулятор с 10% до 80% примерно за 18 минут. Запись на тест-драйв открывается в августе.",
    },
    related_trim_ids: ["trim_hyundai_ioniq5_long_range_awd_2025"],
    related_model_reason: {
      az: "Hyundai Ioniq 5 Long Range AWD — yazıdakı yeni təqdim olunan model.",
      en: "Hyundai Ioniq 5 Long Range AWD — the newly launched model in this article.",
      ru: "Hyundai Ioniq 5 Long Range AWD — модель, представленная в этой статье.",
    },
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
    title: {
      az: "PHEV və HEV: hibrid texnologiyaları arasındakı fərq",
      en: "PHEV vs HEV: the difference between hybrid technologies",
      ru: "PHEV и HEV: в чём разница гибридных технологий",
    },
    summary: {
      az: "Hangı hibrid sənin sürmə tərzinə daha uyğundur — şarjlanan plug-in, yoxsa adi hibrid?",
      en: "Which hybrid fits your driving style — a plug-in or a regular hybrid?",
      ru: "Какой гибрид подходит вашему стилю езды — заряжаемый PHEV или классический HEV?",
    },
    excerpt: {
      az: "Plug-in hibrid (PHEV) və adi hibrid (HEV) — fərq, üstünlüklər və kimə nə uyğundur.",
      en: "Plug-in hybrid (PHEV) and conventional hybrid (HEV) — differences, strengths, and who each suits.",
      ru: "Подключаемый гибрид (PHEV) и обычный гибрид (HEV) — отличия, преимущества и кому что подходит.",
    },
    body: {
      az: "PHEV (plug-in hibrid) həm elektrik şəbəkəsindən şarjlanır, həm də benzin mühərrikinə malikdir — şəhərdaxili gediş-gəliş üçün 40–80 km elektrik diapazonu verir. HEV (adi hibrid) yalnız öz daxili sistemindən enerji bərpa edir və xarici şarj tələb etmir. Volvo XC60 T8 — PHEV nümunəsidir; Toyota Camry Hybrid — klassik HEV.",
      en: "A PHEV (plug-in hybrid) charges from the grid and also has a petrol engine — giving 40–80 km of electric range for urban commuting. An HEV (regular hybrid) only recovers energy from its own systems and needs no external charging. Volvo XC60 T8 is a PHEV example; Toyota Camry Hybrid is a classic HEV.",
      ru: "PHEV (подключаемый гибрид) заряжается от сети и имеет бензиновый двигатель, обеспечивая 40–80 км запаса хода на электротяге для города. HEV (классический гибрид) восстанавливает энергию только из собственных систем и не требует внешней зарядки. Volvo XC60 T8 — пример PHEV; Toyota Camry Hybrid — классический HEV.",
    },
    related_trim_ids: [
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_toyota_camry_25_hybrid_prestige_2025",
    ],
    related_model_reason: {
      az: "Volvo XC60 T8 Recharge — bu yazıdakı PHEV-in əsas nümunəsi.",
      en: "Volvo XC60 T8 Recharge — the main PHEV example in this article.",
      ru: "Volvo XC60 T8 Recharge — основной пример PHEV в этой статье.",
    },
    published_at: NOW_BASE - 14 * DAY,
    topic_tags: ["energy_type", "phev", "hev"],
    category: "tech",
    source: { name: "Zolaq Tex", source_count: 6, verified: true },
  },
  {
    content_id: "enc_erev_explained",
    type: "encyclopedia",
    slug: "erev-diapazon-genislendirici-elektrik",
    title: {
      az: "EREV nədir? Diapazon genişləndirici elektrik avtomobillər",
      en: "What is an EREV? Extended-range electric vehicles explained",
      ru: "Что такое EREV? Электромобили с увеличенным запасом хода",
    },
    summary: {
      az: "Li Auto L9 kimi modellərdə istifadə olunan EREV texnologiyasının iş prinsipi və üstünlükləri.",
      en: "How EREV technology works in models like the Li Auto L9, and what its advantages are.",
      ru: "Как работает технология EREV в моделях вроде Li Auto L9 и в чём её преимущества.",
    },
    excerpt: {
      az: "EREV — şəhərdə tam EV, magistralda generator. 1100+ km tam diapazonun necə işlədiyi.",
      en: "EREV — a full EV in the city, generator-assisted on the highway. How 1100+ km of total range works.",
      ru: "EREV — полностью электрический в городе, с бензиновым генератором на шоссе. Как работает 1100+ км общего запаса хода.",
    },
    body: {
      az: "EREV (Extended Range Electric Vehicle) — elektrik mühərriki ilə hərəkət edən, lakin batareya bitdikdə kiçik benzin generatoru vasitəsilə cərəyan istehsal edən avtomobil tipidir. Mühərrik təkərlərə birbaşa bağlı deyil. Li Auto L9 Max bu sinifin nümunəsidir: 1315 km ümumi yürüş məsafəsi.",
      en: "An EREV (Extended Range Electric Vehicle) is driven by an electric motor; when the battery runs low, a small petrol generator produces electricity. The engine is not directly connected to the wheels. Li Auto L9 Max is an example in this class with a total range of 1315 km.",
      ru: "EREV (Extended Range Electric Vehicle) — автомобиль, движущийся на электромоторе; когда аккумулятор разряжается, небольшой бензиновый генератор вырабатывает электричество. Двигатель напрямую с колёсами не соединён. Li Auto L9 Max — пример этого класса с общим запасом хода 1315 км.",
    },
    related_trim_ids: ["trim_li_auto_l9_max_erev_6seat_2025"],
    related_model_reason: {
      az: "Li Auto L9 Max — yazıdakı 1100+ km diapazonlu EREV nümunəsi.",
      en: "Li Auto L9 Max — the 1100+ km EREV example in this article.",
      ru: "Li Auto L9 Max — пример EREV с запасом хода 1100+ км из этой статьи.",
    },
    published_at: NOW_BASE - 21 * DAY,
    topic_tags: ["energy_type", "erev"],
    category: "tech",
    stats: [
      {
        label: { az: "EV rejimi", en: "EV mode", ru: "Режим EV" },
        value: "150–250 km",
      },
      {
        label: { az: "Tam aralıq", en: "Total range", ru: "Общий запас хода" },
        value: "900–1200+ km",
      },
      {
        label: { az: "Generator", en: "Generator", ru: "Генератор" },
        value: {
          az: "1.3–1.5L benzin",
          en: "1.3–1.5 L petrol",
          ru: "Бензиновый 1,3–1,5 л",
        },
      },
      {
        label: { az: "Şarj", en: "Charging", ru: "Зарядка" },
        value: "AC + DC",
      },
    ],
    source: { name: "Zolaq Tex", source_count: 6, verified: true },
  },
  {
    content_id: "enc_ev_baku_charging_network",
    type: "encyclopedia",
    slug: "baku-elektrik-sarj-shebekesi",
    title: {
      az: "Bakıda elektrik avtomobil şarj şəbəkəsi — 2026",
      en: "EV charging network in Baku — 2026",
      ru: "Сеть зарядных станций электромобилей в Баку — 2026",
    },
    summary: {
      az: "Bakıda və Abşeron yarımadasında mövcud DC sürətli və AC ev şarj nöqtələri haqqında qısa bələdçi.",
      en: "A short guide to DC fast charging and AC home charging options in Baku and the Absheron peninsula.",
      ru: "Краткий гид по доступным DC-скоростным и AC-домашним зарядным точкам в Баку и на Апшеронском полуострове.",
    },
    excerpt: {
      az: "DC sürətli şarj, AC wallbox və mənzil daxili şarj seçimləri — hansı sənin sürmə tərzinə uyğundur?",
      en: "DC fast charging, AC wallbox, and apartment-friendly options — which fits your driving habits?",
      ru: "DC-скоростная зарядка, AC-wallbox и варианты для квартиры — что подходит вашему стилю езды?",
    },
    body: {
      az: "Bakıda və Abşeron ərazisində 50+ ictimai DC sürətli şarj nöqtəsi mövcuddur. CCS2 standartı əksər müasir EV modellərini dəstəkləyir. Evdə şarj üçün 7.4 kW AC wallbox təxminən 6–8 saatda 0%-dən 100%-ə şarj edir. Mənzil sakinləri üçün ümumi qida şəbəkəsindən istifadə yalnız çox uzun gecə şarjı (10–14 saat) üçün uyğundur. Şarj operatorları və paket variantları haqqında dilerlər məsləhət verir.",
      en: "Baku and the Absheron area have 50+ public DC fast-charging points. The CCS2 standard covers most modern EVs. At home, a 7.4 kW AC wallbox can charge from 0% to 100% in roughly 6–8 hours. For apartment dwellers, using a regular household socket is only feasible for long overnight charging (10–14 hours). Dealers can advise on charging operators and packages.",
      ru: "В Баку и на Апшероне работает более 50 публичных DC-скоростных зарядных станций. Стандарт CCS2 поддерживается большинством современных EV. Дома AC-wallbox мощностью 7,4 кВт заряжает с 0% до 100% примерно за 6–8 часов. Жителям квартир обычная бытовая розетка подходит только для длительной ночной зарядки (10–14 часов). Дилеры подскажут операторов зарядки и доступные пакеты.",
    },
    related_trim_ids: [
      "trim_byd_han_ev_premium_awd_2025",
      "trim_kia_ev6_gt_line_awd_2025",
      "trim_hyundai_ioniq5_long_range_awd_2025",
    ],
    related_model_reason: {
      az: "BYD Han EV, Kia EV6 və Hyundai Ioniq 5 — CCS2 dəstəkləyən populyar EV nümunələri.",
      en: "BYD Han EV, Kia EV6, and Hyundai Ioniq 5 — popular EVs that support CCS2.",
      ru: "BYD Han EV, Kia EV6 и Hyundai Ioniq 5 — популярные EV с поддержкой CCS2.",
    },
    published_at: NOW_BASE - 5 * DAY,
    topic_tags: ["charging", "ev"],
    category: "charging",
    stats: [
      {
        label: {
          az: "DC nöqtələri (Bakı)",
          en: "DC points (Baku)",
          ru: "DC-точки (Баку)",
        },
        value: "50+",
      },
      {
        label: {
          az: "Şarj sürəti",
          en: "Charging speed",
          ru: "Скорость зарядки",
        },
        value: "50–120 kW DC",
      },
      {
        label: { az: "AC wallbox", en: "AC wallbox", ru: "AC wallbox" },
        value: "7.4–11 kW",
      },
      {
        label: { az: "Standart", en: "Standard", ru: "Стандарт" },
        value: "CCS2 / Type 2",
      },
    ],
    source: { name: "Zolaq Tex", source_count: 4, verified: true },
  },
  {
    content_id: "enc_battery_warranty_basics",
    type: "encyclopedia",
    slug: "elektrik-batareya-zemanet",
    title: {
      az: "Elektrik avtomobil batareyası zəmanəti — nəyə diqqət etməli?",
      en: "EV battery warranty — what to look for",
      ru: "Гарантия на аккумулятор электромобиля — на что обратить внимание",
    },
    summary: {
      az: "Batareya zəmanəti, deqradasiya və alıcı üçün vacib müddələr haqqında qısa məlumat.",
      en: "A short briefing on EV battery warranties, degradation, and the terms that matter to buyers.",
      ru: "Кратко об условиях гарантии на аккумулятор, его деградации и пунктах, важных для покупателя.",
    },
    excerpt: {
      az: "Tutum saxlanması (SoH), zəmanət müddəti və ikinci sahib transferi — alıcı çek-listi.",
      en: "State of Health (SoH), warranty length, and second-owner transfer — a buyer checklist.",
      ru: "Сохранение ёмкости (SoH), срок гарантии и передача второму владельцу — чек-лист покупателя.",
    },
    body: {
      az: "EV və PHEV batareyaları üçün standart zəmanət 7–8 il və ya 150–200 min km arasındadır. Çoxu istehsalçı zəmanət dövrü ərzində batareyanın orijinal tutumun ən az 70%-ni saxlamasını öhdəliyə götürür (SoH — State of Health). Zəmanətin ikinci sahibə keçməsi şərtləri brendlər arasında dəyişir — alış öncəsi bunu yoxlamaq vacibdir. Hongqi E-HS9 üçün xüsusi 6-illik genişləndirilmiş zəmanət paketi mövcuddur.",
      en: "Standard EV and PHEV battery warranties run 7–8 years or 150,000–200,000 km. Most manufacturers commit to keeping at least 70% of the original capacity during the warranty period (SoH — State of Health). Second-owner transfer rules vary by brand — verify this before buying. Hongqi E-HS9 offers a special 6-year extended warranty package.",
      ru: "Стандартная гарантия на аккумулятор EV и PHEV — 7–8 лет или 150–200 тыс. км. Большинство производителей обязуются сохранять не менее 70% исходной ёмкости в течение гарантийного периода (SoH — State of Health). Условия передачи гарантии второму владельцу различаются по брендам — это стоит проверить до покупки. Для Hongqi E-HS9 доступен расширенный 6-летний гарантийный пакет.",
    },
    related_trim_ids: [
      "trim_byd_han_ev_premium_awd_2025",
      "trim_byd_tang_ev_premium_awd_2025",
      "trim_hongqi_ehs9_ev_6year_2025",
    ],
    related_model_reason: {
      az: "BYD Han, Tang və Hongqi E-HS9 — zəmanət paketləri ilə diqqət çəkən EV-lər.",
      en: "BYD Han, Tang, and Hongqi E-HS9 — EVs notable for their warranty packages.",
      ru: "BYD Han, Tang и Hongqi E-HS9 — EV, выделяющиеся своими гарантийными пакетами.",
    },
    published_at: NOW_BASE - 12 * DAY,
    topic_tags: ["battery", "warranty"],
    category: "battery",
    stats: [
      {
        label: {
          az: "Tipik zəmanət",
          en: "Typical warranty",
          ru: "Типичная гарантия",
        },
        value: { az: "7–8 il", en: "7–8 years", ru: "7–8 лет" },
      },
      {
        label: {
          az: "Yürüş limiti",
          en: "Mileage limit",
          ru: "Лимит пробега",
        },
        value: {
          az: "150–200 min km",
          en: "150–200k km",
          ru: "150–200 тыс. км",
        },
      },
      {
        label: { az: "SoH limiti", en: "SoH minimum", ru: "Минимум SoH" },
        value: "≥70%",
      },
    ],
    source: { name: "Zolaq Tex", source_count: 5, verified: true },
  },
  {
    content_id: "enc_test_drive_checklist",
    type: "encyclopedia",
    slug: "test-surusu-checklist",
    title: {
      az: "Test-sürüş üçün 10 sual — alıcı kontrol siyahısı",
      en: "Test drive checklist — 10 questions every buyer should ask",
      ru: "10 вопросов для тест-драйва — чек-лист покупателя",
    },
    summary: {
      az: "Test-sürüş zamanı yoxlanılması vacib olan əsas məqamlar və sürücüyə verilməli suallar.",
      en: "Key things to check during a test drive and questions to ask the dealer.",
      ru: "Ключевые моменты, которые стоит проверить на тест-драйве, и вопросы дилеру.",
    },
    excerpt: {
      az: "Sükan rahatlığı, fren həssaslığı, infotainment, regen rejimi və yedək yeri — qısa siyahı.",
      en: "Steering comfort, brake feel, infotainment, regen mode, and cargo space — a short list.",
      ru: "Удобство руля, отзывчивость тормозов, инфотейнмент, режим рекуперации и багажник — краткий список.",
    },
    body: {
      az: "Test-sürüş zamanı yalnız sürətə baxmaq kifayət deyil. Aşağıdakıları yoxla: 1) Sükan oturuş və görüş bucağı; 2) Frenin xətti davranışı; 3) Regen rejimlərinin (one-pedal) intensivliyi; 4) İnfotainment ekranının cavab müddəti; 5) Telefon Android Auto / Apple CarPlay bağlantısı; 6) Klima və sürət reqülyatoru düymələri; 7) Yedək vəziyyətdə görüş və kamera; 8) Ön və arxa oturacaqlarda baş və ayaq sahəsi; 9) Yük yeri ölçüsü və zərif qatlanma; 10) ADAS funksiyalarının fəaliyyət sərhədləri. EREV və PHEV üçün əlavə: tam EV rejimdə hərəkət edə bilmə müddəti.",
      en: "A test drive is not only about acceleration. Check: 1) Seating position and outward visibility; 2) Linear braking feel; 3) Regen mode (one-pedal) intensity; 4) Infotainment screen response time; 5) Android Auto / Apple CarPlay pairing; 6) Climate and cruise-control buttons; 7) Reverse visibility and camera; 8) Head and leg room front and rear; 9) Cargo volume and seat-folding ease; 10) ADAS function limits. For EREV and PHEV, also test how long the car can run in pure EV mode.",
      ru: "Тест-драйв — это не только про ускорение. Проверьте: 1) Посадку и обзорность; 2) Линейность торможения; 3) Интенсивность рекуперации (one-pedal); 4) Скорость отклика инфотейнмента; 5) Сопряжение Android Auto / Apple CarPlay; 6) Кнопки климата и круиз-контроля; 7) Обзор назад и камеру; 8) Пространство над головой и в ногах спереди и сзади; 9) Объём багажника и удобство складывания сидений; 10) Границы работы ADAS. Для EREV и PHEV дополнительно — как долго машина едет в полностью электрическом режиме.",
    },
    related_trim_ids: [
      "trim_toyota_camry_25_hybrid_prestige_2025",
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_li_auto_l9_max_erev_6seat_2025",
    ],
    related_model_reason: {
      az: "Test-sürüş üçün hazır olan əsas demo modellər — HEV, PHEV və EREV nümunələri.",
      en: "Demo models ready for a test drive — HEV, PHEV, and EREV examples.",
      ru: "Демо-модели, готовые к тест-драйву — примеры HEV, PHEV и EREV.",
    },
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
    question: {
      az: "BYD Han EV-ni Bakıda harada şarj etmək olar?",
      en: "Where can I charge a BYD Han EV in Baku?",
      ru: "Где зарядить BYD Han EV в Баку?",
    },
    answer: {
      az: "Bakıda 50+ DC sürətli şarj nöqtəsi mövcuddur. BYD Han EV CCS2 standartını dəstəkləyir və 30 dəqiqədə 30%-dən 80%-ə qədər şarj oluna bilər. Rəsmi diler həm də evdə Type 2 wallbox quraşdırılması üçün dəstək təklif edir.",
      en: "Baku has 50+ DC fast-charging points. The BYD Han EV supports the CCS2 standard and can charge from 30% to 80% in about 30 minutes. The official dealer also helps with installing a Type 2 wallbox at home.",
      ru: "В Баку работает более 50 DC-скоростных зарядных станций. BYD Han EV поддерживает стандарт CCS2 и заряжается с 30% до 80% примерно за 30 минут. Официальный дилер также помогает установить домашний Type 2 wallbox.",
    },
    related_trim_ids: ["trim_byd_han_ev_premium_awd_2025"],
    published_at: NOW_BASE - 5 * DAY,
  },
  {
    content_id: "qa_xc60_vs_camry",
    type: "qa",
    id: "qa-002",
    question: {
      az: "Ailə üçün Volvo XC60 T8, yoxsa Toyota Camry Hybrid daha səmərəlidir?",
      en: "For a family, is the Volvo XC60 T8 or the Toyota Camry Hybrid more efficient?",
      ru: "Что эффективнее для семьи — Volvo XC60 T8 или Toyota Camry Hybrid?",
    },
    answer: {
      az: "XC60 T8 (PHEV) gündəlik şəhərdaxili məsafələri elektriklə qət etməyə imkan verir və evdə şarj edə bilirsənsə yanacaq xərclərini ciddi azaldır. Camry Hybrid (HEV) şarj tələb etmir, daha aşağı qiymət siniflidir və uzun yol səfərlərində daha sadədir. Səfər profilinə görə müqayisə səhifəsindən hər ikisini yan-yana yoxlamaq tövsiyə olunur.",
      en: "The XC60 T8 (PHEV) lets you cover daily city distances on electricity, and if you can charge at home, it cuts fuel costs sharply. The Camry Hybrid (HEV) needs no charging, is priced lower, and is simpler for long trips. Use the comparison page to check both side by side based on your travel profile.",
      ru: "XC60 T8 (PHEV) позволяет ежедневные городские поездки проходить на электротяге, и при возможности заряжать дома существенно снижает расходы на топливо. Camry Hybrid (HEV) не требует зарядки, дешевле и проще для длинных поездок. Сравните обе модели на странице сравнения с учётом вашего профиля поездок.",
    },
    related_trim_ids: [
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_toyota_camry_25_hybrid_prestige_2025",
    ],
    published_at: NOW_BASE - 10 * DAY,
  },
  {
    content_id: "qa_rav4_hybrid_vs_tucson_hybrid",
    type: "qa",
    id: "qa-003",
    question: {
      az: "Toyota RAV4 Hybrid, yoxsa Hyundai Tucson Hybrid — hansı daha sərfəlidir?",
      en: "Toyota RAV4 Hybrid or Hyundai Tucson Hybrid — which is the better value?",
      ru: "Toyota RAV4 Hybrid или Hyundai Tucson Hybrid — что выгоднее?",
    },
    answer: {
      az: "RAV4 Hybrid (HEV) etibarlılığı ilə tanınır, yanacaq sərfiyyatı ortalama 5.5–6 L/100 km arasındadır və ikinci əl bazarda qiyməti yaxşı saxlanır. Tucson Hybrid N Line daha güclü (230 a.g.) və daha zəngin standart komplektasiya ilə təklif olunur — Hyundai-nin 5 illik zəmanəti ilə birlikdə. Hər iki model SUV seqmentində ailə istifadəsinə uyğundur; seçim büdcə və zəmanət üstünlüyünə görə dəyişir. Müqayisə üçün hər iki komplektasiyanı yan-yana qoş.",
      en: "The RAV4 Hybrid (HEV) is known for its reliability, averages 5.5–6 L/100 km, and holds its value well on the used market. The Tucson Hybrid N Line is more powerful (230 hp) with richer standard equipment and Hyundai's 5-year warranty. Both fit family use in the SUV segment; the choice depends on budget and which warranty terms matter to you. Compare both trims side by side.",
      ru: "RAV4 Hybrid (HEV) славится надёжностью, средний расход 5,5–6 л/100 км, а на вторичном рынке хорошо сохраняет цену. Tucson Hybrid N Line мощнее (230 л.с.) и предлагает более богатую стандартную комплектацию вместе с 5-летней гарантией Hyundai. Оба варианта подходят для семьи в сегменте SUV; выбор зависит от бюджета и приоритетных условий гарантии. Сравните обе комплектации рядом.",
    },
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
    question: {
      az: "Kia EV6 və Hyundai Ioniq 5 eyni platformadırsa, fərq nədir?",
      en: "If the Kia EV6 and Hyundai Ioniq 5 share a platform, what's the difference?",
      ru: "Если Kia EV6 и Hyundai Ioniq 5 на одной платформе, в чём разница?",
    },
    answer: {
      az: "Hər iki model Hyundai-Kia E-GMP 800V platforması üzərində qurulub və 18 dəqiqəlik sürətli şarj imkanını paylaşır. Fərqlər: EV6 daha kupé profilli, idman xarakterli sürüş hissi və daha sıx oturuş paketi təklif edir. Ioniq 5 isə daha geniş daxili məkan, düz döşəmə və V2L (Vehicle-to-Load) funksiyası ilə xidmət hibridi kimi mövqelənir. Yürüş məsafələri demək olar ki, eynidir (~480–510 km).",
      en: "Both models are built on the Hyundai-Kia E-GMP 800V platform and share 18-minute fast charging. Differences: the EV6 has a more coupé-like profile, a sportier driving feel, and a tighter cabin layout. The Ioniq 5 is positioned more as a utility hybrid with a more spacious interior, flat floor, and V2L (Vehicle-to-Load). Their ranges are nearly identical (~480–510 km).",
      ru: "Обе модели построены на платформе Hyundai-Kia E-GMP 800 В и поддерживают быструю зарядку за 18 минут. Различия: EV6 имеет более купеобразный профиль, более спортивную манеру езды и более плотную компоновку салона. Ioniq 5 — это скорее утилитарный гибрид с более просторным салоном, плоским полом и функцией V2L (Vehicle-to-Load). Запас хода почти одинаков (~480–510 км).",
    },
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
    question: {
      az: "Mənzildə yaşayıram, PHEV almaq məntiqli olarmı?",
      en: "I live in an apartment — does buying a PHEV make sense?",
      ru: "Я живу в квартире — есть ли смысл покупать PHEV?",
    },
    answer: {
      az: "Mənzildə yaşayan və ev wallbox quraşdırma imkanı olmayan istifadəçi üçün PHEV-in tam faydası məhdudlaşır — çünki gündəlik EV diapazonu (40–80 km) yalnız müntəzəm şarj zamanı yanacağa qənaət gətirir. İş yerində və ya yaxın ictimai AC nöqtələrində gündə bir dəfə şarj etmək imkanı varsa, PHEV hələ də mənalı seçimdir. Əks halda, klassik HEV (Toyota Camry / Corolla Hybrid, Toyota RAV4 Hybrid) şarjsız işləyir və daha az gündəlik narahatlıq yaradır.",
      en: "For an apartment dweller who can't install a home wallbox, a PHEV's full benefit is limited — its 40–80 km daily EV range only saves fuel with regular charging. If you can charge once a day at work or a nearby public AC point, a PHEV still makes sense. Otherwise, a classic HEV (Toyota Camry / Corolla Hybrid, Toyota RAV4 Hybrid) needs no charging and causes less daily friction.",
      ru: "Для жителя квартиры без возможности установить домашний wallbox польза PHEV ограничена — ежедневный электрозапас (40–80 км) экономит топливо только при регулярной зарядке. Если можно заряжать раз в день на работе или ближайшей публичной AC-точке, PHEV всё ещё имеет смысл. Иначе классический HEV (Toyota Camry / Corolla Hybrid, Toyota RAV4 Hybrid) работает без зарядки и создаёт меньше ежедневных хлопот.",
    },
    related_trim_ids: [
      "trim_volvo_xc60_t8_recharge_plus_2025",
      "trim_volvo_s60_t8_polestar_2025",
      "trim_toyota_camry_25_hybrid_prestige_2025",
    ],
    published_at: NOW_BASE - 2 * DAY,
  },
];
