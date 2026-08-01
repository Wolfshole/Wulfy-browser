import { useCallback, useEffect, useState } from "react";
import type { SearchEngine } from "../electron.d";

export function useSettings() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState("google");
  const [restoreTabs, setRestoreTabsState] = useState(false);

  useEffect(() => {
    (async () => {
      const t = (await window.electron.settings.getTheme()) as "light" | "dark";
      setThemeState(t);
      document.body.classList.toggle("dark-mode", t === "dark");

      const engines = await window.electron.settings.getSearchEngines();
      setSearchEngines(engines || []);

      const current = await window.electron.settings.getDefaultSearchEngine();
      if (current) setSelectedEngineId(current.id);

      const restore = await window.electron.settings.getRestoreTabs();
      setRestoreTabsState(Boolean(restore));
    })();
  }, []);

  const setTheme = useCallback(async (next: "light" | "dark") => {
    setThemeState(next);
    document.body.classList.toggle("dark-mode", next === "dark");
    await window.electron.settings.setTheme(next);
  }, []);

  const setSearchEngine = useCallback(async (engineId: string) => {
    setSelectedEngineId(engineId);
    await window.electron.settings.setDefaultSearchEngine(engineId);
  }, []);

  const setRestoreTabs = useCallback(async (enabled: boolean) => {
    setRestoreTabsState(enabled);
    await window.electron.settings.setRestoreTabs(enabled);
  }, []);

  return {
    theme,
    setTheme,
    searchEngines,
    selectedEngineId,
    setSearchEngine,
    restoreTabs,
    setRestoreTabs,
  };
}
