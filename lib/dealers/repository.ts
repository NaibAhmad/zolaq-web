import "server-only";

// Sprint 9B seam — re-exports the existing dealer store unchanged. Future
// catalog cutover PR will swap this to a Prisma-backed implementation.

export {
  listDealers,
  getDealer,
  createDealer,
  updateDealer,
  type CreateDealerInput,
} from "@/lib/admin/dealer-store";
