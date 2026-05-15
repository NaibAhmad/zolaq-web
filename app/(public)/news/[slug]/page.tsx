import { Placeholder } from "@/components/layout/Placeholder";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Placeholder title="Xəbər detalı" note={`slug: ${slug}`} />;
}
