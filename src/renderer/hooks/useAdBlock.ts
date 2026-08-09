import { useCallback, useEffect, useState } from 'react';

export function useAdBlock() {
  const [adBlockEnabled, setAdBlockEnabledState] = useState(true);
  const [trackerBlockEnabled, setTrackerBlockEnabledState] = useState(true);
  const [cosmeticFiltersEnabled, setCosmeticFiltersEnabledState] = useState(true);
  const [malwareBlockEnabled, setMalwareBlockEnabledState] = useState(false);
  const [safeBrowsingApiKey, setSafeBrowsingApiKeyState] = useState('');
  const [stats, setStats] = useState({ ads: 0, trackers: 0, malware: 0 });
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);

  const reloadStats = useCallback(async () => {
    const s = await window.electron.adblock.getBlockedStats();
    setStats(s || { ads: 0, trackers: 0, malware: 0 });
  }, []);

  useEffect(() => {
    (async () => {
      setAdBlockEnabledState(Boolean(await window.electron.settings.getAdBlockEnabled()));
      setTrackerBlockEnabledState(Boolean(await window.electron.settings.getTrackerBlockEnabled()));
      setCosmeticFiltersEnabledState(Boolean(await window.electron.settings.getCosmeticFiltersEnabled()));
      setMalwareBlockEnabledState(Boolean(await window.electron.settings.getMalwareBlockEnabled()));
      setSafeBrowsingApiKeyState((await window.electron.settings.getSafeBrowsingApiKey()) || '');
      setWhitelist((await window.electron.adblock.getWhitelist()) || []);
      setBlacklist((await window.electron.adblock.getBlacklist()) || []);
    })();
    reloadStats();

    const interval = setInterval(reloadStats, 3000);
    return () => clearInterval(interval);
  }, [reloadStats]);

  const setAdBlockEnabled = useCallback(async (value: boolean) => {
    setAdBlockEnabledState(value);
    await window.electron.settings.setAdBlockEnabled(value);
  }, []);

  const setTrackerBlockEnabled = useCallback(async (value: boolean) => {
    setTrackerBlockEnabledState(value);
    await window.electron.settings.setTrackerBlockEnabled(value);
  }, []);

  const setCosmeticFiltersEnabled = useCallback(async (value: boolean) => {
    setCosmeticFiltersEnabledState(value);
    await window.electron.settings.setCosmeticFiltersEnabled(value);
  }, []);

  const setMalwareBlockEnabled = useCallback(async (value: boolean) => {
    setMalwareBlockEnabledState(value);
    await window.electron.settings.setMalwareBlockEnabled(value);
  }, []);

  const setSafeBrowsingApiKey = useCallback(async (key: string) => {
    setSafeBrowsingApiKeyState(key);
    await window.electron.settings.setSafeBrowsingApiKey(key);
  }, []);

  const addWhitelistEntry = useCallback(async (domain: string) => {
    const next = await window.electron.adblock.addToWhitelist(domain);
    setWhitelist(next);
  }, []);

  const removeWhitelistEntry = useCallback(async (domain: string) => {
    const next = await window.electron.adblock.removeFromWhitelist(domain);
    setWhitelist(next);
  }, []);

  const addBlacklistEntry = useCallback(async (domain: string) => {
    const next = await window.electron.adblock.addToBlacklist(domain);
    setBlacklist(next);
  }, []);

  const removeBlacklistEntry = useCallback(async (domain: string) => {
    const next = await window.electron.adblock.removeFromBlacklist(domain);
    setBlacklist(next);
  }, []);

  return {
    adBlockEnabled,
    setAdBlockEnabled,
    trackerBlockEnabled,
    setTrackerBlockEnabled,
    cosmeticFiltersEnabled,
    setCosmeticFiltersEnabled,
    malwareBlockEnabled,
    setMalwareBlockEnabled,
    safeBrowsingApiKey,
    setSafeBrowsingApiKey,
    stats,
    whitelist,
    addWhitelistEntry,
    removeWhitelistEntry,
    blacklist,
    addBlacklistEntry,
    removeBlacklistEntry,
  };
}
