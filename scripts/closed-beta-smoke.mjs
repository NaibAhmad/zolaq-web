#!/usr/bin/env node
// Sprint 10B — closed beta smoke harness.
// Hits every public-facing route and the health endpoint with plain Node fetch
// (no Playwright dependency). Reports PASS/FAIL/SKIP/MANUAL_REQUIRED per check.
//
// Usage:
//   BETA_SMOKE_BASE_URL=https://staging.zolaq.az node scripts/closed-beta-smoke.mjs
//   (default: http://localhost:3000)

const BASE = (process.env.BETA_SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EXPECT_NOINDEX = process.env.STAGING_NO_INDEX === "true" || BASE.includes("staging.zolaq.az");

const results = [];
function record(section, name, status, detail = "") {
  results.push({ section, name, status, detail });
}
function expect(section, name, condition, detail = "") {
  record(section, name, condition ? "PASS" : "FAIL", detail);
}

async function http(path, init) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  try {
    const res = await fetch(url, { redirect: "manual", ...init });
    const text = await res.text();
    return { status: res.status, headers: res.headers, text, url, error: null };
  } catch (e) {
    return { status: 0, headers: new Headers(), text: "", url, error: e };
  }
}

// ─────────────────────────────────────────────────────────────
// A. Public route smoke (status 200)
// ─────────────────────────────────────────────────────────────
async function sectionA() {
  const routes = [
    "/",
    "/cars",
    "/cars?brand=toyota&model=camry",
    "/cars?generation=xv80",
    "/cars?year_from=2021&year_to=2024",
    "/compare",
    "/dealers",
    "/news",
    "/encyclopedia",
    "/qa",
  ];
  for (const p of routes) {
    const r = await http(p);
    if (r.error) {
      expect("A", `GET ${p}`, false, `network error: ${r.error.message}`);
      continue;
    }
    const ok = r.status === 200;
    expect("A", `GET ${p}`, ok, ok ? "" : `got ${r.status}`);
    if (ok) {
      const hasHtml = r.text.includes("<html") || r.text.includes("<!DOCTYPE");
      expect("A", `${p} returns HTML`, hasHtml, hasHtml ? "" : "no <html> marker");
      const has5xxMarker = /Internal Server Error|Server Error \(500\)/i.test(r.text);
      expect("A", `${p} has no 5xx body marker`, !has5xxMarker);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// B. Auth-gated route smoke (login pages render, /profile redirects)
// ─────────────────────────────────────────────────────────────
async function sectionB() {
  const loginPages = ["/admin/login", "/dealer/login", "/auth/otp"];
  for (const p of loginPages) {
    const r = await http(p);
    if (r.error) {
      expect("B", `GET ${p}`, false, `network error: ${r.error.message}`);
      continue;
    }
    expect("B", `GET ${p} returns 200`, r.status === 200, r.status === 200 ? "" : `got ${r.status}`);
  }
  // /profile must redirect unauthed users (3xx to /auth/otp).
  const profile = await http("/profile");
  if (!profile.error) {
    const loc = profile.headers.get("location") ?? "";
    expect(
      "B",
      "/profile redirects unauthed → /auth/otp",
      profile.status >= 300 && profile.status < 400 && loc.includes("/auth/otp"),
      `status=${profile.status} location=${loc}`
    );
  } else {
    expect("B", "/profile redirects unauthed → /auth/otp", false, `network error: ${profile.error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// C. Health endpoint
// ─────────────────────────────────────────────────────────────
async function sectionC() {
  const r = await http("/api/health");
  if (r.error) {
    expect("C", "GET /api/health", false, `network error: ${r.error.message}`);
    return;
  }
  expect("C", "GET /api/health returns 200 or 503", r.status === 200 || r.status === 503, `got ${r.status}`);
  expect("C", "GET /api/health Cache-Control: no-store", (r.headers.get("cache-control") ?? "").includes("no-store"));

  // Secret-leak scan. /api/health body MUST contain only boolean/string config
  // flags. Look for known secret-shaped fragments and bail if any appear.
  const body = r.text;
  let leak = null;
  const leakPatterns = [
    /BEGIN (RSA |EC )?PRIVATE KEY/,                  // PEM
    /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\./,    // JWT-ish
    /postgres(?:ql)?:\/\/[^\s"']+/,                   // db url
    /sk_(live|test)_[A-Za-z0-9]{16,}/,                // stripe-ish
    /AKIA[0-9A-Z]{16}/,                               // aws key id
    /["']?(api[_-]?key|password|secret)["']?\s*:\s*["'][^"']{12,}/i,
  ];
  for (const re of leakPatterns) {
    if (re.test(body)) {
      leak = re.toString();
      break;
    }
  }
  expect("C", "/api/health body contains no secret-shaped substrings", leak === null, leak ? `matched ${leak}` : "");

  // Parse + structural checks
  try {
    const j = JSON.parse(body);
    expect("C", "/api/health has status field", typeof j.status === "string", "");
    expect("C", "/api/health has checks object", j.checks && typeof j.checks === "object", "");
    expect(
      "C",
      "/api/health does not include any value with key 'password' / 'secret' / 'api_key'",
      !JSON.stringify(j).match(/"(password|secret|api[_-]?key|private[_-]?key)"\s*:\s*"[^"]+"/i),
      ""
    );
  } catch (e) {
    expect("C", "/api/health body is valid JSON", false, e.message);
  }
}

// ─────────────────────────────────────────────────────────────
// D. Noindex protection (only enforced when expected)
// ─────────────────────────────────────────────────────────────
async function sectionD() {
  if (!EXPECT_NOINDEX) {
    record("D", "X-Robots-Tag noindex (skipped — not staging)", "SKIP",
      "Set STAGING_NO_INDEX=true or point BETA_SMOKE_BASE_URL at staging.zolaq.az to enable");
    return;
  }
  const r = await http("/");
  if (r.error) {
    expect("D", "GET / for X-Robots-Tag check", false, `network error: ${r.error.message}`);
    return;
  }
  const tag = r.headers.get("x-robots-tag") ?? "";
  expect("D", "Staging response sets X-Robots-Tag", tag.toLowerCase().includes("noindex"), `got "${tag}"`);

  const robotsRes = await http("/robots.txt");
  if (!robotsRes.error) {
    expect("D", "Staging /robots.txt contains Disallow: /", /Disallow:\s*\//.test(robotsRes.text), "");
  }
}

// ─────────────────────────────────────────────────────────────
// E. Manual-only items
// ─────────────────────────────────────────────────────────────
function sectionE() {
  record("E", "Admin login round-trip", "MANUAL_REQUIRED", "see STAGING_DB_VERIFICATION_CHECKLIST.md §C");
  record("E", "Dealer login round-trip", "MANUAL_REQUIRED", "see STAGING_DB_VERIFICATION_CHECKLIST.md §D");
  record("E", "OTP request + verify with captured mock code", "MANUAL_REQUIRED", "code logged as [MOCK-OTP] on Vercel function logs");
  record("E", "Cross-tenant dealer isolation", "MANUAL_REQUIRED", "see STAGING_DB_VERIFICATION_CHECKLIST.md §E");
  record("E", "Media upload smoke", "MANUAL_REQUIRED", "local fs; ephemeral on Vercel cold-start");
  record("E", "Mobile 390px layout", "MANUAL_REQUIRED", "browser only");
  record("E", "Dark/light theme persistence", "MANUAL_REQUIRED", "browser only");
}

// ─────────────────────────────────────────────────────────────
// Driver
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`Sprint 10B closed-beta smoke against ${BASE}`);
  console.log(`Expect noindex: ${EXPECT_NOINDEX ? "yes" : "no"}\n`);

  // Reachability gate
  const ping = await http("/");
  if (ping.error || ping.status === 0) {
    console.error(`Cannot reach ${BASE}: ${ping.error?.message ?? "unknown"}`);
    process.exit(2);
  }

  const sections = [
    ["A", "Public routes", sectionA],
    ["B", "Auth-gated routes", sectionB],
    ["C", "Health endpoint", sectionC],
    ["D", "Noindex protection", sectionD],
    ["E", "Manual-only checklist", () => Promise.resolve(sectionE())],
  ];

  for (const [key, label, fn] of sections) {
    process.stdout.write(`\n[${key}] ${label}\n`);
    try {
      await fn();
    } catch (e) {
      record(key, `Section threw: ${label}`, "FAIL", e.message);
    }
    const items = results.filter((r) => r.section === key);
    for (const it of items) {
      const tag =
        it.status === "PASS" ? "  PASS"
        : it.status === "SKIP" ? "  SKIP"
        : it.status === "MANUAL_REQUIRED" ? "  MANUAL"
        : "  FAIL";
      console.log(`${tag}  ${it.name}${it.detail ? `  — ${it.detail}` : ""}`);
    }
  }

  const counts = results.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
    {}
  );
  console.log("\n────────────────────────────────────────────");
  console.log("Sprint 10B closed-beta smoke summary");
  console.log("────────────────────────────────────────────");
  console.log(`  PASS:             ${counts.PASS ?? 0}`);
  console.log(`  FAIL:             ${counts.FAIL ?? 0}`);
  console.log(`  SKIP:             ${counts.SKIP ?? 0}`);
  console.log(`  MANUAL_REQUIRED:  ${counts.MANUAL_REQUIRED ?? 0}`);
  console.log(`  Total checks:     ${results.length}`);

  if ((counts.FAIL ?? 0) > 0) {
    console.log("\nFailures:");
    for (const r of results.filter((x) => x.status === "FAIL")) {
      console.log(`  [${r.section}] ${r.name} — ${r.detail}`);
    }
  }

  process.exit((counts.FAIL ?? 0) > 0 ? 1 : 0);
}

main();
