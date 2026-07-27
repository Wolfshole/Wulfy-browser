import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from "electron";
import fs from "fs";
import path from "path";
import isDev from "electron-is-dev";
import bookmarksManager from "./bookmarks-manager";
import historyManager from "./history-manager";
import downloadsManager from "./downloads-manager";
import { registerDownloadHandler } from "./download-handler";
import settingsManager from "./settings-manager";
import aiManager from "./ai-manager";

let mainWindow: BrowserWindow;

app.on("web-contents-created", (_event, contents) => {
  // Seiten starten Downloads teils über window.open(). Statt eines separaten
  // Fensters öffnen wir die Zieladresse in einem normalen Browser-Tab.
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      mainWindow?.webContents.send("open-url-in-new-tab", url);
    }
    return { action: "deny" };
  });

  contents.on("context-menu", (_event, params) => {
    const template: Electron.MenuItemConstructorOptions[] = [];

    if (params.mediaType === "image" && params.srcURL) {
      template.push({
        label: "Bild herunterladen",
        click: () => contents.downloadURL(params.srcURL),
      });
    }

    if (params.linkURL && /^https?:\/\//i.test(params.linkURL)) {
      template.push({
        label: "Link herunterladen",
        click: () => contents.downloadURL(params.linkURL),
      });
    }

    if (template.length > 0) {
      Menu.buildFromTemplate(template).popup({ window: mainWindow });
    }
  });
});

const createWindow = () => {
  Menu.setApplicationMenu(null);
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
  mainWindow.setMenuBarVisibility(false);

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "renderer", "index.html")}`;

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

ipcMain.handle("downloads:open", async (_evt, downloadId: string) => {
  const download = downloadsManager.getDownload(downloadId);
  if (!download || download.status !== "completed" || !fs.existsSync(download.filePath)) {
    return false;
  }
  return (await shell.openPath(download.filePath)) === "";
});

ipcMain.handle("downloads:showInFolder", async (_evt, downloadId: string) => {
  const download = downloadsManager.getDownload(downloadId);
  if (!download || !fs.existsSync(download.filePath)) return false;
  shell.showItemInFolder(download.filePath);
  return true;
});

ipcMain.handle("downloads:openFolder", async () => {
  const downloadPath = downloadsManager.getDownloadPath();
  fs.mkdirSync(downloadPath, { recursive: true });
  return (await shell.openPath(downloadPath)) === "";
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

ipcMain.handle("settings:getRestoreTabs", async () => {
  return settingsManager.getRestoreTabs();
});

ipcMain.handle("settings:setRestoreTabs", async (_evt, enabled: boolean) => {
  settingsManager.setRestoreTabs(enabled);
  return true;
});

ipcMain.handle("settings:getSavedTabs", async () => {
  return settingsManager.getSavedTabs();
});

ipcMain.handle("settings:setSavedTabs", async (_evt, tabs: unknown) => {
  if (!Array.isArray(tabs)) return false;
  const validTabs = tabs.filter((tab): tab is { url: string; title: string } =>
    typeof tab?.url === "string" && typeof tab?.title === "string"
  );
  settingsManager.setSavedTabs(validTabs);
  return true;
});

ipcMain.handle("settings:getAIConfig", async () => {
  return settingsManager.getAIConfig();
});

ipcMain.handle("settings:setAIConfig", async (_evt, config: any) => {
  settingsManager.setAIConfig(config);
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
