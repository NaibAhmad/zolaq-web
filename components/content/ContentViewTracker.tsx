"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/tracking/track";
import type { ContentType } from "@/lib/content/types";

type Props = {
  contentId: string;
  contentType: ContentType;
  slugOrId: string;
};

export function ContentViewTracker({
  contentId,
  contentType,
  slugOrId,
}: Props) {
  useEffect(() => {
    trackEvent("content_viewed", {
      content_id: contentId,
      content_type: contentType,
      slug: slugOrId,
    });
  }, [contentId, contentType, slugOrId]);

  return null;
}
