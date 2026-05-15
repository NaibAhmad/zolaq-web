import { Placeholder } from "@/components/layout/Placeholder";

export default async function DealerDetailPage({
  params,
}: {
  params: Promise<{ dealerId: string }>;
}) {
  const { dealerId } = await params;
  return <Placeholder title="Diler profili" note={`dealerId: ${dealerId}`} />;
}
