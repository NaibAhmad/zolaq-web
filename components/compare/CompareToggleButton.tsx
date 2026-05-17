"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import {
  MAX_COMPARE,
  getCompareIds,
  subscribe,
  toggleCompareId,
} from "@/lib/compare/client-store";

type Props = {
  trimId: string;
};

function getSnapshot(): string {
  return getCompareIds().join(",");
}

function getServerSnapshot(): string {
  return "";
}

export function CompareToggleButton({ trimId }: Props) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = snapshot ? snapshot.split(",") : [];
  const selected = ids.includes(trimId);
  const atLimit = !selected && ids.length >= MAX_COMPARE;

  const label = selected
    ? "Müqayisədən çıxar"
    : atLimit
      ? `Maksimum ${MAX_COMPARE}`
      : "Müqayisəyə əlavə et";

  return (
    <Button
      variant="ghost"
      size="sm"
      fullWidth
      disabled={atLimit}
      aria-pressed={selected}
      onClick={() => toggleCompareId(trimId)}
      className={
        selected
          ? "border border-accent-blue/30 bg-accent-blue-soft text-accent-blue hover:bg-accent-blue-soft"
          : "border border-border"
      }
    >
      <span aria-hidden className="text-base leading-none">
        {selected ? "✓" : "+"}
      </span>
      {label}
    </Button>
  );
}
