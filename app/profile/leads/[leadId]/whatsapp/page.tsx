import { WhatsappStatusView } from "@/components/leads/WhatsappStatusView";

export default async function ProfileLeadWhatsappPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return <WhatsappStatusView leadId={leadId} />;
}
