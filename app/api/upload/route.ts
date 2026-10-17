/**
 * Admin image uploads for the content editor.
 *
 * The previous implementation accepted any file from anyone and wrote it
 * into `public/`, which allowed anonymous users to fill the disk and to
 * publish same-origin content (including scriptable SVG). Now: admins only,
 * a 2 MiB cap, and the stored file type comes from its magic bytes — the
 * client's filename and Content-Type are ignored entirely.
 */

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { type NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth-guards";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

type SniffedImage = { extension: string; mime: string };

/** Detects the file type from its first bytes; SVG is deliberately absent. */
function sniffImageType(buffer: Buffer): SniffedImage | null {
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(pngMagic)) {
    return { extension: "png", mime: "image/png" };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { extension: "jpg", mime: "image/jpeg" };
  }

  if (buffer.length >= 6 && buffer.subarray(0, 4).toString("ascii") === "GIF8") {
    return { extension: "gif", mime: "image/gif" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", mime: "image/webp" };
  }

  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") {
      return { extension: "avif", mime: "image/avif" };
    }
  }

  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to upload files." },
      { status: 401 },
    );
  }
  if (user.banned) {
    return NextResponse.json(
      { ok: false, error: "Your account is suspended." },
      { status: 403 },
    );
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin access required." },
      { status: 403 },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json(
      { ok: false, error: "Images are limited to 2 MiB." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Expected a multipart form with a file field." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "No file provided." },
      { status: 400 },
    );
  }

  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Images are limited to 2 MiB." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unsupported image format. Use PNG, JPEG, GIF, WebP or AVIF.",
      },
      { status: 415 },
    );
  }

  try {
    const fileName = `${randomUUID()}.${sniffed.extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/${fileName}`,
      mime: sniffed.mime,
      size: buffer.byteLength,
    });
  } catch (error) {
    console.error("[upload] write failed:", error);
    return NextResponse.json(
      { ok: false, error: "Upload failed." },
      { status: 500 },
    );
  }
}
