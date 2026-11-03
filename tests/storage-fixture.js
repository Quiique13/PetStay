import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createServer } from "node:http";
import { createLocalStore, createStorageMiddleware } from "../server/local-store.js";

export async function fixture(t, serve = false) {
  const base = resolve(tmpdir());
  const directory = await mkdtemp(join(base, "momo-storage-test-"));
  const store = createLocalStore(directory);
  let server;
  t.after(async () => {
    if (server) await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
    // Only remove the unique test directory created above, never project or user data.
    if (dirname(resolve(directory)) !== base || !basename(directory).startsWith("momo-storage-test-")) {
      throw new Error("Unsafe test cleanup path.");
    }
    await rm(directory, { recursive: true, force: true });
  });
  if (!serve) return { directory, store };
  const middleware = createStorageMiddleware(store);
  server = createServer((req, res) => middleware(req, res, () => { res.writeHead(404); res.end(); }));
  await new Promise(done => server.listen(0, "127.0.0.1", done));
  return { directory, store, url: `http://127.0.0.1:${server.address().port}` };
}
