import { Placeholder } from "@/components/layout/Placeholder";

export default async function EncyclopediaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Placeholder title="Bələdçi məqaləsi" note={`slug: ${slug}`} />;
}
