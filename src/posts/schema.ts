import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .trim()
    .min(1, "Title is empty or/and contains whitespaces")
    .max(255, "Title maximum length is 255 charaters"),
  content: z
    .string({ message: "Content is required" })
    .min(1, "Content is required"),
  categoryId: z.string().uuid().optional().nullable().default(null),
  published: z.boolean().default(false),
});
