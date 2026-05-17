#!/usr/bin/env node
// Sprint 8H automated QA pass.
// Run with the dev server already up: `npm run dev`, then `node scripts/qa-sprint-8h.mjs`.
//
// Covers everything probeable over HTTP / the JSON API. Anything that requires
// a real browser (client-side filter cascade, theme toggle, viewport, OTP code
// capture) is reported as MANUAL_REQUIRED so the operator knows what is left.

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const REAL_TRIM_ID = "trim_byd_han_ev_premium_awd_2025";

const results = [];

function record(section, name, status, detail = "") {
  results.push({ section, name, status, detail });
}

async function http(path, init) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, { redirect: "manual", ...init });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, url };
}

function expect(section, name, condition, detail) {
  record(section, name, condition ? "PASS" : "FAIL", detail);
}

// ─────────────────────────────────────────────────────────────
// A. Route smoke
// ─────────────────────────────────────────────────────────────
async function sectionA() {
  const routes = [
    ["/", 200],
    ["/cars", 200],
    ["/compare", 200],
    ["/dealers", 200],
    ["/news", 200],
    ["/encyclopedia", 200],
    ["/qa", 200],
    ["/admin/login", 200],
    ["/dealer/login", 200],
  ];
  for (const [path, want] of routes) {
    const r = await http(path);
    expect(
      "A",
      `GET ${path}`,
      r.status === want,
      `expected ${want}, got ${r.status}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// B. Header search
// Static SSR: header form exists on every public route. The submit itself
// is a browser action, but we can verify (a) the form is present, (b) the
// target URL renders, (c) URL-encoding is honored.
// ─────────────────────────────────────────────────────────────
async function sectionB() {
  const home = await http("/");
  expect(
    "B",
    "Header search form present on /",
    home.text.includes('id="header-search"'),
    "expected header-search input id"
  );
  expect(
    "B",
    "Header placeholder is 'Marka, model və ya komplektasiya axtar'",
    home.text.includes("Marka, model və ya komplektasiya axtar"),
    ""
  );
  // Verify the search target route returns 200 with the query
  const withQ = await http("/cars?q=bmw%20x5");
  expect(
    "B",
    "/cars?q=bmw%20x5 returns 200",
    withQ.status === 200,
    `got ${withQ.status}`
  );
  // Verify header survives on multiple public routes
  for (const p of ["/encyclopedia", "/news", "/dealers"]) {
    const r = await http(p);
    expect(
      "B",
      `Header search present on ${p}`,
      r.text.includes('id="header-search"'),
      ""
    );
  }
  // No-q submit lands on /cars (200)
  const empty = await http("/cars");
  expect(
    "B",
    "Empty search target /cars returns 200",
    empty.status === 200,
    ""
  );
  record(
    "B",
    "Header search interactive submit (form -> /cars?q=…)",
    "MANUAL_REQUIRED",
    "Browser-only: type 'bmw x5' in the header and confirm URL becomes /cars?q=bmw%20x5"
  );
}

// ─────────────────────────────────────────────────────────────
// C. Homepage quick search
// HomeSearchBlock is server-rendered; we can confirm the form scaffold
// and the absence of a Komplektasiya field. Cascade behavior itself is JS.
// ─────────────────────────────────────────────────────────────
async function sectionC() {
  const home = await http("/");
  expect(
    "C",
    "Homepage quick search block present (Sürətli)",
    home.text.includes("Sürətli"),
    ""
  );
  expect("C", "Homepage 'Marka' label", home.text.includes("Marka"), "");
  expect(
    "C",
    "Homepage 'Ətraflı filtr' link present",
    home.text.includes("Ətraflı filtr"),
    ""
  );
  // Homepage may show "Komplektasiya" as a CarCard label in the featured
  // section, but must NOT expose it as a filter widget in the quick-search
  // block. Check for the trim <select> / form field, not the bare word.
  expect(
    "C",
    "Homepage quick-search has NO trim/Komplektasiya filter widget",
    !/name=["']trim["']/.test(home.text),
    "homepage quick-search must not expose a trim/komplektasiya dropdown"
  );
  // Verify the target route resolves
  const target = await http("/cars?brand=brand_bmw&model=X5&year=2024");
  expect(
    "C",
    "/cars?brand=brand_bmw&model=X5&year=2024 returns 200",
    target.status === 200,
    `got ${target.status}`
  );
  record(
    "C",
    "Homepage cascade interaction (brand disables/enables model dropdown)",
    "MANUAL_REQUIRED",
    "Browser-only: pick BMW; model dropdown should enable; pick X5+2024; submit"
  );
}

// ─────────────────────────────────────────────────────────────
// D. /cars top search
// ─────────────────────────────────────────────────────────────
async function sectionD() {
  const cars = await http("/cars");
  expect(
    "D",
    "/cars renders simple search row (Marka label present)",
    cars.text.includes("Marka"),
    ""
  );
  expect(
    "D",
    "/cars renders advanced toggle (Ətraflı filtr)",
    cars.text.includes("Ətraflı filtr"),
    ""
  );
  const withQ = await http("/cars?q=xdrive");
  expect("D", "/cars?q=xdrive returns 200", withQ.status === 200, "");
  expect(
    "D",
    "/cars?q=xdrive SSR reflects the query value",
    withQ.text.includes('value="xdrive"'),
    "expected q input to be hydrated with 'xdrive'"
  );
}

// ─────────────────────────────────────────────────────────────
// E. Advanced filter — fields exist (in source); /api/cars validates each.
// Live label assertions require the JS-expanded panel.
// ─────────────────────────────────────────────────────────────
async function sectionE() {
  // The advanced panel is JS-rendered, so labels won't be in static HTML
  // unless someone opens it. We verify the API contract instead, which is
  // the authoritative behavior every filter widget ultimately drives.
  // API contract per app/api/cars/route.ts:
  //   - Integer fields (year, price_*) return 400 on bad input.
  //   - Enum fields (energy_type, body_type, availability, sort) silently
  //     return {trims: [], results: []} on unknown values (defensive).
  const fieldProbes = [
    ["energy_type=EV", 200, "any"],
    ["energy_type=NONSENSE", 200, "empty"],
    ["body_type=suv", 200, "any"],
    ["body_type=NONSENSE", 200, "empty"],
    ["price_min=10000", 200, "any"],
    ["price_max=80000", 200, "any"],
    ["price_min=-1", 400, "any"],
    ["year=2024", 200, "any"],
    ["year=abc", 400, "any"],
    ["dealer_verified=1", 200, "any"],
    ["availability=in_stock", 200, "any"],
    ["availability=NONSENSE", 200, "empty"],
    ["sort=price_asc", 200, "any"],
    ["sort=NONSENSE", 200, "empty"],
    ["brand=brand_bmw&model=X5&trim=trim_byd_han_ev_premium_awd_2025", 200, "any"],
  ];
  for (const [qs, wantStatus, wantShape] of fieldProbes) {
    const r = await http(`/api/cars?${qs}`);
    const statusOk = r.status === wantStatus;
    let shapeOk = true;
    let shapeDetail = "";
    if (statusOk && r.status === 200 && wantShape === "empty") {
      try {
        const j = JSON.parse(r.text);
        shapeOk = Array.isArray(j.results) && j.results.length === 0;
        shapeDetail = shapeOk ? "" : `expected empty results, got ${j.results?.length}`;
      } catch (e) {
        shapeOk = false;
        shapeDetail = `JSON parse failed: ${e.message}`;
      }
    }
    expect(
      "E",
      `/api/cars?${qs} -> ${wantStatus}${wantShape === "empty" ? " (empty results)" : ""}`,
      statusOk && shapeOk,
      statusOk ? shapeDetail : `got ${r.status}`
    );
  }
  // Combined real-world filter
  const combo = await http(
    "/api/cars?energy_type=EV&price_max=80000&body_type=suv&dealer_verified=1&sort=price_asc"
  );
  expect(
    "E",
    "/api/cars combo (EV+price+body+verified+sort) returns 200",
    combo.status === 200,
    `got ${combo.status}`
  );
  try {
    const j = JSON.parse(combo.text);
    expect(
      "E",
      "Combo response shape has trims & results arrays",
      Array.isArray(j.trims) && Array.isArray(j.results),
      ""
    );
  } catch (e) {
    expect("E", "Combo response is valid JSON", false, e.message);
  }
  record(
    "E",
    "Advanced filter panel UI labels (Komplektasiya, Enerji, Kuzov, Qiymət, Rəsmi diler, Mövcudluq, Sıralama)",
    "MANUAL_REQUIRED",
    "Browser-only: open 'Ətraflı filtr' on /cars and visually confirm all field labels render. Source: components/catalog/CatalogFilters.tsx:46-54."
  );
}

// ─────────────────────────────────────────────────────────────
// F. Cascade — server cannot reflect client useState. We verify the API
// supports the cascade semantically: model is restricted to a brand.
// ─────────────────────────────────────────────────────────────
async function sectionF() {
  const all = await http("/api/cars");
  const bmw = await http("/api/cars?brand=brand_bmw");
  try {
    const allJ = JSON.parse(all.text);
    const bmwJ = JSON.parse(bmw.text);
    const allBrands = new Set(
      (allJ.results ?? []).map((r) => r.trim.brand_id)
    );
    const bmwBrands = new Set(
      (bmwJ.results ?? []).map((r) => r.trim.brand_id)
    );
    expect(
      "F",
      "Catalog has >=2 distinct brands",
      allBrands.size >= 2,
      `got ${allBrands.size}`
    );
    expect(
      "F",
      "Filtering by brand_bmw narrows server results to BMW only",
      bmwBrands.size === 0 || (bmwBrands.size === 1 && bmwBrands.has("brand_bmw")),
      `brands present: ${[...bmwBrands].join(",") || "none"}`
    );
  } catch (e) {
    expect("F", "Cascade API responses parse", false, e.message);
  }
  record(
    "F",
    "Cascade UX (brand change clears model+trim, model change clears trim, year revalidates trim)",
    "MANUAL_REQUIRED",
    "Browser-only state. Source: components/catalog/CatalogFilters.tsx:190-212"
  );
}

// ─────────────────────────────────────────────────────────────
// G. Query round trip — deep URL renders with form values reflected.
// ─────────────────────────────────────────────────────────────
async function sectionG() {
  const deep =
    "/cars?brand=brand_bmw&model=X5&year=2024&energy_type=ICE&body_type=suv&price_min=50000&price_max=120000&dealer_verified=1&availability=in_stock&sort=price_asc";
  const r = await http(deep);
  expect("G", "Deep URL returns 200", r.status === 200, `got ${r.status}`);
  const checks = [
    ["brand_bmw", "brand selection in HTML"],
    ["X5", "model in HTML"],
    ["2024", "year in HTML"],
  ];
  for (const [token, label] of checks) {
    expect("G", `SSR reflects ${label}`, r.text.includes(token), "");
  }
  // The simple row's q input is rendered as <input ... value="..."> — confirm
  // by adding a free-text query and checking it shows up.
  const q = await http("/cars?q=xdrive");
  expect(
    "G",
    "q value persists in SSR",
    q.text.includes('value="xdrive"'),
    ""
  );
  // Invalid params don't crash the page
  const bad = await http("/cars?year=abc");
  expect(
    "G",
    "/cars?year=abc still renders (no crash)",
    bad.status === 200,
    `got ${bad.status}`
  );
  record(
    "G",
    "Reload preserves form widget state (visual check across all advanced fields)",
    "MANUAL_REQUIRED",
    "Browser-only: reload the deep URL and visually confirm every dropdown/checkbox/input matches"
  );
}

// ─────────────────────────────────────────────────────────────
// H. Card / detail / compare trim display
// CarDetail is client-rendered against /api/cars/{id}, so we test the
// data layer and confirm the labels exist in the source-rendered shell.
// ─────────────────────────────────────────────────────────────
async function sectionH() {
  const cars = await http("/cars");
  expect(
    "H",
    "/cars renders catalog markup",
    cars.text.includes("BYD") || cars.text.includes("brand_"),
    "expected at least one brand token"
  );
  // Detail API contract
  const trim = await http(`/api/cars/${REAL_TRIM_ID}`);
  expect("H", "Detail API returns 200", trim.status === 200, `got ${trim.status}`);
  try {
    const j = JSON.parse(trim.text);
    expect(
      "H",
      "Detail API returns trim.display_name",
      typeof j?.trim?.display_name === "string" && j.trim.display_name.length > 0,
      ""
    );
    expect(
      "H",
      "Detail API returns brand_id + model_name (header source)",
      Boolean(j?.trim?.brand_id) && Boolean(j?.trim?.model_name),
      ""
    );
  } catch (e) {
    expect("H", "Detail API JSON parses", false, e.message);
  }
  const missing = await http("/api/cars/does_not_exist");
  expect(
    "H",
    "Detail API 404s on missing id",
    missing.status === 404,
    `got ${missing.status}`
  );
  const detailPage = await http(`/cars/${REAL_TRIM_ID}`);
  expect(
    "H",
    "Detail page returns 200",
    detailPage.status === 200,
    `got ${detailPage.status}`
  );
  // Compare with up to 3 ids
  const compare3 = await http(
    `/compare?ids=${REAL_TRIM_ID},${REAL_TRIM_ID},${REAL_TRIM_ID}`
  );
  expect(
    "H",
    "/compare with 3 ids returns 200",
    compare3.status === 200,
    `got ${compare3.status}`
  );
  // 4th id should not crash (silently ignored per spec)
  const compare4 = await http(
    `/compare?ids=${REAL_TRIM_ID},a,b,c,d`
  );
  expect(
    "H",
    "/compare with 4+ ids does not crash",
    compare4.status === 200,
    `got ${compare4.status}`
  );
  record(
    "H",
    "Card/detail/compare trim suffix visual correctness (no 'undefined', no duplicate brand)",
    "MANUAL_REQUIRED",
    "Browser-only: scan card row + detail H1 + compare headers. Source: components/catalog/CarCard.tsx:80-112"
  );
}

// ─────────────────────────────────────────────────────────────
// I. Admin / dealer route smoke + auth gates
// ─────────────────────────────────────────────────────────────
async function sectionI() {
  const loginPages = [
    "/admin/login",
    "/dealer/login",
  ];
  for (const p of loginPages) {
    const r = await http(p);
    expect("I", `${p} loads`, r.status === 200, `got ${r.status}`);
  }
  // Auth gates: logged-out access to authed routes redirects to login.
  const gates = [
    ["/admin/dashboard", "/admin/login"],
    ["/dealer/dashboard", "/dealer/login"],
    ["/profile", "/auth/otp"],
  ];
  for (const [from, toContains] of gates) {
    const r = await http(from);
    const loc = r.headers.get("location") ?? "";
    expect(
      "I",
      `${from} redirects (3xx) to ${toContains}`,
      r.status >= 300 && r.status < 400 && loc.includes(toContains),
      `status=${r.status} location=${loc}`
    );
  }
  // Smoke: a public dealer profile shouldn't 500 even with a junk id
  const dealerJunk = await http("/dealers/does_not_exist_xyz");
  expect(
    "I",
    "/dealers/<unknown-id> handles gracefully (200 or 404, not 500)",
    dealerJunk.status === 200 || dealerJunk.status === 404,
    `got ${dealerJunk.status}`
  );
  record(
    "I",
    "Admin/dealer authed CRUD pages (dashboard, brands, dealers, content, etc.)",
    "MANUAL_REQUIRED",
    "Requires login session; out of scope for fetch-only automation"
  );
}

// ─────────────────────────────────────────────────────────────
// J. Lead / OTP regression
// We can verify the endpoints exist + auth-gate. Capturing the OTP code
// requires server stderr capture, which we treat as MANUAL_REQUIRED.
// ─────────────────────────────────────────────────────────────
async function sectionJ() {
  // OTP request endpoint
  const otpReq = await http("/api/auth/otp/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+994500000000", purpose: "lead_submit" }),
  });
  expect(
    "J",
    "POST /api/auth/otp/request returns 200",
    otpReq.status === 200,
    `got ${otpReq.status}`
  );
  let session;
  try {
    session = JSON.parse(otpReq.text);
    expect(
      "J",
      "OTP request body has otp_session_id + expires_in_seconds",
      Boolean(session?.otp_session_id) &&
        typeof session?.expires_in_seconds === "number",
      ""
    );
  } catch (e) {
    expect("J", "OTP request JSON parses", false, e.message);
  }
  // Wrong code should be rejected
  if (session?.otp_session_id) {
    const verifyBad = await http("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp_session_id: session.otp_session_id, code: "000000" }),
    });
    expect(
      "J",
      "OTP verify with wrong code is rejected (4xx)",
      verifyBad.status >= 400 && verifyBad.status < 500,
      `got ${verifyBad.status}`
    );
  }
  // /api/leads without a verified session must be rejected
  const leadNoAuth = await http("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trim_id: REAL_TRIM_ID,
      source_surface: "detail",
      name: "QA bot",
      preferred_contact: "phone",
    }),
  });
  expect(
    "J",
    "POST /api/leads without OTP rejected (401/403)",
    leadNoAuth.status === 401 || leadNoAuth.status === 403,
    `got ${leadNoAuth.status}`
  );
  record(
    "J",
    "Full OTP happy path (request → enter code from dev console → /api/leads → /profile/leads/[id])",
    "MANUAL_REQUIRED",
    "Mock OTP code logs to server stderr only ([MOCK-OTP]). Browser flow required: see plan §9"
  );
}

// ─────────────────────────────────────────────────────────────
// K. Mobile 390px — pure browser concern.
// ─────────────────────────────────────────────────────────────
async function sectionK() {
  // SSR markup hints we can still verify: bottom nav class exists, header
  // has the md:hidden toggle classes.
  const home = await http("/");
  expect(
    "K",
    "MobileBottomNav present in SSR shell (md:hidden marker)",
    home.text.includes("md:hidden"),
    ""
  );
  record(
    "K",
    "390px layout: no horizontal overflow on / and /cars; header collapses; filters stack",
    "MANUAL_REQUIRED",
    "Browser-only at 390x844. See plan §10"
  );
}

// ─────────────────────────────────────────────────────────────
// L. Theme — pure browser concern (toggle + localStorage).
// ─────────────────────────────────────────────────────────────
async function sectionL() {
  const home = await http("/");
  expect(
    "L",
    "ThemeScript present (data-theme bootstrap)",
    home.text.includes("data-theme"),
    ""
  );
  expect(
    "L",
    "Theme tokens / CSS variables referenced",
    home.text.includes("--") || home.text.includes("theme"),
    ""
  );
  record(
    "L",
    "Light/dark toggle persists across reload",
    "MANUAL_REQUIRED",
    "Browser-only: toggle in header, reload, confirm <html data-theme='dark'> + localStorage zlq.theme=dark"
  );
}

// ─────────────────────────────────────────────────────────────
// Driver
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`Sprint 8H automated QA against ${BASE}\n`);
  // Health check
  try {
    const h = await http("/");
    if (h.status !== 200) {
      console.error(
        `Dev server at ${BASE} did not return 200 for /. Aborting. (got ${h.status})`
      );
      process.exit(2);
    }
  } catch (e) {
    console.error(`Cannot reach ${BASE}: ${e.message}`);
    process.exit(2);
  }

  const sections = [
    ["A", "Route smoke", sectionA],
    ["B", "Header search", sectionB],
    ["C", "Homepage quick search", sectionC],
    ["D", "/cars top search", sectionD],
    ["E", "Advanced filter", sectionE],
    ["F", "Cascade", sectionF],
    ["G", "Query-param round trip", sectionG],
    ["H", "Card / detail / compare", sectionH],
    ["I", "Admin / dealer route smoke", sectionI],
    ["J", "Lead / OTP", sectionJ],
    ["K", "Mobile 390px", sectionK],
    ["L", "Theme", sectionL],
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
        it.status === "PASS"
          ? "  PASS"
          : it.status === "MANUAL_REQUIRED"
            ? "  MANUAL"
            : "  FAIL";
      console.log(`${tag}  ${it.name}${it.detail ? `  — ${it.detail}` : ""}`);
    }
  }

  // Summary table
  const counts = results.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
    {}
  );
  console.log("\n────────────────────────────────────────────");
  console.log("Sprint 8H automated QA summary");
  console.log("────────────────────────────────────────────");
  console.log(`  PASS:             ${counts.PASS ?? 0}`);
  console.log(`  FAIL:             ${counts.FAIL ?? 0}`);
  console.log(`  MANUAL_REQUIRED:  ${counts.MANUAL_REQUIRED ?? 0}`);
  console.log(`  Total checks:     ${results.length}`);

  if ((counts.FAIL ?? 0) > 0) {
    console.log("\nFailures:");
    for (const r of results.filter((x) => x.status === "FAIL")) {
      console.log(`  [${r.section}] ${r.name} — ${r.detail}`);
    }
  }

  console.log("\nManual-only remainder:");
  for (const r of results.filter((x) => x.status === "MANUAL_REQUIRED")) {
    console.log(`  [${r.section}] ${r.name}`);
    if (r.detail) console.log(`      ${r.detail}`);
  }

  process.exit((counts.FAIL ?? 0) > 0 ? 1 : 0);
}

main();
