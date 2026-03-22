import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { mediumLoader } from "./utils/medium-loader";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      isExternal: z.boolean().optional().default(false),
      link: z.string().optional(),
    }),
});

const medium = defineCollection({
  loader: mediumLoader("https://medium.com/feed/@andriipap"),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().url().optional(),
    categories: z.array(z.string()).optional(),
    isExternal: z.boolean().default(true),
    link: z.string().url(),
  }),
});

export const collections = { blog, medium };
