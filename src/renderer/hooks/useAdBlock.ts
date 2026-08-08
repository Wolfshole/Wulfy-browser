import { useCallback, useEffect, useState } from 'react';

export function useAdBlock() {
  const [enabled, setEnabledState] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);

  const reloadCount = useCallback(async () => {
    const count = await window.electron.adblock.getBlockedCount();
    setBlockedCount(count || 0);
  }, []);

  useEffect(() => {
    (async () => {
      const current = await window.electron.settings.getAdBlockEnabled();
      setEnabledState(Boolean(current));
    })();
    reloadCount();

    // Zähler alle paar Sekunden auffrischen, solange die Settings-Seite offen ist
    const interval = setInterval(reloadCount, 3000);
    return () => clearInterval(interval);
  }, [reloadCount]);

  const setEnabled = useCallback(async (value: boolean) => {
    setEnabledState(value);
    await window.electron.settings.setAdBlockEnabled(value);
  }, []);

  return { enabled, setEnabled, blockedCount };
}
