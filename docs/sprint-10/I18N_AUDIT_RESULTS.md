# i18n Audit Results — Sprint 10I-C

2026-05-18. Companion to
[`I18N_GOVERNANCE_AND_NO_HARDCODED_COPY.md`](./I18N_GOVERNANCE_AND_NO_HARDCODED_COPY.md).

## What was scanned

- `app/**/*.tsx` — every page, layout, and route handler that renders JSX.
- `components/**/*.tsx` — every reusable component.

The script that produces this report lives at
[`scripts/audit-i18n-hardcoded.mjs`](../../scripts/audit-i18n-hardcoded.mjs).
Run it with `npm run i18n:audit`. It walks the two trees above, parses each
`.tsx`, and flags string literals that look like visible AZ/RU/EN copy
based on:

- Presence of AZ-specific characters (`ə ş ç ğ ı ö ü`).
- Presence of Cyrillic characters.
- A capitalized English phrase of 2+ words.

It ignores literals that match an allowlist of proper nouns (brand, model,
dealer names — `BYD`, `Volvo`, `Hongqi`, `Deepal`, `Zolaq`, `WhatsApp`,
`Bakı`, etc.), technical units (`km`, `kW`, `kWh`, `AZN`, `HP`), phone
placeholders matching `+994\d+`, identifier-shaped values, hex colors, and
non-visible JSX attributes (`className`, `id`, `href`, `src`, `key`,
`role`, `type`, `name`, `data-*`).

The script exits 0 — it is a warning gate for now. Sprint 11+ will promote
it to a failing CI gate after the new-feature pipeline has produced a few
sprints of clean signal.

## Intentionally untranslated

The following remain in source form on purpose. The audit script may still
report them — the allowlist is conservative — but they should not be moved
into the dictionary.

| Item | Why |
| --- | --- |
| Brand / model / generation / trim / dealer **names** | Proper nouns — they read the same in every locale. |
| Technical units (`km`, `kW`, `kWh`, `HP`, `AZN`) | Universally recognized; translating them would degrade clarity. |
| Phone placeholders matching `+994…` | Format guidance, not copy. |
| Author-written **content bodies** (news article body, encyclopedia article body) | Long-form prose. Surrounding chrome (eyebrow, category, "Yenilənib", "Əlaqəli modellər") is translated; the body itself stays as the source language. |
| The single AZ string operators type into the admin market-pulse "new" form | Operators enter the source value; localization happens in the seed file and the helper layer. Tracked as a future follow-up to evolve the editor into a localized input. |
| `Zolaq · 2026`, `Zolaq Admin`, `Zolaq Diler` | Brand string + system-name composition. Year is data, brand is a proper noun. |
| Q&A route slug `/qa` and internal state token `"suallar"` | Route identifiers, not visible copy. The visible label (`nav.qa`) is translated: AZ "Sorğu" / EN "Ask" / RU "Запросы". |
| `Q&A` literal used in some breadcrumbs | Standard cross-locale label for the section. Where a localized variant is desired, the `nav.qa` key is the canonical source. |

## Known deferred content translations

- **Admin market-pulse editor.** The operator-facing form for creating a
  topic accepts a single AZ string for `question` and option `label`. The
  seed file does carry `{az, en, ru}` objects for the demo topics; the
  editor will gain a multilingual form in a later sprint.
- **Long-form article bodies** in `news` and `encyclopedia` content
  records. Locale-aware bodies require an editorial pipeline beyond this
  sprint's scope.

## Date formatting

All visible dates render through helpers in
[`lib/format/date.ts`](../../lib/format/date.ts). After Sprint 10I-C there
should be no remaining `Date.toLocaleString()` / `Date.toLocaleDateString()`
calls in `app/**/*.tsx` or `components/**/*.tsx` used for visible rendering.
Number formatting via `Intl.NumberFormat("az-AZ")` for currency display is
acceptable — it's a number, not a date, and is not affected by the
month-name issue that motivates this rule.

## Future rule

Once Sprint 11 ships, `npm run i18n:audit` should be wired into CI and run
with `--check` semantics (exit non-zero on findings outside the allowlist).
This document will be updated to reflect any further allowlist additions
made during that promotion.
