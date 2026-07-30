import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchEngine } from "../electron.d";

export interface Tab {
  id: string;
  title: string;
  url: string;
}

let tabCounter = 0;

export function useBrowserTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const webviewRefs = useRef<Map<string, any>>(new Map());
  const searchEngineRef = useRef<SearchEngine>({
    id: "google",
    name: "Google",
    url: "https://www.google.com/search?q={query}",
  });
  const restoreEnabledRef = useRef(false);
  const tabsRef = useRef<Tab[]>([]);
  const activeTabIdRef = useRef("");

  // Refs immer synchron zum State halten, damit Callbacks (Webview-Events)
  // nicht mit veralteten Closures arbeiten.
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);
  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  const ensureProtocol = useCallback((input: string): string => {
    const url = input.trim();
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.includes(".") && !url.includes(" ")) return `https://${url}`;
    return searchEngineRef.current.url.replace(
      "{query}",
      encodeURIComponent(url),
    );
  }, []);

  const saveCurrentTabs = useCallback((currentTabs: Tab[]) => {
    if (!restoreEnabledRef.current) return;
    window.electron.settings.setSavedTabs(
      currentTabs.map(({ url, title }) => ({ url, title })),
    );
  }, []);

  const registerWebviewRef = useCallback((tabId: string, el: any) => {
    if (el) webviewRefs.current.set(tabId, el);
    else webviewRefs.current.delete(tabId);
  }, []);

  const updateNavState = useCallback(() => {
    const webview = webviewRefs.current.get(activeTabIdRef.current);
    if (!webview || typeof webview.canGoBack !== "function") {
      setCanGoBack(false);
      setCanGoForward(false);
      return;
    }
    try {
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
    } catch {
      setCanGoBack(false);
      setCanGoForward(false);
    }
  }, []);

  const createNewTab = useCallback(
    (url = "https://www.google.com", title = "Neues Tab"): string => {
      const id = `tab-${++tabCounter}`;
      const finalUrl = ensureProtocol(url);
      setTabs((prev) => {
        const next = [...prev, { id, title, url: finalUrl }];
        saveCurrentTabs(next);
        return next;
      });
      setActiveTabId(id);
      return id;
    },
    [ensureProtocol, saveCurrentTabs],
  );

  const closeTab = useCallback(
    (tabId: string) => {
      webviewRefs.current.delete(tabId);
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        saveCurrentTabs(next);

        if (activeTabIdRef.current === tabId) {
          if (next.length > 0) {
            setActiveTabId(next[0].id);
          } else {
            // Letzter Tab geschlossen -> neuen leeren Tab öffnen
            const id = `tab-${++tabCounter}`;
            const fresh = {
              id,
              title: "Neues Tab",
              url: ensureProtocol("https://www.google.com"),
            };
            setActiveTabId(id);
            return [fresh];
          }
        }
        return next;
      });
    },
    [ensureProtocol, saveCurrentTabs],
  );

  const switchToNextTab = useCallback(() => {
    const ids = tabsRef.current.map((t) => t.id);
    const currentIndex = ids.indexOf(activeTabIdRef.current);
    const nextIndex = (currentIndex + 1) % ids.length;
    if (ids[nextIndex]) setActiveTabId(ids[nextIndex]);
  }, []);

  const navigateToUrl = useCallback(
    (input: string) => {
      const url = ensureProtocol(input);
      const webview = webviewRefs.current.get(activeTabIdRef.current);
      if (webview) webview.src = url;
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabIdRef.current ? { ...t, url } : t)),
      );
    },
    [ensureProtocol],
  );

  const goBack = useCallback(() => {
    const webview = webviewRefs.current.get(activeTabIdRef.current);
    if (webview?.canGoBack?.()) {
      webview.goBack();
      updateNavState();
    }
  }, [updateNavState]);

  const goForward = useCallback(() => {
    const webview = webviewRefs.current.get(activeTabIdRef.current);
    if (webview?.canGoForward?.()) {
      webview.goForward();
      updateNavState();
    }
  }, [updateNavState]);

  const refresh = useCallback(() => {
    webviewRefs.current.get(activeTabIdRef.current)?.reload();
  }, []);

  const stop = useCallback(() => {
    webviewRefs.current.get(activeTabIdRef.current)?.stop();
  }, []);

  const goHome = useCallback(() => {
    navigateToUrl("https://www.google.com");
  }, [navigateToUrl]);

  // Webview-Events pro Tab anhängen, sobald ein neues <webview> gemountet wird.
  const bindWebviewEvents = useCallback(
    (tabId: string, webview: any) => {
      const onTitleUpdated = (e: any) => {
        setTabs((prev) =>
          prev.map((t) => (t.id === tabId ? { ...t, title: e.title } : t)),
        );
        const tab = tabsRef.current.find((t) => t.id === tabId);
        if (tab) window.electron.history.add(e.title, tab.url);
      };

      const onDidNavigate = (e: any) => {
        setTabs((prev) => {
          const next = prev.map((t) =>
            t.id === tabId ? { ...t, url: e.url } : t,
          );
          saveCurrentTabs(next);
          return next;
        });
        if (activeTabIdRef.current === tabId) updateNavState();
      };

      const onStartLoading = () => {
        if (activeTabIdRef.current === tabId) setIsLoading(true);
      };
      const onStopLoading = () => {
        if (activeTabIdRef.current === tabId) setIsLoading(false);
      };
      const onDomReady = () => {
        if (activeTabIdRef.current === tabId) updateNavState();
      };

      webview.addEventListener("page-title-updated", onTitleUpdated);
      webview.addEventListener("did-navigate", onDidNavigate);
      webview.addEventListener("did-start-loading", onStartLoading);
      webview.addEventListener("did-stop-loading", onStopLoading);
      webview.addEventListener("dom-ready", onDomReady);

      return () => {
        webview.removeEventListener("page-title-updated", onTitleUpdated);
        webview.removeEventListener("did-navigate", onDidNavigate);
        webview.removeEventListener("did-start-loading", onStartLoading);
        webview.removeEventListener("did-stop-loading", onStopLoading);
        webview.removeEventListener("dom-ready", onDomReady);
      };
    },
    [saveCurrentTabs, updateNavState],
  );

  // Beim Tab-Wechsel: Navigationsstatus neu abfragen (Webview braucht kurz,
  // bis canGoBack()/canGoForward() nach dem Sichtbarwerden korrekt sind).
  useEffect(() => {
    const timer = setTimeout(updateNavState, 100);
    return () => clearTimeout(timer);
  }, [activeTabId, updateNavState]);

  const initialize = useCallback(async () => {
    try {
      const engine = await window.electron.settings.getDefaultSearchEngine();
      if (engine) searchEngineRef.current = engine;
    } catch {
      // Fallback bleibt Google
    }

    restoreEnabledRef.current = Boolean(
      await window.electron.settings.getRestoreTabs(),
    );

    let restored = false;
    if (restoreEnabledRef.current) {
      const saved = await window.electron.settings.getSavedTabs();
      const validTabs = (saved || []).filter((t) =>
        /^https?:\/\//i.test(t.url),
      );
      if (validTabs.length > 0) {
        validTabs.forEach((t, i) => {
          const id = `tab-${++tabCounter}`;
          setTabs((prev) => [...prev, { id, title: t.title, url: t.url }]);
          if (i === 0) setActiveTabId(id);
        });
        restored = true;
      }
    }

    if (!restored) {
      createNewTab("https://www.google.com", "Google");
    }
  }, [createNewTab]);

  return {
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
    restoreEnabledRef,
  };
}
