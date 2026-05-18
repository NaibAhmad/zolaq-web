import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { listPrices, listTrims } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { getServerT } from "@/lib/i18n/server";

export default async function DealerOffersPage() {
  const session = (await getDealerSession())!;
  const offers = listPrices({ dealer_id: session.dealerId, offers_only: true });
  const trims = listTrims();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("dealerOffers.title")}</h1>
        <ButtonLink href="/dealer/offers/new">{t("dealerOffers.newOffer")}</ButtonLink>
      </header>
      <AdminTable
        rows={offers}
        rowKey={(o) => o.price_id}
        empty={t("dealerOffers.emptyOffers")}
        columns={[
          {
            key: "trim",
            header: t("dealerOffers.trimCol"),
            cell: (o) => (
              <Link href={`/dealer/offers/${o.offer_id ?? o.price_id}`} className="font-medium hover:underline">
                {trims.find((tr) => tr.trim_id === o.trim_id)?.display_name ?? o.trim_id}
              </Link>
            ),
          },
          {
            key: "amount",
            header: t("dealerOffers.amountCol"),
            cell: (o) => `${o.amount.toLocaleString("az-AZ")} ${o.currency}`,
          },
          {
            key: "status",
            header: t("dealerOffers.statusCol"),
            cell: (o) => (o.offer_status ? <StatusBadge status={o.offer_status} /> : "—"),
          },
          { key: "valid", header: t("dealerOffers.validCol"), cell: (o) => o.valid_until ?? "—" },
          { key: "note", header: t("dealerOffers.reviewerNoteCol"), cell: (o) => o.review_note ?? "—" },
        ]}
      />
    </div>
  );
}
