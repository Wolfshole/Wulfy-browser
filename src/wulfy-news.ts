import https from 'https';

export interface WulfyNewsItem {
  type: 'release' | 'commit';
  title: string;
  url: string;
  date: string;
}

const REPO = 'Wolfshole/Wulfy-brwoser';
const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { items: WulfyNewsItem[]; fetchedAt: number } | null = null;

function fetchJson(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(
        `https://api.github.com${path}`,
        { headers: { 'User-Agent': 'wulfy-browser', Accept: 'application/vnd.github+json' }, timeout: 5000 },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          });
        },
      )
      .on('error', reject)
      .on('timeout', () => reject(new Error('timeout')));
  });
}

export async function getWulfyNews(): Promise<WulfyNewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  const items: WulfyNewsItem[] = [];

  try {
    const releases = await fetchJson(`/repos/${REPO}/releases?per_page=5`);
    if (Array.isArray(releases)) {
      for (const r of releases) {
        items.push({
          type: 'release',
          title: `${r.name || r.tag_name} veröffentlicht`,
          url: r.html_url,
          date: r.published_at || r.created_at,
        });
      }
    }
  } catch {
    // Releases nicht erreichbar - Commits unten reichen als Fallback
  }

  try {
    const commits = await fetchJson(`/repos/${REPO}/commits?per_page=8`);
    if (Array.isArray(commits)) {
      for (const c of commits) {
        const firstLine = (c.commit?.message || '').split('\n')[0];
        if (!firstLine) continue;
        items.push({
          type: 'commit',
          title: firstLine,
          url: c.html_url,
          date: c.commit?.author?.date || c.commit?.committer?.date,
        });
      }
    }
  } catch {
    // Commits nicht erreichbar
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const limited = items.slice(0, 10);

  if (limited.length > 0) {
    cache = { items: limited, fetchedAt: Date.now() };
  }

  return limited;
}
