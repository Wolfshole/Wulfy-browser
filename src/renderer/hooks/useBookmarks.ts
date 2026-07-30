import { useCallback, useEffect, useState } from "react";

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const reload = useCallback(async () => {
    const data = await window.electron.bookmarks.get();
    setBookmarks(data || []);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (title: string, url: string) => {
      await window.electron.bookmarks.add(title, url);
      await reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await window.electron.bookmarks.delete(id);
      await reload();
    },
    [reload],
  );

  return { bookmarks, add, remove, reload };
}
