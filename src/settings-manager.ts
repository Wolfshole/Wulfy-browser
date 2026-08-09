import Store from 'electron-store';

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

export interface WallpaperPreset {
  id: string;
  name: string;
  css: string; // gültiger CSS background-image Wert (Gradient)
}

export interface WallpaperPreset {
  id: string;
  name: string;
  css: string; // fertiger CSS-Wert für background-image, z.B. ein Gradient
}

class SettingsManager {
  private store: Store;
  private defaultSearchEngines: SearchEngine[] = [
    {
      id: 'google',
      name: 'Google',
      url: 'https://www.google.com/search?q={query}',
      icon: '🔍',
    },
    {
      id: 'bing',
      name: 'Bing',
      url: 'https://www.bing.com/search?q={query}',
      icon: '🔷',
    },
    {
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      url: 'https://duckduckgo.com/?q={query}',
      icon: '🦆',
    },
    {
      id: 'wikipedia',
      name: 'Wikipedia',
      url: 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json',
      icon: '📚',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com/results?search_query={query}',
      icon: '📺',
    },
  ];

  // Feste Preset-Themes (nur Akzentfarbe - Grundhelligkeit bleibt Hell/Dunkel).
  // Nicht persistiert, dient nur als Auswahlliste für den Frontend-Farbwähler.
  private themePresets: ThemePreset[] = [
    { id: 'default-blue', name: 'Wulfy Blau', accentColor: '#0078d4' },
    { id: 'gx-purple', name: 'GX Lila', accentColor: '#8e44ec' },
    { id: 'crimson', name: 'Crimson', accentColor: '#e63950' },
    { id: 'emerald', name: 'Smaragd', accentColor: '#1abc9c' },
    { id: 'sunset', name: 'Sonnenuntergang', accentColor: '#ff7a45' },
    { id: 'gold', name: 'Gold', accentColor: '#d4a017' },
  ];

  // Vorinstallierte Wallpaper (reine CSS-Gradienten, keine Bilddateien nötig).
  private wallpaperPresets: WallpaperPreset[] = [
    { id: 'gx-purple-haze', name: 'Purple Haze', css: 'linear-gradient(135deg, #2d1b4e 0%, #8e44ec 100%)' },
    { id: 'sunset-glow', name: 'Sonnenuntergang', css: 'linear-gradient(135deg, #ff7a45 0%, #e63950 100%)' },
    { id: 'ocean-deep', name: 'Tiefsee', css: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)' },
    { id: 'emerald-forest', name: 'Smaragdwald', css: 'linear-gradient(135deg, #134e5e 0%, #1abc9c 100%)' },
    { id: 'midnight', name: 'Mitternacht', css: 'linear-gradient(135deg, #000000 0%, #232526 100%)' },
    { id: 'gold-rush', name: 'Goldrausch', css: 'linear-gradient(135deg, #d4a017 0%, #f6d365 100%)' },
    {
      id: 'aurora',
      name: 'Aurora',
      css: 'linear-gradient(135deg, #00c6ff 0%, #8e44ec 50%, #ff00cc 100%)',
    },
  ];

  constructor() {
    this.store = new Store({
      name: 'settings',
      defaults: {
        searchEngine: 'google',
        homepage: 'https://www.google.com',
        theme: 'light',
        searchEngines: this.defaultSearchEngines,
        restoreTabs: false,
        savedTabs: [],
        accentColor: '',
        backgroundImage: '',
        backgroundPresetId: '',
        adBlockEnabled: true,
        trackerBlockEnabled: true,
        cosmeticFiltersEnabled: true,
        malwareBlockEnabled: false,
        safeBrowsingApiKey: '',
        adBlockWhitelist: [] as string[],
        adBlockBlacklist: [] as string[],
        whitelist: [],
        blacklist: [],
      },
    });
  }

  /**
   * Standard-Suchmaschine abrufen
   */
  getDefaultSearchEngine(): SearchEngine {
    const engineId = this.store.get('searchEngine', 'google') as string;
    const engines = this.getSearchEngines();
    return engines.find(e => e.id === engineId) || engines[0];
  }

  /**
   * Standard-Suchmaschine setzen
   */
  setDefaultSearchEngine(engineId: string): void {
    this.store.set('searchEngine', engineId);
  }

  /**
   * Alle Suchmaschinen abrufen
   */
  getSearchEngines(): SearchEngine[] {
    return this.store.get('searchEngines', this.defaultSearchEngines) as SearchEngine[];
  }

  /**
   * Suchmaschine nach ID finden
   */
  getSearchEngineById(id: string): SearchEngine | undefined {
    return this.getSearchEngines().find(e => e.id === id);
  }

  /**
   * Benutzerdefinierte Suchmaschine hinzufügen
   */
  addCustomSearchEngine(name: string, url: string, icon?: string): SearchEngine {
    const engines = this.getSearchEngines();
    const engine: SearchEngine = {
      id: `custom-${Date.now()}`,
      name,
      url,
      icon,
    };
    engines.push(engine);
    this.store.set('searchEngines', engines);
    return engine;
  }

  /**
   * Suchmaschine löschen
   */
  deleteSearchEngine(engineId: string): boolean {
    let engines = this.getSearchEngines();
    engines = engines.filter(e => e.id !== engineId && !e.id.startsWith('custom-'));
    this.store.set('searchEngines', engines);
    return true;
  }

  /**
   * Homepage abrufen
   */
  getHomepage(): string {
    return this.store.get('homepage', 'https://www.google.com') as string;
  }

