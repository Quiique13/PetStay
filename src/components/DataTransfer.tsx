import { useEffect, useState } from "react";
import { Download, Upload, Share2, RotateCcw, CheckCircle2 } from "lucide-react";
import { useHotel } from "../context/HotelContext.tsx";
import { backupFileName, maxBackupBytes, parseBackup, serializeBackup } from "../services/backup.ts";
import type { BackupPreview } from "../services/backup.ts";
import { loadImportRecovery } from "../services/device-storage.ts";
import { isMobileApp } from "../services/storage-mode.ts";
import { asStorageError } from "../types.ts";

export function DataTransfer() {
  const storage = useHotel();
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);

  async function exportData() {
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await storage.flush();
      const file = new File([serializeBackup(data)], backupFileName(data), { type: "application/json" });
      setShareFile(file);
      setDownloadUrl(URL.createObjectURL(file));
      setMessage("Cópia preparada. Toque em «Guardar ficheiro» ou partilhe-a com o outro dispositivo.");
    } catch (cause) { setError(asStorageError(cause).message); }
    finally { setBusy(false); }
  }

  async function selectFile(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError(""); setMessage(""); setPreview(null); setConfirmed(false);
    try {
      if (file.size > maxBackupBytes) throw new Error("A cópia excede o limite de 10 MB.");
      setPreview(parseBackup(await file.text()));
    } catch (cause) { setError(asStorageError(cause).message); }
    finally { setBusy(false); }
  }

  async function importData() {
    if (!preview || (storage.data?.hotel && !confirmed)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await storage.replaceData(preview.data);
      setPreview(null); setConfirmed(false); setShareFile(null); setDownloadUrl(null);
      setMessage("Dados importados e guardados neste dispositivo.");
      if (isMobileApp) void navigator.storage?.persist?.().catch(() => {});
    } catch (cause) { setError(asStorageError(cause).message); }
    finally { setBusy(false); }
  }

  async function recovery() {
    setBusy(true); setError(""); setMessage(""); setPreview(null); setConfirmed(false);
    try {
      const data = await loadImportRecovery();
      if (!data?.hotel) throw new Error("Ainda não existe uma cópia anterior à importação neste dispositivo.");
      setPreview({ data, exportedAt: null });
    } catch (cause) { setError(asStorageError(cause).message); }
    finally { setBusy(false); }
  }

  return <section className="data-transfer" aria-label="Dados e cópias" aria-busy={busy}>
    <p>Leve o seu hotel consigo. Exporte uma cópia neste dispositivo e importe-a no computador ou no telemóvel.</p>
    <div className="transfer-actions">
      {storage.data?.hotel && <button className="primary" disabled={busy} onClick={exportData}><Download size={18} /> Exportar cópia</button>}
      <label className={`secondary file-picker ${busy ? "disabled" : ""}`}>
        <Upload size={18} /> Escolher cópia para importar
        <input aria-label="Ficheiro de cópia PetStay" type="file" accept=".json,application/json" disabled={busy} onChange={event => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          void selectFile(file);
        }} />
      </label>
    </div>
    {downloadUrl && shareFile && <a className="primary" href={downloadUrl} download={shareFile.name}><Download size={18} /> Guardar ficheiro</a>}
    {shareFile && navigator.canShare?.({ files: [shareFile] }) && <button className="secondary" disabled={busy} onClick={async () => {
      try { await navigator.share({ files: [shareFile], title: "Cópia PetStay" }); }
      catch (cause) { if (!(cause instanceof Error && cause.name === "AbortError")) setError("Não foi possível partilhar. Use o ficheiro guardado nas transferências."); }
    }}><Share2 size={18} /> Partilhar cópia</button>}
    <p className="transfer-note">A cópia inclui o perfil e avatar, hóspedes e tutores, reservas, pagamentos, preços e simulador. Transfira o ficheiro por AirDrop, cabo ou um serviço de ficheiros à sua escolha.</p>
    {preview && <div className="import-preview">
      <span className="eyebrow">PRÉ-VISUALIZAÇÃO DA CÓPIA</span>
      <h3>{preview.data.hotel?.name}</h3>
      <p>{preview.data.hotel?.owner}</p>
      <dl>
        <div><dt>Hóspedes</dt><dd>{preview.data.guests.length}</dd></div>
        <div><dt>Reservas</dt><dd>{preview.data.bookings.length}</dd></div>
        <div><dt>Pagas</dt><dd>{preview.data.bookings.filter(booking => booking.paid).length}</dd></div>
      </dl>
      {preview.exportedAt && <p>Exportada em {new Date(preview.exportedAt).toLocaleString("pt-PT")}</p>}
      <p>A importação substitui todos os dados deste dispositivo. Não junta alterações feitas nos dois dispositivos. A versão anterior fica disponível em «Recuperar dados anteriores».</p>
      {storage.data?.hotel && <label className="confirm-import"><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} /> Confirmo que quero substituir os dados deste dispositivo.</label>}
      <div className="transfer-actions">
        <button className="primary" disabled={busy || (!!storage.data?.hotel && !confirmed)} onClick={importData}>{busy ? "A importar…" : "Importar e substituir"}</button>
        <button className="secondary" disabled={busy} onClick={() => { setPreview(null); setConfirmed(false); }}>Cancelar</button>
      </div>
    </div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="transfer-success" role="status"><CheckCircle2 size={18} />{message}</p>}
    {storage.data?.hotel && <button className="textbutton recovery-action" disabled={busy} onClick={recovery}><RotateCcw size={15} /> Recuperar dados anteriores</button>}
    <p className="transfer-note">Os dispositivos funcionam de forma independente. Para levar alterações de volta, exporte uma nova cópia no dispositivo mais atualizado. Guarde estas cópias num local privado.</p>
  </section>;
}
