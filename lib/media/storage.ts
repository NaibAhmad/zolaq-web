import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

// LocalStorageProvider writes uploads under /public/uploads/<owner>/<yyyy-mm>/
// and returns the public URL Next serves them from. Production should swap
// for an S3 / R2 / Supabase Storage provider — see
// docs/sprint-9d/STORAGE_PROVIDER_DECISION.md. The interface below is the
// one swap point.

export type SaveInput = {
  bytes: Uint8Array;
  ext: string; // "jpg" | "png" | "webp"
  ownerType: string; // "trim" | "dealer" | "general" | ...
  originalName: string;
};

export type SaveResult = {
  storage_provider: "local";
  storage_key: string; // file path relative to public/
  public_url: string; // path beginning with /uploads/...
  file_name: string;
};

export interface StorageProvider {
  save(input: SaveInput): Promise<SaveResult>;
}

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

class LocalStorageProvider implements StorageProvider {
  async save(input: SaveInput): Promise<SaveResult> {
    const ownerDir = sanitize(input.ownerType) || "general";
    const yyyymm = monthBucket(new Date());
    const dir = path.join(UPLOADS_ROOT, ownerDir, yyyymm);
    await mkdir(dir, { recursive: true });

    const fileBase = hashedName(input.originalName);
    const file_name = `${fileBase}.${input.ext}`;
    const fullPath = path.join(dir, file_name);
    await writeFile(fullPath, input.bytes, { flag: "wx" }).catch(async (err) => {
      if (err && (err as NodeJS.ErrnoException).code === "EEXIST") {
        // Collision (vanishingly rare): retry once with an added UUID suffix.
        const altPath = path.join(dir, `${fileBase}_${randomUUID().slice(0, 8)}.${input.ext}`);
        await writeFile(altPath, input.bytes);
        return;
      }
      throw err;
    });

    const publicBase = (process.env.MEDIA_PUBLIC_BASE_URL ?? "/uploads").replace(/\/$/, "");
    const public_url = `${publicBase}/${ownerDir}/${yyyymm}/${file_name}`;
    const storage_key = `uploads/${ownerDir}/${yyyymm}/${file_name}`;

    return { storage_provider: "local", storage_key, public_url, file_name };
  }
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (provider) return provider;
  const name = (process.env.MEDIA_STORAGE_PROVIDER ?? "local").toLowerCase();
  switch (name) {
    case "local":
      provider = new LocalStorageProvider();
      return provider;
    default:
      throw new Error(
        `MEDIA_STORAGE_PROVIDER="${name}" not implemented. Only "local" is supported in Sprint 9D. ` +
          `See docs/sprint-9d/STORAGE_PROVIDER_DECISION.md to add s3 / r2 / supabase.`,
      );
  }
}

function sanitize(input: string): string {
  return input.replace(/[^a-z0-9_-]+/gi, "_").toLowerCase();
}

function monthBucket(now: Date): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function hashedName(originalName: string): string {
  const seed = `${randomUUID()}_${originalName}_${Date.now()}`;
  return createHash("sha256").update(seed).digest("hex").slice(0, 16);
}
