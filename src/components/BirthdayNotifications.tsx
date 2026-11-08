import { Cake } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.tsx";
import type { birthdayAlerts } from "../utils/birthdays.ts";

export function BirthdayNotifications({ alerts }: { alerts: ReturnType<typeof birthdayAlerts> }) {
  const { t } = useLanguage();
  return <section className="birthday-notifications" aria-label={t("Alertas de aniversário")}>
    <h3><Cake size={19} /> {t("Alertas de aniversário")}</h3>
    {alerts.length ? alerts.map(({ guest, age, daysAway }) => <div className="birthday-alert" key={`${guest.name}-${daysAway}`}>
      <strong>{t(daysAway === 0 ? "Hoje: {name} faz {age} anos!" : "Amanhã: {name} faz {age} anos!", { name: guest.name, age })}</strong>
      <small>{guest.owner}</small>
    </div>) : <p>{t("Sem aniversários hoje ou amanhã.")}</p>}
    <p className="hint">{t("Os alertas aparecem um dia antes e no dia do aniversário, quando o PetStay está aberto.")}</p>
  </section>;
}
