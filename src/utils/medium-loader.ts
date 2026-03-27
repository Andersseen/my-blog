import Parser from 'rss-parser';
import type { LoaderContext } from 'astro/loaders';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 10000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchMediumFeed(
  parser: Parser,
  url: string,
  logger: LoaderContext['logger'],
): Promise<ReturnType<typeof parser.parseURL>> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Fetching Medium feed (attempt ${attempt}/${MAX_RETRIES}) from ${url}`);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
      });

      const feed = await Promise.race([parser.parseURL(url), timeoutPromise]);

      logger.info(`Successfully fetched Medium feed on attempt ${attempt}`);
      return feed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < MAX_RETRIES) {
        logger.info(`Waiting ${RETRY_DELAY}ms before retry...`);
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  throw lastError || new Error(`Failed to fetch Medium feed after ${MAX_RETRIES} attempts`);
}

function extractHeroImage(content: string): string | undefined {
  try {
    const figureImgs = [
      ...content.matchAll(/<figure[^\u003e]*\u003e[\s\S]*?<img[^\u003e]+src=["']([^"']+)["']/gi),
    ]
      .map(m => m[1])
      .filter(src => src.startsWith('https://cdn-images-1.medium.com'));

    if (figureImgs.length === 0) {
      return undefined;
    }

    const best = figureImgs.reduce((a, b) => {
      const widthA = parseInt(a.match(/\/max\/(\d+)\//)?.[1] || '0', 10);
      const widthB = parseInt(b.match(/\/max\/(\d+)\//)?.[1] || '0', 10);
      return widthB > widthA ? b : a;
    });

    return best.replace(/\/max\/\d+\//, '/max/1024/');
  } catch (error) {
    console.warn('Failed to extract hero image:', error);
    return undefined;
  }
}

function cleanDescription(contentSnippet: string | undefined): string {
  if (!contentSnippet) {
    return '';
  }

  try {
    const firstLine = contentSnippet.split('\n')[0];
    return firstLine.length > 160 ? `${firstLine.substring(0, 160)}...` : firstLine;
  } catch (error) {
    console.warn('Failed to clean description:', error);
    return '';
  }
}

/**
 * Custom Astro Loader for Medium RSS Feed
 * Fetches posts, extracts the first image, and normalizes the data for the Content Layer.
 * Includes retry logic and timeout handling.
 */
export function mediumLoader(url: string) {
  const parser = new Parser();

  return {
    name: 'medium-loader',
    load: async (context: LoaderContext) => {
      const { store, logger, parseData } = context;

      try {
        const feed = await fetchMediumFeed(parser, url, logger);
        let successCount = 0;
        let skipCount = 0;

        for (const item of feed.items) {
          if (!item.guid || !item.title) {
            skipCount++;
            continue;
          }

          try {
            const content = item['content:encoded'] || '';
            const heroImage = extractHeroImage(content);
            const description = cleanDescription(item.contentSnippet);

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
              },
            });

            store.set({
              id: item.guid,
              data: parsedData,
            });

            successCount++;
          } catch (itemError) {
            logger.warn(
              `Failed to process item ${item.guid}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`,
            );
            skipCount++;
          }
        }

        logger.info(`Medium loader completed: ${successCount} posts loaded, ${skipCount} skipped`);
      } catch (error) {
        logger.error(
          `Failed to load Medium feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  };
}
