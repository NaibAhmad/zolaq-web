import Link from "next/link";
import { BazarTopicCard } from "@/components/market-pulse/BazarTopicCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getSession } from "@/lib/auth/session";
import {
  aggregateTopic,
  hasVoted,
  pickFeaturedActiveTopic,
} from "@/lib/market-pulse/store";
import { ROUTES } from "@/lib/routes";

export async function HomeMarketPulse() {
  const topic = pickFeaturedActiveTopic();
  if (!topic) return null;
  const session = await getSession();
  const aggregate = aggregateTopic(topic.topic_id);
  const userVote = session ? hasVoted(topic.topic_id, session.userId) : null;
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-3">
        <SectionHeading
          eyebrow="Bazar Nəbzi"
          title="Bazar nə deyir?"
          subtitle="İcma proqnozları və canlı nəticələr. Mərc və pul mükafatı yoxdur — yalnız iştirakçı səsi."
        />
        <Link
          href={`${ROUTES.qa}?tab=bazar-nebzi`}
          className="inline-flex w-fit items-center text-sm font-medium text-accent-blue hover:underline"
        >
          Tarixçəyə bax →
        </Link>
      </div>
      <BazarTopicCard
        topic={topic}
        aggregate={aggregate}
        userVoteOptionId={userVote?.option_id ?? null}
        isAuthenticated={!!session}
      />
    </div>
  );
}
