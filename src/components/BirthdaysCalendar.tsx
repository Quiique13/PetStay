import { useState } from "react";
import { ChevronLeft, ChevronRight, PawPrint } from "lucide-react";
import type { Guest } from "../types.ts";
import { useLanguage } from "../context/LanguageContext.tsx";
import { birthdaysInMonth } from "../utils/birthdays.ts";
import { createFormatters } from "../utils/format.ts";
import "./BirthdaysCalendar.css";

export function BirthdaysCalendar({ guests }: { guests: Guest[] }) {
  const { t, locale } = useLanguage();
  const { weekdayShort } = createFormatters(locale);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const today = new Date();
  const birthdays = birthdaysInMonth(guests, year, month);
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((offset + days) / 7) * 7;
  const missing = guests.filter(guest => !guest.birthDate && !guest.deceased).length;
  return <section className="panel birthdays-panel" aria-label={t("Calendário de aniversários")}>
    <div className="panelheading">
      <div><h3>{t("Calendário de aniversários")}</h3><p>{t("Um dia especial para cada patudo.")}</p></div>
      <div className="month">
        <button type="button" aria-label={t("Mês anterior")} onClick={() => setMonthDate(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
        <span aria-live="polite">{monthDate.toLocaleDateString(locale, { month: "long", year: "numeric" })}</span>
        <button type="button" aria-label={t("Mês seguinte")} onClick={() => setMonthDate(new Date(year, month + 1, 1))}><ChevronRight size={16} /></button>
      </div>
    </div>
    <div className="birthday-toolbar"><button className="secondary" onClick={() => setMonthDate(new Date())}>{t("Este mês")}</button><span>{t("Aniversários este mês: {count}", { count: birthdays.length })}</span></div>
    <div className="birthday-grid">
      {Array.from({ length: 7 }, (_, i) => <div className="birthday-weekday" key={`weekday-${i}`}>{weekdayShort(new Date(2026, 10, 2 + i))}</div>)}
      {Array.from({ length: cells }, (_, i) => {
        const day = i - offset + 1;
        if (day < 1 || day > days) return <div className="birthday-blank" key={i} aria-hidden="true" />;
        const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
        return <div className={`birthday-day ${isToday ? "birthday-today" : ""}`} key={i} aria-label={new Date(year, month, day).toLocaleDateString(locale)} aria-current={isToday ? "date" : undefined}>
          <strong className="birthday-number">{day}</strong>
          {birthdays.filter(birthday => birthday.day === day).map(({ guest, age }) => <div className="birthday-dog" key={guest.name}>
            {guest.photo ? <img src={guest.photo} alt="" /> : <PawPrint size={16} />}
            <div><strong>{guest.name}</strong><small>{t("Faz {age} anos", { age })}</small><small>{guest.owner}</small></div>
          </div>)}
        </div>;
      })}
    </div>
    {!birthdays.length && <p className="birthday-note" role="status">{t("Sem aniversários neste mês.")}</p>}
    {missing > 0 && <p className="birthday-note">{t("Hóspedes sem data de nascimento: {count}. Edite o hóspede para adicionar o aniversário.", { count: missing })}</p>}
    <p className="birthday-note">{t("Os aniversários de 29 de fevereiro aparecem a 28 nos anos não bissextos.")}</p>
  </section>;
}
