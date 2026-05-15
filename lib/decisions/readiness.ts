// Readiness score helper. Pure server-side function. Called ONLY by
// /api/profile/decision-center — UI components must consume the response,
// not recompute. Weights come straight from the Sprint 5 brief and sum to 100.

import { listLeadsForUser } from "@/lib/leads/store";
import { READINESS_FACTOR_LABELS_AZ, NEXT_BEST_ACTION_LABELS_AZ } from "./labels";
import { listSavedForUser, listViewedForUser } from "./store";
import { ROUTES } from "@/lib/routes";
import type {
  NextBestAction,
  NextBestActionCode,
  ReadinessFactorKey,
  ReadinessSummary,
  ScoreBreakdownEntry,
} from "./types";

const WEIGHTS: Record<ReadinessFactorKey, number> = {
  profile_completeness: 15,
  research_activity: 15,
  compare_activity: 20,
  official_offers: 25,
  test_drive_stage: 15,
  budget_match: 10,
};

const FACTOR_ORDER: ReadinessFactorKey[] = [
  "profile_completeness",
  "research_activity",
  "compare_activity",
  "official_offers",
  "test_drive_stage",
  "budget_match",
];

export function computeReadinessForUser(user_id: string): ReadinessSummary {
  const leads = listLeadsForUser(user_id);
  const saved = listSavedForUser(user_id);
  const viewed = listViewedForUser(user_id);

  const officialOfferLeads = leads.filter(
    (l) => l.state === "official_offer" || l.state === "second_offer"
  );
  const testDriveLeads = leads.filter(
    (l) =>
      l.state === "test_drive_requested" || l.state === "test_drive_confirmed"
  );

  // profile_completeness: no real profile form exists in MVP yet. Treat
  // "session exists" as a partial signal — caller is already authenticated.
  const profileAchieved = 0.6;
  const researchAchieved = clamp01(viewed.length / 5);
  const compareAchieved = clamp01(saved.length / 3);
  const officialOffersAchieved = clamp01(officialOfferLeads.length / 2);
  const testDriveAchieved = testDriveLeads.length > 0 ? 1 : 0;
  // budget_match: no budget input exists in MVP. Stubbed at 0.5.
  const budgetAchieved = 0.5;

  const achieved: Record<ReadinessFactorKey, number> = {
    profile_completeness: profileAchieved,
    research_activity: researchAchieved,
    compare_activity: compareAchieved,
    official_offers: officialOffersAchieved,
    test_drive_stage: testDriveAchieved,
    budget_match: budgetAchieved,
  };

  const breakdown: ScoreBreakdownEntry[] = FACTOR_ORDER.map((key) => ({
    key,
    weight_pct: WEIGHTS[key],
    achieved_pct: achieved[key],
    contribution: Math.round(WEIGHTS[key] * achieved[key]),
    label_az: READINESS_FACTOR_LABELS_AZ[key],
  }));

  const readiness_score = Math.min(
    100,
    Math.max(0, Math.round(breakdown.reduce((sum, b) => sum + b.contribution, 0)))
  );

  const next_best_action = pickNextBestAction({
    profileAchieved,
    viewedCount: viewed.length,
    savedCount: saved.length,
    officialOfferCount: officialOfferLeads.length,
    testDriveCount: testDriveLeads.length,
  });

  return { readiness_score, score_breakdown: breakdown, next_best_action };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

type NextBestInputs = {
  profileAchieved: number;
  viewedCount: number;
  savedCount: number;
  officialOfferCount: number;
  testDriveCount: number;
};

function pickNextBestAction(input: NextBestInputs): NextBestAction {
  const code = pickCode(input);
  const labels = NEXT_BEST_ACTION_LABELS_AZ[code];
  return {
    code,
    title_az: labels.title,
    description_az: labels.description,
    href: hrefForCode(code),
  };
}

function pickCode(input: NextBestInputs): NextBestActionCode {
  // Deterministic priority order. First unmet factor wins.
  if (input.profileAchieved < 1) return "complete_profile";
  if (input.viewedCount < 3) return "view_cars";
  if (input.savedCount < 2) return "create_comparison";
  if (input.officialOfferCount < 1) return "request_offer";
  if (input.officialOfferCount > 0 && input.testDriveCount === 0)
    return "request_test_drive";
  if (input.officialOfferCount > 0) return "review_offer";
  return "all_set";
}

function hrefForCode(code: NextBestActionCode): string | undefined {
  switch (code) {
    case "complete_profile":
      return ROUTES.profile;
    case "view_cars":
      return ROUTES.cars;
    case "create_comparison":
      return ROUTES.profileSaved;
    case "request_offer":
      return ROUTES.cars;
    case "request_test_drive":
      return ROUTES.profileLeads;
    case "review_offer":
      return ROUTES.profileLeads;
    case "all_set":
      return ROUTES.profileDecisions;
  }
}
