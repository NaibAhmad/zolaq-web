import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { getTrimById } from "@/lib/cars/lookup";
import { createLead } from "@/lib/leads/store";
import {
  LEAD_SOURCE_SURFACES,
  PREFERRED_CONTACTS,
  isLeadSourceSurface,
  isPreferredContact,
} from "@/lib/leads/types";

const NAME_MAX = 80;
const NOTE_MAX = 500;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Invalid JSON body.");
  }

  const { trim_id, source_surface, name, preferred_contact, note } = (body ??
    {}) as {
    trim_id?: unknown;
    source_surface?: unknown;
    name?: unknown;
    preferred_contact?: unknown;
    note?: unknown;
  };

  if (typeof trim_id !== "string" || trim_id.length === 0) {
    return errorJson(400, "VALIDATION_ERROR", "`trim_id` tələb olunur.", {
      field: "trim_id",
    });
  }
  if (!isLeadSourceSurface(source_surface)) {
    return errorJson(
      400,
      "VALIDATION_ERROR",
      "`source_surface` dəyəri yanlışdır.",
      { field: "source_surface", allowed: LEAD_SOURCE_SURFACES }
    );
  }

  let nameClean: string | undefined;
  if (name !== undefined && name !== null && name !== "") {
    if (typeof name !== "string") {
      return errorJson(400, "VALIDATION_ERROR", "`name` mətn olmalıdır.", {
        field: "name",
      });
    }
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > NAME_MAX) {
      return errorJson(
        400,
        "VALIDATION_ERROR",
        "`name` 1–80 simvol olmalıdır.",
        { field: "name", max: NAME_MAX }
      );
    }
    nameClean = trimmed;
  }

  let preferredContactClean: "phone" | "whatsapp" | undefined;
  if (preferred_contact !== undefined && preferred_contact !== null) {
    if (!isPreferredContact(preferred_contact)) {
      return errorJson(
        400,
        "VALIDATION_ERROR",
        "`preferred_contact` dəyəri yanlışdır.",
        { field: "preferred_contact", allowed: PREFERRED_CONTACTS }
      );
    }
    preferredContactClean = preferred_contact;
  }

  let noteClean: string | undefined;
  if (note !== undefined && note !== null && note !== "") {
    if (typeof note !== "string") {
      return errorJson(400, "VALIDATION_ERROR", "`note` mətn olmalıdır.", {
        field: "note",
      });
    }
    if (note.length > NOTE_MAX) {
      return errorJson(
        400,
        "VALIDATION_ERROR",
        `\`note\` ${NOTE_MAX} simvoldan uzun ola bilməz.`,
        { field: "note", max: NOTE_MAX }
      );
    }
    noteClean = note;
  }

  if (!getTrimById(trim_id)) {
    return errorJson(404, "NOT_FOUND", "Trim tapılmadı.", { trim_id });
  }

  const lead = createLead({
    trim_id,
    source_surface,
    user_id: session.userId,
    phone_hash: session.phoneHash,
    name: nameClean,
    preferred_contact: preferredContactClean,
    note: noteClean,
  });

  return NextResponse.json({ lead }, { status: 201 });
}
