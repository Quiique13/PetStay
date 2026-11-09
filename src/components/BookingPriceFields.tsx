import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.tsx";

export function BookingPriceFields({
  initialTotal,
  initialRate,
  initialDiscount = 0,
}: {
  initialTotal?: number;
  initialRate?: number;
  initialDiscount?: number;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"automatic" | "daily" | "legacy">(
    initialRate !== undefined
      ? "daily"
      : initialTotal !== undefined
        ? "legacy"
        : "automatic",
  );
  const [amount, setAmount] = useState(
    initialRate === undefined ? "" : String(initialRate),
  );
  function automatic() {
    setMode("automatic");
    setAmount("");
  }
  return (
    <fieldset className="booking-price-fields">
      <legend>{t("Preço da reserva")}</legend>
      <label>
        <input
          type="radio"
          name="priceMode"
          value="automatic"
          checked={mode === "automatic"}
          onChange={automatic}
        />{" "}
        {t("Automático — usar preços definidos")}
      </label>
      <label>
        <input
          type="radio"
          name="priceMode"
          value="custom"
          checked={mode === "daily"}
          onChange={() => setMode("daily")}
        />{" "}
        {t("Definir preço personalizado")}
      </label>
      {mode === "legacy" && (
        <>
          <input type="hidden" name="customTotal" value={initialTotal} />
          <p className="hint">
            {t(
              "Esta reserva mantém o preço total personalizado anterior. Selecione um preço diário para alterar a forma de cálculo.",
            )}
          </p>
        </>
      )}
      {mode === "daily" && (
        <>
          <label>
            {t("Preço personalizado por noite/dia (€)")}
            <input
              name="customRate"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("Usar cálculo automático")}
            />
          </label>
          <p className="hint">
            {t(
              "Hotel: preço × noites. Creche: preço por dia. Em branco, usa os preços definidos. O suplemento opcional é adicionado antes do desconto.",
            )}
          </p>
        </>
      )}
      {mode !== "automatic" && (
        <button type="button" className="textbutton" onClick={automatic}>
          {t("Voltar ao preço automático")}
        </button>
      )}
      <label>
        {t("Desconto (%)")}
        <input
          name="discountPercent"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={initialDiscount}
        />
      </label>
      <p className="hint">
        {t(
          "O desconto aplica-se ao total da reserva, incluindo suplementos, e é arredondado aos cêntimos.",
        )}
      </p>
    </fieldset>
  );
}
