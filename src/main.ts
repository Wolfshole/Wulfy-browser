import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from "electron";
import path from "path";
import bookmarksManager from "./bookmarks-manager";
import historyManager from "./history-manager";
import downloadsManager from "./downloads-manager";
import { registerDownloadHandler } from "./download-handler";
import settingsManager from "./settings-manager";
import aiManager from "./ai-manager";

let mainWindow: BrowserWindow;

const isDev = !app.isPackaged;

Menu.setApplicationMenu(null);

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Wulfy Browser",
    icon: path.join(__dirname, "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "renderer", "index.html")}`;

  console.log(`[main] isDev=${isDev} -> loading ${startUrl}`);
  mainWindow.loadURL(startUrl);

  registerDownloadHandler(mainWindow);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null as any;
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ===== BOOKMARKS IPC HANDLERS =====
ipcMain.handle(
  "bookmarks:add",
  async (_evt, title: string, url: string, favicon?: string) => {
    return bookmarksManager.addBookmark(title, url, favicon);
  },
);

ipcMain.handle("bookmarks:get", async (_evt, folder?: string) => {
  return bookmarksManager.getBookmarks(folder);
});

ipcMain.handle("bookmarks:delete", async (_evt, bookmarkId: string) => {
  return bookmarksManager.deleteBookmark(bookmarkId);
});

ipcMain.handle(
  "bookmarks:update",
  async (_evt, bookmarkId: string, updates: any) => {
    return bookmarksManager.updateBookmark(bookmarkId, updates);
  },
);

ipcMain.handle("bookmarks:createFolder", async (_evt, name: string) => {
  return bookmarksManager.createFolder(name);
});

ipcMain.handle("bookmarks:getFolders", async () => {
  return bookmarksManager.getFolders();
});

ipcMain.handle("bookmarks:deleteFolder", async (_evt, folderId: string) => {
  return bookmarksManager.deleteFolder(folderId);
});

ipcMain.handle("bookmarks:export", async () => {
  return bookmarksManager.exportBookmarks();
});

ipcMain.handle("bookmarks:import", async (_evt, data: any) => {
  bookmarksManager.importBookmarks(data);
  return true;
});

// ===== HISTORY IPC HANDLERS =====
ipcMain.handle(
  "history:add",
  async (_evt, title: string, url: string, favicon?: string) => {
    return historyManager.addVisit(title, url, favicon);
  },
);

ipcMain.handle("history:get", async (_evt, limit?: number, search?: string) => {
  return historyManager.getHistory(limit, search);
});

ipcMain.handle("history:getAll", async () => {
  return historyManager.getAllHistory();
});

ipcMain.handle("history:delete", async (_evt, entryId: string) => {
  return historyManager.deleteEntry(entryId);
});

ipcMain.handle("history:deleteUrl", async (_evt, url: string) => {
  return historyManager.deleteUrl(url);
});

ipcMain.handle("history:clear", async () => {
  historyManager.clearHistory();
  return true;
});

ipcMain.handle("history:clearSince", async (_evt, since: number) => {
  historyManager.clearHistorySince(since);
  return true;
});

ipcMain.handle("history:getTopVisited", async (_evt, limit?: number) => {
  return historyManager.getTopVisited(limit);
});

ipcMain.handle("history:getToday", async () => {
  return historyManager.getTodayHistory();
});

ipcMain.handle("history:export", async () => {
  return historyManager.exportHistory();
});

ipcMain.handle("history:import", async (_evt, entries: any) => {
  historyManager.importHistory(entries);
  return true;
});

// ===== DOWNLOADS IPC HANDLERS =====
ipcMain.handle("downloads:add", async (_evt, url: string) => {
  if (mainWindow) mainWindow.webContents.downloadURL(url);
  return true;
});

ipcMain.handle("downloads:get", async () => {
  return downloadsManager.getDownloads();
});

ipcMain.handle("downloads:delete", async (_evt, downloadId: string) => {
  return downloadsManager.deleteDownload(downloadId);
});

ipcMain.handle("downloads:clear", async () => {
  downloadsManager.clearDownloads();
  return true;
});

ipcMain.handle("downloads:getPath", async () => {
  return downloadsManager.getDownloadPath();
});

ipcMain.handle("downloads:setPath", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    downloadsManager.setDownloadPath(result.filePaths[0]);
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("downloads:getByDate", async (_evt, days?: number) => {
  return downloadsManager.getDownloadsByDate(days);
});

ipcMain.handle("downloads:openFolder", async () => {
  await shell.openPath(downloadsManager.getDownloadPath());
});

ipcMain.handle("downloads:getByMimeType", async (_evt, mimeType: string) => {
  return downloadsManager.getDownloadsByMimeType(mimeType);
});

ipcMain.handle("downloads:export", async () => {
  return downloadsManager.exportDownloads();
});

ipcMain.handle("downloads:import", async (_evt, downloads: any) => {
  downloadsManager.importDownloads(downloads);
  return true;
});

// ===== SETTINGS IPC HANDLERS =====
ipcMain.handle("settings:getDefaultSearchEngine", async () => {
  return settingsManager.getDefaultSearchEngine();
});

ipcMain.handle(
  "settings:setDefaultSearchEngine",
  async (_evt, engineId: string) => {
    settingsManager.setDefaultSearchEngine(engineId);
    return true;
  },
);

ipcMain.handle("settings:getSearchEngines", async () => {
  return settingsManager.getSearchEngines();
});

ipcMain.handle("settings:getSearchEngineById", async (_evt, id: string) => {
  return settingsManager.getSearchEngineById(id);
});

ipcMain.handle(
  "settings:addCustomSearchEngine",
  async (_evt, name: string, url: string, icon?: string) => {
    return settingsManager.addCustomSearchEngine(name, url, icon);
  },
);

ipcMain.handle(
  "settings:deleteSearchEngine",
  async (_evt, engineId: string) => {
    return settingsManager.deleteSearchEngine(engineId);
  },
);

ipcMain.handle("settings:getHomepage", async () => {
  return settingsManager.getHomepage();
});

ipcMain.handle("settings:setHomepage", async (_evt, url: string) => {
  settingsManager.setHomepage(url);
  return true;
});

ipcMain.handle("settings:getTheme", async () => {
  return settingsManager.getTheme();
});

ipcMain.handle("settings:setTheme", async (_evt, theme: string) => {
  settingsManager.setTheme(theme);
  return true;
});

ipcMain.handle("settings:getAIConfig", async () => {
  return settingsManager.getAIConfig();
});

ipcMain.handle("settings:setAIConfig", async (_evt, config: any) => {
  settingsManager.setAIConfig(config);
  return true;
});

ipcMain.handle("settings:getRestoreTabs", async () => {
  return settingsManager.getRestoreTabs();
});

ipcMain.handle("settings:getAccentColor", async () => {
  return settingsManager.getAccentColor();
});

ipcMain.handle("settings:setAccentColor", async (_evt, color: string) => {
  settingsManager.setAccentColor(color);
  return true;
});

ipcMain.handle("settings:getThemePresets", async () => {
  return settingsManager.getThemePresets();
});

ipcMain.handle("settings:applyThemePreset", async (_evt, presetId: string) => {
  return settingsManager.applyThemePreset(presetId);
});

ipcMain.handle("settings:getBackgroundImage", async () => {
  return settingsManager.getBackgroundImage();
});

ipcMain.handle("settings:chooseBackgroundImage", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Bilder", extensions: ["png", "jpg", "jpeg", "webp", "gif"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    settingsManager.setBackgroundImage(result.filePaths[0]);
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("settings:clearBackgroundImage", async () => {
  settingsManager.setBackgroundImage("");
  return true;
});

ipcMain.handle("settings:setRestoreTabs", async (_evt, enabled: boolean) => {
  settingsManager.setRestoreTabs(enabled);
  return true;
});

ipcMain.handle("settings:getSavedTabs", async () => {
  return settingsManager.getSavedTabs();
});

ipcMain.handle("settings:setSavedTabs", async (_evt, tabs: any) => {
  settingsManager.setSavedTabs(tabs);
  return true;
});

ipcMain.handle("ai:createConversation", async () => {
  return aiManager.createConversation();
});

ipcMain.handle("ai:processMessage", async (_evt, message: string) => {
  return aiManager.processMessage(message);
});

ipcMain.handle("ai:getHistory", async () => {
  return aiManager.getConversationHistory();
});

ipcMain.handle("ai:clearHistory", async () => {
  return aiManager.clearConversationHistory();
});

ipcMain.handle("ai:addKnowledge", async (_evt, entry: string) => {
  aiManager.addKnowledge(entry);
  return true;
});
