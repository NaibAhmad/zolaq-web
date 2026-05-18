import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getServerT } from "@/lib/i18n/server";
import { ROUTES } from "@/lib/routes";

type Props = {
  reason: "no_ids" | "not_enough";
  providedCount?: number;
};

export async function CompareEmpty({ reason, providedCount = 0 }: Props) {
  const t = await getServerT();
  const heading =
    reason === "not_enough" && providedCount === 1
      ? t("compareHero.emptyOneTitle")
      : t("compareHero.emptyTitle");
  return (
    <>
      <Section tone="dark" padding="md">
        <Container>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue">
              {t("compareHero.eyebrow")}
            </span>
            <h1 className="text-3xl font-semibold md:text-4xl">
              {t("compareHero.title")}
            </h1>
            <p className="max-w-2xl text-on-dark-muted">
              {t("compareHero.subtitle")}
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
                {t("compareHero.helper")}
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={ROUTES.cars} variant="primary">
                  {t("compareHero.ctaCatalog")}
                </ButtonLink>
                <ButtonLink href={ROUTES.profileSaved} variant="secondary">
                  {t("compareHero.ctaSaved")}
                </ButtonLink>
                <ButtonLink href={ROUTES.profileHistory} variant="ghost">
                  {t("compareHero.ctaRecent")}
                </ButtonLink>
              </div>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
