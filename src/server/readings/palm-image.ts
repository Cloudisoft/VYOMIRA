import "server-only";
import sharp from "sharp";

export const PALM_LIMITS = { maxBytes: 10 * 1024 * 1024, minSide: 480, maxSide: 1568 };
const ALLOWED = new Set(["jpeg", "png", "webp", "heif"]);

export interface PalmQuality { ok: boolean; issues: string[]; brightness: number; sharpness: number; entropy: number }

/**
 * Validate and normalise a palm photo: decode (rejects non-images), honour EXIF rotation,
 * resize to ≤1568px, re-encode as JPEG (which strips EXIF/GPS metadata), and run basic quality checks.
 */
export async function processPalmImage(input: Buffer): Promise<{ ok: true; jpeg: Buffer; width: number; height: number; quality: PalmQuality } | { ok: false; error: string }> {
  if (input.length > PALM_LIMITS.maxBytes) return { ok: false, error: "That photo is larger than 10 MB. Please upload a smaller one." };
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input, { failOn: "error", limitInputPixels: 60_000_000 }).metadata();
  } catch {
    return { ok: false, error: "We couldn't read that file as a photo. Please upload a JPEG, PNG or WebP image." };
  }
  if (!meta.format || !ALLOWED.has(meta.format)) return { ok: false, error: "Please upload a JPEG, PNG or WebP photo." };
  const img = sharp(input, { failOn: "error" }).rotate().resize({ width: PALM_LIMITS.maxSide, height: PALM_LIMITS.maxSide, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" });
  const jpeg = await img.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  const out = await sharp(jpeg).metadata();
  const width = out.width ?? 0, height = out.height ?? 0;
  if (Math.min(width, height) < PALM_LIMITS.minSide) return { ok: false, error: `That photo is too small (${width}×${height}). Please use a photo at least ${PALM_LIMITS.minSide}px on the short side.` };
  const s = await sharp(jpeg).stats();
  const brightness = s.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) / 3;
  const issues: string[] = [];
  if (brightness < 45) issues.push("The photo looks too dark — try daylight or a bright room.");
  if (brightness > 232) issues.push("The photo looks over-exposed — avoid direct flash or strong backlight.");
  if (s.sharpness < 0.25 || s.entropy < 3.5) issues.push("The photo looks blurry or lacks detail — hold the phone steady and focus on the palm.");
  return { ok: true, jpeg, width, height, quality: { ok: issues.length === 0, issues, brightness: Math.round(brightness), sharpness: Number(s.sharpness.toFixed(3)), entropy: Number(s.entropy.toFixed(2)) } };
}
