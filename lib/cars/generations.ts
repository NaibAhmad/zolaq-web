// Sprint 8H Correction v2: model generation (Nəsil) seed + read helpers.
// Nəsil is a third identity dimension between Model and Komplektasiya:
// BMW X5 (model) → G05 (nəsil) → xDrive40i M Sport (komplektasiya).
//
// Seed-only for now. Admin Generations CRUD is deferred (Sprint 9 candidate).
// Trims without a generation_id render the "Bütün nəsillər" fallback and
// remain searchable.

import type { Generation } from "./types";

export const GENERATIONS: readonly Generation[] = [
  {
    generation_id: "gen_toyota_camry_xv80",
    brand_id: "brand_toyota",
    model_name: "Camry",
    name: "XV80",
    display_name: "XV80 · 2023–",
    production_year_from: 2023,
    production_year_to: null,
    status: "active",
  },
  {
    generation_id: "gen_volvo_xc60_ii",
    brand_id: "brand_volvo",
    model_name: "XC60",
    name: "II (facelift)",
    display_name: "II · 2017–",
    production_year_from: 2017,
    production_year_to: null,
    status: "active",
  },
  {
    generation_id: "gen_hyundai_tucson_nx4",
    brand_id: "brand_hyundai",
    model_name: "Tucson",
    name: "NX4",
    display_name: "NX4 · 2020–",
    production_year_from: 2020,
    production_year_to: null,
    status: "active",
  },
  {
    generation_id: "gen_kia_ev6_g1",
    brand_id: "brand_kia",
    model_name: "EV6",
    name: "1-ci nəsil",
    display_name: "1-ci nəsil · 2021–",
    production_year_from: 2021,
    production_year_to: null,
    status: "active",
  },
  // Sprint 10F: 6 additional generations added to broaden the local demo set
  // (Section A target: 10 generations). New trims below reference these.
  {
    generation_id: "gen_byd_song_plus_2",
    brand_id: "brand_byd",
    model_name: "Song Plus",
    name: "2-ci nəsil",
    display_name: "2-ci nəsil · 2021–",
    production_year_from: 2021,
    production_year_to: null,
    status: "active",
  },
  {
    generation_id: "gen_byd_tang_3",
    brand_id: "brand_byd",
    model_name: "Tang",
    name: "3-cü nəsil",
    display_name: "3-cü nəsil · 2022–",
    production_year_from: 2022,
    production_year_to: null,
    status: "active",
  },
  {
    generation_id: "gen_volvo_xc40_1",
    brand_id: "brand_volvo",
    model_name: "XC40",
    name: "I (facelift)",
    display_name: "I · 2018–",
    production_year_from: 2018,
    production_year_to: null,
    status: "active",
  },
  {
    generation_id: "gen_volvo_s60_iii",
    brand_id: "brand_volvo",
    model_name: "S60",
    name: "III",
    display_name: "III · 2018–",
    production_year_from: 2018,
    production_year_to: null,
    status: "active",
  },
  {
    generation_id: "gen_toyota_rav4_xa50",
    brand_id: "brand_toyota",
    model_name: "RAV4",
    name: "XA50",
    display_name: "XA50 · 2019–",
    production_year_from: 2019,
    production_year_to: null,
    status: "active",
  },
  {
    generation_id: "gen_hyundai_ioniq5_ne",
    brand_id: "brand_hyundai",
    model_name: "Ioniq 5",
    name: "NE",
    display_name: "NE · 2021–",
    production_year_from: 2021,
    production_year_to: null,
    status: "active",
  },
];

export function listGenerationsForModel(
  brandId: string,
  modelName: string,
): Generation[] {
  return GENERATIONS.filter(
    (g) =>
      g.status === "active" &&
      g.brand_id === brandId &&
      g.model_name === modelName,
  );
}

export function getGenerationById(
  id?: string | null,
): Generation | undefined {
  if (!id) return undefined;
  return GENERATIONS.find((g) => g.generation_id === id);
}
