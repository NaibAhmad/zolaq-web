import { Placeholder } from "@/components/layout/Placeholder";

export default async function ProfileLeadTestDrivePage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return (
    <Placeholder
      title="Test-sürüş statusu"
      note={`leadId: ${leadId} — request-only (Step 5 §12).`}
    />
  );
}
