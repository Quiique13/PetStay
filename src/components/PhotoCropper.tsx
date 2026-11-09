import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.tsx";
import { cropSquarePhoto } from "../utils/photo-crop.ts";
import "./PhotoCropper.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function PhotoCropper({ image, onUse, onCancel }: {
  image: HTMLImageElement;
  onUse: (photo: string) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const hintId = useId();
  const zoomId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const cancel = useRef(onCancel);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0.5, y: 0.5 });
  const [error, setError] = useState("");
  const shortest = Math.min(image.naturalWidth, image.naturalHeight);
  const width = image.naturalWidth / shortest * zoom;
  const height = image.naturalHeight / shortest * zoom;

  useEffect(() => { cancel.current = onCancel; }, [onCancel]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const parent = document.querySelector<HTMLElement>(".dog-profile-dialog");
    const wasInert = parent?.inert;
    if (parent) parent.inert = true;
    viewport.current?.focus();
    function keyboard(event: globalThis.KeyboardEvent) {
      // Capture at the document so Escape also works when WebKit leaves focus on body.
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancel.current();
      }
      if (event.key !== "Tab") return;
      event.stopImmediatePropagation();
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']") ?? []);
      const first = focusable[0], last = focusable.at(-1);
      const outside = !dialog.current?.contains(document.activeElement);
      if (outside || event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      if (parent) parent.inert = wasInert ?? false;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const travelX = rect.width * (width - 1), travelY = rect.height * (height - 1);
    setPan({
      x: travelX > 0 ? clamp(start.panX - (event.clientX - start.x) / travelX) : 0.5,
      y: travelY > 0 ? clamp(start.panY - (event.clientY - start.y) / travelY) : 0.5,
    });
  }

  return createPortal(
    <div className="overlay photo-crop-overlay">
      <div className="dialog photo-crop-dialog" ref={dialog} role="dialog" aria-modal="true" aria-label={t("Recortar fotografia")} aria-describedby={hintId}>
        <button className="close" type="button" aria-label={t("Fechar")} onClick={onCancel}><X /></button>
        <h2>{t("Recortar fotografia")}</h2>
        <p id={hintId}>{t("Arraste para enquadrar e ajuste o zoom. O recorte é sempre quadrado (1:1).")}</p>
        <div className="photo-crop-viewport" ref={viewport} role="group" aria-label={t("Enquadramento da fotografia")} tabIndex={0}
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
          onKeyDown={event => {
            const delta = event.shiftKey ? 0.1 : 0.03;
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            setPan(current => ({
              x: clamp(current.x + (event.key === "ArrowRight" ? delta : event.key === "ArrowLeft" ? -delta : 0)),
              y: clamp(current.y + (event.key === "ArrowDown" ? delta : event.key === "ArrowUp" ? -delta : 0)),
            }));
          }}>
          <img src={image.src} alt="" draggable={false} style={{ width: `${width * 100}%`, height: `${height * 100}%`, left: `${-pan.x * (width - 1) * 100}%`, top: `${-pan.y * (height - 1) * 100}%` }} />
          <span className="photo-crop-guides" aria-hidden="true" />
        </div>
        <div className="photo-crop-zoom">
          <div><label htmlFor={zoomId}>{t("Zoom")}</label><output htmlFor={zoomId}>{zoom.toFixed(1)}×</output></div>
          <input id={zoomId} type="range" min="1" max="4" step="0.01" value={zoom} aria-valuetext={`${zoom.toFixed(1)}×`} onChange={event => setZoom(Number(event.target.value))} />
        </div>
        <button className="textbutton photo-crop-reset" type="button" onClick={() => { setZoom(1); setPan({ x: 0.5, y: 0.5 }); }}><RotateCcw size={14} />{t("Repor enquadramento")}</button>
        {error && <p role="alert">{t(error)}</p>}
        <div className="photo-crop-actions">
          <button className="secondary" type="button" onClick={onCancel}>{t("Cancelar")}</button>
          <button className="primary" type="button" onClick={() => {
            try { onUse(cropSquarePhoto(image, zoom, pan.x, pan.y)); }
            catch { setError("Não foi possível abrir a imagem."); }
          }}>{t("Usar fotografia")}</button>
        </div>
      </div>
    </div>, document.body,
  );
}
