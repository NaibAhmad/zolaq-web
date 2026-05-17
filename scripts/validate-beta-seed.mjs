#!/usr/bin/env node
// Sprint 10B — beta seed validator.
// Reads data/beta-seed/live/*.json if present, otherwise data/beta-seed/templates/*.json.
// Enforces the invariants documented in data/beta-seed/README.md.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), "..");
const liveDir = resolve(root, "data/beta-seed/live");
const tmplDir = resolve(root, "data/beta-seed/templates");

const FILES = [
  "brands.json",
  "models.json",
  "generations.json",
  "trims.json",
  "catalog-prices.json",
  "dealers.json",
  "dealer-offers.json",
  "encyclopedia.json",
  "news.json",
  "qa.json",
  "bazar-nebzi.json",
];

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

async function loadOne(name) {
  const livePath = resolve(liveDir, name);
  const tmplPath = resolve(tmplDir, name);
  const source = existsSync(livePath) ? livePath : tmplPath;
  if (!existsSync(source)) {
    fail(`${name}: missing in both live/ and templates/`);
    return { source: null, data: [] };
  }
  try {
    const raw = await readFile(source, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      fail(`${name}: top-level value must be a JSON array, got ${typeof data}`);
      return { source, data: [] };
    }
    return { source, data };
  } catch (e) {
    fail(`${name}: invalid JSON — ${e.message}`);
    return { source, data: [] };
  }
}

function requireFields(file, record, idx, fields) {
  for (const f of fields) {
    if (record[f] === undefined || record[f] === null || record[f] === "") {
      fail(`${file}[${idx}]: missing required field "${f}"`);
    }
  }
}

function requireMetadata(file, record, idx) {
  if (typeof record.source !== "string" || record.source.length === 0) {
    fail(`${file}[${idx}]: missing required metadata "source"`);
  }
  const allowedVerification = ["unverified", "source-checked", "verified"];
  if (!allowedVerification.includes(record.verification)) {
    fail(`${file}[${idx}]: "verification" must be one of ${allowedVerification.join(", ")}`);
  }
  const officialish = record.is_official === true || record.verification === "verified";
  if (!officialish && record.is_beta_demo !== true) {
    fail(`${file}[${idx}]: not verified/official — must set "is_beta_demo": true`);
  }
}

