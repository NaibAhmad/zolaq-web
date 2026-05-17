import "server-only";
import { randomUUID } from "node:crypto";
import { isDatabaseAvailable } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";

// Hybrid MediaAsset store. Writes to Postgres if DB available, otherwise to
// a globalThis-pinned Map. The local file (uploaded via lib/media/storage.ts)
// lands on disk in both modes — only the metadata location differs.

export type MediaStatus = "uploaded" | "processing" | "active" | "rejected" | "archived";

export type MediaAsset = {
  id: string;
  owner_type: string;
  owner_id: string | null;
  file_name: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  storage_provider: string;
  storage_key: string;
  public_url: string;
  alt_text: string | null;
  caption: string | null;
  status: MediaStatus;
  created_by_type: string | null;
  created_by_id: string | null;
  created_at: number;
  updated_at: number;
};

export type CreateMediaAssetInput = {
  owner_type: string;
  owner_id?: string | null;
  file_name: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_provider: string;
  storage_key: string;
  public_url: string;
  alt_text?: string | null;
  caption?: string | null;
  status?: MediaStatus;
  created_by_type?: string | null;
  created_by_id?: string | null;
};

export type ListMediaFilter = {
  owner_type?: string;
  owner_id?: string;
  status?: MediaStatus;
};

type MemStore = { assets: Map<string, MediaAsset> };
const g = globalThis as unknown as { __zlq_media_store?: MemStore };
const memStore: MemStore = g.__zlq_media_store ?? (g.__zlq_media_store = { assets: new Map() });

function newId(): string {
  return `media_${randomUUID()}`;
}

export async function createMediaAsset(input: CreateMediaAssetInput): Promise<MediaAsset> {
  const id = newId();
  const now = Date.now();
  if (await isDatabaseAvailable()) {
    const row = await prisma.mediaAsset.create({
      data: {
        id,
        owner_type: input.owner_type,
        owner_id: input.owner_id ?? null,
        file_name: input.file_name,
        original_file_name: input.original_file_name,
        mime_type: input.mime_type,
        size_bytes: input.size_bytes,
        storage_provider: input.storage_provider,
        storage_key: input.storage_key,
        public_url: input.public_url,
        alt_text: input.alt_text ?? null,
        caption: input.caption ?? null,
        status: input.status ?? "uploaded",
        created_by_type: input.created_by_type ?? null,
        created_by_id: input.created_by_id ?? null,
      },
    });
    return mapRow(row);
  }
  const asset: MediaAsset = {
    id,
    owner_type: input.owner_type,
    owner_id: input.owner_id ?? null,
    file_name: input.file_name,
    original_file_name: input.original_file_name,
    mime_type: input.mime_type,
    size_bytes: input.size_bytes,
    width: null,
    height: null,
    storage_provider: input.storage_provider,
    storage_key: input.storage_key,
    public_url: input.public_url,
    alt_text: input.alt_text ?? null,
    caption: input.caption ?? null,
    status: input.status ?? "uploaded",
    created_by_type: input.created_by_type ?? null,
    created_by_id: input.created_by_id ?? null,
    created_at: now,
    updated_at: now,
  };
  memStore.assets.set(id, asset);
  return { ...asset };
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  if (await isDatabaseAvailable()) {
    const row = await prisma.mediaAsset.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }
  const asset = memStore.assets.get(id);
  return asset ? { ...asset } : null;
}

export async function listMediaAssets(filter: ListMediaFilter = {}): Promise<MediaAsset[]> {
  if (await isDatabaseAvailable()) {
    const rows = await prisma.mediaAsset.findMany({
      where: {
        ...(filter.owner_type && { owner_type: filter.owner_type }),
        ...(filter.owner_id && { owner_id: filter.owner_id }),
        ...(filter.status && { status: filter.status }),
      },
      orderBy: { created_at: "desc" },
    });
    return rows.map(mapRow);
  }
  let rows = Array.from(memStore.assets.values());
  if (filter.owner_type) rows = rows.filter((r) => r.owner_type === filter.owner_type);
  if (filter.owner_id) rows = rows.filter((r) => r.owner_id === filter.owner_id);
  if (filter.status) rows = rows.filter((r) => r.status === filter.status);
  return rows
    .map((r) => ({ ...r }))
    .sort((a, b) => b.created_at - a.created_at);
}

export async function updateMediaAssetStatus(
  id: string,
  status: MediaStatus,
): Promise<MediaAsset | null> {
  if (await isDatabaseAvailable()) {
    try {
      const row = await prisma.mediaAsset.update({ where: { id }, data: { status } });
      return mapRow(row);
    } catch {
      return null;
    }
  }
  const existing = memStore.assets.get(id);
  if (!existing) return null;
  const next: MediaAsset = { ...existing, status, updated_at: Date.now() };
  memStore.assets.set(id, next);
  return { ...next };
}

type DbMediaRow = {
  id: string;
  owner_type: string;
  owner_id: string | null;
  file_name: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  storage_provider: string;
  storage_key: string;
  public_url: string;
  alt_text: string | null;
  caption: string | null;
  status: string;
  created_by_type: string | null;
  created_by_id: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: DbMediaRow): MediaAsset {
  return {
    id: row.id,
    owner_type: row.owner_type,
    owner_id: row.owner_id,
    file_name: row.file_name,
    original_file_name: row.original_file_name,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    width: row.width,
    height: row.height,
    storage_provider: row.storage_provider,
    storage_key: row.storage_key,
    public_url: row.public_url,
    alt_text: row.alt_text,
    caption: row.caption,
    status: row.status as MediaStatus,
    created_by_type: row.created_by_type,
    created_by_id: row.created_by_id,
    created_at: row.created_at.getTime(),
    updated_at: row.updated_at.getTime(),
  };
}
