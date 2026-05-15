// Client-side tracking helper. Pure browser code — guards on `typeof window`
// so it is safe to import from server components.
//
// Strips banned PII keys defensively before sending; the server validator
// enforces the same rule independently.
//
// Errors are swallowed silently — by design, to keep PII/raw payloads out of
// console logs and to avoid breaking flows when the events endpoint is down.

import {
  BANNED_PII_KEYS,
  isEventName,
  type DeviceType,
  type EventName,
} from "./events";

const SESSION_KEY = "zolaq_tsid";

function readSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tsid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return "session-unavailable";
  }
}

function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function detectLanguage(): string {
  if (typeof document !== "undefined" && document.documentElement.lang) {
    return document.documentElement.lang;
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "az";
}

function sourceUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

function stripPii(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (BANNED_PII_KEYS.includes(key)) continue;
    out[key] = value;
  }
  return out;
}

export function trackEvent(
  name: EventName,
  payload: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  if (!isEventName(name)) return;

  const envelope = {
    event_name: name,
    session_id: readSessionId(),
    device_type: detectDeviceType(),
    language: detectLanguage(),
    source_url: sourceUrl(),
    created_at: Date.now(),
    payload: stripPii(payload),
  };

  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(envelope),
      keepalive: true,
      credentials: "include",
    }).catch(() => {
      // Silently drop: tracking must never break UX.
    });
  } catch {
    // Silently drop.
  }
}
