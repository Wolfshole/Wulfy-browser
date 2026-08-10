import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchEngine } from '../electron.d';

export interface Tab {
  id: string;
  title: string;
  url: string;
  // true solange der Tab noch nie "echt" navigiert wurde (nur die initiale
  // Startseite geladen) - steuert, ob die Adressleiste leer bleibt (wie Chrome).
  isNewTabPage?: boolean;
}

let tabCounter = 0;

export const SETTINGS_URL = 'wulfy://settings';
export const AI_CHAT_URL = 'wulfy://ai-chat';

export function isInternalUrl(url: string): boolean {
  return url.startsWith('wulfy://');
}

export function useBrowserTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const webviewRefs = useRef<Map<string, any>>(new Map());
  const searchEngineRef = useRef<SearchEngine>({
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q={query}',
  });
  const restoreEnabledRef = useRef(false);
  const tabsRef = useRef<Tab[]>([]);
  const activeTabIdRef = useRef('');
  // Merkt sich, für welche Tabs die initiale (programmatische) Navigation
  // schon durchgelaufen ist - erst die ZWEITE Navigation gilt als "echt"
  // und beendet den New-Tab-Page-Zustand (leere Adressleiste).
  const initialNavDoneRef = useRef<Set<string>>(new Set());

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
    if (isInternalUrl(url)) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.includes('.') && !url.includes(' ')) return `https://${url}`;
    return searchEngineRef.current.url.replace('{query}', encodeURIComponent(url));
  }, []);

  const saveCurrentTabs = useCallback((currentTabs: Tab[]) => {
    if (!restoreEnabledRef.current) return;
    window.electron.settings.setSavedTabs(currentTabs.map(({ url, title }) => ({ url, title })));
  }, []);

  const registerWebviewRef = useCallback((tabId: string, el: any) => {
    if (el) webviewRefs.current.set(tabId, el);
    else webviewRefs.current.delete(tabId);
  }, []);

  const updateNavState = useCallback(() => {
    const webview = webviewRefs.current.get(activeTabIdRef.current);
    if (!webview || typeof webview.canGoBack !== 'function') {
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
    (url = 'https://www.google.com', title = 'Neues Tab'): string => {
      const id = `tab-${++tabCounter}`;
      const finalUrl = ensureProtocol(url);
      const isNewTabPage = url === 'https://www.google.com';
      setTabs((prev) => {
        const next = [...prev, { id, title, url: finalUrl, isNewTabPage }];
        saveCurrentTabs(next);
        return next;
      });
      setActiveTabId(id);
      return id;
    },
    [ensureProtocol, saveCurrentTabs]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      webviewRefs.current.delete(tabId);
      initialNavDoneRef.current.delete(tabId);
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
              title: 'Neues Tab',
              url: ensureProtocol('https://www.google.com'),
              isNewTabPage: true,
            };
            setActiveTabId(id);
            return [fresh];
          }
        }
        return next;
      });
    },
    [ensureProtocol, saveCurrentTabs]
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
        prev.map((t) => (t.id === activeTabIdRef.current ? { ...t, url, isNewTabPage: false } : t))
      );
    },
    [ensureProtocol]
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
    navigateToUrl('https://www.google.com');
  }, [navigateToUrl]);

  const openSettingsTab = useCallback(() => {
    const existing = tabsRef.current.find((t) => t.url === SETTINGS_URL);
    if (existing) {
      setActiveTabId(existing.id);
    } else {
      createNewTab(SETTINGS_URL, 'Einstellungen');
    }
  }, [createNewTab]);

  const openAIChatTab = useCallback(() => {
    const existing = tabsRef.current.find((t) => t.url === AI_CHAT_URL);
    if (existing) {
      setActiveTabId(existing.id);
    } else {
      createNewTab(AI_CHAT_URL, 'KI-Assistent');
    }
  }, [createNewTab]);

  // Webview-Events pro Tab anhängen, sobald ein neues <webview> gemountet wird.
  const bindWebviewEvents = useCallback(
    (tabId: string, webview: any) => {
      const onTitleUpdated = (e: any) => {
        setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, title: e.title } : t)));
        const tab = tabsRef.current.find((t) => t.id === tabId);
        if (tab) window.electron.history.add(e.title, tab.url);
      };

      const onDidNavigate = (e: any) => {
        // Die erste did-navigate nach dem Mounten bestätigt nur die initiale
        // (programmatisch gesetzte) URL - das zählt noch nicht als "echte"
        // Navigation durch den Nutzer. Erst ab der zweiten bleibt die
        // Adressleiste nicht mehr leer.
        const isFirstNav = !initialNavDoneRef.current.has(tabId);
        if (isFirstNav) initialNavDoneRef.current.add(tabId);

        setTabs((prev) => {
          const next = prev.map((t) =>
            t.id === tabId ? { ...t, url: e.url, isNewTabPage: isFirstNav ? t.isNewTabPage : false } : t
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

      webview.addEventListener('page-title-updated', onTitleUpdated);
      webview.addEventListener('did-navigate', onDidNavigate);
      webview.addEventListener('did-start-loading', onStartLoading);
      webview.addEventListener('did-stop-loading', onStopLoading);
      webview.addEventListener('dom-ready', onDomReady);

      return () => {
        webview.removeEventListener('page-title-updated', onTitleUpdated);
        webview.removeEventListener('did-navigate', onDidNavigate);
        webview.removeEventListener('did-start-loading', onStartLoading);
        webview.removeEventListener('did-stop-loading', onStopLoading);
        webview.removeEventListener('dom-ready', onDomReady);
      };
    },
    [saveCurrentTabs, updateNavState]
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

    restoreEnabledRef.current = Boolean(await window.electron.settings.getRestoreTabs());

    let restored = false;
    if (restoreEnabledRef.current) {
      const saved = await window.electron.settings.getSavedTabs();
      const validTabs = (saved || []).filter((t) => /^https?:\/\//i.test(t.url));
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
      createNewTab('https://www.google.com', 'Google');
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
    openSettingsTab,
    openAIChatTab,
    registerWebviewRef,
    bindWebviewEvents,
    initialize,
    restoreEnabledRef,
  };
}
