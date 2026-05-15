import { LeadDetailView } from "@/components/leads/LeadDetailView";

export default async function ProfileLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return <LeadDetailView leadId={leadId} />;
}
