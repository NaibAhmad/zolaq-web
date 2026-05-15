import { Placeholder } from "@/components/layout/Placeholder";

export default async function QaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Placeholder title="Sual detalı" note={`id: ${id}`} />;
}
