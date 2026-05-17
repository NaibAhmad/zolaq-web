// Sprint 10H-UX: localStorage-backed saved-trim store for the local demo.
// Mirrors lib/compare/client-store.ts. No auth, no API, no max cap.
// /profile/saved still reads from the server in-memory store separately;
// the two intentionally diverge for now (documented in the SOP).

const STORAGE_KEY = "zlq.saved.v1";
const CHANGE_EVENT = "zlq:saved-changed";

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

export function getSavedIds(): string[] {
  return readRaw();
}

export function hasSavedId(id: string): boolean {
  return readRaw().includes(id);
}

export type SavedToggleResult = "added" | "removed";

export function toggleSavedId(id: string): SavedToggleResult {
  const current = readRaw();
  const idx = current.indexOf(id);
  if (idx >= 0) {
    writeRaw([...current.slice(0, idx), ...current.slice(idx + 1)]);
    return "removed";
  }
  writeRaw([...current, id]);
  return "added";
}

export function clearSaved(): void {
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
