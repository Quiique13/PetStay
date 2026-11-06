import { useLanguage } from "../context/LanguageContext.tsx";
import { useState } from "react";
import type { ChangeEvent } from "react";
import type { HotelProfile, StorageError } from "../types.ts";
import { Upload, ArrowRight } from "lucide-react";
import { HotelAvatar } from "./HotelAvatar.tsx";

interface HotelProfileFormProps {
  initial?: HotelProfile;
  onSubmit: (profile: HotelProfile) => void | Promise<unknown>;
  busy?: boolean;
  error?: StorageError | null;
  submitLabel?: string;
}

export function HotelProfileForm({ initial, onSubmit, busy, error, submitLabel = "Guardar alterações" }: HotelProfileFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(initial?.name ?? "");
  const [owner, setOwner] = useState(initial?.owner ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  const [uploadError, setUploadError] = useState("");
  const [reading, setReading] = useState(false);

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1024 * 1024) {
      setUploadError("Escolha uma imagem PNG, JPG ou WebP com até 1 MB.");
      return;
    }
    setUploadError("");
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setAvatar(reader.result); setReading(false); };
    reader.onerror = () => { setUploadError("Não foi possível abrir a imagem. Tente outra fotografia."); setReading(false); };
    reader.readAsDataURL(file);
  }

  return <form className="hotel-profile-form" onSubmit={async event => {
    event.preventDefault();
    if (busy || reading) return;
    if (!name.trim() || !owner.trim()) { setUploadError("Preencha o nome do hotel e o seu nome."); return; }
    await onSubmit({ name: name.trim(), owner: owner.trim(), avatar });
  }}>
    <div className="avatar-picker">
      <HotelAvatar hotel={{ name, avatar }} large />
      <div>
        <label className="upload-avatar"><Upload size={15} />{" "}{t("Escolher avatar")}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || reading} onChange={upload} />
        </label>
        <p>{t("PNG, JPG ou WebP · até 1 MB · opcional")}</p>
        {avatar && <button type="button" className="textbutton" disabled={busy || reading} onClick={() => setAvatar("")}>{t("Remover imagem")}</button>}
      </div>
    </div>
    <label>{t("Nome do hotel")}<input name="hotelName" placeholder={t("Como se chama o seu hotel?")} autoComplete="organization" maxLength={100} required value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label>
    <label>{t("O seu nome")}<input name="ownerName" placeholder={t("Como se chama?")} autoComplete="name" maxLength={100} required value={owner} disabled={busy} onChange={event => setOwner(event.target.value)} /></label>
    {(uploadError || error) && <p className="form-error" role="alert">{t(uploadError || error?.message || "")}</p>}
    {error?.status === 409 && <button type="button" onClick={() => window.location.reload()}>{t("Recarregar dados")}</button>}
    <button className="primary" type="submit" disabled={busy || reading}>{busy ? t("A guardar…") : reading ? t("A preparar imagem…") : t(submitLabel)}<ArrowRight size={16} /></button>
  </form>;
}
