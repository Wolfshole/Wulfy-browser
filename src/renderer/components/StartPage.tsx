import { useEffect, useState } from 'react';
import type { NewsArticle, WulfyNewsItem } from '../electron.d';

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
  const [wulfyUpdates, setWulfyUpdates] = useState<WulfyNewsItem[]>([]);
  const [wulfyUpdatesLoading, setWulfyUpdatesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const bookmarks = (await window.electron.bookmarks.get()) || [];
      const tiles: Tile[] = bookmarks.map((b: any) => ({ title: b.title, url: b.url }));
      setTiles(tiles);
    })();

    (async () => {
      setNewsLoading(true);
      const feed = (await window.electron.news.getFeed()) || [];
      setNews(feed);
      setNewsLoading(false);
    })();

    (async () => {
      setWulfyUpdatesLoading(true);
      const updates = (await window.electron.news.getWulfyNews()) || [];
      setWulfyUpdates(updates);
      setWulfyUpdatesLoading(false);
    })();
  }, []);

  return (
    <div className="start-page">
      <div className="start-page-inner">
        <h1 className="start-page-greeting">
          <img src="/title-icon.png" alt="Wulfy" className="start-page-logo" />
          Wulfy Start
        </h1>

        <section className="start-page-section">
          <h2>Favoriten</h2>
          {tiles.length === 0 ? (
            <p className="empty-message">
              Noch keine Favoriten vorhanden - speichere eine Seite mit dem ☆-Button, dann taucht sie
              hier auf.
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

        {wulfyUpdates.length > 0 && (
          <section className="start-page-section">
            <h2>Wulfy Browser Updates</h2>
            <div className="news-list">
              {wulfyUpdates.map((item, i) => (
                <button
                  key={i}
                  className={`news-item wulfy-update-item wulfy-update-${item.type}`}
                  onClick={() => openInNewTab(item.url, item.title)}
                >
                  <span className="news-item-title">{item.title}</span>
                  <span className="news-item-source">
                    {item.type === 'release' ? 'Release' : 'Commit'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
        {wulfyUpdatesLoading && wulfyUpdates.length === 0 && (
          <section className="start-page-section">
            <h2>Wulfy Browser Updates</h2>
            <p className="empty-message">Lade...</p>
          </section>
        )}

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
