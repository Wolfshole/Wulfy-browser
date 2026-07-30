import { useCallback, useEffect, useState } from "react";
import Toolbar from "./components/Toolbar";
import TabBar from "./components/TabBar";
import ProgressBar from "./components/ProgressBar";
import BrowserView from "./components/BrowserView";
import SidePanel from "./components/SidePanel";
import BookmarksPanel from "./components/BookmarksPanel";
import { useBrowserTabs } from "./hooks/useBrowserTabs";
import { useBookmarks } from "./hooks/useBookmarks";

type PanelName = "bookmarks" | "history" | "downloads" | "settings" | null;

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
    registerWebviewRef,
    bindWebviewEvents,
    initialize,
  } = useBrowserTabs();

  const {
    bookmarks,
    add: addBookmarkEntry,
    remove: removeBookmark,
  } = useBookmarks();
  const [activePanel, setActivePanel] = useState<PanelName>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleBookmarkNavigate = useCallback(
    (url: string) => {
      navigateToUrl(url);
      closeAllPanels();
    },
    [navigateToUrl, closeAllPanels],
  );

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
        // 'h'/'j' (History/Downloads Panels) kommen in den nächsten Schritten dazu
      }

      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
        refresh();
      }

      if (e.key === "Escape") {
        closeAllPanels();
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
  ]);

  // "Neuer Tab" Event vom Main-Prozess (Menü o.ä.)
  useEffect(() => {
    const handler = () => createNewTab();
    window.addEventListener("new-tab", handler);
    return () => window.removeEventListener("new-tab", handler);
  }, [createNewTab]);

  return (
    <div className="app">
      <header className="header">
        <Toolbar
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
          onToggleHistory={() => {
            /* Schritt 3 */
          }}
          onToggleDownloads={() => {
            /* Schritt 4 */
          }}
          onToggleSettings={() => {
            /* Schritt 5 */
          }}
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
          onNavigate={handleBookmarkNavigate}
          onDelete={removeBookmark}
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
