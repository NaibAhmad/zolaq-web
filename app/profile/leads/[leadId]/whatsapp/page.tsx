import { Placeholder } from "@/components/layout/Placeholder";

export default async function ProfileLeadWhatsappPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return (
    <Placeholder
      title="WhatsApp keçidi"
      note={`leadId: ${leadId} — external handoff + tracking (Step 5 §13).`}
    />
  );
}
