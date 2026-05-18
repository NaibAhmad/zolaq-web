#!/usr/bin/env node
// Sprint 10I-C: i18n hardcoded-copy audit. Walks app/ and components/ looking
// for visible string literals that smell like AZ / RU / EN UI copy.
//
// Sprint 10I-D: per-area buckets (public / profile / dealer / admin / etc.)
// plus a top-N "files with risky visible hardcoded text" list.
//
// Sprint 10I-E: classification buckets (BLOCKING-public / BLOCKING-operator-
// chrome / ALLOWED / DEFERRED / OTHER), tighter NOT_COPY regex, --check=blocking.
//
// Sprint 10I-F: split operator-chrome into BLOCKING-admin / BLOCKING-dealer,
// promote profile to its own bucket, replace whole-file DEFERRED with a
// per-line `/* i18n:editor-body */` marker, count ALLOWED-proper-nouns-units
// instead of silently dropping them, emit --json output for closure reports,
// and add an EN/RU dictionary parity check so no AZ key falls back silently.

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components"];
const ARGS = process.argv.slice(2);
const FLAGS = new Set(ARGS.filter((a) => !a.includes("=") || a.startsWith("--check=")));
const CHECK_BLOCKING = FLAGS.has("--check=blocking");
const JSON_OUT = ARGS.find((a) => a.startsWith("--json="))?.split("=")[1] ?? null;
const BASELINE_PATH = ARGS.find((a) => a.startsWith("--baseline="))?.split("=")[1] ?? null;
const QUIET = FLAGS.has("--quiet");

// Allowlist tokens that look translatable but aren't (counted, not silently dropped).
const PROPER_NOUNS = new Set([
  "Zolaq",
  "BYD",
  "Volvo",
  "Hongqi",
  "Deepal",
  "WhatsApp",
  "JSON",
  "URL",
  "VIN",
  "SLA",
  "ID",
  "EV",
  "PHEV",
  "EREV",
  "PDF",
  "OTP",
  "API",
  "Q&A",
  "CTA",
  "Bakı",
]);
const TECH_UNITS = new Set(["km", "kW", "kWh", "AZN", "HP", "a.g.", "min", "max"]);

// AZ-specific characters that strongly imply Azerbaijani text.
const AZ_CHARS = /[əşçğıöüƏŞÇĞIİÖÜ]/;
// Cyrillic implies Russian text.
const RU_CHARS = /[Ѐ-ӿ]/;
// English visible UI: 2+ alphabetic words with at least one space.
const EN_PHRASE = /^[A-Z][a-z]+(?:\s+[A-Za-z][a-z]+){1,}/;

