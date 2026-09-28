/**
 * Device photo → compressed data URL for gallery/services.
 * Works offline of Supabase Storage; images are stored on the record itself.
 */

export async function fileToCompressedDataUrl(
  file: File,
  opts?: { maxWidth?: number; maxHeight?: number; quality?: number },
): Promise<string> {
  const maxWidth = opts?.maxWidth ?? 1280;
  const maxHeight = opts?.maxHeight ?? 1280;
  const quality = opts?.quality ?? 0.78;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (photo).");
  }
  // Skip heavy work for already-small images under ~200KB
  if (file.size < 200_000 && file.type === "image/jpeg") {
    return readAsDataUrl(file);
  }

  const bitmap = await createImageBitmap(file);
  try {
    let { width, height } = bitmap;
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readAsDataUrl(file);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.readAsDataURL(file);
  });
}

/** Optional: upload to Supabase Storage when a public bucket exists. */
export async function tryUploadToSupabase(
  file: File,
  pathPrefix = "gallery",
): Promise<string | null> {
  const base =
    (typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_URL : undefined) ||
    "https://xkhcwokuxhhchdhqjbyn.supabase.co";
  const anon =
    (typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhraGN3b2t1eGhoY2hkaHFqYnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTMyMjAsImV4cCI6MjEwNTkyOTIyMH0.ETrTW4Z9dBoRX76qxmGzPjYBEWntlRjwrNe7puVMhy8";

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const objectPath = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const res = await fetch(`${base}/storage/v1/object/salon-media/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        "Content-Type": file.type || "image/jpeg",
        "x-upsert": "true",
      },
      body: file,
    });
    if (!res.ok) return null;
    return `${base}/storage/v1/object/public/salon-media/${objectPath}`;
  } catch {
    return null;
  }
}

export async function pickImageAsSrc(file: File): Promise<string> {
  const remote = await tryUploadToSupabase(file);
  if (remote) return remote;
  return fileToCompressedDataUrl(file);
}
