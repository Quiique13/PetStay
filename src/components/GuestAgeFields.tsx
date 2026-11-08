import { useState } from "react";
import type { Guest } from "../types.ts";
import { useLanguage } from "../context/LanguageContext.tsx";
import { ageGroupFromBirth, ageInMonths, isBirthDate } from "../utils/age.ts";
import { ageLabels, localDate } from "../utils/format.ts";

export function GuestAgeFields({ guest }: { guest?: Guest }) {
  const { t } = useLanguage();
  const [birth, setBirth] = useState(guest?.birthDate ?? "");
  const valid = isBirthDate(birth) && ageInMonths(birth) >= 0;
  const months = valid ? ageInMonths(birth) : 0;
  const age = valid ? ageGroupFromBirth(birth) : guest?.age ?? "Puppy";
  return <>
    <label>{t("Data de nascimento (dia/mês/ano)")}
      <input type="date" name="birthDate" min="1900-01-01" max={localDate()} required={!guest || !!guest.birthDate} value={birth} onChange={e => setBirth(e.target.value)} />
    </label>
    {valid ? <>
      <input type="hidden" name="age" value={age} />
      <p role="status">{t("Idade: {years} anos e {months} meses · {group}", { years: Math.floor(months / 12), months: months % 12, group: t(ageLabels[age]) })}</p>
    </> : guest && !birth ? <label>{t("Faixa etária")}
      <select name="age" defaultValue={guest.age}>
        <option value="Puppy">{t("Cachorro")}</option><option value="Adult">{t("Adulto")}</option><option value="Senior">{t("Sénior")}</option>
      </select>
    </label> : <p>{t("A faixa etária é calculada automaticamente a partir do nascimento.")}</p>}
    <p className="hint">{t("Cachorro: menos de 1 ano · Adulto: 1–7 anos · Sénior: 8 ou mais anos. A faixa muda no dia de aniversário; 29 de fevereiro usa 28 de fevereiro nos anos não bissextos.")}</p>
  </>;
}
