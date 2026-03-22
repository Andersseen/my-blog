import Parser from 'rss-parser';
import type { LoaderContext } from 'astro/loaders';

/**
 * Custom Astro Loader for Medium RSS Feed
 * Fetches posts, extracts the first image, and normalizes the data for the Content Layer.
 */
export function mediumLoader(url: string) {
  const parser = new Parser();

  return {
    name: 'medium-loader',
    load: async (context: LoaderContext) => {
      const { store, logger, parseData } = context;
      
      logger.info(`Fetching Medium feed from ${url}`);
      
      try {
        const feed = await parser.parseURL(url);
        
        for (const item of feed.items) {
          if (!item.guid || !item.title) continue;

          // Extract first image from content:encoded
          const content = item['content:encoded'] || '';
          const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
          const heroImage = imgMatch ? imgMatch[1] : undefined;
          
          // Clean up description (strip HTML)
          const description = item.contentSnippet 
            ? item.contentSnippet.split('\n')[0].substring(0, 160) + '...'
            : '';

          const parsedData = await parseData({
            id: item.guid,
            data: {
              title: item.title,
              description: description,
              pubDate: new Date(item.pubDate || ''),
              link: item.link,
              heroImage: heroImage,
              categories: item.categories || [],
              isExternal: true,
            }
          });

          store.set({
            id: item.guid,
            data: parsedData,
          });
        }
        
        logger.info(`Successfully loaded ${feed.items.length} posts from Medium`);
      } catch (error) {
        logger.error(`Failed to load Medium feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}
