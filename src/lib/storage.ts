import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Storage abstraction for payment-proof photos. Local-disk implementation now;
// swap the three functions for an S3 client later without touching callers.
function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

// Persists a proof photo and returns an opaque key stored on payments.proof_photo_path.
export async function saveProofPhoto(bytes: Buffer, ext: string): Promise<string> {
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const safeExt = /^[a-z0-9]{1,5}$/i.test(ext) ? ext.toLowerCase() : "jpg";
  const key = `${randomUUID()}.${safeExt}`;
  await fs.writeFile(path.join(dir, key), bytes);
  return key;
}

// Reads a stored proof photo by key. Rejects path traversal.
export async function readProofPhoto(
  key: string
): Promise<{ bytes: Buffer; contentType: string }> {
  if (!/^[a-f0-9-]+\.[a-z0-9]{1,5}$/i.test(key)) {
    throw new Error("Invalid photo key");
  }
  const bytes = await fs.readFile(path.join(uploadDir(), key));
  const ext = key.split(".").pop()!.toLowerCase();
  const contentType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { bytes, contentType };
}
