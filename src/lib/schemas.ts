import { z } from "zod";

export const birthInputSchema = z
  .object({
    fullName: z.string().trim().min(1, "Please enter a name").max(80),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM").optional().or(z.literal("")),
    precision: z.enum(["exact", "approximate", "unknown"]),
    uncertaintyMinutes: z.coerce.number().int().min(5).max(240).optional(),
    placeId: z.coerce.number().int().positive(),
    fold: z.union([z.literal(0), z.literal(1)]).optional(),
    language: z.enum(["en", "hi", "hinglish"]).default("en"),
  })
  .superRefine((v, ctx) => {
    if (v.precision !== "unknown" && !v.time) ctx.addIssue({ code: "custom", path: ["time"], message: "Enter a birth time or mark it as unknown" });
    const y = Number(v.date.slice(0, 4));
    if (y < 1800 || y > new Date().getFullYear()) ctx.addIssue({ code: "custom", path: ["date"], message: "Supported birth years are 1800 to today" });
  });
export type BirthInput = z.infer<typeof birthInputSchema>;

export const chatSchema = z.object({
  conversationId: z.string().cuid().optional(),
  question: z.string().trim().min(3).max(600),
  language: z.enum(["en", "hi", "hinglish"]).default("en"),
  deep: z.boolean().optional(),
});
