import { useEffect, useRef } from "react";
import type { Tab } from "../hooks/useBrowserTabs";

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

  const setRef = (el: any) => {
    registerWebviewRef(tab.id, el);
    if (el && !mounted.current) {
      mounted.current = true;
      el.src = tab.url; // Initiale URL nur einmal setzen, danach übernimmt navigateToUrl()
      cleanupRef.current = bindWebviewEvents(tab.id, el);
    }
    if (!el) {
      cleanupRef.current?.();
      mounted.current = false;
    }
  };

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    // @ts-ignore - webview ist ein Electron-spezifisches Custom Element
    <webview
      ref={setRef}
      className="webview"
      allowpopups={true}
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
      {tabs.map((tab) => (
        <WebviewSlot
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          registerWebviewRef={registerWebviewRef}
          bindWebviewEvents={bindWebviewEvents}
        />
      ))}
    </div>
  );
}
