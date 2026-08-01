import { useState } from "react";
import { useSettings } from "../hooks/useSettings";

type Category = "general" | "search" | "tabs" | "ai";

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "general", label: "Design", icon: "🎨" },
  { id: "search", label: "Suchmaschine", icon: "🔍" },
  { id: "tabs", label: "Tabs", icon: "🗂️" },
  { id: "ai", label: "KI-Assistent", icon: "🤖" },
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
  } = useSettings();

  const [category, setCategory] = useState<Category>("general");

  return (
    <div className="settings-page">
      <aside className="settings-page-sidebar">
        <h2 className="settings-page-title">⚙️ Einstellungen</h2>
        <nav>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`settings-page-nav-item${category === cat.id ? " active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              <span className="settings-page-nav-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="settings-page-content">
        {category === "general" && (
          <section className="settings-page-section">
            <h3>Design</h3>
            <p className="settings-page-hint">
              Wähle, wie Wulfy Browser aussehen soll.
            </p>
            <div className="settings-page-theme-cards">
              <button
                className={`settings-page-theme-card${theme === "light" ? " active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <span className="settings-page-theme-preview settings-page-theme-preview-light" />
                ☀️ Hell
              </button>
              <button
                className={`settings-page-theme-card${theme === "dark" ? " active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <span className="settings-page-theme-preview settings-page-theme-preview-dark" />
                🌙 Dunkel
              </button>
            </div>
          </section>
        )}

        {category === "search" && (
          <section className="settings-page-section">
            <h3>Suchmaschine</h3>
            <p className="settings-page-hint">
              Wird verwendet, wenn du in der Adressleiste keine vollständige URL
              eingibst.
            </p>
            <select
              className="search-select"
              value={selectedEngineId}
              onChange={(e) => setSearchEngine(e.target.value)}
            >
              {searchEngines.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.icon ? `${engine.icon} ` : ""}
                  {engine.name}
                </option>
              ))}
            </select>
          </section>
        )}

        {category === "tabs" && (
          <section className="settings-page-section">
            <h3>Tabs</h3>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={restoreTabs}
                onChange={(e) => setRestoreTabs(e.target.checked)}
              />
              Beim Start zuletzt geöffnete Tabs wiederherstellen
            </label>
          </section>
        )}

        {category === "ai" && (
          <section className="settings-page-section">
            <h3>KI-Assistent</h3>
            <p className="settings-page-hint">Kommt in Kürze.</p>
            <button
              className="settings-btn"
              onClick={() => alert("KI-Konfiguration kommt in Schritt 6 🙂")}
            >
              KI Konfigurieren
            </button>
            <button
              className="settings-btn"
              style={{ marginTop: 10 }}
              onClick={() => alert("KI-Chat kommt in Schritt 6 🙂")}
            >
              KI-Chat öffnen
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
