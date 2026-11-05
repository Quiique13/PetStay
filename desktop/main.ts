import { app, BrowserWindow, dialog } from "electron";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Server } from "node:http";
import { startDesktopServer } from "./server.ts";

const portableDirectory = process.env.PORTABLE_EXECUTABLE_DIR
  ?? (app.isPackaged ? dirname(process.execPath) : app.getAppPath());
const dataDirectory = join(portableDirectory, "data");
const runtimeDirectory = join(dataDirectory, ".runtime");

try {
  mkdirSync(runtimeDirectory, { recursive: true });
  app.setPath("userData", runtimeDirectory);
  app.setPath("sessionData", runtimeDirectory);
  app.setAppLogsPath(join(runtimeDirectory, "logs"));
} catch {
  dialog.showErrorBox("PetStay", "Não foi possível abrir a pasta de dados. Mova o PetStay para uma pasta onde possa guardar ficheiros e tente novamente.");
  app.exit(1);
}

let window: BrowserWindow | null = null;
let server: Server | undefined;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (window?.isMinimized()) window.restore();
    window?.show();
    window?.focus();
  });
  app.whenReady().then(async () => {
    const local = await startDesktopServer(join(app.getAppPath(), "dist"), dataDirectory);
    server = local.server;
    window = new BrowserWindow({
      title: "PetStay", width: 1440, height: 960, minWidth: 900, minHeight: 650,
      backgroundColor: "#faf8f3", show: false, autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    window.removeMenu();
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event, url) => {
      if (new URL(url).origin !== local.url) event.preventDefault();
    });
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.once("ready-to-show", () => window?.show());
    window.on("closed", () => { window = null; });
    await window.loadURL(local.url);
  }).catch(error => {
    dialog.showErrorBox("PetStay", `Não foi possível iniciar a aplicação.\n${error instanceof Error ? error.message : String(error)}`);
    app.quit();
  });
}

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => { server?.close(); server?.closeAllConnections(); });
