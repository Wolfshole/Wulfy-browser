import { useCallback, useEffect, useState } from 'react';
import type { SearchEngine, ThemePreset, WallpaperPreset } from '../electron.d';
import { applyAccentColor, withDarkOverlay } from '../utils/color';

// --toolbar-bg-image erwartet einen fertigen CSS background-image Wert
// (entweder ein Gradient wie bei Presets, oder ein url("...") wie bei
// eigenen Bildern). withDarkOverlay dämpft das Bild zentral an dieser einen
// Stelle, damit Text in Toolbar/Panels/internen Seiten überall lesbar bleibt.
function applyBackgroundCss(cssValue: string) {
  if (cssValue) {
    document.body.style.setProperty('--toolbar-bg-image', withDarkOverlay(cssValue));
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
  const [themePresets, setThemePresets] = useState<ThemePreset[]>([]);

  const [backgroundImage, setBackgroundImageState] = useState(''); // rohe Data-URL, für <img>-Vorschau
  const [wallpaperPresets, setWallpaperPresets] = useState<WallpaperPreset[]>([]);
  const [activeWallpaperPresetId, setActiveWallpaperPresetId] = useState('');

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

      const presets = await window.electron.settings.getThemePresets();
      setThemePresets(presets || []);

      const wallpapers = await window.electron.settings.getWallpaperPresets();
      setWallpaperPresets(wallpapers || []);

      // Preset und eigenes Bild schließen sich aus - Preset hat Vorrang,
      // falls beide (fälschlich) gesetzt wären.
      const presetId = await window.electron.settings.getBackgroundPresetId();
      if (presetId) {
        const preset = (wallpapers || []).find(p => p.id === presetId);
        if (preset) {
          setActiveWallpaperPresetId(presetId);
          applyBackgroundCss(preset.css);
        }
      } else {
        const bgImage = await window.electron.settings.getBackgroundImage();
        setBackgroundImageState(bgImage);
        if (bgImage) applyBackgroundCss(`url("${bgImage}")`);
      }
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
    const dataUrl = await window.electron.settings.chooseBackgroundImage();
    if (dataUrl) {
      setBackgroundImageState(dataUrl);
      setActiveWallpaperPresetId('');
      applyBackgroundCss(`url("${dataUrl}")`);
    }
  }, []);

  const clearBackgroundImage = useCallback(async () => {
    await window.electron.settings.clearBackgroundImage();
    setBackgroundImageState('');
    setActiveWallpaperPresetId('');
    applyBackgroundCss('');
  }, []);

  const applyWallpaperPreset = useCallback(async (presetId: string) => {
    const preset = await window.electron.settings.setBackgroundPreset(presetId);
    if (preset) {
      setActiveWallpaperPresetId(presetId);
      setBackgroundImageState('');
      applyBackgroundCss(preset.css);
    }
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
    wallpaperPresets,
    activeWallpaperPresetId,
    applyWallpaperPreset,
  };
}
