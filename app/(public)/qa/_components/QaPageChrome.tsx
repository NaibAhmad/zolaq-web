"use client";

import { ContentList, type ContentListItem } from "@/components/content/ContentList";
import { BazarTopicCard } from "@/components/market-pulse/BazarTopicCard";
import type { QaTabKey } from "@/components/market-pulse/BazarTabBar";
import { EmptyState } from "@/components/state/EmptyState";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import type { BazarAggregate, BazarTopic } from "@/lib/market-pulse/types";

type SuallarProps = {
  kind: "suallar";
  items: readonly ContentListItem[];
};

type BazarTopicEntry = {
  topic: BazarTopic;
  aggregate: BazarAggregate | null;
  userVoteOptionId: string | null;
};

type BazarProps = {
  kind: "bazar";
  activeTab: QaTabKey;
  entries: readonly BazarTopicEntry[];
  isAuthenticated: boolean;
};

type Props = SuallarProps | BazarProps;

const HEADING_KEY: Record<
  QaTabKey,
  { title: TranslationKey; subtitle: TranslationKey }
> = {
  suallar: { title: "qa.title", subtitle: "qa.subtitle" },
  "bazar-nebzi": { title: "qa.bazarTitle", subtitle: "qa.bazarSubtitle" },
  gunluk: { title: "qa.dailyTitle", subtitle: "qa.dailySubtitle" },
  heftelik: { title: "qa.weeklyTitle", subtitle: "qa.weeklySubtitle" },
  ayliq: { title: "qa.monthlyTitle", subtitle: "qa.monthlySubtitle" },
  tarixce: { title: "qa.historyTitle", subtitle: "qa.historySubtitle" },
};

export function QaPageChrome(props: Props) {
  const t = useT();

  if (props.kind === "suallar") {
    return (
      <ContentList
        eyebrow={t("qa.eyebrow")}
        heading={t("qa.title")}
        intro={t("qa.subtitle")}
        emptyTitle={t("qa.emptyTitle")}
        items={props.items}
        cardTone="success"
        cardLabel={t("qa.cardLabel")}
      />
    );
  }

  const headingKeys = HEADING_KEY[props.activeTab];

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container>
          <SectionHeading
            eyebrow={t("qa.bazarEyebrow")}
            title={t(headingKeys.title)}
            subtitle={t(headingKeys.subtitle)}
          />
        </Container>
      </Section>
      <Section tone="light" padding="md">
        <Container>
          {props.entries.length === 0 ? (
            <EmptyState
              title={t("qa.emptyTopicTitle")}
              note={t("qa.emptyTopicNote")}
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {props.entries.map((entry) => (
                <li key={entry.topic.topic_id}>
                  <BazarTopicCard
                    topic={entry.topic}
                    aggregate={entry.aggregate}
                    userVoteOptionId={entry.userVoteOptionId}
                    isAuthenticated={props.isAuthenticated}
                  />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
