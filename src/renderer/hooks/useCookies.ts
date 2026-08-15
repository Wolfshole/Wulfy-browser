import { useCallback, useEffect, useState } from 'react';
import type { CookieGroup } from '../electron.d';

export function useCookies() {
  const [groups, setGroups] = useState<CookieGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await window.electron.cookies.getAll();
    setGroups(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const deleteOne = useCallback(
    async (domain: string, path: string, name: string, secure: boolean) => {
      await window.electron.cookies.deleteOne(domain, path, name, secure);
      await reload();
    },
    [reload]
  );

  const deleteForDomain = useCallback(
    async (domain: string) => {
      await window.electron.cookies.deleteForDomain(domain);
      await reload();
    },
    [reload]
  );

  const clearAll = useCallback(async () => {
    await window.electron.cookies.clearAll();
    await reload();
  }, [reload]);

  return { groups, loading, reload, deleteOne, deleteForDomain, clearAll };
}
