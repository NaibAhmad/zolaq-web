import { CarDetail } from "@/components/catalog/CarDetail";

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  return <CarDetail carId={carId} />;
}
