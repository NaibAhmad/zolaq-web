import { Placeholder } from "@/components/layout/Placeholder";

export default async function ProfileDecisionDetailPage({
  params,
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = await params;
  return (
    <Placeholder title="Qərar Workspace" note={`decisionId: ${decisionId}`} />
  );
}
