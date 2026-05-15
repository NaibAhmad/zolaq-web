# Zolaq Step 6 — Sprint 0 Technical Freeze v2

Status: CTO blocker correction package.

This package updates the first Step 6 package after CTO review. It is designed to move the project from:

`Conditional / Not ready for Sprint 1`

to:

`Ready for CTO re-check and Sprint 1 preparation`.

## CTO blocker response

The CTO listed 7 blockers. This v2 package addresses them as follows:

1. `API_CONTRACT_DRAFT.md` expanded into developer-ready API groups.
2. `MOCK_DATA_SEED.json` expanded to 8 trims, 3 dealers, 6 offers, 4 lead examples, 2 decisions and content examples.
3. `DATA_MODEL_MVP.md` expanded with Content, OTP, verification, currency, audit and tracking fields.
4. OTP provider strategy defined as adapter-based: mock provider for Sprint 1; production provider required before staging/public testing.
5. SLA business-hours logic added as `SLA_BUSINESS_RULES.json`.
6. `SPRINT_BACKLOG.md` rewritten into Sprint 1–6 developer-ready format.
7. `QA_ACCEPTANCE_CRITERIA.md` expanded with OTP, privacy, lead state, price and internal ops test cases.

## Final development rule

Step 5 remains closed. No visual redesign is required.

Step 6 v2 should be reviewed by CTO. If accepted, Sprint 1 can start with route skeleton, layout, auth shell, mock OTP and API client structure.
