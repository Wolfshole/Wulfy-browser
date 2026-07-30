export interface DownloadRecord {
  id: string;
  fileName: string;
  filePath: string;
  url: string;
  fileSize?: number;
  downloadedAt: number;
  mimeType?: string;
  progress: number;
  status:
    | "pending"
    | "progressing"
    | "paused"
    | "completed"
    | "interrupted"
    | "cancelled";
  receivedBytes?: number;
  totalBytes?: number;
  speedBytesPerSec?: number;
  canResume?: boolean;
}

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

export interface SavedTab {
  url: string;
  title: string;
}

export interface ElectronAPI {
  newTab: () => void;
  openDevTools: () => void;
  bookmarks: {
    add: (title: string, url: string, favicon?: string) => Promise<any>;
    get: (folder?: string) => Promise<any[]>;
    delete: (bookmarkId: string) => Promise<any>;
    update: (bookmarkId: string, updates: any) => Promise<any>;
    createFolder: (name: string) => Promise<any>;
    getFolders: () => Promise<any>;
    deleteFolder: (folderId: string) => Promise<any>;
    export: () => Promise<any>;
    import: (data: any) => Promise<any>;
  };
  history: {
    add: (title: string, url: string, favicon?: string) => Promise<any>;
    get: (limit?: number, search?: string) => Promise<any[]>;
    getAll: () => Promise<any>;
    delete: (entryId: string) => Promise<any>;
    deleteUrl: (url: string) => Promise<any>;
    clear: () => Promise<any>;
    clearSince: (since: number) => Promise<any>;
    getTopVisited: (limit?: number) => Promise<any>;
    getToday: () => Promise<any>;
    export: () => Promise<any>;
    import: (entries: any) => Promise<any>;
  };
  downloads: {
    add: (
      fileName: string,
      url: string,
      fileSize?: number,
      mimeType?: string,
    ) => Promise<boolean>;
    get: () => Promise<DownloadRecord[]>;
    delete: (downloadId: string) => Promise<boolean>;
    clear: () => Promise<void>;
    getPath: () => Promise<string>;
    setPath: () => Promise<string | null>;
    getByDate: (days?: number) => Promise<DownloadRecord[]>;
    getByMimeType: (mimeType: string) => Promise<DownloadRecord[]>;
    export: () => Promise<DownloadRecord[]>;
    import: (downloads: DownloadRecord[]) => Promise<void>;
    cancel: (downloadId: string) => Promise<boolean>;
    pause: (downloadId: string) => Promise<boolean>;
    resume: (downloadId: string) => Promise<boolean>;
    // Für Schritt 4 (Downloads-Panel) vorgesehen — noch nicht im Main-Prozess implementiert:
    open?: (downloadId: string) => Promise<boolean>;
    showInFolder?: (downloadId: string) => Promise<boolean>;
    openFolder?: () => Promise<void>;
    onStarted: (callback: (data: any) => void) => () => void;
    onProgress: (callback: (data: any) => void) => () => void;
    onComplete: (callback: (data: any) => void) => () => void;
    onFailed: (callback: (data: any) => void) => () => void;
  };
  settings: {
    getDefaultSearchEngine: () => Promise<SearchEngine>;
    setDefaultSearchEngine: (engineId: string) => Promise<boolean>;
    getSearchEngines: () => Promise<SearchEngine[]>;
    getSearchEngineById: (id: string) => Promise<SearchEngine>;
    addCustomSearchEngine: (
      name: string,
      url: string,
      icon?: string,
    ) => Promise<any>;
    deleteSearchEngine: (engineId: string) => Promise<boolean>;
    getHomepage: () => Promise<string>;
    setHomepage: (url: string) => Promise<boolean>;
    getTheme: () => Promise<"light" | "dark">;
    setTheme: (theme: string) => Promise<boolean>;
    getAIConfig: () => Promise<any>;
    setAIConfig: (config: any) => Promise<boolean>;
    // Für Tab-Wiederherstellung — muss noch in settings-manager.ts ergänzt werden:
    getRestoreTabs: () => Promise<boolean>;
    setRestoreTabs: (enabled: boolean) => Promise<void>;
    getSavedTabs: () => Promise<SavedTab[]>;
    setSavedTabs: (tabs: SavedTab[]) => Promise<void>;
  };
  ai: {
    createConversation: () => Promise<any>;
    processMessage: (message: string) => Promise<any>;
    getHistory: () => Promise<any>;
    clearHistory: () => Promise<any>;
    addKnowledge: (entry: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        allowpopups?: string;
        ref?: React.Ref<any>;
      };
    }
  }
}
