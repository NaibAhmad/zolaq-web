# Sprint 10 — Wave 0 Invite Messages

**Status:** Wave 0 outbound copy — persona-tailored AZ messages for the first 5–7 testers.
**Date:** 2026-05-18
**Tone:** premium, calm, honest beta. No hype. No fake claims. No promised pricing. No public-URL claim if there is no public URL.
**Companion docs:** [WAVE_0_INTERNAL_BETA_PLAN.md](./WAVE_0_INTERNAL_BETA_PLAN.md), [FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md) (the broader copy bank — these Wave 0 messages do not replace it, they extend it for specific personas).

---

## Common rules (apply to every message below)

- **Channel:** WhatsApp or Telegram 1:1 DM only. No groups, no broadcast.
- **Length:** ≤ 6 short lines per message.
- **Personalise** the first line per recipient (name, shared context).
- **Never** hardcode a phone number. Never name a specific dealer.
- **Never** promise a price, a discount, a delivery, or a guarantee.
- **Never** claim a public link exists. If `NEXT_PUBLIC_BETA_WAITLIST_URL` is empty, use the fallback from [FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md) §3:
  > *Link tezliklə hazırdır — sizə şəxsən göndərəcəyəm.*
- **Header line** (closing) — every recruitment message ends with:
  > *Qapalı beta · məhdud yerlər · geribildirim tələb olunur.*
- **Disclaimer for VIN-related messages:** VIN check is a *risk signal*, not an expert inspection, not a Carfax replacement.
- **Disclaimer for the platform:** *onlayn ödəniş yoxdur · satış zəmanəti yoxdur* — include in messages where the recipient might assume otherwise (buyer, import).

`[WAITLIST_URL]` below is the placeholder for `NEXT_PUBLIC_BETA_WAITLIST_URL`. If empty, swap in the fallback line.

---

## §1. Close friend / trusted tester

Use for: founder slot 1–2 (team / trusted developer / designer / first-degree friend).

> Salam [Ad],
>
> Zolaq-ı (Azərbaycan üçün avtomobil platforması) qapalı beta-ya çıxarmağa hazırlaşıram. Sənə inanıram, ona görə ilk 5–7 nəfərdən biri ol.
>
> 10–15 dəqiqə vaxt ayır, mən birlikdə canlı keçirik. Açıq şəkildə nəyi bəyənmədiyini de — bizim üçün ən dəyərli budur.
>
> Qeydiyyat formu: [WAITLIST_URL]
>
> Qapalı beta · məhdud yerlər · geribildirim tələb olunur.

---

## §2. Real car buyer (active search)

Use for: slot 3 (someone actively searching for a car, 0–3 months horizon).

> Salam [Ad],
>
> Avtomobil axtardığını bilirəm. Mən Zolaq adlı platforma hazırlayıram — marka, model, nəsil, komplektasiya üzrə axtarış, diler təklifləri, qiymət aydınlığı.
>
> Qapalı beta-dadır. Sənin baxışın bizim üçün qiymətlidir — bir avtomobil axtar, gördüklərini bir-iki cümlə yaz.
>
> Vacib: onlayn ödəniş yoxdur, satış zəmanəti yoxdur. VIN yoxlaması beta-dır — ekspert yoxlamasının yerini tutmur.
>
> Qeydiyyat formu: [WAITLIST_URL]
>
> Qapalı beta · məhdud yerlər · geribildirim tələb olunur.

---

## §3. Dealer contact

Use for: slot 4 (dealer staff or sales manager from an existing beta-dealer relationship).

> Salam [Ad],
>
> Zolaq-ı qapalı beta-ya çıxarırıq. İlk dalğada diler tərəfindən bir görüş istəyirəm — sizin satış kanalınızı əvəz etmir, əksinə, dilerin təklifini istifadəçiyə aydın göstərir.
>
> 10–15 dəqiqə baxasan, və əgər mümkündürsə, bir müştərinə də formu göndərəsən — onun fikri də bizim üçün vacibdir.
>
> Qeydiyyat formu: [WAITLIST_URL]
>
> Qapalı beta · məhdud yerlər · geribildirim tələb olunur.

---

## §4. EV / hybrid interested user

Use for: slot 5 (EV / hybrid curious — not necessarily an owner, just interested).

> Salam [Ad],
>
> Sənin EV / hybrid maraqını bilirəm. Zolaq-da yanacaq növü, illik istismar dəyəri, hibrid / elektrik filtrini test edirik.
>
> Qapalı beta-dadır. Bir EV və ya hibrid axtar, gördüklərini bir cümlə yaz — nə işlədi, nə əskik idi.
>
> Onlayn ödəniş yoxdur, satış zəmanəti yoxdur.
>
> Qeydiyyat formu: [WAITLIST_URL]
>
> Qapalı beta · məhdud yerlər · geribildirim tələb olunur.

---

## §5. US-import interested user

Use for: slot 6 (someone who has imported or is considering importing a car from the US).

> Salam [Ad],
>
> ABŞ-dən idxal mövzusunda təcrübən var. Zolaq-da idxal avtomobillərinin tarixçəsi, VIN üzrə risk siqnalı və idxal qeydləri ilə işləyirik.
>
> Vacib: VIN yoxlaması beta-dır — Carfax-ı əvəz etmir, ekspert yoxlamasını əvəz etmir, sadəcə ilkin risk siqnalıdır.
>
> Bir VIN sınaqdan keçir, gördüyün dilin aydın olub-olmadığını yaz.
>
> Qeydiyyat formu: [WAITLIST_URL]
>
> Qapalı beta · məhdud yerlər · geribildirim tələb olunur.

---

## §6. Follow-up after testing (48–72 h nudge)

Use 48–72 hours after the invite. Replaces / supplements [FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md) §"feedback nudge" with a Wave 0 personal tone.

> Salam [Ad],
>
> Zolaq-a baxmağa vaxt tapdınmı? Çox uzun olmasın — bir-iki cümlə kifayətdir.
>
> Geribildirim formu: [FEEDBACK_URL]
>
> Əgər indi əlverişli deyilsə, problem yox — sonra yaz, mən gözləyirəm.

(The closing line is intentionally softer here; this is a nudge, not a new recruitment.)

---

## §7. Bug report request

Use when a tester mentions a problem in passing and the operator wants a captured report.

> [Ad], dediyin haqda — bir qısa qeyd alsam, faydalı olar.
>
> Bir cümlə: nə etmək istəyirdin, nə baş verdi.
> Mümkün olarsa: bir ekran şəkli.
>
> Forma: [FEEDBACK_URL]
>
> Vaxtın üçün təşəkkürlər.

---

## Reminder for the operator

- Wave 0 caps at 7 invites. If you are about to send the 8th, **stop** — re-read [WAVE_0_INTERNAL_BETA_PLAN.md](./WAVE_0_INTERNAL_BETA_PLAN.md) §2.
- Every send goes into the operator spreadsheet with: tester slot (1–7), persona section used (§1–§7), date, channel.
- If a tester rejects the AZ copy or says any sentence is off-tone, **pause Wave 0** (see [WAVE_0_INTERNAL_BETA_PLAN.md](./WAVE_0_INTERNAL_BETA_PLAN.md) §7) and rewrite before continuing.
