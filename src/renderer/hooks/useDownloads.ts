import { useCallback, useEffect, useState } from "react";
import type { DownloadRecord } from "../electron.d";

interface Options {
  onStarted?: () => void;
  onComplete?: () => void;
}

export function useDownloads(options?: Options) {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);

  const reload = useCallback(async () => {
    const data = await window.electron.downloads.get();
    setDownloads(data || []);
  }, []);

  useEffect(() => {
    reload();

    const offStarted = window.electron.downloads.onStarted(() => {
      reload();
      options?.onStarted?.();
    });
    const offProgress = window.electron.downloads.onProgress((data: any) => {
      setDownloads((prev) =>
        prev.map((d) =>
          d.id === data.id
            ? {
                ...d,
                progress: data.progress,
                receivedBytes: data.receivedBytes,
                totalBytes: data.totalBytes,
                speedBytesPerSec: data.speedBytesPerSec,
                status: data.status,
              }
            : d,
        ),
      );
    });
    const offComplete = window.electron.downloads.onComplete(() => {
      reload();
      options?.onComplete?.();
    });
    const offFailed = window.electron.downloads.onFailed(() => reload());

    return () => {
      offStarted();
      offProgress();
      offComplete();
      offFailed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const pause = useCallback(
    (id: string) => window.electron.downloads.pause(id),
    [],
  );
  const resume = useCallback(
    (id: string) => window.electron.downloads.resume(id),
    [],
  );
  const cancel = useCallback(
    (id: string) => window.electron.downloads.cancel(id),
    [],
  );

  const remove = useCallback(async (id: string) => {
    await window.electron.downloads.delete(id);
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clear = useCallback(async () => {
    await window.electron.downloads.clear();
    setDownloads([]);
  }, []);

  const chooseFolder = useCallback(
    () => window.electron.downloads.setPath(),
    [],
  );
  const openFolder = useCallback(
    () => window.electron.downloads.openFolder?.(),
    [],
  );

  return {
    downloads,
    pause,
    resume,
    cancel,
    remove,
    clear,
    chooseFolder,
    openFolder,
  };
}
