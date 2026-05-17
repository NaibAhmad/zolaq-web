# Sprint 10 — First 100 Beta Copy

**Status:** Sprint 10J copy bank. Source-of-truth for all First 100 beta messages.
**Date:** 2026-05-18
**Tone:** Azerbaijani-first, premium, calm, trusted. No hype, no exaggeration, no "AI həll edir hər şeyi", no guaranteed price/purchase promise.

**Translation note:** RU and EN translations are out of scope for Sprint 10J. The Azerbaijani versions are the only versions used in product and outbound this sprint. Inline English glosses are for the operator only and must not be copy-pasted to users.

---

## 1. Homepage beta invite CTA (in product)

Rendered by [HomeBetaInviteCard.tsx](../../components/home/HomeBetaInviteCard.tsx) when `NEXT_PUBLIC_FEATURE_BETA_INVITE=true`. Placed after `HomeDecisionHelper`.

**Badge:**

> Beta · Qapalı

**Title (h2):**

> Zolaq Beta — ilk 100 istifadəçidən biri olun

**Body (≤ 220 chars):**

> Avtomobil seçimi, müqayisə, VIN beta yoxlaması və diler təkliflərini ilk test edənlərdən olun.

**Primary CTA button (when `NEXT_PUBLIC_BETA_WAITLIST_URL` is set):**

> Beta üçün qeydiyyat

**Disabled CTA button (when the URL is empty):**

> Qeydiyyat linki tezliklə aktiv olacaq

**Subtext (under the button):**

> Qapalı beta · Məhdud yerlər · Geribildirim tələb olunur

---

## 2. Social post (LinkedIn / X / Instagram — founder voice)

Use **only after wave 0 + wave 1** are stable. Operator (not Zolaq brand) posts as a founder.

> Zolaq qapalı beta-ya başlayır.
>
> İlk 100 istifadəçi seçilir. Mən avtomobil seçimini, müqayisəni və diler təkliflərini real istifadəçilərlə birgə yoxlamaq istəyirəm. Onlayn ödəniş yoxdur, satış zəmanəti yoxdur — yalnız aydın seçim və real diler təklifləri.
>
> Maraqlanırsınızsa, qeydiyyat linki [bio-da / şərhdə].
>
> Qapalı beta · məhdud yerlər · geribildirim tələb olunur.

---

## 3. WhatsApp / Telegram 1:1 invite (direct outreach)

The default invite for waves 1–2. Personalize the first sentence per recipient.

> Salam [Ad],
>
> Mən Zolaq adlı avtomobil platformasını hazırlayıram. Hələ qapalı beta-dadır, ilk 100 istifadəçidən birini sizə təklif edirəm.
>
> İçəridə nə var:
> – axtarış, marka / model / nəsil / komplektasiya üzrə filtr
> – diler təklifləri və real qiymət istinadları
> – VIN üzrə risk beta-yoxlaması (ekspert yoxlamasını əvəz etmir)
>
> Nə yoxdur:
> – onlayn ödəniş yoxdur
> – satış zəmanəti yoxdur
> – avtomobil siyahısı hələ məhduddur
>
> Geribildirim çox vacibdir — gördüklərinizi 1–2 cümlə ilə yazsanız, kifayətdir.
>
> Qeydiyyat linki: [WAITLIST_URL]

If sending without the waitlist link active yet:

> Link tezliklə hazırdır — sizə şəxsən göndərəcəyəm. Razısınızsa "bəli" yazın.

---

## 4. Dealer invite (operator → beta dealer)

Used when asking an existing beta dealer to refer their interested customers. Pairs with [DEALER_BETA_ONBOARDING.md](DEALER_BETA_ONBOARDING.md).

> Salam [Diler adı],
>
> Zolaq-ın istifadəçi tərəfində qapalı beta-ya başlayırıq — ilk 100 alıcı.
>
> Sizdən xahiş: maraqlananlara qeydiyyat linkimizi göndərə bilərsinizmi? Hər təklif edilən şəxs üçün mənbəni qeyd edirik, sizin diler hesabınızla əlaqələndirilir.
>
> Şərtlər:
> – yalnız real alıcı niyyəti olan şəxslər
> – onlayn ödəniş, satış zəmanəti və ya VIN ekspert yoxlaması vəd etmirik
> – istifadəçidən geribildirim gözlənilir
>
> Link: [WAITLIST_URL]
>
> Sizin və müştərinizin təcrübəsi bizim üçün vacibdir. Suallar üçün yazın.

