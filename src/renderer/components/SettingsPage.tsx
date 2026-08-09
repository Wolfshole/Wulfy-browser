import { useEffect, useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useAIConfig } from '../hooks/useAIConfig';
import { useAdBlock } from '../hooks/useAdBlock';
import DomainListEditor from './DomainListEditor';
import ToggleSwitch from './ToggleSwitch';

type Category = 'general' | 'search' | 'tabs' | 'privacy' | 'ai';

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'general', label: 'Design', icon: '🎨' },
  { id: 'search', label: 'Suchmaschine', icon: '🔍' },
  { id: 'tabs', label: 'Tabs', icon: '🗂️' },
  { id: 'privacy', label: 'Privatsphäre', icon: '🛡️' },
  { id: 'ai', label: 'KI-Assistent', icon: '🤖' },
];

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    searchEngines,
    selectedEngineId,
    setSearchEngine,
    restoreTabs,
    setRestoreTabs,
    accentColor,
    setAccentColor,
    themePresets,
    applyPreset,
    backgroundImage,
    chooseBackgroundImage,
    clearBackgroundImage,
    wallpaperPresets,
    activeWallpaperPresetId,
    applyWallpaperPreset,
  } = useSettings();

  const { config: aiConfig, save: saveAIConfig } = useAIConfig();
  const {
    adBlockEnabled,
    setAdBlockEnabled,
    trackerBlockEnabled,
    setTrackerBlockEnabled,
    cosmeticFiltersEnabled,
    setCosmeticFiltersEnabled,
    malwareBlockEnabled,
    setMalwareBlockEnabled,
    safeBrowsingApiKey,
    setSafeBrowsingApiKey,
    stats,
    whitelist,
    addWhitelistEntry,
    removeWhitelistEntry,
    blacklist,
    addBlacklistEntry,
    removeBlacklistEntry,
  } = useAdBlock();
  const [apiKeyDraft, setApiKeyDraft] = useState(safeBrowsingApiKey);
  const [aiConfigOpen, setAIConfigOpen] = useState(false);
  const [aiConfigDraft, setAIConfigDraft] = useState(aiConfig);

  useEffect(() => {
    setAIConfigDraft(aiConfig);
  }, [aiConfig]);

  useEffect(() => {
    setApiKeyDraft(safeBrowsingApiKey);
  }, [safeBrowsingApiKey]);

  const [category, setCategory] = useState<Category>('general');

  return (
    <div className="settings-page">
      <aside className="settings-page-sidebar">
        <h2 className="settings-page-title">⚙️ Einstellungen</h2>
        <nav>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`settings-page-nav-item${category === cat.id ? ' active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <span className="settings-page-nav-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="settings-page-content">
        {category === 'general' && (
          <section className="settings-page-section">
            <h3>Design</h3>
            <p className="settings-page-hint">Wähle, wie Wulfy Browser aussehen soll.</p>
            <div className="settings-page-theme-cards">
              <button
                className={`settings-page-theme-card${theme === 'light' ? ' active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <span className="settings-page-theme-preview settings-page-theme-preview-light" />
                ☀️ Hell
              </button>
              <button
                className={`settings-page-theme-card${theme === 'dark' ? ' active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <span className="settings-page-theme-preview settings-page-theme-preview-dark" />
                🌙 Dunkel
              </button>
            </div>

            <h3 style={{ marginTop: 28 }}>Akzentfarbe</h3>
            <p className="settings-page-hint">
              Bestimmt die Farbe von Buttons, aktiven Tabs und Hervorhebungen im ganzen Browser.
            </p>
            <div className="accent-color-picker">
              <input
                type="color"
                className="accent-color-input"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
              <span className="accent-color-value">{accentColor}</span>
            </div>
            <div className="accent-color-swatches">
              {themePresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`accent-color-swatch${
                    accentColor.toLowerCase() === preset.accentColor.toLowerCase() ? ' active' : ''
                  }`}
                  style={{ background: preset.accentColor }}
                  onClick={() => applyPreset(preset.id)}
                  title={preset.name}
                />
              ))}
            </div>

            <h3 style={{ marginTop: 28 }}>Hintergrundbild</h3>
            <p className="settings-page-hint">
              Legt ein Bild hinter Toolbar und Tab-Leiste, ähnlich wie bei Opera GX.
            </p>

            <p className="settings-page-hint" style={{ marginBottom: 8, fontWeight: 600 }}>
              Vorinstallierte Wallpaper
            </p>
            <div className="wallpaper-preset-grid">
              {wallpaperPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`wallpaper-preset-swatch${
                    activeWallpaperPresetId === preset.id ? ' active' : ''
                  }`}
                  style={{ backgroundImage: preset.css }}
                  onClick={() => applyWallpaperPreset(preset.id)}
                  title={preset.name}
                >
                  <span className="wallpaper-preset-label">{preset.name}</span>
                </button>
              ))}
            </div>

            <p className="settings-page-hint" style={{ marginTop: 20, marginBottom: 8, fontWeight: 600 }}>
              Eigenes Bild
            </p>
            {backgroundImage ? (
              <div className="background-image-preview-row">
                <img src={backgroundImage} alt="Hintergrundbild" className="background-image-preview" />
                <div className="background-image-preview-actions">
                  <button className="settings-btn" onClick={chooseBackgroundImage}>
                    Anderes Bild wählen
                  </button>
                  <button className="settings-btn" onClick={clearBackgroundImage}>
                    Entfernen
                  </button>
                </div>
              </div>
            ) : (
              <button className="settings-btn" onClick={chooseBackgroundImage}>
                Bild wählen
              </button>
            )}
          </section>
        )}

        {category === 'search' && (
          <section className="settings-page-section">
            <h3>Suchmaschine</h3>
            <p className="settings-page-hint">
              Wird verwendet, wenn du in der Adressleiste keine vollständige URL eingibst.
            </p>
            <select
              className="search-select"
              value={selectedEngineId}
              onChange={(e) => setSearchEngine(e.target.value)}
            >
              {searchEngines.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.icon ? `${engine.icon} ` : ''}
                  {engine.name}
                </option>
              ))}
            </select>
          </section>
        )}

        {category === 'tabs' && (
          <section className="settings-page-section">
            <h3>Tabs</h3>
            <ToggleSwitch
              checked={restoreTabs}
              onChange={setRestoreTabs}
              label="Beim Start zuletzt geöffnete Tabs wiederherstellen"
            />
          </section>
        )}

        {category === 'privacy' && (
          <section className="settings-page-section">
            <h3>Privatsphäre</h3>

            <ToggleSwitch checked={adBlockEnabled} onChange={setAdBlockEnabled} label="Werbeblocker aktivieren" />
            <p className="settings-page-hint">Blockiert Anfragen an bekannte Werbe-Netzwerke.</p>

            <ToggleSwitch
              checked={trackerBlockEnabled}
              onChange={setTrackerBlockEnabled}
              label="Tracker-Blocker aktivieren"
            />
            <p className="settings-page-hint">Blockiert Analytics- und Tracking-Skripte.</p>

            <ToggleSwitch
              checked={cosmeticFiltersEnabled}
              onChange={setCosmeticFiltersEnabled}
              label="Kosmetische Filter aktivieren"
            />
            <p className="settings-page-hint">
              Blendet übrig gebliebene (leere) Werbeflächen per CSS aus, auch wenn das Skript selbst
              nicht blockiert wurde.
            </p>

            <p className="adblock-count">
              {stats.ads.toLocaleString('de-DE')} Werbe- und {stats.trackers.toLocaleString('de-DE')}{' '}
              Tracking-Anfragen seit dem Start blockiert.
            </p>

            <DomainListEditor
              title="Ausnahmen (Whitelist)"
              hint="Diese Domains werden nie blockiert, auch nicht bei Treffern in den eingebauten Listen oder der Blacklist."
              placeholder="z. B. beispiel.de"
              entries={whitelist}
              onAdd={addWhitelistEntry}
              onRemove={removeWhitelistEntry}
            />

            <DomainListEditor
              title="Zusätzlich blockieren (Blacklist)"
              hint="Diese Domains werden immer blockiert, unabhängig von den Schaltern oben."
              placeholder="z. B. nervige-domain.de"
              entries={blacklist}
              onAdd={addBlacklistEntry}
              onRemove={removeBlacklistEntry}
            />

            <h3 style={{ marginTop: 28 }}>Malware- &amp; Phishing-Schutz</h3>
            <p className="settings-page-hint">
              Nutzt Google Safe Browsing, um Seiten vor dem Laden zu prüfen. Dafür brauchst du einen
              eigenen, kostenlosen API-Key von Google - eine feste Liste "böser" Domains wäre nach
              wenigen Wochen veraltet und würde nur falsche Sicherheit vortäuschen. Key erstellen unter:
              console.cloud.google.com → API "Safe Browsing API" aktivieren → Anmeldedaten → API-Schlüssel.
            </p>

            <ToggleSwitch
              checked={malwareBlockEnabled}
              onChange={setMalwareBlockEnabled}
              disabled={!safeBrowsingApiKey}
              label={`Malware-/Phishing-Schutz aktivieren${!safeBrowsingApiKey ? ' (API-Key erforderlich)' : ''}`}
            />

            <div className="ai-config-form" style={{ marginTop: 12 }}>
              <label>
                Google Safe Browsing API-Key
                <input
                  type="password"
                  value={apiKeyDraft}
                  onChange={(e) => setApiKeyDraft(e.target.value)}
                  placeholder="AIza..."
                />
              </label>
              <button className="settings-btn" onClick={() => setSafeBrowsingApiKey(apiKeyDraft)}>
                Speichern
              </button>
            </div>

            {stats.malware > 0 && (
              <p className="adblock-count">
                {stats.malware.toLocaleString('de-DE')} gefährliche Seiten blockiert.
              </p>
            )}
          </section>
        )}

        {category === 'ai' && (
          <section className="settings-page-section">
            <h3>KI-Assistent</h3>
            <p className="settings-page-hint">
              Ein lokaler Hilfsassistent für Browser-Funktionen. Die Verbindungsdaten unten sind für eine
              zukünftige Anbindung an einen echten LLM-Provider vorbereitet.
            </p>

            <button className="settings-btn" onClick={() => setAIConfigOpen((prev) => !prev)}>
              {aiConfigOpen ? 'Konfiguration schließen' : 'KI Konfigurieren'}
            </button>

            {aiConfigOpen && (
              <div className="ai-config-form">
                <label>
                  Provider
                  <select
                    value={aiConfigDraft.provider}
                    onChange={(e) => setAIConfigDraft({ ...aiConfigDraft, provider: e.target.value })}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="custom">Eigener Endpoint</option>
                  </select>
                </label>

                <label>
                  Modellname
                  <input
                    type="text"
                    value={aiConfigDraft.modelName}
                    onChange={(e) => setAIConfigDraft({ ...aiConfigDraft, modelName: e.target.value })}
                    placeholder="z. B. gpt-4"
                  />
                </label>

                <label>
                  Endpoint
                  <input
                    type="text"
                    value={aiConfigDraft.endpoint}
                    onChange={(e) => setAIConfigDraft({ ...aiConfigDraft, endpoint: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                  />
                </label>

                <label>
                  API-Key
                  <input
                    type="password"
                    value={aiConfigDraft.apiKey}
                    onChange={(e) => setAIConfigDraft({ ...aiConfigDraft, apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                </label>

                <button
                  className="settings-btn"
                  onClick={async () => {
                    await saveAIConfig(aiConfigDraft);
                    setAIConfigOpen(false);
                  }}
                >
                  Speichern
                </button>
              </div>
            )}

            <button
              className="settings-btn"
              style={{ marginTop: 10 }}
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
            >
              KI-Chat öffnen
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