async function main() {
  const loaded = {};
  for (const f of FILES) loaded[f] = await loadOne(f);

  const trimIds = new Set(loaded["trims.json"].data.map((t) => t.trim_id));
  const dealerIds = new Set(loaded["dealers.json"].data.map((d) => d.dealer_id));
  const generationIds = new Set(loaded["generations.json"].data.map((g) => g.generation_id));

  // brands
  for (const [i, r] of loaded["brands.json"].data.entries()) {
    requireFields("brands.json", r, i, ["brand_id", "name", "slug"]);
    requireMetadata("brands.json", r, i);
  }

  // models
  for (const [i, r] of loaded["models.json"].data.entries()) {
    requireFields("models.json", r, i, ["model_id", "brand_id", "name", "slug"]);
    requireMetadata("models.json", r, i);
  }

  // generations
  for (const [i, r] of loaded["generations.json"].data.entries()) {
    requireFields("generations.json", r, i, [
      "generation_id",
      "brand_id",
      "model_name",
      "name",
      "display_name",
      "production_year_from",
    ]);
    requireMetadata("generations.json", r, i);
    if (trimIds.has(r.generation_id)) {
      fail(`generations.json[${i}]: generation_id "${r.generation_id}" collides with a trim_id — generations and trims must use disjoint id namespaces`);
    }
  }

  // trims — canonical
  for (const [i, r] of loaded["trims.json"].data.entries()) {
    requireFields("trims.json", r, i, [
      "trim_id",
      "brand_id",
      "model_name",
      "display_name",
      "year",
      "energy_type",
    ]);
    requireMetadata("trims.json", r, i);
    if (r.generation_id && !generationIds.has(r.generation_id)) {
      fail(`trims.json[${i}]: generation_id "${r.generation_id}" not found in generations.json`);
    }
  }

  // catalog-prices — separate from dealer offers
  for (const [i, r] of loaded["catalog-prices.json"].data.entries()) {
    requireFields("catalog-prices.json", r, i, [
      "price_id",
      "trim_id",
      "amount",
      "currency",
    ]);
    requireMetadata("catalog-prices.json", r, i);
    if (r.dealer_id !== undefined) {
      fail(`catalog-prices.json[${i}]: must NOT include dealer_id — use dealer-offers.json for dealer quotes`);
    }
    if (!trimIds.has(r.trim_id)) {
      fail(`catalog-prices.json[${i}]: trim_id "${r.trim_id}" not found in trims.json`);
    }
  }

  // dealers
  for (const [i, r] of loaded["dealers.json"].data.entries()) {
    requireFields("dealers.json", r, i, ["dealer_id", "legal_name", "display_name", "slug"]);
    requireMetadata("dealers.json", r, i);
  }

  // dealer-offers — require trim_id + dealer_id, separate from catalog price
  for (const [i, r] of loaded["dealer-offers.json"].data.entries()) {
    requireFields("dealer-offers.json", r, i, [
      "offer_id",
      "dealer_id",
      "trim_id",
      "amount",
      "currency",
    ]);
    requireMetadata("dealer-offers.json", r, i);
    if (!trimIds.has(r.trim_id)) {
      fail(`dealer-offers.json[${i}]: trim_id "${r.trim_id}" not found in trims.json`);
    }
    if (!dealerIds.has(r.dealer_id)) {
      fail(`dealer-offers.json[${i}]: dealer_id "${r.dealer_id}" not found in dealers.json`);
    }
  }

  // content surfaces
  for (const file of ["encyclopedia.json", "news.json", "qa.json", "bazar-nebzi.json"]) {
    for (const [i, r] of loaded[file].data.entries()) {
      requireFields(file, r, i, ["slug", "title"]);
      requireMetadata(file, r, i);
    }
  }

  // Volume targets — soft warnings only
  const counts = Object.fromEntries(
    FILES.map((f) => [f, loaded[f].data.length])
  );
  const targets = {
    "brands.json": [10, 15],
    "models.json": [30, 50],
    "generations.json": [20, 40],
    "trims.json": [50, 100],
    "dealers.json": [5, 10],
    "dealer-offers.json": [20, 50],
    "encyclopedia.json": [15, 25],
    "news.json": [10, 15],
    "qa.json": [20, 30],
    "bazar-nebzi.json": [3, 5],
  };
  const allEmpty = FILES.every((f) => counts[f] === 0);
  for (const [f, [lo, hi]] of Object.entries(targets)) {
    if (counts[f] === 0) {
      if (!allEmpty) warn(`${f}: 0 records (closed-beta target: ${lo}–${hi})`);
    } else if (counts[f] < lo) {
      warn(`${f}: ${counts[f]} records, below closed-beta minimum ${lo}`);
    } else if (counts[f] > hi) {
      warn(`${f}: ${counts[f]} records, above closed-beta target ${hi} (not blocking)`);
    }
  }

  // Report
  console.log("Sprint 10B beta seed validation");
  console.log("─".repeat(48));
  for (const f of FILES) {
    const tag = loaded[f].source && loaded[f].source.includes("live") ? "LIVE" : "TMPL";
    console.log(`  ${tag}  ${f.padEnd(28)} ${counts[f]} record(s)`);
  }
  console.log("─".repeat(48));

  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  WARN  ${w}`);
  }
  if (errors.length) {
    console.log(`\n${errors.length} error(s):`);
    for (const e of errors) console.log(`  FAIL  ${e}`);
    process.exit(1);
  }
  if (allEmpty) {
    console.log("\nOK — templates clean. Populate data/beta-seed/live/*.json to begin beta loading.");
  } else {
    console.log("\nOK — beta seed valid.");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("validate-beta-seed crashed:", e);
  process.exit(2);
});
