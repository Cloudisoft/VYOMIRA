/** Renders the globe surface once into public/brand/globe-texture.webp. Run: npx tsx scripts/gen-globe-texture.ts */
import sharp from "sharp";
import { buildTexture, TEX_H, TEX_W } from "../src/lib/globe-texture";

const rgb = buildTexture();
await sharp(Buffer.from(rgb), { raw: { width: TEX_W, height: TEX_H, channels: 3 } }).webp({ quality: 88 }).toFile("public/brand/globe-texture.webp");
console.log("wrote public/brand/globe-texture.webp");
