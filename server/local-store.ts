import { mkdir, readFile, writeFile, rename, copyFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { defaultData, isRecord, validateData } from "../src/utils/hotel-data.ts";
import { asStorageError } from "../src/types.ts";
import type { StorageError, StorageSnapshot } from "../src/types.ts";
import type { ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export function createLocalStore(directory: string) {
  const file = join(directory, "hotel.json");
  const legacyFile = join(directory, "momo.json");
  let writes = Promise.resolve();

  async function read(): Promise<StorageSnapshot> {
    let contents;
    try {
      contents = await readFile(file, "utf8");
    } catch (error) {
      if (!isMissingFile(error)) throw error;
      try { contents = await readFile(legacyFile, "utf8"); }
      catch (legacyError) {
        if (isMissingFile(legacyError)) return { data: defaultData(), revision: 0, initialized: false };
        throw legacyError;
      }
    }
    const saved: unknown = JSON.parse(contents);
    if (!isRecord(saved) || (saved.schemaVersion !== 1 && saved.schemaVersion !== 2)
      || typeof saved.revision !== "number" || !Number.isInteger(saved.revision) || saved.revision < 1) {
      throw new Error("Formato de ficheiro desconhecido.");
    }
    const data = saved.schemaVersion === 1 && isRecord(saved.data) ? { ...saved.data, hotel: null } : saved.data;
    return { data: validateData(data), revision: saved.revision, initialized: true };
  }

  async function readRecovery() {
    try {
      const record: unknown = JSON.parse(await readFile(join(directory, "before-import.json"), "utf8"));
      if (!isRecord(record) || record.schemaVersion !== 2) throw new Error("Cópia de recuperação inválida.");
      return validateData(record.data);
    } catch (error) { if (isMissingFile(error)) return null; throw error; }
  }

  function save(input: unknown, revision: number, preserveRecovery = false): Promise<StorageSnapshot> {
    // Serialize writes so edits cannot interleave or corrupt the JSON file.
    const operation = writes.then(async () => {
      const data = validateData(input);
      if (!Number.isInteger(revision) || revision < 0) throw new Error("Revisão inválida.");
      const current = await read();
      if (current.revision !== revision) {
        const error: StorageError = new Error("Os dados foram alterados noutra janela. Recarregue a aplicação antes de continuar.");
        error.status = 409;
        throw error;
      }
      await mkdir(directory, { recursive: true });
      const temporary = join(directory, `.hotel-${randomUUID()}.tmp`);
      const record = { schemaVersion: 2, revision: revision + 1, data };
      try {
        await writeFile(temporary, JSON.stringify(record, null, 2) + "\n", { flag: "wx", mode: 0o600 });
        if (current.initialized) {
          let previous = file;
          try { await readFile(file); }
          catch (error) { if (isMissingFile(error)) previous = legacyFile; else throw error; }
          await copyFile(previous, file + ".bak");
          if (preserveRecovery) {
            const recoveryTemporary = join(directory, `.before-import-${randomUUID()}.tmp`);
            try {
              await writeFile(recoveryTemporary, JSON.stringify({ schemaVersion: 2, revision: current.revision, data: current.data }, null, 2) + "\n", { flag: "wx", mode: 0o600 });
              await rename(recoveryTemporary, join(directory, "before-import.json"));
            } finally { await rm(recoveryTemporary, { force: true }); }
          }
          if (!current.data.hotel && data.hotel && previous === file) {
            await copyFile(previous, join(directory, `before-hotel-setup-${randomUUID()}.json`));
          }
        }
        await rename(temporary, file);
      } finally {
        await rm(temporary, { force: true });
      }
      return { data, revision: record.revision, initialized: true };
    });
    writes = operation.then(() => {}, () => {});
    return operation;
  }
  return { read, save, readRecovery };
}

export function createStorageMiddleware(store: ReturnType<typeof createLocalStore>): Connect.NextHandleFunction {
  function reply(response: ServerResponse, status: number, body: unknown) {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(body));
  }
  return async (request, response, next) => {
    let path;
    try { path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname); }
    catch { return reply(response, 400, { error: "Endereço inválido." }); }
    // Vite also serves project files in development; never serve private data as assets.
    if (/(?:^|\/)data(?:\/|$)/i.test(path.replaceAll("\\", "/"))) {
      return reply(response, 404, { error: "Ficheiro não disponível." });
    }
    if (path !== "/api/storage" && path !== "/api/storage/recovery") return next();
    const host = request.headers.host;
    let hostname = "";
    try { hostname = new URL(`http://${host}`).hostname; } catch { /* rejected below */ }
    if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)
      || (request.headers.origin && request.headers.origin !== `http://${host}`)) {
      return reply(response, 403, { error: "O acesso aos dados só é permitido neste dispositivo." });
    }
    if (request.method === "GET") {
      if (path === "/api/storage/recovery") {
        try { return reply(response, 200, { data: await store.readRecovery() }); }
        catch { return reply(response, 500, { error: "Não foi possível abrir a cópia anterior à importação." }); }
      }
      try { return reply(response, 200, await store.read()); }
      catch { return reply(response, 500, { error: "Não foi possível ler os dados do dispositivo. O ficheiro foi preservado; verifique a pasta data ou restaure a cópia .bak antes de continuar." }); }
    }
    if (request.method !== "PUT" || path === "/api/storage/recovery") {
      response.setHeader("Allow", path === "/api/storage/recovery" ? "GET" : "GET, PUT");
      return reply(response, 405, { error: "Método não permitido." });
    }
    if (!request.headers["content-type"]?.startsWith("application/json")) {
      return reply(response, 415, { error: "É necessário enviar dados em JSON." });
    }
    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > 10 * 1024 * 1024) {
          return reply(response, 413, { error: "O ficheiro excede o limite de 10 MB." });
        }
        chunks.push(chunk);
      }
      let body: unknown;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { return reply(response, 400, { error: "JSON inválido. Nenhuma alteração foi gravada." }); }
      let data;
      try { data = validateData(isRecord(body) ? body.data : undefined); }
      catch (error) { return reply(response, 400, { error: asStorageError(error).message }); }
      if (!isRecord(body) || typeof body.revision !== "number" || !Number.isInteger(body.revision) || body.revision < 0) {
        return reply(response, 400, { error: "Revisão inválida." });
      }
      return reply(response, 200, await store.save(data, body.revision, body.preserveRecovery === true));
    } catch (error) {
      const failure = asStorageError(error);
      return reply(response, failure.status ?? 500, { error: failure.status === 409 ? failure.message
        : "Não foi possível guardar os dados neste dispositivo. Verifique o espaço livre e as permissões da pasta data antes de tentar novamente." });
    }
  };
}

export function localStoragePlugin(): Plugin {
  let middleware: Connect.NextHandleFunction;
  return {
    name: "petstay-device-storage",
    configResolved(config) {
      middleware = createStorageMiddleware(createLocalStore(join(config.root, "data")));
    },
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
