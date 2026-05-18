import { BazarTabBar } from "@/components/market-pulse/BazarTabBar";
import { isQaTab, type QaTabKey } from "@/lib/market-pulse/qa-tabs";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getSession } from "@/lib/auth/session";
import {
  aggregateTopic,
  hasVoted,
  listTopics,
} from "@/lib/market-pulse/store";
import {
  type BazarCadence,
  type BazarTopicStatus,
} from "@/lib/market-pulse/types";
import { listQA } from "@/lib/content/lookup";
import { getServerLocale } from "@/lib/i18n/server";
import { getLocalizedText } from "@/lib/i18n/localized";
import { ROUTES } from "@/lib/routes";
import { QaPageChrome } from "./_components/QaPageChrome";

type Search = { tab?: string };

const CADENCE_FOR_TAB: Partial<Record<QaTabKey, BazarCadence>> = {
  gunluk: "daily",
  heftelik: "weekly",
  ayliq: "monthly",
};

export default async function QaPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const activeTab: QaTabKey = isQaTab(sp.tab) ? sp.tab : "suallar";
  const session = await getSession();
  const locale = await getServerLocale();

  if (activeTab === "suallar") {
    const items = listQA().map((entry) => ({
      key: entry.content_id,
      href: ROUTES.qaItem(entry.id),
      title: getLocalizedText(entry.question, locale),
      summary: getLocalizedText(entry.answer, locale),
      publishedAt: entry.published_at,
    }));
    return (
      <>
        <TabHeader activeTab={activeTab} />
        <QaPageChrome kind="suallar" items={items} />
      </>
    );
  }

  // Bazar Nəbzi tabs.
  const cadence = CADENCE_FOR_TAB[activeTab];
  const showHistory = activeTab === "tarixce";
  const statuses: readonly BazarTopicStatus[] = showHistory
    ? ["closed", "resolved", "archived"]
    : ["active", "closed", "resolved", "archived"];
  let topics = listTopics({ status: statuses });
  if (cadence) topics = topics.filter((t) => t.cadence === cadence);
  if (activeTab === "bazar-nebzi") {
    // Landing tab — active topics across cadences only.
    topics = topics.filter((t) => t.status === "active");
  }

  const entries = topics.map((topic) => ({
    topic,
    aggregate: aggregateTopic(topic.topic_id),
    userVoteOptionId: session
      ? hasVoted(topic.topic_id, session.userId)?.option_id ?? null
      : null,
  }));

  return (
    <>
      <TabHeader activeTab={activeTab} />
      <QaPageChrome
        kind="bazar"
        activeTab={activeTab}
        entries={entries}
        isAuthenticated={!!session}
      />
    </>
  );
}

function TabHeader({ activeTab }: { activeTab: QaTabKey }) {
  return (
    <Section tone="muted" padding="sm">
      <Container>
        <BazarTabBar activeTab={activeTab} />
      </Container>
    </Section>
  );
}
