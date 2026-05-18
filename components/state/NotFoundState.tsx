"use client";

import { useT } from "@/lib/i18n/client";
import { EmptyState } from "./EmptyState";

type Props = {
  title?: string;
  note?: string;
};

export function NotFoundState({ title, note }: Props) {
  const t = useT();
  return (
    <EmptyState
      title={title ?? t("errors.notFound")}
      note={note ?? t("common.notFoundFallbackNote")}
    />
  );
}
