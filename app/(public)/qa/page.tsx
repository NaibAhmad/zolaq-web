import { BazarTabBar, isQaTab, type QaTabKey } from "@/components/market-pulse/BazarTabBar";
import { BazarTopicCard } from "@/components/market-pulse/BazarTopicCard";
import { ContentList } from "@/components/content/ContentList";
import { EmptyState } from "@/components/state/EmptyState";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
import { ROUTES } from "@/lib/routes";

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

  if (activeTab === "suallar") {
    const items = listQA().map((entry) => ({
      key: entry.content_id,
      href: ROUTES.qaItem(entry.id),
      title: entry.question,
      summary: entry.answer,
      publishedAt: entry.published_at,
    }));
    return (
      <>
        <TabHeader activeTab={activeTab} />
        <ContentList
          eyebrow="Q&A"
          heading="Suallar və cavablar"
          intro="Ekspert cavabları və real alıcı sualları."
          emptyTitle="Hələ sual yoxdur"
          items={items}
          cardTone="success"
          cardLabel="Sual"
        />
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

  const heading: Record<QaTabKey, string> = {
    suallar: "Suallar və cavablar",
    "bazar-nebzi": "Bazar Nəbzi",
    gunluk: "Günlük",
    heftelik: "Həftəlik",
    ayliq: "Aylıq",
    tarixce: "Tarixçə",
  };
  const subtitle: Record<QaTabKey, string> = {
    suallar: "Ekspert cavabları və real alıcı sualları.",
    "bazar-nebzi":
      "İcma proqnozları. Mərc və pul mükafatı yoxdur — yalnız iştirakçı səsi.",
    gunluk: "Günlük Bazar Nəbzi mövzuları.",
    heftelik: "Həftəlik Bazar Nəbzi mövzuları.",
    ayliq: "Aylıq Bazar Nəbzi mövzuları.",
    tarixce: "Bağlanmış, yekunlaşmış və arxivlənmiş mövzular.",
  };

  return (
    <>
      <TabHeader activeTab={activeTab} />
      <Section tone="muted" padding="sm">
        <Container>
          <SectionHeading
            eyebrow="Bazar Nəbzi"
            title={heading[activeTab]}
            subtitle={subtitle[activeTab]}
          />
        </Container>
      </Section>
      <Section tone="light" padding="md">
        <Container>
          {topics.length === 0 ? (
            <EmptyState
              title="Hələ mövzu yoxdur"
              note="Yeni mövzu açılanda burada görünəcək."
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {topics.map((t) => (
                <li key={t.topic_id}>
                  <BazarTopicCard
                    topic={t}
                    aggregate={aggregateTopic(t.topic_id)}
                    userVoteOptionId={
                      session ? hasVoted(t.topic_id, session.userId)?.option_id ?? null : null
                    }
                    isAuthenticated={!!session}
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

function TabHeader({ activeTab }: { activeTab: QaTabKey }) {
  return (
    <Section tone="muted" padding="sm">
      <Container>
        <BazarTabBar activeTab={activeTab} />
      </Container>
    </Section>
  );
}
