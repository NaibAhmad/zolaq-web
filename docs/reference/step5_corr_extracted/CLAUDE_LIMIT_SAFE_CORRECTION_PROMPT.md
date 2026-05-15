# CLAUDE_LIMIT_SAFE_CORRECTION_PROMPT

Use this prompt only after uploading the ZIP package containing `ZOLAQ_STEP_5_FINAL_CORRECTION_BRIEF.md` and the current Zolaq project ZIP / HTML / screenshots.

```text
Use the uploaded ZOLAQ_STEP_5_FINAL_CORRECTION_BRIEF.md as the final source of truth for this correction.

Continue the existing Zolaq Step 5 prototype. Do not restart from zero. Do not redesign the product. Do not create a new logo, new colors, new typography, or a new visual direction.

Your task is to complete only the missing architecture, user flows, states, terminology, CTA hierarchy, and data logic defined in the uploaded brief.

Keep the existing Zolaq Design System:
- Deep Navy #0B132B
- Electric Blue #2563EB
- Off-White #F7F8FA
- Cool Gray #8A93A6
- Signal Orange #FF6A00 only for primary CTA / selected action / critical lead action
- Inter primary
- Manrope secondary

Do not use Carlink branding.
Do not create private seller flow.
Do not create marketplace seller flow.
Do not create dealer self-service dashboard.
Do not create product upload flow.
Do not create payment flow.
Do not create CRM dashboard.
Do not create WhatsApp Business API real chat sync.

Apply these corrections only:

1. Separate Lead Detail and Decision Workspace.
- Lead Detail = one specific inquiry status page.
- Decision Workspace = strategic dashboard for one decision process.
- Use routes: /profile/leads/[leadId] and /profile/decisions/[decisionId].

2. Separate Decision Center and Decision History.
- Decision Center = active dashboard with next best action.
- Decision History = activity log.

3. Correct terminology.
- Lead → Sorğu
- Saved → Saxlanılan
- Viewed → Baxılan
- Decision score → Qərar hazırlığı
- Second dealer offer → Başqa təkliflə yoxla
- Mobile bottom nav: Ana / Maşın / Müqayisə / Bələdçi / Mən

4. Correct CTA hierarchy.
- Each screen may have only one primary CTA.
- Orange only for primary conversion.
- WhatsApp must be green and secondary unless it is the only primary action.

5. Correct price logic.
- Separate CatalogPrice and DealerOfferData.
- Use price statuses: estimated, catalog_price, dealer_official_offer, dealer_quote_pending, price_unknown, expired_offer, conflict, not_available.
- Every price card must show source, verification, last_updated, and valid_until for dealer offers.
- Use price format: 89 500 AZN.

6. Correct WhatsApp MVP behavior.
- WhatsApp is external handoff + tracking only.
- Do not show full in-app WhatsApp chat as if it is synced.
- Use copy: “WhatsApp xarici kanalda davam edir. Zolaq yalnız sorğu statusunu və rəsmi təklif yeniləmələrini tarixçəndə saxlayır.”

7. Add or refine missing P0 states/screens from the brief:
- Lead Form Modal
- Lead Submitted Success State
- Official Offer Received State
- Offer Expired State
- Dealer No Response State
- Second Offer Request Modal using “Başqa təkliflə yoxla”
- Test-drive Request Modal as request-only
- Test-drive Confirmed State
- WhatsApp External Handoff State
- Dealer Offer Detail
- Official Dealers Listing / Directory
- Guest → OTP → Lead Status state
- News → Related Model → Lead flow

8. Dealer profile correction.
- Canonical desktop dealer profile must be light data-first.
- Dark hero can remain only for mobile/premium preview, not canonical desktop.
- Dealer profile must show verification level, active official offers, source, update date, services, response time, and official price request CTA.

9. Decision readiness score.
- Rename “Qərar etibarı” to “Qərar hazırlığı: 72/100”.
- Add tooltip explanation based on profile, research, compare, official offers, test-drive, and budget match.

10. Conflict data behavior.
- Minor/medium conflict: show recommendation with warning and lower confidence.
- Major conflict: block final verdict and show verification required CTA.

Output expectations:
- Update the existing prototype compactly.
- Do not regenerate unrelated screens.
- Add missing screens/states only where required.
- Keep the current visual style but make the product flow developer-ready.
- Make all key flows clickable or clearly mapped.
```
