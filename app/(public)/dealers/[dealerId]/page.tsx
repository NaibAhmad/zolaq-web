import { DealerProfile } from "@/components/dealers/DealerProfile";

export default async function DealerDetailPage({
  params,
}: {
  params: Promise<{ dealerId: string }>;
}) {
  const { dealerId } = await params;
  return <DealerProfile dealerId={dealerId} />;
}
