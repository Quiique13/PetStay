import React, { useState } from "react";
import { Upload, ArrowRight } from "lucide-react";
import { HotelAvatar } from "./HotelAvatar.jsx";

export function HotelProfileForm({ initial, onSubmit, busy, error, submitLabel = "Guardar alterações" }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [owner, setOwner] = useState(initial?.owner ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  const [uploadError, setUploadError] = useState("");
  const [reading, setReading] = useState(false);

  function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1024 * 1024) {
      setUploadError("Escolha uma imagem PNG, JPG ou WebP com até 1 MB.");
      return;
    }
    setUploadError("");
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => { setAvatar(reader.result); setReading(false); };
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
        <label className="upload-avatar"><Upload size={15} /> Escolher avatar
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || reading} onChange={upload} />
        </label>
        <p>PNG, JPG ou WebP · até 1 MB · opcional</p>
        {avatar && <button type="button" className="textbutton" disabled={busy || reading} onClick={() => setAvatar("")}>Remover imagem</button>}
      </div>
    </div>
    <label>Nome do hotel<input name="hotelName" placeholder="Como se chama o seu hotel?" autoComplete="organization" maxLength={100} required value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label>
    <label>O seu nome<input name="ownerName" placeholder="Como se chama?" autoComplete="name" maxLength={100} required value={owner} disabled={busy} onChange={event => setOwner(event.target.value)} /></label>
    {(uploadError || error) && <p className="form-error" role="alert">{uploadError || error.message}</p>}
    {error?.status === 409 && <button type="button" onClick={() => window.location.reload()}>Recarregar dados</button>}
    <button className="primary" type="submit" disabled={busy || reading}>{busy ? "A guardar…" : reading ? "A preparar imagem…" : submitLabel}<ArrowRight size={16} /></button>
  </form>;
}
