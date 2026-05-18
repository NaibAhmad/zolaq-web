#!/usr/bin/env node
// Sprint 10I-C: i18n hardcoded-copy audit. Walks app/ and components/ looking
// for visible string literals that smell like AZ / RU / EN UI copy. The goal
// is to keep new hardcoded text from creeping back in once Sprint 10I-C
// clears the current backlog. Exits 0 — this is a warning gate for now. The
// promotion plan (in docs/sprint-10/I18N_AUDIT_RESULTS.md) is to flip it to
// a failing CI gate after Sprint 11.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components"];

// Allowlist tokens that look translatable but aren't.
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
];

const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[^\\\n])*?)\1/g;
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "dist"]);

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

function looksTranslatable(s) {
  if (s.length < 3 || s.length > 240) return false;
  for (const re of NOT_COPY) if (re.test(s)) return false;
  if (PROPER_NOUNS.has(s.trim())) return false;
  if (TECH_UNITS.has(s.trim())) return false;
  if (/^\+994/.test(s)) return false; // phone placeholders
  if (AZ_CHARS.test(s)) return true;
  if (RU_CHARS.test(s)) return true;
  if (EN_PHRASE.test(s) && /\s/.test(s)) return true;
  return false;
}

// Crude per-line context: skip strings inside attributes that clearly aren't
// visible copy (className, id, href, src, key, role, name, type, data-*).
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
  return false;
}

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const findings = [];
  const lines = src.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (isInsideNonVisibleAttr(line)) return;
    let m;
    STRING_LITERAL.lastIndex = 0;
    while ((m = STRING_LITERAL.exec(line))) {
      const literal = m[2];
      if (!looksTranslatable(literal)) continue;
      findings.push({ line: idx + 1, text: literal });
    }
  });
  return findings;
}

function summarize(byDir) {
  const total = Object.values(byDir).reduce((a, b) => a + b, 0);
  console.log("\n— Summary —");
  for (const [dir, n] of Object.entries(byDir).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${dir.padEnd(40)} ${n}`);
  }
  console.log(`  ${"TOTAL".padEnd(40)} ${total}`);
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
  let total = 0;
  console.log(`# i18n hardcoded-copy audit (${files.length} files scanned)\n`);
  for (const file of files) {
    const findings = scanFile(file);
    if (findings.length === 0) continue;
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    const topDir = rel.split("/").slice(0, 2).join("/");
    byDir[topDir] = (byDir[topDir] ?? 0) + findings.length;
    total += findings.length;
    console.log(`\n${rel}`);
    for (const f of findings) {
      const snippet = f.text.length > 80 ? `${f.text.slice(0, 77)}…` : f.text;
      console.log(`  ${String(f.line).padStart(5)}: "${snippet}"`);
    }
  }
  summarize(byDir);
  console.log(
    `\nWarning gate: ${total} candidate strings. ` +
      "See docs/sprint-10/I18N_GOVERNANCE_AND_NO_HARDCODED_COPY.md.",
  );
  process.exit(0);
}

main();
