import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type BlogPost = CollectionEntry<'blog'>;
export type MediumPost = CollectionEntry<'medium'>;

export type UnifiedPost = {
  id: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    heroImage?: string | ImageMetadata;
    isExternal?: boolean;
    link?: string;
  };
};

export function unifyPosts(blogPosts: BlogPost[], mediumPosts: MediumPost[]): UnifiedPost[] {
  const unifiedBlogPosts: UnifiedPost[] = blogPosts.map(post => ({
    id: post.id,
    data: {
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      heroImage: post.data.heroImage,
      isExternal: post.data.isExternal ?? false,
      link: post.data.link,
    },
  }));

  const unifiedMediumPosts: UnifiedPost[] = mediumPosts.map(post => ({
    id: post.id,
    data: {
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      heroImage: post.data.heroImage,
      isExternal: post.data.isExternal,
      link: post.data.link,
    },
  }));

  return [...unifiedBlogPosts, ...unifiedMediumPosts];
}
