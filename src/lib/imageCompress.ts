// Client-side image compression before upload (PRD §2: ≤1600px / ~500KB).
// Downscales the longest edge to 1600px and steps JPEG quality down until the
// blob is under the target size. Runs entirely in the browser.
export async function compressImage(
  file: File,
  { maxEdge = 1600, targetBytes = 500 * 1024 } = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  let quality = 0.82;
  let blob = await toBlob(canvas, quality);
  // Step quality down until under target (or floor reached).
  while (blob && blob.size > targetBytes && quality > 0.4) {
    quality -= 0.12;
    blob = await toBlob(canvas, quality);
  }
  return blob ?? file;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
}
