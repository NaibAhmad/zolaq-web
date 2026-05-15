import { Placeholder } from "@/components/layout/Placeholder";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  return (
    <Placeholder
      title="Müqayisə"
      note={ids ? `ids: ${ids}` : "2–3 trim müqayisəsi. Sprint 3."}
    />
  );
}
