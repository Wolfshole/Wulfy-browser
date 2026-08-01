import { useCallback, useEffect, useRef } from "react";
import { isInternalUrl, SETTINGS_URL, type Tab } from "../hooks/useBrowserTabs";
import SettingsPage from "./SettingsPage";

interface Props {
  tabs: Tab[];
  activeTabId: string;
  registerWebviewRef: (tabId: string, el: any) => void;
  bindWebviewEvents: (tabId: string, webview: any) => () => void;
}

function WebviewSlot({
  tab,
  isActive,
  registerWebviewRef,
  bindWebviewEvents,
}: {
  tab: Tab;
  isActive: boolean;
  registerWebviewRef: (tabId: string, el: any) => void;
  bindWebviewEvents: (tabId: string, webview: any) => () => void;
}) {
  const mounted = useRef(false);
  const cleanupRef = useRef<() => void>();

  // WICHTIG: mit useCallback stabil halten. Ohne das erzeugt React bei jedem
  // Render eine neue Ref-Funktion, ruft sie erneut auf (erst null, dann Element),
  // wodurch el.src immer wieder neu gesetzt wird -> die Webview lädt endlos neu.
  const setRef = useCallback(
    (el: any) => {
      registerWebviewRef(tab.id, el);
      if (el && !mounted.current) {
        mounted.current = true;
        el.setAttribute("allowpopups", "true");
        el.src = tab.url;
        cleanupRef.current = bindWebviewEvents(tab.id, el);
      }
      if (!el) {
        cleanupRef.current?.();
        mounted.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab.id, registerWebviewRef, bindWebviewEvents],
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    // @ts-ignore - webview ist ein Electron-spezifisches Custom Element
    <webview
      ref={setRef}
      className="webview"
      style={{ display: isActive ? "flex" : "none" }}
    />
  );
}

export default function BrowserView({
  tabs,
  activeTabId,
  registerWebviewRef,
  bindWebviewEvents,
}: Props) {
  return (
    <div className="browser-container">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        if (isInternalUrl(tab.url)) {
          // Interne Seiten (aktuell nur Settings) sind React-Komponenten,
          // keine Webviews - kein registerWebviewRef/bindWebviewEvents nötig.
          return (
            <div
              key={tab.id}
              className="internal-page"
              style={{ display: isActive ? "flex" : "none" }}
            >
              {tab.url === SETTINGS_URL && <SettingsPage />}
            </div>
          );
        }

        return (
          <WebviewSlot
            key={tab.id}
            tab={tab}
            isActive={isActive}
            registerWebviewRef={registerWebviewRef}
            bindWebviewEvents={bindWebviewEvents}
          />
        );
      })}
    </div>
  );
}
