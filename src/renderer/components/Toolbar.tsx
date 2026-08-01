import { forwardRef, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onStop: () => void;
  onHome: () => void;
  onNavigate: (url: string) => void;
  onNewTab: () => void;
  onBookmark: () => void;
  onToggleBookmarks: () => void;
  onToggleHistory: () => void;
  onToggleDownloads: () => void;
  onToggleSettings: () => void;
  downloadsDropdown?: ReactNode;
}

const Toolbar = forwardRef<HTMLDivElement, Props>(function Toolbar(
  {
    currentUrl,
    canGoBack,
    canGoForward,
    onBack,
    onForward,
    onRefresh,
    onStop,
    onHome,
    onNavigate,
    onNewTab,
    onBookmark,
    onToggleBookmarks,
    onToggleHistory,
    onToggleDownloads,
    onToggleSettings,
    downloadsDropdown,
  },
  downloadsWrapperRef,
) {
  const [addressValue, setAddressValue] = useState(currentUrl);

  // Adressleiste mit der aktiven Tab-URL synchron halten, außer der Nutzer tippt gerade
  useEffect(() => {
    setAddressValue(currentUrl);
  }, [currentUrl]);

  return (
    <div className="toolbar">
      <div className="brand-pill" aria-label="Wulfy Browser Branding">
        <img
          src="/title-icon.png"
          alt="Wulfy Browser"
          className="brand-pill-icon"
        />
        <span className="brand-pill-text">Wulfy</span>
      </div>

      <div className="btn-group">
        <button
          className="nav-btn nav-btn-icon"
          title="Zurück (Alt+←)"
          disabled={!canGoBack}
          onClick={onBack}
        >
          ◀
        </button>
        <button
          className="nav-btn nav-btn-icon"
          title="Vorwärts (Alt+→)"
          disabled={!canGoForward}
          onClick={onForward}
        >
          ▶
        </button>
      </div>

      <div className="btn-group">
        <button
          className="nav-btn nav-btn-icon"
          title="Neu laden (F5)"
          onClick={onRefresh}
        >
          ⟳
        </button>
        <button className="nav-btn nav-btn-icon" title="Stopp" onClick={onStop}>
          ⊘
        </button>
        <button
          className="nav-btn nav-btn-icon"
          title="Startseite"
          onClick={onHome}
        >
          ⌂
        </button>
      </div>

      <div className="address-bar-wrapper">
        <input
          type="text"
          className="address-bar"
          placeholder="URL eingeben oder suchen..."
          autoComplete="off"
          value={addressValue}
          onChange={(e) => setAddressValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onNavigate(addressValue);
          }}
        />
        <div className="address-bar-icon">🔍</div>
      </div>

      <div className="btn-group">
        <button
          className="nav-btn nav-btn-icon"
          title="Zu Favoriten hinzufügen (Strg+D)"
          onClick={onBookmark}
        >
          ☆
        </button>
        <button
          className="nav-btn nav-btn-icon"
          title="Favoriten"
          onClick={onToggleBookmarks}
        >
          ★
        </button>
      </div>

      <div className="btn-group">
        <button
          className="nav-btn nav-btn-icon"
          title="Verlauf (Strg+H)"
          onClick={onToggleHistory}
        >
          ⌚
        </button>
        <div className="downloads-btn-wrapper" ref={downloadsWrapperRef}>
          <button
            className="nav-btn nav-btn-icon"
            title="Downloads (Strg+J)"
            onClick={onToggleDownloads}
          >
            ↓
          </button>
          {downloadsDropdown}
        </div>
        <button
          className="nav-btn nav-btn-icon"
          title="Einstellungen"
          onClick={onToggleSettings}
        >
          ⚙
        </button>
      </div>

      <button
        className="nav-btn nav-btn-new-tab"
        title="Neues Tab (Strg+T)"
        onClick={onNewTab}
      >
        + Neu
      </button>
    </div>
  );
});

export default Toolbar;
