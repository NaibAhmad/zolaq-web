"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import {
  getSavedIds,
  subscribe,
  toggleSavedId,
} from "@/lib/saved/client-store";

type Props = {
  trimId: string;
};

function getSnapshot(): string {
  return getSavedIds().join(",");
}

function getServerSnapshot(): string {
  return "";
}

export function SaveToggleButton({ trimId }: Props) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = snapshot ? snapshot.split(",") : [];
  const saved = ids.includes(trimId);

  return (
    <Button
      variant="secondary"
      size="md"
      aria-pressed={saved}
      onClick={() => toggleSavedId(trimId)}
      className={
        saved
          ? "border-accent-blue/30 bg-accent-blue-soft text-accent-blue hover:bg-accent-blue-soft"
          : undefined
      }
    >
      <span aria-hidden className="text-base leading-none">
        {saved ? "✓" : "♡"}
      </span>
      {saved ? "Saxlanıldı" : "Saxla"}
    </Button>
  );
}
