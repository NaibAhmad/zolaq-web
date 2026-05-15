import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

// Sprint 1 Batch 2: gate this layout — redirect unauthenticated visitors to
// `/auth/otp` (mock OTP) per SPRINT_BACKLOG acceptance "Protected routes
// redirect to OTP/login". For Batch 1 the routes render their placeholder.
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileBottomNav />
    </>
  );
}
