import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { TestContext } from "node:test";
import { createLocalStore, createStorageMiddleware } from "../server/local-store.ts";

interface StorageFixture {
  directory: string;
  store: ReturnType<typeof createLocalStore>;
}

interface HttpStorageFixture extends StorageFixture {
  url: string;
}

export function fixture(t: TestContext, serve: true): Promise<HttpStorageFixture>;
export function fixture(t: TestContext, serve?: false): Promise<StorageFixture>;
export async function fixture(t: TestContext, serve = false): Promise<StorageFixture | HttpStorageFixture> {
  const base = resolve(tmpdir());
  const directory = await mkdtemp(join(base, "momo-storage-test-"));
  const store = createLocalStore(directory);
  let server: Server | undefined;
  t.after(async () => {
    if (server) {
      const activeServer = server;
      await new Promise<void>((done, reject) => activeServer.close(error => error ? reject(error) : done()));
    }
    // Only remove the unique test directory created above, never project or user data.
    if (dirname(resolve(directory)) !== base || !basename(directory).startsWith("momo-storage-test-")) {
      throw new Error("Unsafe test cleanup path.");
    }
    await rm(directory, { recursive: true, force: true });
  });
  if (!serve) return { directory, store };
  const middleware = createStorageMiddleware(store);
  const httpServer = createServer((req, res) => middleware(req, res, () => { res.writeHead(404); res.end(); }));
  server = httpServer;
  await new Promise<void>(done => httpServer.listen(0, "127.0.0.1", done));
  const address = httpServer.address();
  if (!address || typeof address === "string") throw new Error("The test server has no TCP address.");
  return { directory, store, url: `http://127.0.0.1:${address.port}` };
}
