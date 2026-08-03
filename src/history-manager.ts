import Store from "electron-store";

export interface SearchEngine {
  id: string;
  name: string;
  url: string; // URL mit {query} Platzhalter
  icon?: string;
}

export interface SavedTab {
  url: string;
  title: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  accentColor: string;
}

class SettingsManager {
  private store: Store;
  private defaultSearchEngines: SearchEngine[] = [
    {
      id: "google",
      name: "Google",
      url: "https://www.google.com/search?q={query}",
      icon: "🔍",
    },
    {
      id: "bing",
      name: "Bing",
      url: "https://www.bing.com/search?q={query}",
      icon: "🔷",
    },
    {
      id: "duckduckgo",
      name: "DuckDuckGo",
      url: "https://duckduckgo.com/?q={query}",
      icon: "🦆",
    },
    {
      id: "wikipedia",
      name: "Wikipedia",
      url: "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json",
      icon: "📚",
    },
    {
      id: "youtube",
      name: "YouTube",
      url: "https://www.youtube.com/results?search_query={query}",
      icon: "📺",
    },
  ];

  // Feste Preset-Themes (nur Akzentfarbe - Grundhelligkeit bleibt Hell/Dunkel).
  // Nicht persistiert, dient nur als Auswahlliste für den Frontend-Farbwähler.
  private themePresets: ThemePreset[] = [
    { id: "default-blue", name: "Wulfy Blau", accentColor: "#0078d4" },
    { id: "gx-purple", name: "GX Lila", accentColor: "#8e44ec" },
    { id: "crimson", name: "Crimson", accentColor: "#e63950" },
    { id: "emerald", name: "Smaragd", accentColor: "#1abc9c" },
    { id: "sunset", name: "Sonnenuntergang", accentColor: "#ff7a45" },
    { id: "gold", name: "Gold", accentColor: "#d4a017" },
  ];

  constructor() {
    this.store = new Store({
      name: "settings",
      defaults: {
        searchEngine: "google",
        homepage: "https://www.google.com",
        theme: "light",
        searchEngines: this.defaultSearchEngines,
        restoreTabs: false,
        savedTabs: [],
        accentColor: "",
        backgroundImage: "",
      },
    });
  }

  /**
   * Standard-Suchmaschine abrufen
   */
  getDefaultSearchEngine(): SearchEngine {
    const engineId = this.store.get("searchEngine", "google") as string;
    const engines = this.getSearchEngines();
    return engines.find((e) => e.id === engineId) || engines[0];
  }

  /**
   * Standard-Suchmaschine setzen
   */
  setDefaultSearchEngine(engineId: string): void {
    this.store.set("searchEngine", engineId);
  }

  /**
   * Alle Suchmaschinen abrufen
   */
  getSearchEngines(): SearchEngine[] {
    return this.store.get(
      "searchEngines",
      this.defaultSearchEngines,
    ) as SearchEngine[];
  }

  /**
   * Suchmaschine nach ID finden
   */
  getSearchEngineById(id: string): SearchEngine | undefined {
    return this.getSearchEngines().find((e) => e.id === id);
  }

  /**
   * Benutzerdefinierte Suchmaschine hinzufügen
   */
  addCustomSearchEngine(
    name: string,
    url: string,
    icon?: string,
  ): SearchEngine {
    const engines = this.getSearchEngines();
    const engine: SearchEngine = {
      id: `custom-${Date.now()}`,
      name,
      url,
      icon,
    };
    engines.push(engine);
    this.store.set("searchEngines", engines);
    return engine;
  }

  /**
   * Suchmaschine löschen
   */
  deleteSearchEngine(engineId: string): boolean {
    let engines = this.getSearchEngines();
    engines = engines.filter(
      (e) => e.id !== engineId && !e.id.startsWith("custom-"),
    );
    this.store.set("searchEngines", engines);
    return true;
  }

  /**
   * Homepage abrufen
   */
  getHomepage(): string {
    return this.store.get("homepage", "https://www.google.com") as string;
  }

  /**
   * Homepage setzen
   */
  setHomepage(url: string): void {
    this.store.set("homepage", url);
  }

  /**
   * Theme abrufen
   */
  getTheme(): string {
    return this.store.get("theme", "light") as string;
  }

  /**
   * Theme setzen
   */
  setTheme(theme: string): void {
    this.store.set("theme", theme);
  }

  getRestoreTabs(): boolean {
    return this.store.get("restoreTabs", false) as boolean;
  }

  setRestoreTabs(enabled: boolean): void {
    this.store.set("restoreTabs", enabled);
  }

  getSavedTabs(): SavedTab[] {
    return this.store.get("savedTabs", []) as SavedTab[];
  }

  setSavedTabs(tabs: SavedTab[]): void {
    this.store.set("savedTabs", tabs);
  }

  /**
   * Akzentfarbe abrufen (leerer String = Standardfarbe aus dem CSS)
   */
  getAccentColor(): string {
    return this.store.get("accentColor", "") as string;
  }

  /**
   * Akzentfarbe setzen (Hex-Code, z.B. "#8e44ec"), oder "" um zurückzusetzen
   */
  setAccentColor(color: string): void {
    this.store.set("accentColor", color);
  }

  /**
   * Verfügbare Preset-Themes abrufen
   */
  getThemePresets(): ThemePreset[] {
    return this.themePresets;
  }

  /**
   * Preset anwenden: setzt die Akzentfarbe auf den Preset-Wert
   */
  applyThemePreset(presetId: string): ThemePreset | undefined {
    const preset = this.themePresets.find((p) => p.id === presetId);
    if (preset) {
      this.store.set("accentColor", preset.accentColor);
    }
    return preset;
  }

  /**
   * Pfad zum Hintergrundbild abrufen (leerer String = kein Hintergrundbild)
   */
  getBackgroundImage(): string {
    return this.store.get("backgroundImage", "") as string;
  }

  /**
   * Pfad zum Hintergrundbild setzen, oder "" um zu entfernen
   */
  setBackgroundImage(path: string): void {
    this.store.set("backgroundImage", path);
  }

  /**
   * KI-Konfiguration abrufen
   */
  getAIConfig(): any {
    return this.store.get("aiConfig", {
      provider: "openai",
      apiKey: "",
      modelName: "gpt-4",
      endpoint: "https://api.openai.com/v1",
    });
  }

  /**
   * KI-Konfiguration setzen
   */
  setAIConfig(config: any): void {
    this.store.set("aiConfig", config);
  }
}

export default new SettingsManager();
