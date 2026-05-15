import { Suspense } from "react";
import { OtpForm } from "@/components/auth/OtpForm";

export default function AuthOtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpForm />
    </Suspense>
  );
}
