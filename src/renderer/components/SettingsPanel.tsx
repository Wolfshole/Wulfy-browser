import type { SearchEngine } from "../electron.d";

interface Props {
  theme: "light" | "dark";
  onSetTheme: (theme: "light" | "dark") => void;
  searchEngines: SearchEngine[];
  selectedEngineId: string;
  onSetSearchEngine: (engineId: string) => void;
  restoreTabs: boolean;
  onSetRestoreTabs: (enabled: boolean) => void;
  onOpenAISettings: () => void;
  onOpenAIChat: () => void;
}

export default function SettingsPanel({
  theme,
  onSetTheme,
  searchEngines,
  selectedEngineId,
  onSetSearchEngine,
  restoreTabs,
  onSetRestoreTabs,
  onOpenAISettings,
  onOpenAIChat,
}: Props) {
  return (
    <>
      <div className="settings-section">
        <h4>🎨 Design</h4>
        <div className="theme-toggle">
          <button
            className={`theme-btn${theme === "light" ? " active" : ""}`}
            onClick={() => onSetTheme("light")}
          >
            ☀️ Hell
          </button>
          <button
            className={`theme-btn${theme === "dark" ? " active" : ""}`}
            onClick={() => onSetTheme("dark")}
          >
            🌙 Dunkel
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h4>🔍 Suchmaschine</h4>
        <select
          className="search-select"
          value={selectedEngineId}
          onChange={(e) => onSetSearchEngine(e.target.value)}
        >
          {searchEngines.map((engine) => (
            <option key={engine.id} value={engine.id}>
              {engine.icon ? `${engine.icon} ` : ""}
              {engine.name}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <h4>Tabs</h4>
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={restoreTabs}
            onChange={(e) => onSetRestoreTabs(e.target.checked)}
          />
          Beim Start zuletzt geöffnete Tabs wiederherstellen
        </label>
      </div>

      <div className="settings-section">
        <h4>🤖 KI-Assistent</h4>
        <button className="settings-btn" onClick={onOpenAISettings}>
          KI Konfigurieren
        </button>
        <button
          className="settings-btn"
          style={{ marginTop: 10 }}
          onClick={onOpenAIChat}
        >
          KI-Chat öffnen
        </button>
      </div>
    </>
  );
}
