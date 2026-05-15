import { Placeholder } from "@/components/layout/Placeholder";

export default async function ProfileLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return <Placeholder title="Sorğu detalı" note={`leadId: ${leadId}`} />;
}
