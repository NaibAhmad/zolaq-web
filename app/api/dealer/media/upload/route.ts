import { NextResponse, type NextRequest } from "next/server";
import { audit, requireDealerPermission, respond } from "@/lib/admin/api-utils";
import { createMediaAsset } from "@/lib/media/repository";
import { getStorageProvider } from "@/lib/media/storage";
import { validateUpload } from "@/lib/media/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.media.upload");
  if ("response" in auth) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Multipart body tələb olunur." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl tapılmadı." }, { status: 400 });
  }

  // Dealer scope is FORCED — dealer cannot upload on behalf of another owner.
  const owner_type = "dealer";
  const owner_id = auth.session.dealerId;
  const alt_text = form.get("alt_text")?.toString() ?? null;
  const caption = form.get("caption")?.toString() ?? null;

  const result = await validateUpload(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const storage = getStorageProvider();
  const saved = await storage.save({
    bytes: result.bytes,
    ext: result.ext,
    ownerType: owner_type,
    originalName: file.name,
  });

  const asset = await createMediaAsset({
    owner_type,
    owner_id,
    file_name: saved.file_name,
    original_file_name: file.name,
    mime_type: result.mime,
    size_bytes: file.size,
    storage_provider: saved.storage_provider,
    storage_key: saved.storage_key,
    public_url: saved.public_url,
    alt_text,
    caption,
    status: "uploaded", // pending admin approval before becoming public
    created_by_type: "dealer",
    created_by_id: auth.session.dealerId,
  });

  audit(auth.session, {
    action: "media.upload",
    entity_type: "media",
    entity_id: asset.id,
    after: { owner_type, owner_id, public_url: asset.public_url, status: asset.status },
  });

  return respond(request, { media: asset }, "/dealer/media");
}
