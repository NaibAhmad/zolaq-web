// Sprint 7B: tiny client-side compare selection shim. Backs the
// "Müqayisəyə əlavə et" toggle on CarCard so the homepage and catalog can
// hand over selected trim IDs to /compare?ids=... — the existing server-
// rendered compare page is the single source of truth for what gets rendered.
// No new compare system, no server state.

const STORAGE_KEY = "zlq.compare.v1";
const CHANGE_EVENT = "zlq:compare-changed";

export const MAX_COMPARE = 3;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const ids: string[] = [];
    for (const v of parsed) {
      if (typeof v === "string" && v.length > 0 && !ids.includes(v)) {
        ids.push(v);
      }
      if (ids.length >= MAX_COMPARE) break;
    }
    return ids;
  } catch {
    return [];
  }
}

function writeRaw(ids: string[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // ignore quota / privacy-mode errors silently
  }
}

export function getCompareIds(): string[] {
  return readRaw();
}

export function hasCompareId(id: string): boolean {
  return readRaw().includes(id);
}

export type ToggleResult = "added" | "removed" | "limit_reached";

export function toggleCompareId(id: string): ToggleResult {
  const current = readRaw();
  const idx = current.indexOf(id);
  if (idx >= 0) {
    const next = [...current.slice(0, idx), ...current.slice(idx + 1)];
    writeRaw(next);
    return "removed";
  }
  if (current.length >= MAX_COMPARE) return "limit_reached";
  writeRaw([...current, id]);
  return "added";
}

export function clearCompare(): void {
  writeRaw([]);
}

export function subscribe(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onChange = () => listener();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function buildCompareHref(ids: string[]): string {
  if (ids.length === 0) return "/compare";
  return `/compare?ids=${ids.join(",")}`;
}