  /**
   * Homepage setzen
   */
  setHomepage(url: string): void {
    this.store.set('homepage', url);
  }

  /**
   * Theme abrufen
   */
  getTheme(): string {
    return this.store.get('theme', 'light') as string;
  }

  /**
   * Theme setzen
   */
  setTheme(theme: string): void {
    this.store.set('theme', theme);
  }

  getRestoreTabs(): boolean {
    return this.store.get('restoreTabs', false) as boolean;
  }

  setRestoreTabs(enabled: boolean): void {
    this.store.set('restoreTabs', enabled);
  }

  getSavedTabs(): SavedTab[] {
    return this.store.get('savedTabs', []) as SavedTab[];
  }

  setSavedTabs(tabs: SavedTab[]): void {
    this.store.set('savedTabs', tabs);
  }

  /**
   * Akzentfarbe abrufen (leerer String = Standardfarbe aus dem CSS)
   */
  getAccentColor(): string {
    return this.store.get('accentColor', '') as string;
  }

  /**
   * Akzentfarbe setzen (Hex-Code, z.B. "#8e44ec"), oder "" um zurückzusetzen
   */
  setAccentColor(color: string): void {
    this.store.set('accentColor', color);
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
    const preset = this.themePresets.find(p => p.id === presetId);
    if (preset) {
      this.store.set('accentColor', preset.accentColor);
    }
    return preset;
  }

  /**
   * Pfad zum Hintergrundbild abrufen (leerer String = kein eigenes Hintergrundbild)
   */
  getBackgroundImage(): string {
    return this.store.get('backgroundImage', '') as string;
  }

  /**
   * Pfad zum Hintergrundbild setzen, oder "" um zu entfernen.
   * Ein eigenes Bild und ein Preset-Wallpaper schließen sich gegenseitig aus,
   * daher wird hier immer ein aktives Preset zurückgesetzt.
   */
  setBackgroundImage(path: string): void {
    this.store.set('backgroundImage', path);
    this.store.set('backgroundPresetId', '');
  }

  /**
   * Verfügbare vorinstallierte Wallpaper abrufen
   */
  getWallpaperPresets(): WallpaperPreset[] {
    return this.wallpaperPresets;
  }

  /**
   * Aktuell aktives Wallpaper-Preset (leer = keins aktiv / eigenes Bild aktiv)
   */
  getBackgroundPresetId(): string {
    return this.store.get('backgroundPresetId', '') as string;
  }

  /**
   * Wallpaper-Preset anwenden. Setzt gleichzeitig ein eventuell aktives
   * eigenes Hintergrundbild zurück (exklusiv).
   */
  setBackgroundPreset(presetId: string): WallpaperPreset | undefined {
    const preset = this.wallpaperPresets.find(p => p.id === presetId);
    if (preset) {
      this.store.set('backgroundPresetId', presetId);
      this.store.set('backgroundImage', '');
    }
    return preset;
  }

  /**
   * KI-Konfiguration abrufen
   */
  getAIConfig(): any {
    return this.store.get('aiConfig', {
      provider: 'openai',
      apiKey: '',
      modelName: 'gpt-4',
      endpoint: 'https://api.openai.com/v1',
    });
  }

  /**
   * KI-Konfiguration setzen
   */
  setAIConfig(config: any): void {
    this.store.set('aiConfig', config);
  }

  /**
   * Werbeblocker-Status abrufen
   */
  getAdBlockEnabled(): boolean {
    return this.store.get('adBlockEnabled', true) as boolean;
  }

  /**
   * Werbeblocker aktivieren/deaktivieren
   */
  setAdBlockEnabled(enabled: boolean): void {
    this.store.set('adBlockEnabled', enabled);
  }

  getTrackerBlockEnabled(): boolean {
    return this.store.get('trackerBlockEnabled', true) as boolean;
  }

  setTrackerBlockEnabled(enabled: boolean): void {
    this.store.set('trackerBlockEnabled', enabled);
  }

  getCosmeticFiltersEnabled(): boolean {
    return this.store.get('cosmeticFiltersEnabled', true) as boolean;
  }

  setCosmeticFiltersEnabled(enabled: boolean): void {
    this.store.set('cosmeticFiltersEnabled', enabled);
  }

  getMalwareBlockEnabled(): boolean {
    return this.store.get('malwareBlockEnabled', false) as boolean;
  }

  setMalwareBlockEnabled(enabled: boolean): void {
    this.store.set('malwareBlockEnabled', enabled);
  }

  /**
   * Google Safe Browsing API-Key (leer = Malware/Phishing-Prüfung inaktiv,
   * auch wenn der Schalter an ist - ohne Key wird nichts geprüft)
   */
  getSafeBrowsingApiKey(): string {
    return this.store.get('safeBrowsingApiKey', '') as string;
  }

  setSafeBrowsingApiKey(key: string): void {
    this.store.set('safeBrowsingApiKey', key);
  }

  getAdBlockWhitelist(): string[] {
    return this.store.get('adBlockWhitelist', []) as string[];
  }

  setAdBlockWhitelist(list: string[]): void {
    this.store.set('adBlockWhitelist', list);
  }

  getAdBlockBlacklist(): string[] {
    return this.store.get('adBlockBlacklist', []) as string[];
  }

  setAdBlockBlacklist(list: string[]): void {
    this.store.set('adBlockBlacklist', list);
  }
}

export default new SettingsManager();
