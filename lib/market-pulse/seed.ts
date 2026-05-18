import type { BazarTopic, BazarVote } from "./types";

// Sprint 10I-C: question / option label / market_summary now carry az/en/ru
// so the homepage Bazar Nəbzi card and the /qa page localize correctly.
// Brand and model names stay identical across locales — they're proper nouns.

export const BAZAR_TOPIC_SEED: readonly BazarTopic[] = [
  {
    topic_id: "bz_daily_2026_05_16",
    question: {
      az: "Bu gün ən çox sorğu hansı brendə gedəcək?",
      en: "Which brand will get the most inquiries today?",
      ru: "На какой бренд сегодня будет больше всего запросов?",
    },
    cadence: "daily",
    status: "active",
    options: [
      { option_id: "opt_byd", label: "BYD" },
      { option_id: "opt_volvo", label: "Volvo" },
      { option_id: "opt_hongqi", label: "Hongqi" },
      {
        option_id: "opt_other",
        label: { az: "Digər", en: "Other", ru: "Другое" },
      },
    ],
    start_date: "2026-05-16",
    end_date: "2026-05-16",
    sponsored: false,
    created_by: "admin_content",
    created_at: Date.parse("2026-05-16T00:00:00+04:00"),
    updated_at: Date.parse("2026-05-16T00:00:00+04:00"),
  },
  {
    topic_id: "bz_weekly_2026_w20",
    question: {
      az: "Bu həftə ən çox maraq görəcək model hansıdır?",
      en: "Which model will draw the most interest this week?",
      ru: "Какая модель вызовет наибольший интерес на этой неделе?",
    },
    cadence: "weekly",
    status: "active",
    options: [
      { option_id: "opt_song_plus", label: "BYD Song Plus" },
      { option_id: "opt_deepal_s07", label: "Deepal S07" },
      { option_id: "opt_volvo_xc40", label: "Volvo XC40" },
      { option_id: "opt_h5", label: "Hongqi H5" },
    ],
    start_date: "2026-05-11",
    end_date: "2026-05-17",
    sponsored: false,
    created_by: "admin_content",
    created_at: Date.parse("2026-05-11T08:00:00+04:00"),
    updated_at: Date.parse("2026-05-11T08:00:00+04:00"),
  },
  {
    topic_id: "bz_monthly_2026_05",
    question: {
      az: "EV marağı bu ay artacaq, azalacaq, yoxsa sabit qalacaq?",
      en: "Will EV interest grow, drop, or stay flat this month?",
      ru: "Интерес к электромобилям в этом месяце вырастет, упадёт или останется прежним?",
    },
    cadence: "monthly",
    status: "active",
    options: [
      {
        option_id: "opt_up",
        label: { az: "Artacaq", en: "Will grow", ru: "Вырастет" },
      },
      {
        option_id: "opt_flat",
        label: {
          az: "Sabit qalacaq",
          en: "Will stay flat",
          ru: "Останется прежним",
        },
      },
      {
        option_id: "opt_down",
        label: { az: "Azalacaq", en: "Will drop", ru: "Упадёт" },
      },
    ],
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    sponsored: false,
    created_by: "admin_content",
    created_at: Date.parse("2026-05-01T08:00:00+04:00"),
    updated_at: Date.parse("2026-05-01T08:00:00+04:00"),
  },
  {
    topic_id: "bz_weekly_2026_w19_archive",
    question: {
      az: "Keçən həftə ən çox müqayisə edilən model?",
      en: "Most compared model last week?",
      ru: "Самая сравниваемая модель на прошлой неделе?",
    },
    cadence: "weekly",
    status: "resolved",
    options: [
      { option_id: "opt_song", label: "BYD Song Plus" },
      { option_id: "opt_deepal", label: "Deepal S07" },
      { option_id: "opt_xc40", label: "Volvo XC40" },
    ],
    start_date: "2026-05-04",
    end_date: "2026-05-10",
    sponsored: false,
    market_summary: {
      az: "Bu həftə BYD Song Plus müqayisədə öndə oldu — istifadəçilər qiymət/şəbəkə müqayisəsini əsas etdi.",
      en: "BYD Song Plus led the comparisons this week — users focused on price and charging network.",
      ru: "На этой неделе лидером сравнений стал BYD Song Plus — пользователи учитывали цену и зарядную сеть.",
    },
    created_by: "admin_content",
    created_at: Date.parse("2026-05-04T08:00:00+04:00"),
    updated_at: Date.parse("2026-05-11T09:00:00+04:00"),
    closed_at: Date.parse("2026-05-10T23:59:00+04:00"),
    resolved_at: Date.parse("2026-05-11T09:00:00+04:00"),
  },
  {
    topic_id: "bz_monthly_2026_04_archive",
    question: {
      az: "Aprel ayında qiymət istiqaməti necə oldu?",
      en: "How did prices trend in April?",
      ru: "Каким был тренд цен в апреле?",
    },
    cadence: "monthly",
    status: "archived",
    options: [
      {
        option_id: "opt_a_up",
        label: { az: "Artdı", en: "Rose", ru: "Выросли" },
      },
      {
        option_id: "opt_a_flat",
        label: {
          az: "Sabit qaldı",
          en: "Stayed flat",
          ru: "Остались прежними",
        },
      },
      {
        option_id: "opt_a_down",
        label: { az: "Azaldı", en: "Fell", ru: "Упали" },
      },
    ],
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    sponsored: false,
    market_summary: {
      az: "Aprel ayında orta listinq qiyməti sabit qaldı — kiçik dalğalanma model səviyyəsində oldu.",
      en: "Average listing price stayed flat in April — small fluctuations only at the model level.",
      ru: "Средняя цена объявлений в апреле осталась прежней — небольшие колебания только на уровне моделей.",
    },
    created_by: "admin_content",
    created_at: Date.parse("2026-04-01T08:00:00+04:00"),
    updated_at: Date.parse("2026-05-02T09:00:00+04:00"),
    closed_at: Date.parse("2026-04-30T23:59:00+04:00"),
    resolved_at: Date.parse("2026-05-01T09:00:00+04:00"),
    archived_at: Date.parse("2026-05-02T09:00:00+04:00"),
  },
];

// A small seed of votes against the active topics so percentages render.
export const BAZAR_VOTE_SEED: readonly BazarVote[] = [
  ...["u_seed_1", "u_seed_2", "u_seed_3"].map((u, i) => ({
    vote_id: `bv_seed_d_${i}`,
    topic_id: "bz_daily_2026_05_16",
    option_id: i === 2 ? "opt_volvo" : "opt_byd",
    user_id: u,
    created_at: Date.parse("2026-05-16T09:00:00+04:00") + i * 1000,
  })),
  ...["u_seed_1", "u_seed_4", "u_seed_5", "u_seed_6"].map((u, i) => ({
    vote_id: `bv_seed_w_${i}`,
    topic_id: "bz_weekly_2026_w20",
    option_id:
      i === 0
        ? "opt_song_plus"
        : i === 1
          ? "opt_deepal_s07"
          : i === 2
            ? "opt_song_plus"
            : "opt_volvo_xc40",
    user_id: u,
    created_at: Date.parse("2026-05-12T10:00:00+04:00") + i * 1000,
  })),
  ...["u_seed_1", "u_seed_2", "u_seed_7"].map((u, i) => ({
    vote_id: `bv_seed_m_${i}`,
    topic_id: "bz_monthly_2026_05",
    option_id: i === 1 ? "opt_flat" : "opt_up",
    user_id: u,
    created_at: Date.parse("2026-05-03T10:00:00+04:00") + i * 1000,
  })),
];
