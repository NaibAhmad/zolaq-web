import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DealerSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Tənzimləmələr</h1>
      <Card padding="md">
        <p className="text-sm">
          Hesab əlaqə məlumatlarını və saat seçimlərini idarə etmək üçün <strong>Profil</strong>
          səhifəsindən istifadə edin — bütün dəyişikliklər admin yoxlamasına gedir.
        </p>
        <div className="mt-3">
          <ButtonLink href="/dealer/profile">Profilə keç</ButtonLink>
        </div>
      </Card>
      <Card padding="md">
        <h2 className="mb-2 text-sm font-semibold">Bildiriş tənzimləmələri</h2>
        <p className="text-sm text-foreground-muted">
          Sprint 8E real auth və e-poçt bildirişləri ilə birlikdə gələcək.
        </p>
      </Card>
    </div>
  );
}
