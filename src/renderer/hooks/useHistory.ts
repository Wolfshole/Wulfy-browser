import { useCallback, useEffect, useState } from "react";

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  visitedAt: number;
}

export function useHistory(searchTerm: string) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const reload = useCallback(async () => {
    const data = await window.electron.history.get(
      100,
      searchTerm || undefined,
    );
    setEntries(data || []);
  }, [searchTerm]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = useCallback(
    async (id: string) => {
      await window.electron.history.delete(id);
      await reload();
    },
    [reload],
  );

  const clear = useCallback(async () => {
    await window.electron.history.clear();
    await reload();
  }, [reload]);

  return { entries, remove, clear, reload };
}
