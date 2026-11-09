import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { createAccountStorageMiddleware } from "./local-store.ts";
import { createFirebaseTokenVerifier } from "./firebase-auth.ts";
import type { VerifyToken } from "./firebase-auth.ts";

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2",
};

export async function startDesktopServer(assetsDirectory: string, dataDirectory: string, verifyToken: VerifyToken = createFirebaseTokenVerifier(process.env.VITE_FIREBASE_PROJECT_ID || undefined)) {
  const root = resolve(assetsDirectory);
  const storage = createAccountStorageMiddleware(dataDirectory, verifyToken);
  const server = createServer((request, response) => {
    const address = server.address();
    if (!address || typeof address === "string" || request.headers.host !== `127.0.0.1:${address.port}`) {
      response.writeHead(403).end();
      return;
    }
    storage(request, response, () => {
      void (async () => {
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.writeHead(405, { Allow: "GET, HEAD" }).end();
          return;
        }
        let pathname: string;
        try { pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname); }
        catch { response.writeHead(400).end(); return; }
        const file = resolve(root, pathname === "/" ? "index.html" : `.${pathname}`);
        if (!file.startsWith(root + sep) || pathname.includes("\\") || pathname.includes("\0")) {
          response.writeHead(404).end();
          return;
        }
        try {
          const contents = await readFile(file);
          response.writeHead(200, {
            "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com; frame-src https://*.firebaseapp.com https://accounts.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
          });
          response.end(request.method === "HEAD" ? undefined : contents);
        } catch { response.writeHead(404).end(); }
      })().catch(() => { if (!response.headersSent) response.writeHead(500); response.end(); });
    });
  });
  await new Promise<void>((done, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => { server.removeListener("error", reject); done(); });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Servidor local indisponível.");
  return { server, url: `http://127.0.0.1:${address.port}` };
}
