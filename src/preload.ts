import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  newTab: () => ipcRenderer.send('new-tab'),
  openDevTools: () => ipcRenderer.send('open-dev-tools'),

  // Bookmarks
  bookmarks: {
    add: (title: string, url: string, favicon?: string) => ipcRenderer.invoke('bookmarks:add', title, url, favicon),
    get: (folder?: string) => ipcRenderer.invoke('bookmarks:get', folder),
    delete: (bookmarkId: string) => ipcRenderer.invoke('bookmarks:delete', bookmarkId),
    update: (bookmarkId: string, updates: any) => ipcRenderer.invoke('bookmarks:update', bookmarkId, updates),
    createFolder: (name: string) => ipcRenderer.invoke('bookmarks:createFolder', name),
    getFolders: () => ipcRenderer.invoke('bookmarks:getFolders'),
    deleteFolder: (folderId: string) => ipcRenderer.invoke('bookmarks:deleteFolder', folderId),
    export: () => ipcRenderer.invoke('bookmarks:export'),
    import: (data: any) => ipcRenderer.invoke('bookmarks:import', data),
  },

  // History
  history: {
    add: (title: string, url: string, favicon?: string) => ipcRenderer.invoke('history:add', title, url, favicon),
    get: (limit?: number, search?: string) => ipcRenderer.invoke('history:get', limit, search),
    getAll: () => ipcRenderer.invoke('history:getAll'),
    delete: (entryId: string) => ipcRenderer.invoke('history:delete', entryId),
    deleteUrl: (url: string) => ipcRenderer.invoke('history:deleteUrl', url),
    clear: () => ipcRenderer.invoke('history:clear'),
    clearSince: (since: number) => ipcRenderer.invoke('history:clearSince', since),
    getTopVisited: (limit?: number) => ipcRenderer.invoke('history:getTopVisited', limit),
    getToday: () => ipcRenderer.invoke('history:getToday'),
    export: () => ipcRenderer.invoke('history:export'),
    import: (entries: any) => ipcRenderer.invoke('history:import', entries),
  },

  // Downloads
  downloads: {
    add: (fileName: string, url: string, fileSize?: number, mimeType?: string) =>
      ipcRenderer.invoke('downloads:add', fileName, url, fileSize, mimeType),
    get: () => ipcRenderer.invoke('downloads:get'),
    delete: (downloadId: string) => ipcRenderer.invoke('downloads:delete', downloadId),
    clear: () => ipcRenderer.invoke('downloads:clear'),
    getPath: () => ipcRenderer.invoke('downloads:getPath'),
    setPath: () => ipcRenderer.invoke('downloads:setPath'),
    getByDate: (days?: number) => ipcRenderer.invoke('downloads:getByDate', days),
    getByMimeType: (mimeType: string) => ipcRenderer.invoke('downloads:getByMimeType', mimeType),
    export: () => ipcRenderer.invoke('downloads:export'),
    import: (downloads: any) => ipcRenderer.invoke('downloads:import', downloads),
    cancel: (downloadId: string) => ipcRenderer.invoke('downloads:cancel', downloadId),
    pause: (downloadId: string) => ipcRenderer.invoke('downloads:pause', downloadId),
    resume: (downloadId: string) => ipcRenderer.invoke('downloads:resume', downloadId),
    openFolder: () => ipcRenderer.invoke('downloads:openFolder'),

    // Event-Bridges: geben eine Unsubscribe-Funktion zurück, praktisch für
    // React useEffect(() => { const off = ...; return off; }, [])
    onStarted: (callback: (data: any) => void) => {
      const listener = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('download-started', listener);
      return () => ipcRenderer.removeListener('download-started', listener);
    },
    onProgress: (callback: (data: any) => void) => {
      const listener = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('download-progress', listener);
      return () => ipcRenderer.removeListener('download-progress', listener);
    },
    onComplete: (callback: (data: any) => void) => {
      const listener = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('download-complete', listener);
      return () => ipcRenderer.removeListener('download-complete', listener);
    },
    onFailed: (callback: (data: any) => void) => {
      const listener = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('download-failed', listener);
      return () => ipcRenderer.removeListener('download-failed', listener);
    },
  },

  // Settings
  settings: {
    getDefaultSearchEngine: () => ipcRenderer.invoke('settings:getDefaultSearchEngine'),
    setDefaultSearchEngine: (engineId: string) => ipcRenderer.invoke('settings:setDefaultSearchEngine', engineId),
    getSearchEngines: () => ipcRenderer.invoke('settings:getSearchEngines'),
    getSearchEngineById: (id: string) => ipcRenderer.invoke('settings:getSearchEngineById', id),
    addCustomSearchEngine: (name: string, url: string, icon?: string) =>
      ipcRenderer.invoke('settings:addCustomSearchEngine', name, url, icon),
    deleteSearchEngine: (engineId: string) => ipcRenderer.invoke('settings:deleteSearchEngine', engineId),
    getHomepage: () => ipcRenderer.invoke('settings:getHomepage'),
    setHomepage: (url: string) => ipcRenderer.invoke('settings:setHomepage', url),
    getTheme: () => ipcRenderer.invoke('settings:getTheme'),
    setTheme: (theme: string) => ipcRenderer.invoke('settings:setTheme', theme),
    getAIConfig: () => ipcRenderer.invoke('settings:getAIConfig'),
    setAIConfig: (config: any) => ipcRenderer.invoke('settings:setAIConfig', config),
    getRestoreTabs: () => ipcRenderer.invoke('settings:getRestoreTabs'),
    getAdBlockEnabled: () => ipcRenderer.invoke('settings:getAdBlockEnabled'),
    setAdBlockEnabled: (enabled: boolean) => ipcRenderer.invoke('settings:setAdBlockEnabled', enabled),
    setRestoreTabs: (enabled: boolean) => ipcRenderer.invoke('settings:setRestoreTabs', enabled),
    getSavedTabs: () => ipcRenderer.invoke('settings:getSavedTabs'),
    setSavedTabs: (tabs: any) => ipcRenderer.invoke('settings:setSavedTabs', tabs),
    getAccentColor: () => ipcRenderer.invoke('settings:getAccentColor'),
    setAccentColor: (color: string) => ipcRenderer.invoke('settings:setAccentColor', color),
    getThemePresets: () => ipcRenderer.invoke('settings:getThemePresets'),
    applyThemePreset: (presetId: string) => ipcRenderer.invoke('settings:applyThemePreset', presetId),
    getBackgroundImage: () => ipcRenderer.invoke('settings:getBackgroundImage'),
    chooseBackgroundImage: () => ipcRenderer.invoke('settings:chooseBackgroundImage'),
    clearBackgroundImage: () => ipcRenderer.invoke('settings:clearBackgroundImage'),
    getWallpaperPresets: () => ipcRenderer.invoke('settings:getWallpaperPresets'),
    getBackgroundPresetId: () => ipcRenderer.invoke('settings:getBackgroundPresetId'),
    setBackgroundPreset: (presetId: string) => ipcRenderer.invoke('settings:setBackgroundPreset', presetId),
  },

  ai: {
    createConversation: () => ipcRenderer.invoke('ai:createConversation'),
    processMessage: (message: string) => ipcRenderer.invoke('ai:processMessage', message),
    getHistory: () => ipcRenderer.invoke('ai:getHistory'),
    clearHistory: () => ipcRenderer.invoke('ai:clearHistory'),
    addKnowledge: (entry: string) => ipcRenderer.invoke('ai:addKnowledge', entry),
  },

  adblock: {
    getBlockedCount: () => ipcRenderer.invoke('adblock:getBlockedCount'),
  },
});

// IPC Listener
ipcRenderer.on('new-tab', () => {
  window.dispatchEvent(new CustomEvent('new-tab'));
});
