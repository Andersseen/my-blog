import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static SEO assets', () => {
  it('deploys the main build to the Cloudflare Pages production environment', () => {
    const workflow = readFileSync('.github/workflows/deploy-pages-on-pr-merge.yml', 'utf8');

    expect(workflow).toContain(
      'pnpm wrangler pages deploy ./dist --project-name "$CLOUDFLARE_PAGES_PROJECT_NAME"',
    );
    expect(workflow).not.toContain('wrangler pages deploy ./dist --branch');
  });

  it('marks the RSS feed as crawlable but not indexable on Cloudflare Pages', () => {
    const headers = readFileSync('public/_headers', 'utf8');

    expect(headers).toMatch(/\/rss\.xml\s+X-Robots-Tag: noindex, follow/);
  });

  it('permits the self-hosted Umami tracker in the Cloudflare Pages CSP', () => {
    const headers = readFileSync('public/_headers', 'utf8');

    expect(headers).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://giscus.app https://umami.andersseen.dev",
    );
    expect(headers).toContain("connect-src 'self' https://giscus.app https://umami.andersseen.dev");
  });

  it('uses versioned Andersseen icons in favicon metadata and manifest', () => {
    const favicons = readFileSync('src/components/seo/SeoFavicons.astro', 'utf8');
    const manifest = readFileSync('public/site.webmanifest', 'utf8');
    const svg = readFileSync('public/favicon.svg', 'utf8');

    expect(favicons).toContain('2026-09-17');
    expect(manifest).toContain('/icon-192.png?v=2026-09-17');
    expect(manifest).toContain('/icon-512.png?v=2026-09-17');
    expect(manifest).toContain('/maskable-icon-512.png?v=2026-09-17');
    expect(svg).toContain('viewBox="0 0 800 800"');
    expect(svg).not.toContain('Andrii Pap Blog icon');
  });
});
