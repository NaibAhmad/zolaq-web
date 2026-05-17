import { Logo } from "@/components/brand/Logo";

export default function AuthOtpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
          <Logo />
        </div>
      </header>
      <main className="flex-1 bg-background">{children}</main>
    </>
  );
}
