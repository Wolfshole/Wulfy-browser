import { useCallback, useEffect, useRef, useState } from "react";
import Toolbar from "./components/Toolbar";
import TabBar from "./components/TabBar";
import ProgressBar from "./components/ProgressBar";
import BrowserView from "./components/BrowserView";
import SidePanel from "./components/SidePanel";
import BookmarksPanel from "./components/BookmarksPanel";
import HistoryPanel from "./components/HistoryPanel";
import DownloadsDropdown from "./components/DownloadsDropdown";
import { useBrowserTabs } from "./hooks/useBrowserTabs";
import { useBookmarks } from "./hooks/useBookmarks";
import { useHistory } from "./hooks/useHistory";
import { useDownloads } from "./hooks/useDownloads";
import { applyAccentColor } from "./utils/color";

type PanelName = "bookmarks" | "history" | null;

export default function App() {
  const {
    tabs,
    activeTabId,
    canGoBack,
    canGoForward,
    isLoading,
    setActiveTabId,
    createNewTab,
    closeTab,
    switchToNextTab,
    navigateToUrl,
    goBack,
    goForward,
    refresh,
    stop,
    goHome,
    openSettingsTab,
    openAIChatTab,
    registerWebviewRef,
    bindWebviewEvents,
    initialize,
  } = useBrowserTabs();

  const {
    bookmarks,
    add: addBookmarkEntry,
    remove: removeBookmark,
  } = useBookmarks();

  const [historySearch, setHistorySearch] = useState("");
  const { entries: historyEntries, remove: removeHistoryEntry } =
    useHistory(historySearch);

  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const downloadsWrapperRef = useRef<HTMLDivElement | null>(null);

  const {
    downloads,
    pause: pauseDownload,
    resume: resumeDownload,
    cancel: cancelDownload,
    remove: removeDownload,
    clear: clearDownloads,
    chooseFolder,
    openFolder,
  } = useDownloads({
    onStarted: () => setDownloadsOpen(true),
    onComplete: () => setDownloadsOpen(true),
  });

  const [activePanel, setActivePanel] = useState<PanelName>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme + Akzentfarbe direkt beim Start anwenden, unabhängig davon, ob die
  // Settings-Seite je geöffnet wird (dort sitzt useSettings, das läuft nur bei
  // Mount der Seite selbst).
  useEffect(() => {
    (async () => {
      const savedTheme = await window.electron.settings.getTheme();
      document.body.classList.toggle("dark-mode", savedTheme === "dark");

      const savedAccent = await window.electron.settings.getAccentColor();
      if (savedAccent) applyAccentColor(savedAccent);

      const savedBgImage = await window.electron.settings.getBackgroundImage();
      if (savedBgImage) {
        document.documentElement.style.setProperty(
          "--toolbar-bg-image",
          `url("file://${savedBgImage}")`,
        );
      }
    })();
  }, []);

  const closeAllPanels = useCallback(() => setActivePanel(null), []);

  const togglePanel = useCallback((panel: PanelName) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const handleAddBookmark = useCallback(async () => {
    if (!activeTab) return;
    await addBookmarkEntry(activeTab.title, activeTab.url);
    alert(`✅ "${activeTab.title}" wurde zu Favoriten hinzugefügt!`);
  }, [activeTab, addBookmarkEntry]);

  const handleNavigateAndClose = useCallback(
    (url: string) => {
      navigateToUrl(url);
      closeAllPanels();
    },
    [navigateToUrl, closeAllPanels],
  );

  const handleClearDownloads = useCallback(() => {
    if (confirm("Alle Downloads aus der Liste entfernen?")) clearDownloads();
  }, [clearDownloads]);

  // Downloads-Dropdown schließen bei Klick außerhalb
  useEffect(() => {
    if (!downloadsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        downloadsWrapperRef.current &&
        !downloadsWrapperRef.current.contains(e.target as Node)
      ) {
        setDownloadsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [downloadsOpen]);

  // Globale Keyboard-Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "t") {
          e.preventDefault();
          createNewTab();
        }
        if (e.key === "w") {
          e.preventDefault();
          closeTab(activeTabId);
        }
        if (e.key === "Tab") {
          e.preventDefault();
          switchToNextTab();
        }
        if (e.key === "d") {
          e.preventDefault();
          handleAddBookmark();
        }
        if (e.key === "h") {
          e.preventDefault();
          togglePanel("history");
        }
        if (e.key === "j") {
          e.preventDefault();
          setDownloadsOpen((prev) => !prev);
        }
      }

      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
        refresh();
      }

      if (e.key === "Escape") {
        closeAllPanels();
        setDownloadsOpen(false);
        stop();
      }

      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }

      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        goForward();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    activeTabId,
    createNewTab,
    closeTab,
    switchToNextTab,
    refresh,
    stop,
    goBack,
    goForward,
    handleAddBookmark,
    closeAllPanels,
    togglePanel,
  ]);

  // "Neuer Tab" Event vom Main-Prozess (Menü o.ä.)
  useEffect(() => {
    const handler = () => createNewTab();
    window.addEventListener("new-tab", handler);
    return () => window.removeEventListener("new-tab", handler);
  }, [createNewTab]);

  // KI-Chat-Tab öffnen, ausgelöst vom "KI-Chat öffnen"-Button in der Settings-Seite
  useEffect(() => {
    const handler = () => openAIChatTab();
    window.addEventListener("open-ai-chat", handler);
    return () => window.removeEventListener("open-ai-chat", handler);
  }, [openAIChatTab]);

  return (
    <div className="app">
      <header className="header">
        <Toolbar
          ref={downloadsWrapperRef}
          currentUrl={activeTab?.url ?? ""}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={goBack}
          onForward={goForward}
          onRefresh={refresh}
          onStop={stop}
          onHome={goHome}
          onNavigate={navigateToUrl}
          onNewTab={() => createNewTab()}
          onBookmark={handleAddBookmark}
          onToggleBookmarks={() => togglePanel("bookmarks")}
          onToggleHistory={() => togglePanel("history")}
          onToggleDownloads={() => setDownloadsOpen((prev) => !prev)}
          onToggleSettings={openSettingsTab}
          downloadsDropdown={
            downloadsOpen && (
              <DownloadsDropdown
                downloads={downloads}
                onPause={pauseDownload}
                onResume={resumeDownload}
                onCancel={cancelDownload}
                onDelete={removeDownload}
                onOpenFolder={openFolder}
                onChooseFolder={chooseFolder}
                onClearAll={handleClearDownloads}
              />
            )
          }
        />
        <ProgressBar isLoading={isLoading} />
      </header>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitch={setActiveTabId}
        onClose={closeTab}
      />

      <SidePanel
        id="bookmarks-panel"
        title="Favoriten"
        isActive={activePanel === "bookmarks"}
        onClose={closeAllPanels}
      >
        <BookmarksPanel
          bookmarks={bookmarks}
          onNavigate={handleNavigateAndClose}
          onDelete={removeBookmark}
        />
      </SidePanel>

      <SidePanel
        id="history-panel"
        title="Verlauf"
        isActive={activePanel === "history"}
        onClose={closeAllPanels}
        headerExtra={
          <input
            type="text"
            className="search-input"
            placeholder="Verlauf durchsuchen..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
          />
        }
      >
        <HistoryPanel
          entries={historyEntries}
          onNavigate={handleNavigateAndClose}
          onDelete={removeHistoryEntry}
        />
      </SidePanel>

      <BrowserView
        tabs={tabs}
        activeTabId={activeTabId}
        registerWebviewRef={registerWebviewRef}
        bindWebviewEvents={bindWebviewEvents}
      />
    </div>
  );
}