// Skip strings that are clearly not visible copy.
const NOT_COPY = [
  /^[\w./@:-]+$/, // identifiers, paths, slugs, urls
  /^#?[0-9a-fA-F]{3,8}$/, // hex colors
  /^[A-Z][A-Z0-9_]+$/, // SCREAMING_SNAKE
  /^[\d.,\s]+$/, // pure numeric
  /^\s*$/, // empty/whitespace
  /^\/api\//, // API path literals (often template literals)
  /^\/(?:cars|dealers|profile|admin|dealer|auth|content|encyclopedia|news|qa|compare|market-pulse|saved|viewed|history|leads|decisions|invoices|ads|users|roles|catalog|payments|media|offers|submissions)\b/,
  /\$\{/, // any literal still containing a template-placeholder fragment
];

const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[^\\\n])*?)\1/g;
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "dist"]);
const EDITOR_BODY_MARKER = /\/\*\s*i18n:editor-body\s*\*\//;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(full, files);
    } else if (/\.(tsx|jsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

// Classify a string literal: "copy" (real translation candidate),
// "allowed" (matched PROPER_NOUNS / TECH_UNITS / phone — still visible but
// intentionally not translated), or null (not visible copy at all).
function classifyLiteral(s) {
  if (s.length < 3 || s.length > 240) return null;
  for (const re of NOT_COPY) if (re.test(s)) return null;
  if (/^\s*$/.test(s)) return null;
  const trimmed = s.trim();
  const isAz = AZ_CHARS.test(s);
  const isRu = RU_CHARS.test(s);
  const isEn = EN_PHRASE.test(s) && /\s/.test(s);
  if (!isAz && !isRu && !isEn) return null;
  if (PROPER_NOUNS.has(trimmed)) return "allowed";
  if (TECH_UNITS.has(trimmed)) return "allowed";
  if (/^\+994/.test(s)) return "allowed";
  return "copy";
}

const NON_VISIBLE_ATTRS = [
  "className",
  "class",
  "id",
  "href",
  "src",
  "key",
  "role",
  "type",
  "name",
  "rel",
  "target",
  "for",
  "htmlFor",
];

function isInsideNonVisibleAttr(line) {
  for (const attr of NON_VISIBLE_ATTRS) {
    if (new RegExp(`${attr}\\s*=`).test(line) && !/>/.test(line.split(attr)[1] ?? "")) {
      return true;
    }
  }
  if (/\bdata-[a-z-]+\s*=/.test(line)) return true;
  if (/^\s*import\b/.test(line)) return true;
  if (/^\s*\/\//.test(line)) return true; // line comment
  if (/^\s*\*\s/.test(line)) return true; // JSDoc-style comment continuation
  return false;
}

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const findings = []; // real translation candidates
  const allowed = []; // proper-noun / unit / phone matches (visible but allow-listed)
  const editorBody = []; // lines marked /* i18n:editor-body */
  const lines = src.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (isInsideNonVisibleAttr(line)) return;
    const isEditorBodyLine = EDITOR_BODY_MARKER.test(line);
    let m;
    STRING_LITERAL.lastIndex = 0;
    while ((m = STRING_LITERAL.exec(line))) {
      const literal = m[2];
      const cls = classifyLiteral(literal);
      if (cls === null) continue;
      if (isEditorBodyLine) {
        editorBody.push({ line: idx + 1, text: literal });
        continue;
      }
      if (cls === "allowed") {
        allowed.push({ line: idx + 1, text: literal });
        continue;
      }
      findings.push({ line: idx + 1, text: literal });
    }
  });
  return { findings, allowed, editorBody };
}

// Map a file path to a logical area for the per-area summary.
function areaFor(relPath) {
  if (relPath.startsWith("app/(public)/")) return "public";
  if (relPath.startsWith("app/profile/")) return "profile";
  if (relPath.startsWith("app/dealer/")) return "dealer";
  if (relPath.startsWith("app/admin/")) return "admin";
  if (relPath.startsWith("app/auth/")) return "auth";
  if (relPath.startsWith("app/")) return "app-other";
  if (relPath.startsWith("components/home/")) return "public";
  if (relPath.startsWith("components/cars/")) return "public";
  if (relPath.startsWith("components/catalog/")) return "public";
  if (relPath.startsWith("components/compare/")) return "public";
  if (relPath.startsWith("components/dealers/")) return "public";
  if (relPath.startsWith("components/content/")) return "public";
  if (relPath.startsWith("components/decisions/")) return "profile";
  if (relPath.startsWith("components/leads/")) return "leads";
  if (relPath.startsWith("components/auth/")) return "auth";
  if (relPath.startsWith("components/dealer/")) return "dealer";
  if (relPath.startsWith("components/admin/")) return "admin";
  if (relPath.startsWith("components/i18n/")) return "shared";
  if (relPath.startsWith("components/layout/")) return "shared";
  if (relPath.startsWith("components/state/")) return "shared";
  if (relPath.startsWith("components/ui/")) return "shared";
  if (relPath.startsWith("components/")) return "components-other";
  return "other";
}

