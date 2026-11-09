import { randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const completionPath = "/api/desktop-auth/complete";

export function createDesktopAuthBridge(timeoutMs = 5 * 60_000) {
  let pending: {
    secret: string;
    resolve: (token: string) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  } | undefined;

  function cancel() {
    if (!pending) return;
    const previous = pending;
    pending = undefined;
    clearTimeout(previous.timer);
    previous.reject(Object.assign(new Error("Sign-in cancelled or expired."), { code: "auth/popup-closed-by-user" }));
  }

  function begin(origin: string) {
    cancel();
    const secret = randomBytes(32).toString("hex");
    const result = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(cancel, timeoutMs);
      timer.unref();
      pending = { secret, resolve, reject, timer };
    });
    // Cancellation can happen while the OS is still opening the browser.
    void result.catch(() => {});
    const url = new URL("/?desktop-sign-in=1", origin);
    // Only the single-use rendezvous secret is in the fragment; never an ID token.
    url.hash = secret;
    return { url: url.href, result, cancel };
  }

  async function handle(request: IncomingMessage, response: ServerResponse, origin: string) {
    if (new URL(request.url ?? "/", origin).pathname !== completionPath) return false;
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      response.writeHead(405).end();
      return true;
    }
    const secret = request.headers["x-petstay-sign-in"];
    const attempt = pending;
    if (request.headers.origin !== origin || !attempt || typeof secret !== "string"
      || !/^[a-f0-9]{64}$/.test(secret)
      || !timingSafeEqual(Buffer.from(secret), Buffer.from(attempt.secret))) {
      response.writeHead(403).end();
      return true;
    }
    if (!request.headers["content-type"]?.startsWith("application/json")) {
      response.writeHead(415).end();
      return true;
    }
    try {
      let body = "";
      for await (const chunk of request) {
        body += chunk.toString("utf8");
        if (Buffer.byteLength(body) > 16_384) {
          response.writeHead(413).end();
          return true;
        }
      }
      const parsed: unknown = JSON.parse(body);
      if (!parsed || typeof parsed !== "object" || !("idToken" in parsed)
        || typeof parsed.idToken !== "string" || !parsed.idToken || parsed.idToken.length > 12_000) {
        response.writeHead(400).end();
        return true;
      }
      // The attempt may have expired/replaced while the body was being received.
      if (pending !== attempt) {
        response.writeHead(403).end();
        return true;
      }
      pending = undefined;
      clearTimeout(attempt.timer);
      response.writeHead(204).end();
      attempt.resolve(parsed.idToken);
    } catch {
      if (!response.headersSent) response.writeHead(400);
      response.end();
    }
    return true;
  }

  return { begin, handle, cancel };
}