---

## 5. Welcome message (after waitlist approval)

Sent within 24 h of waitlist submission. Personalize the greeting.

> Salam [Ad],
>
> Zolaq qapalı beta-ya xoş gəlmisiniz. Aşağıdakı link sizi platformaya yönləndirir.
>
> [DEMO_URL]
>
> Yadda saxlamağınız üçün:
> – qapalı beta, məhdud yerlər
> – onlayn ödəniş yoxdur, bütün ödənişlər diler ilə birbaşa
> – VIN yoxlaması beta-dır, ekspert yoxlamasını əvəz etmir
> – mobil 390 px-də sınanmışdır
>
> Sınamaq üçün təklif olunan ssenarilər:
> 1. axtarış: bir marka / model / nəsil üzrə nəticələri yoxlayın
> 2. müqayisə: ən azı iki avtomobili müqayisə edin
> 3. diler təklifi və ya lead göndərin
> 4. (varsa) VIN yoxlamasını sınayın
>
> Geribildirim üçün qısa forma: [FEEDBACK_URL]
>
> 3 gündən sonra qısa bir mesajla təcrübənizi soruşacağam.

---

## 6. Feedback nudge (≈ 72 h after welcome)

> Salam [Ad],
>
> Zolaq-ı sınamağa vaxt ayırdığınız üçün təşəkkür. Qısa bir sual: hansı an sizin üçün ən aydın oldu, hansı an ən qarışıq?
>
> 1–2 cümlə kifayətdir. İstəyirsinizsə, qısa forma da var: [FEEDBACK_URL]

---

## 7. Beta disclaimer (boilerplate)

Add to welcome, dealer-invite, and any operator email/DM that references the product.

> **Beta xəbərdarlığı.** Zolaq qapalı beta-dadır. Funksionallıq dəyişə bilər, məlumat tam dolu deyil və VIN yoxlaması ilkin risk siqnalıdır — ekspert yoxlamasını əvəz etmir. Onlayn ödəniş, marketplace və xüsusi satıcı təklifləri bu mərhələdə yoxdur.

---

## 8. Critical-bug pause message

Sent immediately if a critical bug forces an invite pause (see [FIRST_100_BETA_PLAN.md](FIRST_100_BETA_PLAN.md) §9).

> Salam [Ad],
>
> Zolaq-da kiçik bir texniki problem aşkar etdik və qapalı beta-nı qısa müddətə dayandırırıq. Məlumatlarınız təhlükəsizdir. Hazır olduqda sizə yenidən yazacağam.
>
> Vaxtınız üçün təşəkkür.

---

## 9. Removal / opt-out confirmation

If a user asks to be removed.

> Salam [Ad],
>
> Zolaq qapalı beta siyahısından çıxarıldınız. Bundan sonra sizə bu mövzuda mesaj göndərilməyəcək. Maraqlandığınız üçün təşəkkür.

---

## 10. Tone rules (do / don't)

| Do | Don't |
|---|---|
| "ilk 100 istifadəçidən biri" | "ekskluziv VIP" |
| "diler təklifləri" | "ən sərfəli qiymət zəmanəti" |
| "VIN beta yoxlaması — ekspert yoxlamasını əvəz etmir" | "VIN ilə avtomobilin tam tarixini biləcəksiniz" |
| "geribildirim tələb olunur" | "pulsuz hədiyyə qazanın" |
| "qapalı beta, məhdud yerlər" | "tezliklə açılır, qaçırmayın!" |
| "AI vasitələri test mərhələsindədir" | "AI hər şeyi sizin üçün həll edəcək" |
| Azerbaijani diakritik hərflər (ə, ş, ç, ı, ğ, ö, ü) yazılı düzgün | "Azeri Latin" trans-literasiyası (e əvəzinə "a", ş əvəzinə "sh", və s.) |
