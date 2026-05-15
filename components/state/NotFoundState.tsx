import { EmptyState } from "./EmptyState";

type Props = {
  title?: string;
  note?: string;
};

export function NotFoundState({
  title = "Tapılmadı",
  note = "Axtardığınız məzmun mövcud deyil və ya silinib.",
}: Props) {
  return <EmptyState title={title} note={note} />;
}
