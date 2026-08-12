import { useEffect, useState } from 'react';
import type { NewsArticle } from '../electron.d';

interface Tile {
  title: string;
  url: string;
}

function navigateTo(url: string) {
  window.dispatchEvent(new CustomEvent('wulfy-navigate', { detail: { url } }));
}

function openInNewTab(url: string, title: string) {
  window.dispatchEvent(new CustomEvent('wulfy-open-new-tab', { detail: { url, title } }));
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function StartPage() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const bookmarks = (await window.electron.bookmarks.get()) || [];
      const topVisited = (await window.electron.history.getTopVisited(12)) || [];

      const seen = new Set<string>();
      const combined: Tile[] = [];

      for (const b of bookmarks) {
        if (!seen.has(b.url)) {
          seen.add(b.url);
          combined.push({ title: b.title, url: b.url });
        }
      }
      for (const h of topVisited) {
        if (!seen.has(h.url) && combined.length < 8) {
          seen.add(h.url);
          combined.push({ title: h.title, url: h.url });
        }
      }

      setTiles(combined.slice(0, 8));
    })();

    (async () => {
      setNewsLoading(true);
      const feed = (await window.electron.news.getFeed()) || [];
      setNews(feed);
      setNewsLoading(false);
    })();
  }, []);

  return (
    <div className="start-page">
      <div className="start-page-inner">
        <h1 className="start-page-greeting">🐺 Wulfy Start</h1>

        <section className="start-page-section">
          <h2>Favoriten &amp; meistbesucht</h2>
          {tiles.length === 0 ? (
            <p className="empty-message">
              Noch keine Favoriten oder Verlauf vorhanden - besuch ein paar Seiten oder speichere
              Favoriten, dann tauchen sie hier auf.
            </p>
          ) : (
            <div className="speed-dial-grid">
              {tiles.map((tile) => (
                <button
                  key={tile.url}
                  className="speed-dial-tile"
                  onClick={() => navigateTo(tile.url)}
                  title={tile.url}
                >
                  <span className="speed-dial-icon">{hostnameOf(tile.url).charAt(0).toUpperCase()}</span>
                  <span className="speed-dial-title">{tile.title || hostnameOf(tile.url)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="start-page-section">
          <h2>Nachrichten</h2>
          {newsLoading ? (
            <p className="empty-message">Lade Nachrichten...</p>
          ) : (
            <div className="news-list">
              {news.map((article, i) => (
                <button
                  key={i}
                  className="news-item"
                  disabled={!article.link}
                  onClick={() => article.link && openInNewTab(article.link, article.title)}
                >
                  <span className="news-item-title">{article.title}</span>
                  {article.source && <span className="news-item-source">{article.source}</span>}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
