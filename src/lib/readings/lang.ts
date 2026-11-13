export type RLang = "en" | "hi" | "hinglish";
export const toRLang = (l: string | null | undefined): RLang => (l === "hi" || l === "hinglish" ? l : "en");
/** Pick a translation, falling back to English. */
export const tr = <T,>(m: Record<RLang, T> | Partial<Record<RLang, T>> & { en: T }, l: RLang): T => (m as Record<RLang, T>)[l] ?? m.en;
