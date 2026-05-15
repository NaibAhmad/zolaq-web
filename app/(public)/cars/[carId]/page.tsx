import { Placeholder } from "@/components/layout/Placeholder";

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  return (
    <Placeholder
      title="Maşın detalı"
      note={`carId (= trim_id alias): ${carId}`}
    />
  );
}
