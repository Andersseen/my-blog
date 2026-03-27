import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { mediumLoader } from './utils/medium-loader';

const MEDIUM_RSS_URL = process.env.MEDIUM_RSS_URL || 'https://medium.com/feed/@andriipap';

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
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
  loader: mediumLoader(MEDIUM_RSS_URL),
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
