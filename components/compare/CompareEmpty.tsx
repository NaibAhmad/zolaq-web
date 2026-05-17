import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/routes";

type Props = {
  reason: "no_ids" | "not_enough";
  providedCount?: number;
};

export function CompareEmpty({ reason, providedCount = 0 }: Props) {
  const heading =
    reason === "not_enough" && providedCount === 1
      ? "Yalnız 1 maşın seçilib — ən azı 2 lazımdır"
      : "Müqayisə üçün maşın seçilməyib";
  return (
    <>
      <Section tone="dark" padding="md">
        <Container>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue">
              Müqayisə
            </span>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Yan-yana 2–3 maşın müqayisə et
            </h1>
            <p className="max-w-2xl text-on-dark-muted">
              Texniki göstəriciləri, qiymət statusunu və rəsmi diler təklifini
              birbaşa yan-yana yoxla. Müqayisə üçün maşın seç və qərarına yaxınlaş.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <Card padding="lg" tone="raised">
            <div className="flex flex-col items-start gap-4">
              <h2 className="text-xl font-semibold text-foreground">
                {heading}
              </h2>
              <p className="max-w-2xl text-sm text-foreground-muted">
                Kataloqdan maşın seçərək &quot;Müqayisəyə əlavə et&quot; düyməsindən
                istifadə et, və ya saxlanan maşınlar siyahısından bir-birinə qarşı
                qoy.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={ROUTES.cars} variant="primary">
                  Maşın kataloquna keç
                </ButtonLink>
                <ButtonLink href={ROUTES.profileSaved} variant="secondary">
                  Saxlanılan maşınlar
                </ButtonLink>
                <ButtonLink href={ROUTES.profileHistory} variant="ghost">
                  Son baxılan maşınlar
                </ButtonLink>
              </div>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
