import type { Tab } from "../hooks/useBrowserTabs";

interface Props {
  tabs: Tab[];
  activeTabId: string;
  onSwitch: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  onSwitch,
  onClose,
}: Props) {
  return (
    <div className="tab-bar" id="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab${tab.id === activeTabId ? " active" : ""}`}
          onClick={() => onSwitch(tab.id)}
        >
          <span className="tab-title">{tab.title}</span>
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.id);
            }}
          >
            ✕
          </span>
        </div>
      ))}
    </div>
  );
}
