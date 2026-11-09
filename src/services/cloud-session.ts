import type { HotelData, StorageError, StorageSnapshot } from "../types.ts";
import { asStorageError } from "../types.ts";
import { validateData } from "../utils/hotel-data.ts";
import { defaultData } from "../utils/hotel-data.ts";
import { sameData } from "./cloud-model.ts";
import type { CloudCache, CloudDraft, CloudSnapshot } from "./cloud-model.ts";

export interface CloudState {
  data: HotelData | null;
  status: "loading" | "saved" | "saving" | "offline" | "error" | "conflict";
  error: StorageError | null;
  conflict: HotelData | null;
}
export interface CloudDependencies {
  cache: () => Promise<CloudCache>;
  legacy: () => Promise<StorageSnapshot>;
  saveDraft: (draft: CloudDraft) => Promise<unknown>;
  saveCommitted: (snapshot: CloudSnapshot, clearDraftId?: string) => Promise<unknown>;
  saveRecovery: (data: HotelData) => Promise<unknown>;
  watch: (receive: (snapshot: CloudSnapshot, cached: boolean) => void, fail: (cause: unknown) => void) => () => void;
  write: (draft: CloudDraft) => Promise<CloudSnapshot>;
  online: () => boolean;
}

// A local draft is durable before it is uploaded. Publishing compares revisions,
// so an offline device cannot silently replace a newer account snapshot.
export class CloudSession {
  state: CloudState = { data: null, status: "loading", error: null, conflict: null };
  private committed: CloudSnapshot | null = null;
  private draft: CloudDraft | null = null;
  private remote: CloudSnapshot | null = null;
  private legacy: StorageSnapshot | null = null;
  private migrated = false;
  private confirmed = false;
  private stopped = false;
  private writing: CloudDraft | null = null;
  private local = Promise.resolve();
  private pendingLocal = 0;
  private localFailure: StorageError | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private unwatch: (() => void) | undefined;
  private listeners = new Set<() => void>();

