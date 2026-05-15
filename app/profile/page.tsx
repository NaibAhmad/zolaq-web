import { Placeholder } from "@/components/layout/Placeholder";
import { SessionProbe } from "@/components/auth/SessionProbe";

export default function ProfilePage() {
  return (
    <>
      <Placeholder
        title="Qərar Mərkəzi"
        note="Readiness score, next best action — Sprint 5."
      />
      {/* TODO Sprint 5: remove SessionProbe when real Qərar Mərkəzi lands. */}
      <SessionProbe />
    </>
  );
}
