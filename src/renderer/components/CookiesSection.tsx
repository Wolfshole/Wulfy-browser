import { useMemo, useState } from 'react';
import { useCookies } from '../hooks/useCookies';

export default function CookiesSection() {
  const { groups, loading, deleteOne, deleteForDomain, clearAll } = useCookies();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const term = search.trim().toLowerCase();
    return groups.filter((g) => g.domain.toLowerCase().includes(term));
  }, [groups, search]);

  const toggleExpanded = (domain: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const totalCount = groups.reduce((sum, g) => sum + g.cookies.length, 0);

  return (
    <div className="cookies-section">
      <div className="cookies-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Domain durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="small-btn"
          onClick={() => {
            if (confirm('Wirklich ALLE Cookies aller Seiten löschen?')) clearAll();
          }}
          disabled={totalCount === 0}
        >
          Alle löschen
        </button>
      </div>

      <p className="settings-page-hint">
        {loading
          ? 'Lade Cookies...'
          : `${totalCount.toLocaleString('de-DE')} Cookies auf ${groups.length.toLocaleString('de-DE')} Domains.`}
      </p>

      {!loading && filteredGroups.length === 0 && (
        <p className="empty-message">Keine Cookies gefunden.</p>
      )}

      <div className="cookie-domain-list">
        {filteredGroups.map((group) => {
          const isOpen = expanded.has(group.domain);
          return (
            <div key={group.domain} className="cookie-domain-group">
              <div className="cookie-domain-header" onClick={() => toggleExpanded(group.domain)}>
                <span className="cookie-domain-toggle">{isOpen ? '▾' : '▸'}</span>
                <span className="cookie-domain-name">{group.domain}</span>
                <span className="cookie-domain-count">{group.cookies.length}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteForDomain(group.domain);
                  }}
                  title="Alle Cookies dieser Domain löschen"
                >
                  🗑️
                </button>
              </div>

              {isOpen && (
                <div className="cookie-entry-list">
                  {group.cookies.map((cookie) => (
                    <div key={`${cookie.name}-${cookie.path}`} className="cookie-entry">
                      <div className="cookie-entry-info">
                        <span className="cookie-entry-name">{cookie.name}</span>
                        <span className="cookie-entry-meta">
                          {cookie.path} {cookie.secure ? '· sicher' : ''}
                          {cookie.httpOnly ? ' · HttpOnly' : ''}
                        </span>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => deleteOne(cookie.domain, cookie.path, cookie.name, cookie.secure)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
