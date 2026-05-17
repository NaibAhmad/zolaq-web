import "server-only";

// MIME allowlist — kept narrow on purpose. SVG is excluded (can carry script
// payloads). PDF (payment proof) is deferred this sprint — payment-proof
// route is untouched. See docs/sprint-9d/MEDIA_SECURITY_RULES.md.

export const MIME_ALLOWLIST = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMime = (typeof MIME_ALLOWLIST)[number];

const MIME_TO_EXT: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Magic-byte signatures so we don't trust a client-supplied Content-Type.
const SIGNATURES: ReadonlyArray<{ mime: AllowedMime; prefix: number[] }> = [
  { mime: "image/jpeg", prefix: [0xff, 0xd8, 0xff] },
  { mime: "image/png", prefix: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WebP: "RIFF....WEBP"
  { mime: "image/webp", prefix: [0x52, 0x49, 0x46, 0x46] },
];

export function maxUploadBytes(): number {
  const mb = Number(process.env.MEDIA_UPLOAD_MAX_MB ?? "8");
  const safe = Number.isFinite(mb) && mb > 0 ? mb : 8;
  return Math.floor(safe * 1024 * 1024);
}

export type ValidationOk = {
  ok: true;
  mime: AllowedMime;
  ext: string;
  bytes: Uint8Array;
};
export type ValidationErr = { ok: false; status: number; error: string };
export type ValidationResult = ValidationOk | ValidationErr;

export async function validateUpload(file: File): Promise<ValidationResult> {
  if (!file || typeof file.size !== "number") {
    return { ok: false, status: 400, error: "Fayl tapılmadı." };
  }
  const max = maxUploadBytes();
  if (file.size > max) {
    return {
      ok: false,
      status: 413,
      error: `Fayl çox böyükdür (maks. ${Math.floor(max / 1024 / 1024)} MB).`,
    };
  }
  if (file.size === 0) {
    return { ok: false, status: 400, error: "Boş fayl." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectMime(bytes);
  if (!detected) {
    return {
      ok: false,
      status: 415,
      error: "Yalnız JPEG / PNG / WebP şəkilləri qəbul edilir.",
    };
  }
  if (!(MIME_ALLOWLIST as readonly string[]).includes(detected)) {
    return {
      ok: false,
      status: 415,
      error: "Bu fayl tipi qəbul edilmir.",
    };
  }
  // Trust the detected type over the client-supplied one.
  return { ok: true, mime: detected, ext: MIME_TO_EXT[detected], bytes };
}

function detectMime(bytes: Uint8Array): AllowedMime | null {
  for (const sig of SIGNATURES) {
    if (bytes.length < sig.prefix.length) continue;
    let match = true;
    for (let i = 0; i < sig.prefix.length; i++) {
      if (bytes[i] !== sig.prefix[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      // WebP also needs "WEBP" at offset 8 to disambiguate from other RIFF.
      if (sig.mime === "image/webp") {
        const tag = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
        if (tag !== "WEBP") continue;
      }
      return sig.mime;
    }
  }
  return null;
}
