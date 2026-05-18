import { BazarTopicCard } from "@/components/market-pulse/BazarTopicCard";
import { HomeMarketPulseHeading } from "@/components/home/HomeMarketPulseHeading";
import { getSession } from "@/lib/auth/session";
import {
  aggregateTopic,
  hasVoted,
  pickFeaturedActiveTopic,
} from "@/lib/market-pulse/store";

export async function HomeMarketPulse() {
  const topic = pickFeaturedActiveTopic();
  if (!topic) return null;
  const session = await getSession();
  const aggregate = aggregateTopic(topic.topic_id);
  const userVote = session ? hasVoted(topic.topic_id, session.userId) : null;
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <HomeMarketPulseHeading />
      <BazarTopicCard
        topic={topic}
        aggregate={aggregate}
        userVoteOptionId={userVote?.option_id ?? null}
        isAuthenticated={!!session}
      />
    </div>
  );
}
