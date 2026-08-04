import { useCallback, useEffect, useState } from 'react';
import type { SearchEngine, ThemePreset } from '../electron.d';
import { applyAccentColor } from '../utils/color';

function applyBackgroundImage(dataUrl: string) {
  if (dataUrl) {
    document.body.style.setProperty('--toolbar-bg-image', `url("${dataUrl}")`);
  } else {
    document.body.style.removeProperty('--toolbar-bg-image');
  }
}

export function useSettings() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState('google');
  const [restoreTabs, setRestoreTabsState] = useState(false);
  const [accentColor, setAccentColorState] = useState('#0078d4');
  const [backgroundImage, setBackgroundImageState] = useState('');
  const [themePresets, setThemePresets] = useState<ThemePreset[]>([]);

  useEffect(() => {
    (async () => {
      const t = (await window.electron.settings.getTheme()) as 'light' | 'dark';
      setThemeState(t);
      document.body.classList.toggle('dark-mode', t === 'dark');

      const engines = await window.electron.settings.getSearchEngines();
      setSearchEngines(engines || []);

      const current = await window.electron.settings.getDefaultSearchEngine();
      if (current) setSelectedEngineId(current.id);

      const restore = await window.electron.settings.getRestoreTabs();
      setRestoreTabsState(Boolean(restore));

      const color = await window.electron.settings.getAccentColor();
      if (color) {
        setAccentColorState(color);
        applyAccentColor(color);
      }

      const bgImage = await window.electron.settings.getBackgroundImage();
      setBackgroundImageState(bgImage);
      applyBackgroundImage(bgImage);

      const presets = await window.electron.settings.getThemePresets();
      setThemePresets(presets || []);
    })();
  }, []);

  const setTheme = useCallback(async (next: 'light' | 'dark') => {
    setThemeState(next);
    document.body.classList.toggle('dark-mode', next === 'dark');
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

  const setAccentColor = useCallback(async (color: string) => {
    setAccentColorState(color);
    applyAccentColor(color);
    await window.electron.settings.setAccentColor(color);
  }, []);

  const applyPreset = useCallback(async (presetId: string) => {
    const preset = await window.electron.settings.applyThemePreset(presetId);
    if (preset) {
      setAccentColorState(preset.accentColor);
      applyAccentColor(preset.accentColor);
    }
  }, []);

  const chooseBackgroundImage = useCallback(async () => {
    const path = await window.electron.settings.chooseBackgroundImage();
    if (path) {
      setBackgroundImageState(path);
      applyBackgroundImage(path);
    }
  }, []);

  const clearBackgroundImage = useCallback(async () => {
    await window.electron.settings.clearBackgroundImage();
    setBackgroundImageState('');
    applyBackgroundImage('');
  }, []);

  return {
    theme,
    setTheme,
    searchEngines,
    selectedEngineId,
    setSearchEngine,
    restoreTabs,
    setRestoreTabs,
    accentColor,
    setAccentColor,
    themePresets,
    applyPreset,
    backgroundImage,
    chooseBackgroundImage,
    clearBackgroundImage,
  };
}
