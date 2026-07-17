import { z } from "zod";

export const uploadSchema = z.object({
  citationStyle: z.enum(["apa7", "apa6", "harvard", "vancouver", "chicago-author-date", "chicago-notes", "mla9", "ieee", "oscola", "turabian"]),
  multiRefList: z.boolean().optional().default(false),
  label: z.string().max(200).optional(),
});

export const pasteSchema = z.object({
  text: z.string().min(1).max(500000),
  citationStyle: z.enum(["apa7", "apa6", "harvard", "vancouver", "chicago-author-date", "chicago-notes", "mla9", "ieee", "oscola", "turabian"]),
  multiRefList: z.boolean().optional().default(false),
  label: z.string().max(200).optional(),
});
