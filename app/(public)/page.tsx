import { SponsoredSlot } from "@/components/ads/SponsoredSlot";
import { HomeBetaInviteCard } from "@/components/home/HomeBetaInviteCard";
import { HomeCatalogTeaser } from "@/components/home/HomeCatalogTeaser";
import { HomeContentTeaser } from "@/components/home/HomeContentTeaser";
import { HomeDealerTeaser } from "@/components/home/HomeDealerTeaser";
import { HomeDecisionHelper } from "@/components/home/HomeDecisionHelper";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeMarketPulse } from "@/components/home/HomeMarketPulse";
import { HomeSearchBlock } from "@/components/home/HomeSearchBlock";
import { HomeTrustStrip } from "@/components/home/HomeTrustStrip";
import { HomeVinBetaCard } from "@/components/home/HomeVinBetaCard";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { FEATURE_BETA_INVITE, FEATURE_VIN_BETA } from "@/lib/env";

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <Section tone="light" padding="sm" className="relative">
        <Container>
          <HomeSearchBlock />
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <HomeTrustStrip />
        </Container>
      </Section>

      {FEATURE_VIN_BETA ? (
        <Section tone="muted" padding="md">
          <Container>
            <HomeVinBetaCard />
          </Container>
        </Section>
      ) : null}

      <Section tone="muted" padding="md">
        <Container>
          <HomeDecisionHelper />
        </Container>
      </Section>

      {FEATURE_BETA_INVITE ? (
        <Section tone="light" padding="md">
          <Container>
            <HomeBetaInviteCard />
          </Container>
        </Section>
      ) : null}

      <Section tone="light" padding="md">
        <Container>
          <HomeCatalogTeaser />
        </Container>
      </Section>

      <Section tone="muted" padding="sm">
        <Container>
          <SponsoredSlot area="homepage" variant="strip" />
        </Container>
      </Section>

      <Section tone="muted" padding="md">
        <Container>
          <HomeContentTeaser />
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <HomeMarketPulse />
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <HomeDealerTeaser />
        </Container>
      </Section>
    </>
  );
}
