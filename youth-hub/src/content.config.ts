import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Hand-written guides: the pages AdSense reviews and search brings people to. One Markdown file each.
const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(["contest", "travel", "job", "common"]),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    // Drafts are built in dev only, never published.
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
