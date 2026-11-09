import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Server } from "node:http";
import { startDesktopServer } from "../server/desktop-server.ts";

const portableDirectory = process.env.PORTABLE_EXECUTABLE_DIR;
const dataDirectory = join(portableDirectory ?? app.getPath("appData"), ...(portableDirectory ? ["data"] : ["PetStay", "data"]));
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
let cancelSignIn: (() => void) | undefined;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (window?.isMinimized()) window.restore();
    window?.show();
    window?.focus();
  });
  app.whenReady().then(async () => {
    // IndexedDB and Firebase persistence belong to an origin, including its port.
    // Reuse the port across launches so offline drafts and sign-in survive restarts.
    const portFile = join(runtimeDirectory, "server-port");
    let preferredPort = 0;
    try {
      const saved = Number(readFileSync(portFile, "utf8"));
      if (Number.isInteger(saved) && saved >= 1024 && saved <= 65535) preferredPort = saved;
    } catch {}
    let local: Awaited<ReturnType<typeof startDesktopServer>>;
    try { local = await startDesktopServer(join(app.getAppPath(), "dist"), dataDirectory, undefined, preferredPort); }
    catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === "EADDRINUSE") throw new Error("A porta guardada do PetStay está ocupada. Feche as outras instâncias ou reinicie o computador para preservar o acesso à cópia offline.");
      throw cause;
    }
    writeFileSync(portFile, new URL(local.url).port, "utf8");
    server = local.server;
    cancelSignIn = local.desktopAuth.cancel;
    window = new BrowserWindow({
      title: "PetStay", width: 1440, height: 960, minWidth: 900, minHeight: 650,
      backgroundColor: "#faf8f3", show: false, autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false, contextIsolation: true, sandbox: true,
        preload: join(app.getAppPath(), "preload.cjs"),
      },
    });
    function trustedSender(event: IpcMainInvokeEvent) {
      return !!window && event.sender === window.webContents
        && event.senderFrame === window.webContents.mainFrame
        && new URL(event.senderFrame.url).origin === local.url;
    }
    let signingIn = false;
    ipcMain.handle("petstay:google-sign-in", async event => {
      if (!trustedSender(event) || signingIn) return { errorCode: "auth/cancelled-popup-request" };
      signingIn = true;
      const attempt = local.desktopAuth.begin(local.url);
      try {
        // This URL is generated locally; the renderer cannot supply external URLs.
        await shell.openExternal(attempt.url);
        const idToken = await attempt.result;
        window?.show();
        window?.focus();
        return { idToken };
      } catch (error) {
        attempt.cancel();
        return { errorCode: error && typeof error === "object" && "code" in error
          ? String(error.code) : "auth/network-request-failed" };
      } finally { signingIn = false; }
    });
    ipcMain.handle("petstay:cancel-sign-in", event => {
      if (trustedSender(event)) local.desktopAuth.cancel();
    });
    window.removeMenu();
    // Google authentication runs in the system browser, never an embedded popup.
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event, url) => {
      if (new URL(url).origin !== local.url) event.preventDefault();
    });
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.once("ready-to-show", () => window?.show());
    window.on("closed", () => { local.desktopAuth.cancel(); window = null; });
    await window.loadURL(local.url);
  }).catch(error => {
    dialog.showErrorBox("PetStay", `Não foi possível iniciar a aplicação.\n${error instanceof Error ? error.message : String(error)}`);
    app.quit();
  });
}

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => { cancelSignIn?.(); server?.close(); server?.closeAllConnections(); });