// Sprint 10I-F: six-bucket scheme.
// - BLOCKING-public:   public surfaces, auth, leads
// - BLOCKING-profile:  user profile (decisions, saved, viewed, history)
// - BLOCKING-dealer:   dealer panel + dealer chrome components
// - BLOCKING-admin:    admin/master panel + admin chrome components
// - DEFERRED-editor-body: per-line annotated body fallbacks in editor pages
// - ALLOWED-proper-nouns-units: visible strings allow-listed (counted only)
// - OTHER: shared layout / unclassified
function bucketFor(area) {
  switch (area) {
    case "public":
    case "leads":
    case "auth":
      return "BLOCKING-public";
    case "profile":
      return "BLOCKING-profile";
    case "dealer":
      return "BLOCKING-dealer";
    case "admin":
      return "BLOCKING-admin";
    case "shared":
      return "OTHER";
    default:
      return "OTHER";
  }
}

const BUCKET_ORDER = [
  "BLOCKING-public",
  "BLOCKING-profile",
  "BLOCKING-dealer",
  "BLOCKING-admin",
  "DEFERRED-editor-body",
  "ALLOWED-proper-nouns-units",
  "OTHER",
];

const BLOCKING_BUCKETS = new Set([
  "BLOCKING-public",
  "BLOCKING-profile",
  "BLOCKING-dealer",
  "BLOCKING-admin",
]);

function summarize(byDir, byArea, byBucket, fileTop) {
  const log = (...a) => {
    if (!QUIET) console.log(...a);
  };
  const totalDir = Object.values(byDir).reduce((a, b) => a + b, 0);
  log("\n— Summary (by directory) —");
  for (const [dir, n] of Object.entries(byDir).sort((a, b) => b[1] - a[1])) {
    log(`  ${dir.padEnd(40)} ${n}`);
  }
  log(`  ${"TOTAL".padEnd(40)} ${totalDir}`);

  log("\n— Summary (by area) —");
  for (const [area, n] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
    log(`  ${area.padEnd(40)} ${n}`);
  }

  log("\n— Summary (by Wave-0 bucket) —");
  for (const bucket of BUCKET_ORDER) {
    const n = byBucket[bucket] ?? 0;
    log(`  ${bucket.padEnd(40)} ${n}`);
  }

  log("\n— Top files with hardcoded copy —");
  const top = Object.entries(fileTop)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [file, n] of top) {
    log(`  ${file.padEnd(60)} ${n}`);
  }
}

// Dictionary parity check: every AZ leaf must exist in EN and RU.
function checkDictionaryParity() {
  const azPath = join(ROOT, "lib/i18n/translations/common.az.json");
  const enPath = join(ROOT, "lib/i18n/translations/common.en.json");
  const ruPath = join(ROOT, "lib/i18n/translations/common.ru.json");
  if (!existsSync(azPath) || !existsSync(enPath) || !existsSync(ruPath)) {
    return { ok: true, missing: [], note: "dictionary files not found, skipping parity check" };
  }
  const az = JSON.parse(readFileSync(azPath, "utf8"));
  const en = JSON.parse(readFileSync(enPath, "utf8"));
  const ru = JSON.parse(readFileSync(ruPath, "utf8"));
  const missing = [];
  for (const section of Object.keys(az)) {
    const azBranch = az[section];
    if (typeof azBranch !== "object" || azBranch === null) continue;
    const enBranch = en[section];
    const ruBranch = ru[section];
    for (const leaf of Object.keys(azBranch)) {
      if (!enBranch || enBranch[leaf] === undefined) {
        missing.push(`EN missing ${section}.${leaf}`);
      }
      if (!ruBranch || ruBranch[leaf] === undefined) {
        missing.push(`RU missing ${section}.${leaf}`);
      }
    }
  }
  return { ok: missing.length === 0, missing };
}

