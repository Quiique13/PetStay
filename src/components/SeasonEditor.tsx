import { Plus, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.tsx";
import type { SeasonRange } from "../types.ts";
import { createFormatters } from "../utils/format.ts";
import { daysInSeasonMonth } from "../utils/seasons.ts";

export function SeasonEditor({ ranges, onChange }: {
  ranges: SeasonRange[];
  onChange: (ranges: SeasonRange[]) => void;
}) {
  const { t, locale } = useLanguage();
  const { monthName } = createFormatters(locale);

  function update(index: number, boundary: "start" | "end", month: number, day: number) {
    const value = `${String(month).padStart(2, "0")}-${String(Math.min(day, daysInSeasonMonth(month))).padStart(2, "0")}`;
    onChange(ranges.map((range, i) => i === index ? { ...range, [boundary]: value } : range));
  }

  return (
    <div className="season-editor">
      <h4>{t("Escolha os dias de época alta")}</h4>
      <p>{t("Os períodos repetem-se todos os anos e incluem o primeiro e o último dia. Os restantes dias usam os preços de época baixa. As alterações são guardadas automaticamente.")}</p>
      <p>{t("Se o fim for anterior ao início, o período termina no ano seguinte.")}</p>
      <div className="season-ranges">
        {ranges.map((range, index) => (
          <fieldset className="season-range" key={index}>
            <legend>{t("Período {number}", { number: index + 1 })}</legend>
            {(["start", "end"] as const).map(boundary => {
              const [month, day] = range[boundary].split("-").map(Number);
              return (
                <div className="season-boundary" key={boundary}>
                  <span>{t(boundary === "start" ? "Desde" : "Até")}</span>
                  <div className="season-date">
                    <select
                      aria-label={t(boundary === "start" ? "Dia de início do período {number}" : "Dia de fim do período {number}", { number: index + 1 })}
                      value={day}
                      onChange={event => update(index, boundary, month, Number(event.target.value))}
                    >
                      {Array.from({ length: daysInSeasonMonth(month) }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                    </select>
                    <select
                      aria-label={t(boundary === "start" ? "Mês de início do período {number}" : "Mês de fim do período {number}", { number: index + 1 })}
                      value={month}
                      onChange={event => update(index, boundary, Number(event.target.value), day)}
                    >
                      {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{monthName(i)}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
            <button type="button" className="season-remove" aria-label={t("Remover período {number}", { number: index + 1 })} onClick={() => onChange(ranges.filter((_, i) => i !== index))}>
              <X size={17} />
            </button>
          </fieldset>
        ))}
      </div>
      {!ranges.length && <p className="season-empty">{t("Sem períodos de época alta. Todos os dias usam os preços de época baixa.")}</p>}
      <button type="button" className="secondary season-add" onClick={() => {
        const today = new Date();
        const date = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        onChange([...ranges, { start: date, end: date }]);
      }}>
        <Plus size={16} /> {t("Adicionar período de época alta")}
      </button>
    </div>
  );
}
