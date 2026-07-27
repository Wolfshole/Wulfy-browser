import { contextBridge, ipcRenderer } from 'electron';

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
    add: (url: string) => ipcRenderer.invoke('downloads:add', url),
    get: () => ipcRenderer.invoke('downloads:get'),
    pause: (downloadId: string) => ipcRenderer.invoke('downloads:pause', downloadId),
    resume: (downloadId: string) => ipcRenderer.invoke('downloads:resume', downloadId),
    cancel: (downloadId: string) => ipcRenderer.invoke('downloads:cancel', downloadId),
    open: (downloadId: string) => ipcRenderer.invoke('downloads:open', downloadId),
    showInFolder: (downloadId: string) => ipcRenderer.invoke('downloads:showInFolder', downloadId),
    openFolder: () => ipcRenderer.invoke('downloads:openFolder'),
    delete: (downloadId: string) => ipcRenderer.invoke('downloads:delete', downloadId),
    clear: () => ipcRenderer.invoke('downloads:clear'),
    getPath: () => ipcRenderer.invoke('downloads:getPath'),
    setPath: () => ipcRenderer.invoke('downloads:setPath'),
    getByDate: (days?: number) => ipcRenderer.invoke('downloads:getByDate', days),
    getByMimeType: (mimeType: string) => ipcRenderer.invoke('downloads:getByMimeType', mimeType),
    export: () => ipcRenderer.invoke('downloads:export'),
    import: (downloads: any) => ipcRenderer.invoke('downloads:import', downloads),
    onChanged: (callback: () => void) => {
      const refresh = () => callback();
      ipcRenderer.on('download-started', refresh);
      ipcRenderer.on('download-progress', refresh);
      ipcRenderer.on('download-complete', refresh);
      ipcRenderer.on('download-failed', refresh);
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
    getRestoreTabs: () => ipcRenderer.invoke('settings:getRestoreTabs'),
    setRestoreTabs: (enabled: boolean) => ipcRenderer.invoke('settings:setRestoreTabs', enabled),
    getSavedTabs: () => ipcRenderer.invoke('settings:getSavedTabs'),
    setSavedTabs: (tabs: any[]) => ipcRenderer.invoke('settings:setSavedTabs', tabs),
    getAIConfig: () => ipcRenderer.invoke('settings:getAIConfig'),
    setAIConfig: (config: any) => ipcRenderer.invoke('settings:setAIConfig', config),
  },

  ai: {
    createConversation: () => ipcRenderer.invoke('ai:createConversation'),
    processMessage: (message: string) => ipcRenderer.invoke('ai:processMessage', message),
    getHistory: () => ipcRenderer.invoke('ai:getHistory'),
    clearHistory: () => ipcRenderer.invoke('ai:clearHistory'),
    addKnowledge: (entry: string) => ipcRenderer.invoke('ai:addKnowledge', entry),
  },
});

// IPC Listener
ipcRenderer.on('new-tab', () => {
  window.dispatchEvent(new CustomEvent('new-tab'));
});

ipcRenderer.on('open-url-in-new-tab', (_event, url: string) => {
  window.dispatchEvent(new CustomEvent('open-url-in-new-tab', { detail: url }));
});
