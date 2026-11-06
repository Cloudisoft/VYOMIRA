import "server-only";
import { cache } from "react";
import { db } from "./db";
import { toLang, type Lang } from "@/lib/interpret/life-guide-i18n";

/** The user's preferred language (stored on their most recent birth profile). Cached per request. */
export const userLang = cache(async (userId: string): Promise<Lang> => {
  const p = await db.birthProfile.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" }, select: { language: true } });
  return toLang(p?.language);
});
