import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { createTopic, listTopics } from "@/lib/market-pulse/store";
import {
  BAZAR_CADENCES,
  type BazarCadence,
} from "@/lib/market-pulse/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(
    request,
    "super_admin",
    "content_manager",
  );
  if ("response" in auth) return auth.response;
  return NextResponse.json({ topics: listTopics() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const question = pick(body, "question");
  const cadence = pick(body, "cadence") as BazarCadence | undefined;
  const start_date = pick(body, "start_date");
  const end_date = pick(body, "end_date");
  if (
    !question ||
    !cadence ||
    !BAZAR_CADENCES.includes(cadence) ||
    !start_date ||
    !end_date
  ) {
    return NextResponse.json(
      { error: "question, cadence, start_date, end_date required" },
      { status: 400 },
    );
  }
  // Options come from option_1..option_4 fields. 3-4 required.
  const options = [1, 2, 3, 4]
    .map((n) => pick(body, `option_${n}`))
    .filter((s): s is string => !!s && s.trim().length > 0)
    .map((label) => ({ label }));
  if (options.length < 3) {
    return NextResponse.json(
      { error: "at least 3 options required" },
      { status: 400 },
    );
  }
  const sponsored = pick(body, "sponsored") === "true";
  const row = createTopic(
    {
      question,
      cadence,
      options,
      start_date,
      end_date,
      sponsored,
      sponsor_ad_request_id: pick(body, "sponsor_ad_request_id"),
      sponsor_name: pick(body, "sponsor_name"),
      created_by: auth.session.adminId,
    },
    {
      actor_type: "admin",
      actor_id: auth.session.adminId,
      role: auth.session.role,
    },
  );
  return respond(
    request,
    { topic: row },
    `/admin/market-pulse/${row.topic_id}`,
  );
}
