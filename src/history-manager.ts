import Store from 'electron-store';

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  visitedAt: number;
  visitCount: number;
}

class HistoryManager {
  private store: Store;

  constructor() {
    this.store = new Store({
      name: 'history',
      defaults: {
        history: [],
      },
    });
  }

  /**
   * Besuch hinzufügen. Existiert die URL schon, wird der Eintrag aktualisiert
   * (Titel, Zeit, Besuchszähler) und nach oben verschoben statt dupliziert.
   */
  addVisit(title: string, url: string, favicon?: string): HistoryEntry {
    const history = this.getAllHistory();
    const existingIndex = history.findIndex(h => h.url === url);

    if (existingIndex !== -1) {
      const existing = history[existingIndex];
      existing.title = title;
      existing.favicon = favicon ?? existing.favicon;
      existing.visitedAt = Date.now();
      existing.visitCount = (existing.visitCount || 1) + 1;
      history.splice(existingIndex, 1);
      history.unshift(existing);
      this.store.set('history', history);
      return existing;
    }

    const entry: HistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      url,
      favicon,
      visitedAt: Date.now(),
      visitCount: 1,
    };
    history.unshift(entry);
    this.store.set('history', history);
    return entry;
  }

  /**
   * Kompletten Verlauf abrufen (unsortiert nach Speicherreihenfolge = neueste zuerst)
   */
  getAllHistory(): HistoryEntry[] {
    return this.store.get('history', []) as HistoryEntry[];
  }

  /**
   * Verlauf mit optionalem Limit und Suchfilter (Titel oder URL)
   */
  getHistory(limit?: number, search?: string): HistoryEntry[] {
    let history = this.getAllHistory();

    if (search) {
      const term = search.toLowerCase();
      history = history.filter(
        h => h.title.toLowerCase().includes(term) || h.url.toLowerCase().includes(term)
      );
    }

    if (limit) {
      history = history.slice(0, limit);
    }

    return history;
  }

  deleteEntry(entryId: string): boolean {
    const history = this.getAllHistory().filter(h => h.id !== entryId);
    this.store.set('history', history);
    return true;
  }

  deleteUrl(url: string): boolean {
    const history = this.getAllHistory().filter(h => h.url !== url);
    this.store.set('history', history);
    return true;
  }

  clearHistory(): void {
    this.store.set('history', []);
  }

  clearHistorySince(since: number): void {
    const history = this.getAllHistory().filter(h => h.visitedAt < since);
    this.store.set('history', history);
  }

  getTopVisited(limit: number = 10): HistoryEntry[] {
    return [...this.getAllHistory()]
      .sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
      .slice(0, limit);
  }

  getTodayHistory(): HistoryEntry[] {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.getAllHistory().filter(h => h.visitedAt >= startOfDay.getTime());
  }

  exportHistory(): HistoryEntry[] {
    return this.getAllHistory();
  }

  importHistory(entries: HistoryEntry[]): void {
    this.store.set('history', entries);
  }
}

export default new HistoryManager();