  constructor(private deps: CloudDependencies) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.state;
  private show(next: Partial<CloudState>) {
    if (this.stopped) return;
    this.state = { ...this.state, ...next };
    this.listeners.forEach(listener => listener());
  }
  private fail = (cause: unknown) => {
    const original = asStorageError(cause);
    const code = (cause as { code?: string })?.code;
    const error = code === "permission-denied"
      ? new Error("O Firestore bloqueou o acesso. Publique as regras da aplicação no Firebase e tente novamente.")
      : original;
    this.show({ error, status: original.status === 409 ? "conflict" : "error" });
  };
  private enqueue(action: () => Promise<unknown>) {
    this.pendingLocal++;
    const operation = this.local.then(action);
    this.local = operation.then(() => { this.pendingLocal--; }, cause => { this.pendingLocal--; this.localFailure = asStorageError(cause); this.fail(cause); });
    return operation;
  }
  hasUnsavedLocal = () => this.pendingLocal > 0;
  async start() {
    try {
      const cache = await this.deps.cache();
      if (this.stopped) return;
      // An interrupted first migration can have a durable draft before any
      // committed cache. Its base revision still permits further offline edits.
      this.committed = cache.committed ?? (cache.draft ? { id: null, revision: cache.draft.baseRevision, initialized: false, data: defaultData() } : null);
      this.draft = cache.draft;
      this.migrated = cache.migrated;
      this.show({ data: this.draft?.data ?? this.committed?.data ?? null, status: this.committed || this.draft ? "offline" : "loading" });
      // Only the old store belonging to this UID is a migration candidate.
      if (!this.migrated && !this.draft) this.legacy = await this.deps.legacy();
      if (!this.stopped) this.connect();
    } catch (cause) { this.fail(cause); }
  }
  private connect() {
    this.unwatch?.();
    this.unwatch = this.deps.watch((snapshot, cached) => {
      void this.receive(snapshot, cached).catch(this.fail);
    }, this.fail);
  }
  private async receive(snapshot: CloudSnapshot, cached: boolean) {
    if (this.stopped || snapshot.revision < (this.remote?.revision ?? 0)) return;
    this.remote = snapshot;
    this.confirmed = !cached;
    if (!this.migrated && !this.draft && this.legacy?.initialized && !sameData(this.legacy.data, snapshot.data)) {
      if (cached) return;
      if (snapshot.initialized) {
        this.show({ data: this.legacy.data, conflict: snapshot.data, status: "conflict", error: null });
        return;
      }
      this.committed = snapshot;
      this.show({ data: this.legacy.data });
      await this.stage(this.legacy.data);
      return;
    }
    if (this.draft) {
      if (snapshot.id === this.draft.id) {
        const id = this.draft.id;
        this.committed = snapshot;
        this.draft = null;
        this.migrated = true;
        await this.enqueue(() => this.deps.saveCommitted(snapshot, id));
        if (!this.draft && this.committed?.id === snapshot.id) this.show({ data: snapshot.data, status: cached ? "offline" : "saved", error: null, conflict: null });
      } else if (snapshot.id === this.writing?.id) {
        this.committed = snapshot;
        this.draft = { ...this.draft, baseRevision: snapshot.revision };
        const next = this.draft;
        await this.enqueue(() => this.deps.saveDraft(next));
      } else if (!cached && snapshot.revision !== this.draft.baseRevision) {
        this.show({ conflict: snapshot.data, status: "conflict", error: null });
      } else if (!cached) this.schedule();
      return;
    }
    this.committed = snapshot;
    this.migrated = true;
    await this.enqueue(() => this.deps.saveCommitted(snapshot));
    if (!this.draft) this.show({ data: snapshot.data, status: cached ? "offline" : "saved", error: null, conflict: null });
  }
  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.pump(); }, 250);
  }
  private async stage(data: HotelData, preserveRecovery = false) {
    if (!this.committed) throw new Error("Aguarde pela abertura dos dados da conta.");
    // Never reuse an in-flight snapshot ID for different contents.
    const draft: CloudDraft = { id: crypto.randomUUID(), baseRevision: this.committed.revision, data: validateData(data), preserveRecovery: preserveRecovery || !!this.draft?.preserveRecovery };
    this.draft = draft;
    this.show({ data: draft.data, status: this.deps.online() ? "saving" : "offline", error: null });
    await this.enqueue(() => this.deps.saveDraft(draft));
    this.localFailure = null;
    this.schedule();
  }
  update = <K extends keyof HotelData>(key: K, value: HotelData[K]) => {
    if (!this.state.data || this.state.conflict || this.state.status === "conflict") return;
    void this.stage({ ...this.state.data, [key]: value }).catch(this.fail);
  };
  private async pump() {
    if (this.writing || !this.draft || this.stopped || this.state.conflict || this.state.status === "conflict" || this.state.status === "error") return;
    if (!this.confirmed || !this.deps.online()) { this.show({ status: "offline" }); return; }
    const draft = this.draft;
    this.writing = draft;
    try {
      await this.local;
      if (this.snapshot().status === "error") return;
      this.show({ status: "saving" });
      const snapshot = await this.deps.write(draft);
      if (snapshot.revision < (this.remote?.revision ?? 0)) return;
      this.committed = snapshot;
      this.remote = snapshot;
      this.migrated = true;
      if (this.draft?.id === draft.id) {
        this.draft = null;
        await this.enqueue(() => this.deps.saveCommitted(snapshot, draft.id));
        if (!this.draft) this.show({ status: "saved", error: null });
      } else if (this.draft) {
        this.draft = { ...this.draft, baseRevision: snapshot.revision };
        const next = this.draft;
        await this.enqueue(async () => { await this.deps.saveCommitted(snapshot); await this.deps.saveDraft(next); });
      }
    } catch (cause) {
      if (!this.deps.online()) this.show({ status: "offline", error: null });
      else this.fail(cause);
    } finally {
      this.writing = null;
      if (this.draft && this.state.status === "saving") this.schedule();
    }
  }
  // Export and logout wait for the durable local copy, including while offline.
  // They never label that copy as synchronized before Firestore acknowledges it.
  flush = async (): Promise<HotelData> => {
    await this.local;
    if (!this.state.data) throw new Error("Os dados ainda não estão disponíveis.");
    if (this.localFailure) throw this.localFailure;
    return structuredClone(this.state.data);
  };
  replaceData = async (input: HotelData, preserveRecovery = true) => {
    if (this.state.conflict || this.state.status === "conflict") throw new Error("Resolva as alterações entre dispositivos antes de importar.");
    const next = structuredClone(validateData(input));
    const previous = await this.flush();
    if (preserveRecovery) await this.enqueue(() => this.deps.saveRecovery(previous));
    await this.stage(next, preserveRecovery);
  };
  resolve = async (choice: "cloud" | "local") => {
    if (!this.remote || !this.confirmed || !this.state.data) return;
    if (this.writing) return;
    try {
      const local = this.state.data;
      const remote = this.remote;
      // Preserve the displaced data before either explicit replacement.
      await this.enqueue(() => this.deps.saveRecovery(choice === "cloud" ? local : remote.data));
      this.committed = remote;
      this.migrated = true;
      this.show({ conflict: null, error: null });
      if (choice === "cloud") {
        const id = this.draft?.id;
        this.draft = null;
        await this.enqueue(() => this.deps.saveCommitted(remote, id));
        this.show({ data: remote.data, status: "saved" });
      } else await this.stage(local, true);
    } catch (cause) { this.fail(cause); }
  };
  retry = () => {
    if (!this.committed && !this.draft && !this.unwatch) { void this.start(); return; }
    this.confirmed = false;
    this.show({ error: null, status: this.state.conflict ? "conflict" : this.draft ? "saving" : "loading" });
    const draft = this.draft;
    void (draft ? this.enqueue(() => this.deps.saveDraft(draft)) : this.committed ? this.enqueue(() => this.deps.saveCommitted(this.committed!)) : Promise.resolve()).then(() => { this.localFailure = null; this.connect(); }).catch(this.fail);
  };
  network = () => {
    if (!this.deps.online()) this.show({ status: this.state.conflict ? "conflict" : "offline" });
    else this.retry();
  };
  stop() { this.stopped = true; clearTimeout(this.timer); this.unwatch?.(); this.listeners.clear(); }
}
