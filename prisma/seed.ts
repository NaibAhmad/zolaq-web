// Sprint 9B seed loader skeleton. Idempotent upserts in FK order from the
// existing TS seed (the in-memory store this sprint still reads from). Run
// with `npm run db:seed` after `npm run prisma:migrate`. Safe to re-run.
// Does NOT wipe; only upserts. MediaAsset/MediaUsage are intentionally
// skipped — there is no source data and dev uploads should be the only path.

import { PrismaClient } from "@prisma/client";

import { BRANDS, DEALER_OFFERS, EXTRA_PRICES, TRIMS } from "../lib/cars/seed";
import { GENERATIONS } from "../lib/cars/generations";
import { DEALERS } from "../lib/dealers/seed";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedBrands() {
  for (const b of BRANDS) {
    await prisma.brand.upsert({
      where: { brand_id: b.brand_id },
      create: {
        brand_id: b.brand_id,
        name: b.name,
        slug: slugify(b.name),
        country: b.country ?? null,
        status: b.status,
      },
      update: {
        name: b.name,
        slug: slugify(b.name),
        country: b.country ?? null,
        status: b.status,
      },
    });
  }
  console.log(`brands: upserted ${BRANDS.length}`);
}

async function seedModels() {
  const seen = new Set<string>();
  for (const t of TRIMS) {
    const slug = slugify(t.model_name);
    const model_id = `${t.brand_id}__${slug}`;
    if (seen.has(model_id)) continue;
    seen.add(model_id);
    await prisma.model.upsert({
      where: { model_id },
      create: {
        model_id,
        brand_id: t.brand_id,
        name: t.model_name,
        slug,
        body_type: t.body_type ?? null,
      },
      update: { name: t.model_name, slug, body_type: t.body_type ?? null },
    });
  }
  console.log(`models: upserted ${seen.size}`);
}

async function seedGenerations() {
  for (const g of GENERATIONS) {
    await prisma.generation.upsert({
      where: { generation_id: g.generation_id },
      create: {
        generation_id: g.generation_id,
        brand_id: g.brand_id,
        model_name: g.model_name,
        name: g.name,
        display_name: g.display_name,
        production_year_from: g.production_year_from,
        production_year_to: g.production_year_to ?? null,
        status: g.status,
      },
      update: {
        name: g.name,
        display_name: g.display_name,
        production_year_from: g.production_year_from,
        production_year_to: g.production_year_to ?? null,
        status: g.status,
      },
    });
  }
  console.log(`generations: upserted ${GENERATIONS.length}`);
}

async function seedTrims() {
  for (const t of TRIMS) {
    await prisma.trim.upsert({
      where: { trim_id: t.trim_id },
      create: {
        trim_id: t.trim_id,
        brand_id: t.brand_id,
        model_name: t.model_name,
        generation_id: t.generation_id ?? null,
        display_name: t.display_name,
        year: t.year,
        energy_type: t.energy_type,
        body_type: t.body_type ?? null,
        power_hp: t.power_hp ?? null,
        range_km: t.range_km ?? null,
        image_url: t.image_url ?? null,
        status: t.status,
      },
      update: {
        display_name: t.display_name,
        year: t.year,
        energy_type: t.energy_type,
        body_type: t.body_type ?? null,
        generation_id: t.generation_id ?? null,
        power_hp: t.power_hp ?? null,
        range_km: t.range_km ?? null,
        image_url: t.image_url ?? null,
        status: t.status,
      },
    });
  }
  console.log(`trims: upserted ${TRIMS.length}`);
}

async function seedDealers() {
  for (const d of DEALERS) {
    await prisma.dealer.upsert({
      where: { dealer_id: d.dealer_id },
      create: {
        dealer_id: d.dealer_id,
        legal_name: d.legal_name,
        display_name: d.display_name,
        slug: slugify(d.display_name),
        verification_status: d.verification_status,
        represented_brands: [...d.represented_brands],
        city: d.city ?? null,
        address: d.address ?? null,
        response_sla_hours: d.response_sla_hours ?? null,
        services: [...d.services],
        status: d.status,
        source_name: d.source_name ?? null,
      },
      update: {
        legal_name: d.legal_name,
        display_name: d.display_name,
        verification_status: d.verification_status,
        represented_brands: [...d.represented_brands],
        city: d.city ?? null,
        address: d.address ?? null,
        response_sla_hours: d.response_sla_hours ?? null,
        services: [...d.services],
        status: d.status,
        source_name: d.source_name ?? null,
      },
    });
  }
  console.log(`dealers: upserted ${DEALERS.length}`);
}

async function seedPricesAndOffers() {
  let catalogCount = 0;
  let offerCount = 0;
  for (const p of [...DEALER_OFFERS, ...EXTRA_PRICES]) {
    if (p.dealer_id) {
      const offer_id = p.offer_id ?? `offer_seed_${p.trim_id}_${p.dealer_id}`;
      await prisma.dealerOffer.upsert({
        where: { offer_id },
        create: {
          offer_id,
          dealer_id: p.dealer_id,
          trim_id: p.trim_id,
          amount: p.amount,
          currency: p.currency,
          stock_status: p.stock_status ?? null,
          offer_status: p.offer_status ?? "published",
          valid_until: p.valid_until ? new Date(p.valid_until) : null,
          published_at: p.published_at ? new Date(p.published_at) : new Date(p.last_updated),
          submitted_by: p.submitted_by ?? null,
          notes: p.notes ?? null,
        },
        update: {
          amount: p.amount,
          currency: p.currency,
          stock_status: p.stock_status ?? null,
          offer_status: p.offer_status ?? "published",
          valid_until: p.valid_until ? new Date(p.valid_until) : null,
        },
      });
      offerCount++;
    } else {
      const price_id = `price_seed_${p.trim_id}_${p.source_name.replace(/\W+/g, "_")}`;
      await prisma.catalogPrice.upsert({
        where: { price_id },
        create: {
          price_id,
          trim_id: p.trim_id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          source_type: p.source_type,
          source_name: p.source_name,
          verification_status: p.verification_status,
          last_updated: new Date(p.last_updated),
        },
        update: {
          amount: p.amount,
          status: p.status,
          source_name: p.source_name,
          verification_status: p.verification_status,
          last_updated: new Date(p.last_updated),
        },
      });
      catalogCount++;
    }
  }
  console.log(`prices: upserted ${catalogCount} catalog + ${offerCount} dealer offers`);
}

async function main() {
  console.log("Seeding zolaq DB from TS seed files...");
  await seedBrands();
  await seedModels();
  await seedGenerations();
  await seedTrims();
  await seedDealers();
  await seedPricesAndOffers();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
