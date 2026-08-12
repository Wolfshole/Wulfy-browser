import https from 'https';

export interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

const FEED_URL = 'https://news.google.com/rss?hl=de&gl=DE&ceid=DE:de';
const CACHE_TTL_MS = 15 * 60 * 1000;

let cache: { articles: NewsArticle[]; fetchedAt: number } | null = null;

function fetchXml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'WulfyBrowser/1.0' }, timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject)
      .on('timeout', () => reject(new Error('timeout')));
  });
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseRss(xml: string): NewsArticle[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  return items
    .slice(0, 12)
    .map((block) => {
      const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      return {
        title: extractTag(block, 'title'),
        link: extractTag(block, 'link'),
        pubDate: extractTag(block, 'pubDate'),
        source: sourceMatch ? sourceMatch[1].replace(/<[^>]+>/g, '').trim() : '',
      };
    })
    .filter((a) => a.title && a.link);
}

const PLACEHOLDER: NewsArticle[] = [
  { title: 'Nachrichten momentan nicht verfügbar', link: '', pubDate: '', source: 'Wulfy Browser' },
];

export async function getNewsFeed(): Promise<NewsArticle[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.articles;
  }

  try {
    const xml = await fetchXml(FEED_URL);
    const articles = parseRss(xml);
    if (articles.length > 0) {
      cache = { articles, fetchedAt: Date.now() };
      return articles;
    }
  } catch {
    // Feed nicht erreichbar - unten Platzhalter zurückgeben
  }

  return PLACEHOLDER;
}
