import { z } from "zod";
import { TAROT_CATEGORIES } from "@/lib/readings/tarot";

export const numerologyInput = z.object({
  name: z.string().trim().min(2).max(80).regex(/\p{L}/u, "Name must contain letters"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  method: z.enum(["pythagorean", "chaldean"]).default("pythagorean"),
});
export const tarotInput = z.object({
  category: z.enum(TAROT_CATEGORIES),
  question: z.string().trim().max(300).optional().default(""),
});
export const palmistryInput = z.object({
  dominant: z.enum(["left", "right"]),
  hands: z.enum(["left", "right", "both"]),
});

export type NumerologyInput = z.infer<typeof numerologyInput>;
export type TarotInput = z.infer<typeof tarotInput>;
export type PalmistryInput = z.infer<typeof palmistryInput>;
export type ReadingInput = NumerologyInput | TarotInput | PalmistryInput;

export const INPUT_SCHEMA = { numerology: numerologyInput, tarot: tarotInput, palmistry: palmistryInput } as const;
