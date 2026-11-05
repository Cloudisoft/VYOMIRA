import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/**
 * Application-layer encryption for birth details and chart payloads (AES-256-GCM).
 * Format: v1.<iv b64>.<tag b64>.<ciphertext b64>. Rotate by adding v2 with a new key id.
 */
function key() {
  const k = Buffer.from(env().BIRTH_DATA_ENCRYPTION_KEY, "base64");
  if (k.length !== 32) throw new Error("BIRTH_DATA_ENCRYPTION_KEY must decode to 32 bytes");
  return k;
}

export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(value), "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(".");
}

export function decryptJson<T>(payload: string): T {
  const [v, iv, tag, ct] = payload.split(".");
  if (v !== "v1") throw new Error("Unsupported ciphertext version");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8")) as T;
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function hmacSha256Hex(secret: string, data: string | Buffer) {
  return createHmac("sha256", secret).update(data).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && ab.length > 0 && timingSafeEqual(ab, bb);
}

/** Non-reversible identifier for IPs in logs/rate limits. */
export const hashIp = (ip: string) => sha256(`${env().BETTER_AUTH_SECRET}:${ip}`).slice(0, 24);
