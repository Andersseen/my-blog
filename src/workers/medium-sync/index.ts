export interface Env {
  MEDIUM_SYNC_KV: KVNamespace;
  MEDIUM_RSS_URL: string;
  GITHUB_REPO: string;
  WORKFLOW_FILENAME: string;
  GITHUB_TOKEN: string;
}

interface SyncStatus {
  lastCheck: string;
  lastPostGuid: string | null;
  lastPostTitle: string | null;
  lastDeploy: string | null;
  newPostDetected: boolean;
}

async function fetchAndParseRSS(url: string): Promise<{ guid: string; title: string } | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      cf: { cacheTtl: 60 },
    });

    if (!response.ok) {
      console.error(`RSS fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    // Check for XML parse errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parse error:', parserError.textContent);
      return null;
    }

    const firstItem = doc.querySelector('item');
    if (!firstItem) {
      console.warn('No items found in RSS feed');
      return null;
    }

    const guid = firstItem.querySelector('guid')?.textContent?.trim() || null;
    const title = firstItem.querySelector('title')?.textContent?.trim() || null;

    if (!guid || !title) {
      console.warn('Missing guid or title in first RSS item');
      return null;
    }

    return { guid, title };
  } catch (error) {
    console.error('Error fetching RSS:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function triggerGitHubDeploy(env: Env): Promise<boolean> {
  try {
    const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${env.WORKFLOW_FILENAME}/dispatches`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'my-blog-medium-sync-worker',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error: ${response.status}`, errorText);
      return false;
    }

    console.log('Successfully triggered GitHub workflow dispatch');
    return true;
  } catch (error) {
    console.error('Error triggering GitHub deploy:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function handleCron(env: Env): Promise<Response> {
  console.log(`[${new Date().toISOString()}] Running Medium sync check...`);

  const latestPost = await fetchAndParseRSS(env.MEDIUM_RSS_URL);

  if (!latestPost) {
    return new Response(JSON.stringify({ ok: false, error: 'Failed to fetch RSS' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const lastGuid = await env.MEDIUM_SYNC_KV.get('last-post-guid');
  const hasNewPost = lastGuid !== latestPost.guid;

  if (hasNewPost) {
    console.log(`New post detected: "${latestPost.title}" (${latestPost.guid})`);

    // Update KV immediately to prevent duplicate triggers
    await env.MEDIUM_SYNC_KV.put('last-post-guid', latestPost.guid);

    const status: SyncStatus = {
      lastCheck: new Date().toISOString(),
      lastPostGuid: latestPost.guid,
      lastPostTitle: latestPost.title,
      lastDeploy: new Date().toISOString(),
      newPostDetected: true,
    };
    await env.MEDIUM_SYNC_KV.put('sync-status', JSON.stringify(status));

    // Trigger deploy
    const deployOk = await triggerGitHubDeploy(env);

    return new Response(
      JSON.stringify({
        ok: true,
        newPost: true,
        post: { guid: latestPost.guid, title: latestPost.title },
        previousGuid: lastGuid,
        deployTriggered: deployOk,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // No new post, just update check timestamp
  const status: SyncStatus = {
    lastCheck: new Date().toISOString(),
    lastPostGuid: latestPost.guid,
    lastPostTitle: latestPost.title,
    lastDeploy: (await env.MEDIUM_SYNC_KV.get('sync-status'))
      ? JSON.parse((await env.MEDIUM_SYNC_KV.get('sync-status'))!).lastDeploy
      : null,
    newPostDetected: false,
  };
  await env.MEDIUM_SYNC_KV.put('sync-status', JSON.stringify(status));

  return new Response(
    JSON.stringify({
      ok: true,
      newPost: false,
      currentPost: { guid: latestPost.guid, title: latestPost.title },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleHTTPRequest(env: Env): Promise<Response> {
  const statusRaw = await env.MEDIUM_SYNC_KV.get('sync-status');
  const status: SyncStatus | null = statusRaw ? JSON.parse(statusRaw) : null;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Medium Sync Status</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    .card { background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 20px 0; }
    .ok { color: #059669; }
    .info { color: #2563eb; }
    code { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
    .button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <h1>Medium Sync Status</h1>
  <div class="card">
    <h2>Last Check</h2>
    <p>${status ? new Date(status.lastCheck).toLocaleString() : 'Never'}</p>
    ${status?.newPostDetected ? `<p class="ok">New post detected at last check!</p>` : ''}
  </div>
  
  ${status?.lastPostTitle ? `
  <div class="card">
    <h2>Latest Post</h2>
    <p><strong>${status.lastPostTitle}</strong></p>
    <p><code>${status.lastPostGuid}</code></p>
  </div>
  ` : ''}
  
  ${status?.lastDeploy ? `
  <div class="card">
    <h2>Last Deploy</h2>
    <p>${new Date(status.lastDeploy).toLocaleString()}</p>
  </div>
  ` : ''}

  <div class="card">
    <h2>Manual Trigger</h2>
    <p>You can also trigger a manual check:</p>
    <form method="POST" action="/">
      <button type="submit" class="button">Run Sync Check Now</button>
    </form>
  </div>

  <footer style="margin-top: 40px; color: #6b7280; font-size: 0.9em;">
    <p>Auto-sync runs every 30 minutes via Cloudflare Cron Trigger.</p>
    <p>Scheduled redeploy runs every 6 hours via GitHub Actions.</p>
  </footer>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'POST') {
      return handleCron(env);
    }
    return handleHTTPRequest(env);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleCron(env));
  },
};
