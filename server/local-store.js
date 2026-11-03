import { mkdir, readFile, writeFile, rename, copyFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { defaultData, validateData } from "../src/utils/hotel-data.js";

export function createLocalStore(directory) {
  const file = join(directory, "hotel.json");
  const legacyFile = join(directory, "momo.json");
  let writes = Promise.resolve();

  async function read() {
    let contents;
    try {
      contents = await readFile(file, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      try { contents = await readFile(legacyFile, "utf8"); }
      catch (legacyError) {
        if (legacyError.code === "ENOENT") return { data: defaultData(), revision: 0, initialized: false };
        throw legacyError;
      }
    }
    const saved = JSON.parse(contents);
    if (![1, 2].includes(saved.schemaVersion) || !Number.isInteger(saved.revision) || saved.revision < 1) {
      throw new Error("Formato de ficheiro desconhecido.");
    }
    const data = saved.schemaVersion === 1 ? { ...saved.data, hotel: null } : saved.data;
    return { data: validateData(data), revision: saved.revision, initialized: true };
  }

  function save(data, revision) {
    // Serialize writes so edits cannot interleave or corrupt the JSON file.
    const operation = writes.then(async () => {
      validateData(data);
      if (!Number.isInteger(revision) || revision < 0) throw new Error("Revisão inválida.");
      const current = await read();
      if (current.revision !== revision) {
        const error = new Error("Os dados foram alterados noutra janela. Recarregue a aplicação antes de continuar.");
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
          catch (error) { if (error.code === "ENOENT") previous = legacyFile; else throw error; }
          await copyFile(previous, file + ".bak");
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
    writes = operation.catch(() => {});
    return operation;
  }
  return { read, save };
}

export function createStorageMiddleware(store) {
  function reply(response, status, body) {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(body));
  }
  return async (request, response, next) => {
    let path;
    try { path = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
    catch { return reply(response, 400, { error: "Endereço inválido." }); }
    // Vite also serves project files in development; never serve private data as assets.
    if (/(?:^|\/)data(?:\/|$)/i.test(path.replaceAll("\\", "/"))) {
      return reply(response, 404, { error: "Ficheiro não disponível." });
    }
    if (path !== "/api/storage") return next();
    const host = request.headers.host;
    let hostname;
    try { hostname = new URL(`http://${host}`).hostname; } catch { /* rejected below */ }
    if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)
      || (request.headers.origin && request.headers.origin !== `http://${host}`)) {
      return reply(response, 403, { error: "O acesso aos dados só é permitido neste dispositivo." });
    }
    if (request.method === "GET") {
      try { return reply(response, 200, await store.read()); }
      catch { return reply(response, 500, { error: "Não foi possível ler os dados do dispositivo. O ficheiro foi preservado; verifique a pasta data ou restaure a cópia .bak antes de continuar." }); }
    }
    if (request.method !== "PUT") {
      response.setHeader("Allow", "GET, PUT");
      return reply(response, 405, { error: "Método não permitido." });
    }
    if (!request.headers["content-type"]?.startsWith("application/json")) {
      return reply(response, 415, { error: "É necessário enviar dados em JSON." });
    }
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > 10 * 1024 * 1024) {
          return reply(response, 413, { error: "O ficheiro excede o limite de 10 MB." });
        }
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { return reply(response, 400, { error: "JSON inválido. Nenhuma alteração foi gravada." }); }
      try { validateData(body?.data); }
      catch (error) { return reply(response, 400, { error: error.message }); }
      if (!Number.isInteger(body.revision) || body.revision < 0) {
        return reply(response, 400, { error: "Revisão inválida." });
      }
      return reply(response, 200, await store.save(body.data, body.revision));
    } catch (error) {
      return reply(response, error.status ?? 500, { error: error.status === 409 ? error.message
        : "Não foi possível guardar os dados neste dispositivo. Verifique o espaço livre e as permissões da pasta data antes de tentar novamente." });
    }
  };
}

export function localStoragePlugin() {
  let middleware;
  return {
    name: "petstay-device-storage",
    configResolved(config) {
      middleware = createStorageMiddleware(createLocalStore(join(config.root, "data")));
    },
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
