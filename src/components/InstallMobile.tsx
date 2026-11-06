import { useLanguage } from "../context/LanguageContext.tsx";
import { useEffect, useState } from "react";
import { Download, Smartphone, RefreshCw } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useHotel } from "../context/HotelContext.tsx";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallMobile() {
  const { t } = useLanguage();
  const storage = useHotel();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [error, setError] = useState("");
  const [cached, setCached] = useState(false);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError: () =>
      setError(
        "Não foi possível preparar o modo offline. Verifique a ligação e reabra a aplicação.",
      ),
  });

  useEffect(() => {
    let active = true;
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then(() => {
        if (active) setCached(true);
      });
    }
    function available(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    }
    function complete() {
      setInstalled(true);
      setPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);

  return (
    <section className="mobile-install" aria-label={t("Instalar PetStay")}>
      <Smartphone size={21} />
      <div>
        <strong>
          {installed
            ? t("O seu hotel, sempre consigo")
            : t("PetStay no seu ecrã principal")}
        </strong>
        <p>
          {offlineReady || cached
            ? t("Pronto para usar sem ligação, com os dados neste dispositivo.")
            : t("Abra uma vez com ligação para preparar o uso offline.")}
        </p>
        {!installed && !prompt && (
          <p>
            {t(
              "No iPhone: Safari → Partilhar → Adicionar ao ecrã principal. No Android: menu do navegador → Instalar aplicação.",
            )}
          </p>
        )}
        {error && <p role="alert">{t(error)}</p>}
      </div>
      {prompt && (
        <button
          className="secondary"
          onClick={async () => {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice.outcome === "accepted") setPrompt(null);
            void navigator.storage?.persist?.().catch(() => {});
          }}
        >
          <Download size={16} /> {t("Instalar")}
        </button>
      )}
      {needRefresh && (
        <button
          className="secondary"
          disabled={storage.status !== "saved"}
          onClick={async () => {
            try {
              await storage.flush();
              await updateServiceWorker(true);
            } catch {
              setError("Guarde as alterações antes de atualizar a aplicação.");
            }
          }}
        >
          <RefreshCw size={16} /> {t("Atualizar aplicação")}
        </button>
      )}
    </section>
  );
}