function loadBaseline(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function printDelta(current, baseline) {
  if (!baseline) {
    console.log(`\n— Baseline file not loadable, skipping delta —`);
    return;
  }
  console.log("\n— Delta vs baseline —");
  for (const bucket of BUCKET_ORDER) {
    const now = current.byBucket[bucket] ?? 0;
    const was = baseline.byBucket?.[bucket] ?? 0;
    const diff = now - was;
    const sign = diff > 0 ? "+" : "";
    console.log(`  ${bucket.padEnd(40)} ${String(was).padStart(5)} -> ${String(now).padStart(5)}  (${sign}${diff})`);
  }
}

function main() {
  const files = [];
  for (const dir of TARGET_DIRS) {
    try {
      walk(join(ROOT, dir), files);
    } catch {
      // dir might not exist; skip silently.
    }
  }

  const byDir = {};
  const byArea = {};
  const byBucket = {};
  const fileTop = {};
  let total = 0;
  if (!QUIET) console.log(`# i18n hardcoded-copy audit (${files.length} files scanned)\n`);
  for (const file of files) {
    const { findings, allowed, editorBody } = scanFile(file);
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    const topDir = rel.split("/").slice(0, 2).join("/");
    const area = areaFor(rel);

    if (allowed.length > 0) {
      byBucket["ALLOWED-proper-nouns-units"] =
        (byBucket["ALLOWED-proper-nouns-units"] ?? 0) + allowed.length;
    }
    if (editorBody.length > 0) {
      byBucket["DEFERRED-editor-body"] =
        (byBucket["DEFERRED-editor-body"] ?? 0) + editorBody.length;
    }
    if (findings.length === 0) continue;

    byDir[topDir] = (byDir[topDir] ?? 0) + findings.length;
    byArea[area] = (byArea[area] ?? 0) + findings.length;
    const bucket = bucketFor(area);
    byBucket[bucket] = (byBucket[bucket] ?? 0) + findings.length;
    fileTop[rel] = findings.length;
    total += findings.length;
    if (!QUIET) {
      console.log(`\n${rel}  [${bucket}]`);
      for (const f of findings) {
        const snippet = f.text.length > 80 ? `${f.text.slice(0, 77)}…` : f.text;
        console.log(`  ${String(f.line).padStart(5)}: "${snippet}"`);
      }
    }
  }
  summarize(byDir, byArea, byBucket, fileTop);

  // Dictionary parity.
  const parity = checkDictionaryParity();
  if (!QUIET) {
    console.log("\n— Dictionary parity (AZ → EN, RU) —");
    if (parity.ok) {
      console.log("  ✓ All AZ leaves exist in EN and RU.");
    } else {
      console.log(`  ✗ ${parity.missing.length} missing translations.`);
      for (const m of parity.missing.slice(0, 20)) console.log(`    ${m}`);
      if (parity.missing.length > 20) console.log(`    …and ${parity.missing.length - 20} more.`);
    }
  }

  console.log(
    `\nWarning gate: ${total} candidate strings. ` +
      "See docs/sprint-10/I18N_GOVERNANCE_AND_NO_HARDCODED_COPY.md.",
  );

  // JSON output (machine-readable for closure reports).
  if (JSON_OUT) {
    const payload = {
      generatedAt: new Date().toISOString(),
      totalCandidates: total,
      byDir,
      byArea,
      byBucket,
      fileTop,
      parityOk: parity.ok,
      parityMissing: parity.missing,
    };
    try {
      mkdirSync(dirname(JSON_OUT), { recursive: true });
    } catch {
      // best-effort
    }
    writeFileSync(JSON_OUT, JSON.stringify(payload, null, 2));
    console.log(`\nWrote JSON report → ${JSON_OUT}`);
  }

  // Baseline delta.
  if (BASELINE_PATH) {
    const baseline = loadBaseline(BASELINE_PATH);
    printDelta({ byBucket }, baseline);
  }

  if (CHECK_BLOCKING) {
    const blocking = Array.from(BLOCKING_BUCKETS).reduce(
      (acc, b) => acc + (byBucket[b] ?? 0),
      0,
    );
    if (blocking > 0 || !parity.ok) {
      if (blocking > 0) {
        console.error(
          `\n✗ --check=blocking failed: ${blocking} blocking candidates remain.`,
        );
      }
      if (!parity.ok) {
        console.error(
          `\n✗ --check=blocking failed: ${parity.missing.length} dictionary parity gaps.`,
        );
      }
      process.exit(1);
    }
    console.log(
      "\n✓ --check=blocking passed: no blocking candidates remain and dictionaries are in parity.",
    );
  }

  process.exit(0);
}

main();
