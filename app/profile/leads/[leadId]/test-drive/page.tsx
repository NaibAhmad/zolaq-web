import { TestDriveStatusView } from "@/components/leads/TestDriveStatusView";

export default async function ProfileLeadTestDrivePage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return <TestDriveStatusView leadId={leadId} />;
}
