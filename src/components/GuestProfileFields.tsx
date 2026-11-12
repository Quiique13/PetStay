import { useEffect, useId, useRef, useState } from "react";
import { Camera, PawPrint, Upload } from "lucide-react";
import type { Guest } from "../types.ts";
import { useLanguage } from "../context/LanguageContext.tsx";
import { ClientPicker } from "./ClientPicker.tsx";
import { GuestAgeFields } from "./GuestAgeFields.tsx";
import { photoSource } from "../utils/photo.ts";
import { MemorialCross } from "./MemorialCross.tsx";
import { PhotoCropper } from "./PhotoCropper.tsx";
import "./GuestProfileFields.css";

export function GuestProfileFields({
  guest,
  clients,
  initialClient,
  photo,
  reading,
  onPhoto,
  onReading,
  onError,
}: {
  guest?: Guest;
  clients: string[];
  initialClient: string;
  photo: string;
  reading: boolean;
  onPhoto: (photo: string) => void;
  onReading: (reading: boolean) => void;
  onError: (error: string) => void;
}) {
  const { t } = useLanguage();
  const photoId = useId();
  const [deceased, setDeceased] = useState(guest?.deceased ?? false);
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => () => {
    if (cropImage?.src.startsWith("blob:")) URL.revokeObjectURL(cropImage.src);
  }, [cropImage]);
  async function openCrop(source: string) {
    const image = new Image();
    image.src = source;
    try {
      await image.decode();
    } catch {
      throw new Error("Não foi possível abrir a imagem. Tente outra fotografia.");
    }
    if (mounted.current) setCropImage(image);
    else if (source.startsWith("blob:")) URL.revokeObjectURL(source);
  }
  return (
    <>
      <section
        className="dog-photo-section"
        aria-label={t("Fotografia do hóspede")}
      >
        <div className="dog-photo-frame">
          {photo ? (
            <img
              className="guest-photo-preview"
              src={photo}
              alt={t("Fotografia do hóspede")}
            />
          ) : (
            <PawPrint size={34} />
          )}
          <span className="dog-photo-camera">
            <Camera size={14} />
          </span>
        </div>
        <div className="dog-photo-controls">
          <strong>{t("Fotografia do hóspede")}</strong>
          <p>{t("Uma fotografia para reconhecer o seu patudo.")}</p>
          <label className="dog-upload-button" htmlFor={photoId}>
            <Upload size={14} />{" "}
            {t(photo ? "Alterar fotografia" : "Adicionar fotografia")}
          </label>
          <input
            id={photoId}
            className="dog-photo-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={reading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              onReading(true);
              onError("");
              let source = "";
              try {
                source = await photoSource(file);
                await openCrop(source);
              } catch (error) {
                if (source.startsWith("blob:")) URL.revokeObjectURL(source);
                onError(
                  error instanceof Error
                    ? error.message
                    : "Erro ao abrir imagem.",
                );
              } finally {
                onReading(false);
              }
            }}
          />
          {photo && (
            <div className="dog-photo-actions">
              <button className="textbutton" type="button" disabled={reading} onClick={() => {
                onReading(true);
                onError("");
                void openCrop(photo).catch(() => onError("Não foi possível abrir a imagem.")).finally(() => onReading(false));
              }}>{t("Recortar fotografia")}</button>
              <button
                className="textbutton"
                type="button"
                disabled={reading}
                onClick={() => onPhoto("")}
              >
                {t("Remover imagem")}
              </button>
            </div>
          )}
          <small>
            {reading
              ? t("A preparar imagem…")
              : t("PNG, JPG ou WebP · até 20 MB · opcional")}
          </small>
        </div>
      </section>
      <fieldset className="dog-form-section">
        <legend>{t("Sobre o seu patudo")}</legend>
        <div className="dog-form-columns">
          <label>
            <span>
              {deceased && <MemorialCross />}
              {t("Nome do cão")}
            </span>
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={guest?.name ?? ""}
            />
          </label>
          <label>
            {t("Raça")}
            <input
              name="breed"
              required
              maxLength={100}
              defaultValue={guest?.breed ?? ""}
            />
          </label>
        </div>
        <GuestAgeFields guest={guest} />
        <label>
          {t("Castrado")}
          <select
            name="neutered"
            defaultValue={
              guest?.neutered === undefined ? "" : guest.neutered ? "yes" : "no"
            }
          >
            <option value="">{t("Por indicar")}</option>
            <option value="yes">{t("Sim")}</option>
            <option value="no">{t("Não")}</option>
          </select>
        </label>
      </fieldset>
      <fieldset className="dog-form-section">
        <legend>{t("Cliente")}</legend>
        <ClientPicker
          clients={clients}
          initial={guest?.owner ?? initialClient}
        />
      </fieldset>
      <fieldset className="dog-form-section dog-status-section">
        <legend>{t("Estado do hóspede")}</legend>
        <label className="dog-status-option">
          <input
            type="checkbox"
            name="deceased"
            checked={deceased}
            onChange={(e) => setDeceased(e.target.checked)}
          />{" "}
          {t("Falecido")}
        </label>
        <p className="hint">
          {t(
            "Os hóspedes falecidos deixam de aparecer nos aniversários e nos alertas. Os registos são mantidos.",
          )}
        </p>
      </fieldset>
      {cropImage && <PhotoCropper image={cropImage} onCancel={() => setCropImage(null)} onUse={next => {
        onPhoto(next);
        setCropImage(null);
      }} />}
    </>
  );
}
