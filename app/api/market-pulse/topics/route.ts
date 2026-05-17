import { NextResponse } from "next/server";
import {
  aggregateTopic,
  hasVoted,
  listTopics,
} from "@/lib/market-pulse/store";
import {
  type BazarCadence,
  BAZAR_CADENCES,
} from "@/lib/market-pulse/types";
import { getSession } from "@/lib/auth/session";

// Public list. Optional `cadence` filter; only active + closed + resolved +
// archived are returned (no drafts / rejected / pending).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cadence = url.searchParams.get("cadence") as BazarCadence | null;
  const view = url.searchParams.get("view"); // "active" | "history"
  const session = await getSession();

  const status =
    view === "history"
      ? (["closed", "resolved", "archived"] as const)
      : (["active", "closed", "resolved", "archived"] as const);

  let rows = listTopics({ status });
  if (cadence && BAZAR_CADENCES.includes(cadence)) {
    rows = rows.filter((t) => t.cadence === cadence);
  }
  return NextResponse.json({
    topics: rows.map((t) => {
      const agg = aggregateTopic(t.topic_id);
      const userVote = session ? hasVoted(t.topic_id, session.userId) : null;
      return {
        ...t,
        aggregate: agg,
        user_vote_option_id: userVote?.option_id ?? null,
      };
    }),
  });
}
