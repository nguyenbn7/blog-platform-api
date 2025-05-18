import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Required").max(255, "Maximum length is 255"),
  description: z.string().optional().nullable().default(null),
});
