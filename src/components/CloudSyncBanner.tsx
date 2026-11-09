import { useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useHotel } from "../context/HotelContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { backupFileName, serializeBackup } from "../services/backup.ts";
import type { HotelData } from "../types.ts";

export function CloudSyncBanner() {
  const storage = useHotel();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  if (!storage.cloud) return null;
  async function choose(choice: "cloud" | "local") {
    setBusy(true);
    try { await storage.resolve(choice); } finally { setBusy(false); }
  }
  function download(data: HotelData) {
    const url = URL.createObjectURL(new Blob([serializeBackup(data)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = backupFileName(data); link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const conflict = storage.conflict;
  return (
    <section className={`cloud-sync ${conflict ? "cloud-conflict" : ""}`} aria-label={t("Sincronização da conta")}>
      {conflict && storage.data ? <>
        <h2>{t("Existem duas versões do seu hotel")}</h2>
        <p>{t("Escolha a versão a manter em todos os dispositivos. A outra cópia fica disponível em Recuperar dados anteriores. Pode exportar ambas antes de escolher.")}</p>
        <div className="cloud-copies">
          {([ ["local", storage.data], ["cloud", conflict] ] as const).map(([choice, data]) => <article key={choice}>
            <h3>{t(choice === "local" ? "Neste dispositivo" : "Na conta")}</h3>
            <strong>{data.hotel?.name ?? t("Sem hotel")}</strong>
            <p>{t("{guests} hóspedes · {bookings} reservas", { guests: data.guests.length, bookings: data.bookings.length })}</p>
            <button disabled={busy} onClick={() => download(data)}>{t("Exportar cópia")}</button>
            <button className="primary" disabled={busy} onClick={() => void choose(choice)}>{t(choice === "local" ? "Usar esta cópia em todos os dispositivos" : "Usar os dados da conta")}</button>
          </article>)}
        </div>
      </> : <div className="cloud-sync-status" role={storage.error ? "alert" : "status"}>
        {storage.status === "saved" ? <Cloud size={17} /> : storage.status === "offline" ? <CloudOff size={17} /> : <RefreshCw size={17} />}
        <span>{t(storage.error?.message ?? (storage.status === "saved" ? "Sincronizado com a sua conta." : storage.status === "offline" ? "Sem ligação confirmada. A cópia local está guardada; as alterações serão sincronizadas ao voltar a ligar." : storage.status === "conflict" ? "A aguardar os dados mais recentes para resolver as alterações entre dispositivos." : "A sincronizar com a sua conta…"))}</span>
        {(storage.error || storage.status === "offline" || storage.status === "conflict") && <button onClick={storage.retry}>{t("Tentar novamente")}</button>}
      </div>}
    </section>
  );
}
