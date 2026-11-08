import { GuestProfileFields } from "./GuestProfileFields.tsx";
import { MemorialCross } from "./MemorialCross.tsx";
import { useBirthdayAlerts } from "../hooks/useBirthdayAlerts.ts";
import { BirthdayNotifications } from "./BirthdayNotifications.tsx";
import { BirthdaysCalendar } from "./BirthdaysCalendar.tsx";
import { BookingPriceFields } from "./BookingPriceFields.tsx";
import { clientKey, groupClients } from "../utils/clients.ts";
import {
  ageGroupFromBirth,
  ageInMonths,
  guestAgeGroup,
  isBirthDate,
} from "../utils/age.ts";
import { useLanguage } from "../context/LanguageContext.tsx";
import React, { useEffect, useState } from "react";
import {
  PawPrint,
  LayoutDashboard,
  CalendarDays,
  Heart,
  Wallet,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Search,
  Bell,
  X,
  Sun,
  Check,
  DatabaseBackup,
  Settings,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useHotel } from "../context/HotelContext.tsx";
import { bookingPrice, isAgeGroup, isStayType } from "../utils/hotel-data.ts";
import { asStorageError } from "../types.ts";
import type { Booking, HotelData } from "../types.ts";
import { Brand } from "./Brand.tsx";
import { HotelAvatar } from "./HotelAvatar.tsx";
import { HotelProfileForm } from "./HotelProfileForm.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { DataTransfer } from "./DataTransfer.tsx";
import { SettingsPage } from "./SettingsPage.tsx";
import { SeasonEditor } from "./SeasonEditor.tsx";
import { monthlyRevenue } from "../utils/seasons.ts";
import { InstallMobile } from "./InstallMobile.tsx";
import { isMobileApp } from "../services/storage-mode.ts";
import hotelDog from "../assets/hotel-dog.jpg";
import {
  createFormatters,
  initials,
  localDate,
  pageLabels,
  ageLabels,
  stayLabels,
  breedLabel,
} from "../utils/format.ts";
const names = [
  "Overview",
  "Bookings",
  "Guests & clients",
  "Payments",
  "Pricing & seasons",
  "Settings",
] as const;
type Page = (typeof names)[number];
type Modal =
  | "profile"
  | "help"
  | "notifications"
  | "guest"
  | "booking"
  | "data";
const ages = ["Puppy", "Adult", "Senior"] as const;
const icons = [
  LayoutDashboard,
  CalendarDays,
  Heart,
  Wallet,
  SlidersHorizontal,
  Settings,
];
export default function Dashboard() {
  const { t, locale } = useLanguage();
  const { money, shortMoney, formatDate, monthName, weekdayShort } = createFormatters(locale);
  const storage = useHotel();
  const [page, P] = useState<Page>("Overview"),
    [calendarDate, setCalendarDate] = useState(() => new Date()),
    [modal, S] = useState<Modal | null>(null),
    [query, Q] = useState(""),
    [formError, setFormError] = useState("");
  const [guestPhoto, setGuestPhoto] = useState("");
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [editingGuest, setEditingGuest] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [guestView, setGuestView] = useState<"dogs" | "birthdays">("dogs");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [editingBooking, setEditingBooking] = useState<number | null>(null);
  const data = storage.data;
  if (!data?.hotel) throw new Error("Dashboard requires a registered hotel.");
  const { hotel, rates, guests, bookings, occupancy, capacity } = data;
  const clients = groupClients(guests);
  const visibleClients = clients.filter(client => !ownerFilter || clientKey(client.name) === ownerFilter);
  const visibleGuests = guests.filter(guest => !ownerFilter || clientKey(guest.owner) === ownerFilter);
  const birthdayNotices = useBirthdayAlerts(guests);
  const savedBooking =
    editingBooking === null ? undefined : bookings[editingBooking];
  function editBooking(booking: Booking) {
    setEditingBooking(bookings.indexOf(booking));
    S("booking");
  }
  const month = calendarDate.getMonth(),
    year = calendarDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = Date.UTC(year, month, 1);
  const monthEnd = Date.UTC(year, month + 1, 1);
  const calendarBookings = bookings.filter(booking => Date.parse(booking.start) < monthEnd
    && (booking.type === "Daycare" ? Date.parse(booking.start) + 86400000 : Date.parse(booking.end)) > monthStart);
  const calendarDogs = new Set(calendarBookings.map(booking => booking.dog));
  const calendarGuests = guests.filter(guest => calendarDogs.has(guest.name));
  const ownerInitials = initials(hotel.owner).toUpperCase();
  useEffect(() => {
    setFormError("");
    if (!modal) {
      setGuestPhoto("");
      setEditingGuest(null);
      setSelectedClient("");
      setEditingBooking(null);
    }
    if (!modal) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>(".dialog");
    dialog
      ?.querySelector<HTMLElement>("button, input, select, a[href]")
      ?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") S(null);
      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], summary",
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyboard);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [modal]);
  function moveMonth(delta: number) {
    setCalendarDate(new Date(year, month + delta, 1));
  }
  function persist<Key extends keyof HotelData>(
    key: Key,
    value: HotelData[Key],
  ) {
    storage.update(key, value);
  }
  const monthlyBookings = bookings.filter(
    (b) => +b.start.slice(0, 4) === year && +b.start.slice(5, 7) === month + 1,
  );
  const income = monthlyBookings.reduce(
    (sum, booking) => sum + booking.total,
    0,
  );
  const chart = Array.from({ length: 12 }, (_, i) => {
    return {
      name: monthName(i, true),
      value: monthlyRevenue(rates, year, i, capacity, occupancy),
    };
  });
  const total = chart[month].value;
  const filtered = bookings.filter((b) =>
    b.dog.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="app">
      <aside>
        <Brand />
        <button
          className={t("hotel")}
          onClick={() => S("profile")}
          aria-label={t("Editar perfil do hotel")}
        >
          <HotelAvatar hotel={hotel} />
          <div>
            {hotel.name}
            <small>{t("Editar perfil do hotel")}</small>
          </div>
        </button>
        <small className="navlabel">{t("ÁREA DE GESTÃO")}</small>
        <nav aria-label={t("Navegação principal")}>
          {names.map((n, i) => {
            let Icon = icons[i];
            return (
              <button
                className={page === n ? "active" : ""}
                aria-current={page === n ? "page" : undefined}
                aria-label={t(pageLabels[n])}
                onClick={() => P(n)}
                key={n}
              >
                <Icon size={19} />
                <span className="nav-desktop">{t(pageLabels[n])}</span>
                <span className="nav-mobile">
                  {
                    [
                      t("Início"),
                      t("Reservas"),
                      t("Hóspedes"),
                      t("Pagamentos"),
                      t("Preços"),
                      t("Ajustes"),
                    ][i]
                  }
                </span>
                {n === "Bookings" && <em>{bookings.length}</em>}
              </button>
            );
          })}
        </nav>
        <div className="asidebottom">
          <div className="help">
            <span>🐾</span>
            <h4>{t("Uma ajuda, muito carinho.")}</h4>
            <p>
              {t("Tudo o que precisa para gerir o seu hotel, num só lugar.")}
            </p>
            <button onClick={() => S("help")}>
              {t("Conheça a sua área de gestão")} <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">{ownerInitials}</div>
            <div>
              {hotel.owner}
              <small>{t("Gestão do hotel")}</small>
            </div>
            <Check size={16} />
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <span className="crumb">{t("Área de gestão")}</span>
            <span className="slash">/</span>
            {t(pageLabels[page])}
          </div>
          <div className="headerRight">
            <button
              className="data-trigger"
              onClick={() => S("data")}
              aria-label={t("Dados e cópias")}
            >
              <DatabaseBackup size={20} />
              <span>{t("Dados e cópias")}</span>
            </button>
            <span>
              <i /> {t("Hotel aberto")}
            </span>
            <button
              onClick={() => S("notifications")}
              aria-label={t("Notificações")}
            >
              <Bell size={19} />
              {(birthdayNotices.length > 0 || bookings.some(booking => !booking.paid)) && <b />}
            </button>
            <button
              className="profile-trigger"
              onClick={() => S("profile")}
              aria-label={t("Editar perfil do hotel")}
            >
              <HotelAvatar hotel={hotel} />
            </button>
          </div>
        </header>
        <section className="content">
          {isMobileApp && <InstallMobile />}
          <div
            className={`storage-status ${storage.error ? "storage-error" : ""}`}
          >
            <span role={storage.error ? "alert" : "status"}>
              {storage.error
                ? t(storage.error.message)
                : storage.status === "saving"
                  ? t("A guardar neste dispositivo…")
                  : t("Dados guardados neste dispositivo.")}
            </span>
            {storage.error &&
              (storage.error.status === 409 ? (
                <button onClick={() => window.location.reload()}>
                  {t("Recarregar dados")}
                </button>
              ) : (
                <button onClick={storage.retry}>
                  {t("Tentar guardar novamente")}
                </button>
              ))}
          </div>
          <div className="heading">
            <div>
              <div className="eyebrow">
                {page === "Settings"
                  ? t("O SEU HOTEL, À SUA MEDIDA")
                  : t("MUITO CARINHO. MUITAS CAUDAS A ABANAR.")}
              </div>
              <h1>
                {page === "Overview"
                  ? t("Olá, {name}", { name: hotel.owner.split(/\s+/)[0] })
                  : t(pageLabels[page])}
                <span>{page === "Overview" ? " ☀️" : ""}</span>
              </h1>
              <p>
                {page === "Overview"
                  ? t("Veja o que se passa hoje no {hotel}.", {
                      hotel: hotel.name,
                    })
                  : page === "Settings"
                    ? t("Gira o seu perfil, o hotel e a aparência do PetStay.")
                    : t("Mais tempo para eles. Menos tempo com a papelada.")}
              </p>
            </div>
            {page !== "Settings" && (
              <button
                className="primary"
                onClick={() =>
                  S(page === "Guests & clients" ? "guest" : "booking")
                }
              >
                <Plus size={18} />
                {page === "Guests & clients"
                  ? t("Adicionar hóspede")
                  : t("Nova reserva")}
              </button>
            )}
          </div>
          {page === "Settings" && (
            <SettingsPage onPricing={() => P("Pricing & seasons")} />
          )}
          {page === "Overview" && (
            <>
              {birthdayNotices.length > 0 && <div className="panel birthday-reminders" role="status"><BirthdayNotifications alerts={birthdayNotices} /></div>}
              {(guests.length === 0 ||
                rates.day === null ||
                ages.some((age) => rates[age].includes(null))) && (
                <div className="setup-checklist">
                  <div>
                    <h3>{t("Prepare o seu hotel")}</h3>
                    <p>{t("Comece com os seus dados, ao seu ritmo.")}</p>
                  </div>
                  <button onClick={() => S("guest")}>
                    <Plus size={16} /> {t("Adicionar hóspedes")}
                  </button>
                  <button onClick={() => P("Pricing & seasons")}>
                    <SlidersHorizontal size={16} /> {t("Definir preços")}
                  </button>
                </div>
              )}
              <div className="welcome">
                <div>
                  <span className="tag">{t("ESTADIAS CHEIAS DE ALEGRIA")}</span>
                  <h2>
                    {t("Corações cheios.")}
                    <br />
                    {t("Caudas a abanar.")}
                  </h2>
                  <p>{t("Conforto para eles. Tranquilidade para si.")}</p>
                  <button onClick={() => P("Bookings")}>
                    {t("Veja quem está hospedado")} <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="dogscene">
                  <span className="spark">✧</span>
                  <img src={hotelDog} alt={t("Cão de raça Golden Retriever")} />
                  <div className="dogbadge">
                    <Heart size={16} fill="#df997b" /> {t("Uma segunda casa")}
                  </div>
                </div>
              </div>
              <div className="stats">
                {[
                  [
                    t("Hóspedes este mês"),
                    monthlyBookings.length,
                    t("Cada hóspede, um novo amigo"),
                    "🐶",
                  ],
                  [
                    t("Estadias no hotel"),
                    monthlyBookings.filter((b) => b.type === "Boarding").length,
                    t("Noites tranquilas, manhãs felizes"),
                    "🌙",
                  ],
                  [
                    t("Visitas à creche"),
                    monthlyBookings.filter((b) => b.type === "Daycare").length,
                    t("Um dia inteiro de brincadeira"),
                    "☀️",
                  ],
                  [
                    t("Receita das reservas"),
                    money(income),
                    t("Das reservas deste mês"),
                    "💶",
                  ],
                ].map(([a, b, c, d]) => (
                  <div className="stat" key={a}>
                    <span>
                      {a}
                      <i>{d}</i>
                    </span>
                    <strong>{b}</strong>
                    <small>{c}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {(page === "Overview" || page === "Bookings") && (
            <div className="panel bookingpanel">
              <div className="panelheading">
                <div>
                  <h3>
                    {page === "Overview"
                      ? t("Calendário de estadias")
                      : t("Calendário de reservas")}{" "}
                    <span className="count">
                      {bookings.length}{" "}
                      {bookings.length === 1 ? t("estadia") : t("estadias")}
                    </span>
                  </h3>
                  <p>{t("Pequenas aventuras, tudo planeado.")}</p>
                </div>
                <div className="month">
                  <button
                    aria-label={t("Mês anterior")}
                    onClick={() => moveMonth(-1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {monthName(month)} {year}
                  <button
                    aria-label={t("Mês seguinte")}
                    onClick={() => moveMonth(1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              {bookings.length === 0 ? (
                <EmptyState
                  title={t("Ainda não há reservas")}
                  action={
                    guests.length
                      ? t("Criar primeira reserva")
                      : t("Adicionar primeiro hóspede")
                  }
                  onAction={() => S(guests.length ? "booking" : "guest")}
                >
                  {t("As estadias dos seus hóspedes vão aparecer aqui.")}
                </EmptyState>
              ) : (
                <div
                  className="calendar"
                  style={{ "--days": daysInMonth } as React.CSSProperties}
                >
                  <div className="calhead">
                    <span>{t("HÓSPEDE")}</span>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <div key={i}>
                        <small>
                          {weekdayShort(new Date(year, month, i + 1)).toUpperCase()}
                        </small>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {calendarGuests.map((g, i) => (
                    <div className="calrow" key={g.name}>
                      <div className="guestcell">
                        <span className="guest-avatar">
                          {g.photo ? (
                            <img src={g.photo} alt={g.name} />
                          ) : (
                            <PawPrint size={18} />
                          )}
                        </span>
                        <div>
                          {g.deceased && <MemorialCross />}{g.name}
                          <small>{breedLabel(g.breed, t)}</small>
                        </div>
                      </div>
                      <div className="track">
                        {calendarBookings
                          .filter(
                            (b) =>
                              b.dog === g.name,
                          )
                          .map((b, j) => (
                            <button
                              key={j}
                              className={"stay stay" + i}
                              style={{
                                left: `${(Math.max(0, (Date.parse(b.start) - monthStart) / 86400000) * 100) / daysInMonth}%`,
                                width: `${(((Math.min(monthEnd, b.type === "Daycare" ? Date.parse(b.start) + 86400000 : Date.parse(b.end)) - Math.max(monthStart, Date.parse(b.start))) / 86400000) * 100) / daysInMonth}%`,
                              }}
                              onClick={() => editBooking(b)}
                            >
                              {b.type === "Daycare" ? "☀" : "☾"}{" "}
                              {t(stayLabels[b.type] ?? b.type)}
                              <span>{b.paid ? t("Pago") : t("Pendente")}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                  {!calendarGuests.length && <p className="hint">{t("Sem reservas neste mês.")}</p>}
                </div>
              )}
              <div className="legend">
                <span>
                  <i /> {t("Hotel")}
                </span>
                <span>
                  <i /> {t("Creche")}
                </span>
                <button onClick={() => P("Bookings")}>
                  {t("Ver todas as reservas")} <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          )}
          {page === "Guests & clients" && <>
            <div className="guest-view-switch" role="group" aria-label={t("Vista dos hóspedes")}>
              <button className="secondary" aria-pressed={guestView === "dogs"} onClick={() => setGuestView("dogs")}>{t("Lista de hóspedes")}</button>
              <button className="secondary" aria-pressed={guestView === "birthdays"} onClick={() => setGuestView("birthdays")}>{t("Aniversários")}</button>
            </div>
            <label className="owner-filter">{t("Filtrar por tutor")}
              <select aria-label={t("Filtrar por tutor")} value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
                <option value="">{t("Todos os tutores")}</option>
                {clients.map(client => <option key={clientKey(client.name)} value={clientKey(client.name)}>{client.name}</option>)}
              </select>
            </label>
            {guestView === "birthdays" && <BirthdaysCalendar guests={visibleGuests} />}
          </>}
          {page === "Guests & clients" && guestView === "dogs" &&
            (guests.length === 0 ? (
              <div className="panel">
                <EmptyState
                  title={t("O primeiro amigo está por chegar")}
                  action={t("Adicionar primeiro hóspede")}
                  onAction={() => S("guest")}
                >
                  {t(
                    "Adicione o nome, o tutor e os dados do seu primeiro hóspede.",
                  )}
                </EmptyState>
              </div>
            ) : (
              <div className="client-list">
                {visibleClients.map((client) => (
                  <section
                    className="client-group"
                    key={clientKey(client.name)}
                    aria-label={client.name}
                  >
                    <div className="panelheading">
                      <div>
                        <h3>{client.name}</h3>
                        <p>
                          {t("{count} cães", { count: client.dogs.length })}
                        </p>
                      </div>
                      <button
                        className="secondary"
                        onClick={() => {
                          setSelectedClient(client.name);
                          S("guest");
                        }}
                      >
                        {t("Adicionar cão a este cliente")}
                      </button>
                    </div>
                    <div className="guestgrid">
                      {client.dogs.map((g) => (
                        <div className="panel guestcard" key={g.name}>
                          <span className="guest-avatar guest-avatar-large">
                            {g.photo ? (
                              <img src={g.photo} alt={g.name} />
                            ) : (
                              <PawPrint size={32} />
                            )}
                          </span>
                          <h3>{g.deceased && <MemorialCross />}{g.name}</h3>
                          {g.deceased && <p className="softtag">{t("Falecido")}</p>}
                          {g.birthDate && !g.deceased && (
                            <p>
                              {t(
                                "Idade: {years} anos e {months} meses · {group}",
                                {
                                  years: Math.floor(
                                    ageInMonths(g.birthDate) / 12,
                                  ),
                                  months: ageInMonths(g.birthDate) % 12,
                                  group: t(ageLabels[guestAgeGroup(g)]),
                                },
                              )}
                            </p>
                          )}
                          <p>
                            {breedLabel(g.breed, t)} ·{" "}
                            {t(ageLabels[guestAgeGroup(g)])}
                          </p>
                          <hr />
                          <small>{t("TUTOR")}</small>
                          <h4>{g.owner}</h4>
                          <p>
                            {g.neutered === undefined
                              ? t("Castração por indicar")
                              : g.neutered
                                ? t("Castrado")
                                : t("Não castrado")}
                          </p>
                          <button
                            className="secondary"
                            onClick={() => {
                              setEditingGuest(g.name);
                              setGuestPhoto(g.photo ?? "");
                              S("guest");
                            }}
                          >
                            {t("Editar hóspede")}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ))}
          {(page === "Payments" || page === "Bookings") && (
            <div className="panel">
              <div className="panelheading">
                <h3>
                  {page === "Payments"
                    ? t("Pagamentos e saldos")
                    : t("Todas as reservas")}
                </h3>
                <label className="search">
                  <Search size={16} />
                  <input
                    aria-label={t("Procurar hóspede")}
                    placeholder={t("Procurar hóspede…")}
                    value={query}
                    onChange={(e) => Q(e.target.value)}
                  />
                </label>
              </div>
              <table className="records-table">
                <thead>
                  <tr>
                    <th>{t("Hóspede")}</th>
                    <th>{t("Estadia")}</th>
                    <th>{t("Datas")}</th>
                    <th>{t("Total")}</th>
                    <th>{t("Pagamento")}</th>
                    <th>{t("Editar reserva")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          title={
                            bookings.length
                              ? t("Nenhum resultado")
                              : page === "Payments"
                                ? t("Ainda não há pagamentos")
                                : t("Ainda não há reservas")
                          }
                          action={
                            bookings.length
                              ? t("Limpar pesquisa")
                              : t("Criar reserva")
                          }
                          onAction={() =>
                            bookings.length ? Q("") : S("booking")
                          }
                        >
                          {bookings.length
                            ? t("Experimente procurar outro hóspede.")
                            : t(
                                "Os registos aparecem aqui depois de criar a primeira reserva.",
                              )}
                        </EmptyState>
                      </td>
                    </tr>
                  )}
                  {filtered.map((b, i) => (
                    <tr key={i}>
                      <td data-label={t("Hóspede")}>
                        <strong>{b.dog}</strong>
                      </td>
                      <td data-label={t("Estadia")}>
                        {t(stayLabels[b.type] ?? b.type)}
                      </td>
                      <td data-label={t("Datas")} className="record-dates">
                        {formatDate(b.start)} → {formatDate(b.end)}
                      </td>
                      <td data-label={t("Total")}>{money(b.total)}</td>
                      <td data-label={t("Pagamento")}>
                        <button
                          className={b.paid ? "paid" : "pending"}
                          onClick={() =>
                            persist(
                              "bookings",
                              bookings.map((x) =>
                                x === b ? { ...x, paid: !x.paid } : x,
                              ),
                            )
                          }
                        >
                          {b.paid ? t("✓ Pago") : t("Marcar como pago")}
                        </button>
                      </td>
                      <td data-label={t("Editar reserva")}>
                        <button
                          className="secondary"
                          onClick={() => editBooking(b)}
                          aria-label={t("Editar reserva de {name}", {
                            name: b.dog,
                          })}
                        >
                          {t("Editar reserva")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {page === "Pricing & seasons" && (
            <div className="panel">
              <div className="panelheading">
                <div>
                  <h3>{t("Um preço justo para cada hóspede")}</h3>
                  <p>
                    {t(
                      "Preços do hotel por noite. Cachorro: menos de 1 ano · Adulto: 1–7 anos · Sénior: 8 ou mais anos.",
                    )}
                  </p>
                </div>
              </div>
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>{t("Faixa etária")}</th>
                    <th>{t("Época baixa (€)")}</th>
                    <th>{t("Época alta (€)")}</th>
                    <th>{t("Época de Natal (€)")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ages.map((a) => (
                    <tr key={a}>
                      <td>{t(ageLabels[a])}</td>
                      {([0, 1, 2] as const).map((i) => (
                        <td key={i}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rates[a][i] ?? ""}
                            placeholder={t("Por definir")}
                            aria-label={t(
                              i === 2
                                ? "Preço de {age} — época de Natal"
                                : i
                                  ? "Preço de {age} — época alta"
                                  : "Preço de {age} — época baixa",
                              { age: t(ageLabels[a]) },
                            )}
                            onChange={(e) => {
                              const prices = [...rates[a]];
                              prices[i] =
                                e.target.value === ""
                                  ? null
                                  : Math.max(0, +e.target.value);
                              persist("rates", {
                                ...rates,
                                [a]: [prices[0], prices[1], prices[2] ?? null],
                              });
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="season">
                <h4>
                  {t("Preço diário da creche")}{" "}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rates.day ?? ""}
                    placeholder={t("Por definir")}
                    aria-label={t("Preço diário da creche")}
                    onChange={(e) =>
                      persist("rates", {
                        ...rates,
                        day:
                          e.target.value === ""
                            ? null
                            : Math.max(0, +e.target.value),
                      })
                    }
                  />{" "}
                  €
                </h4>
                <SeasonEditor
                  christmas
                  ranges={rates.christmas ?? []}
                  onChange={(christmas) =>
                    persist("rates", { ...rates, christmas })
                  }
                />
                <SeasonEditor
                  ranges={rates.high}
                  onChange={(high) => persist("rates", { ...rates, high })}
                />
              </div>
            </div>
          )}
          {(page === "Overview" || page === "Pricing & seasons") && (
            <div className="bottomgrid">
              <div className="panel earnings">
                <div className="panelheading">
                  <div>
                    <h3>
                      {t("Um olhar sobre o potencial")} <span>↗</span>
                    </h3>
                    <p>{t("Simulador de receita mensal")}</p>
                  </div>
                  <span className="softtag">
                    {t("Projeção para {year}", { year })}
                  </span>
                </div>
                <div className="simcontrols">
                  <label>
                    {t("Vagas")}{" "}
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={capacity}
                      onChange={(e) =>
                        persist(
                          "capacity",
                          Math.min(100, Math.max(1, +e.target.value)),
                        )
                      }
                    />
                  </label>
                  <label>
                    {t("Ocupação")} <strong>{occupancy}%</strong>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={occupancy}
                      onChange={(e) => persist("occupancy", +e.target.value)}
                    />
                  </label>
                  <div>
                    <strong>
                      {total === null ? t("Por definir") : money(total)}
                    </strong>
                    <small>
                      {t("{month} · estimativa de hotel para adultos", {
                        month: chart[month].name,
                      })}
                    </small>
                  </div>
                </div>
                {total === null ? (
                  <EmptyState
                    title={t("O seu simulador começa com os seus preços")}
                    action={t("Definir preços")}
                    onAction={() => P("Pricing & seasons")}
                  >
                    {t(
                      "Defina o preço de hotel para adultos para calcular uma estimativa.",
                    )}
                  </EmptyState>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                      data={chart}
                      margin={{ left: 0, right: 20, top: 15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--chart)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--chart)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="var(--line)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "var(--muted)" }}
                      />
                      <YAxis
                        tickFormatter={shortMoney}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted)" }}
                      />
                      <Tooltip
                        formatter={(value) => money(Number(value))}
                        contentStyle={{
                          background: "var(--surface)",
                          borderColor: "var(--line)",
                          color: "var(--text)",
                        }}
                        itemStyle={{ color: "var(--accent-text)" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name={t("Receita estimada")}
                        stroke="var(--chart)"
                        strokeWidth={2.5}
                        fill="url(#green)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="seasoncard">
                <Sun size={28} />
                <span>{t("PLANEIE COM TRANQUILIDADE")}</span>
                <h3>
                  {t("Cada época")}
                  <br />
                  {t("tem o seu encanto.")}
                </h3>
                <p>
                  {t(
                    "Defina os preços para os verões mais concorridos e os dias tranquilos. Nós fazemos as contas.",
                  )}
                </p>
                <button onClick={() => P("Pricing & seasons")}>
                  {t("Gerir preços por época")} <ArrowUpRight size={17} />
                </button>
              </div>
            </div>
          )}
          <footer>
            {t("Feito com carinho, para os nossos patudos.")}{" "}
            <PawPrint size={13} />
            <span>
              {hotel.name} · PetStay{" "}
              <span className="app-version">
                v{import.meta.env.VITE_APP_VERSION}
              </span>
            </span>
          </footer>
        </section>
      </main>
      {modal && (
        <div className="overlay">
          <div
            className={`dialog ${modal === "guest" ? "dog-profile-dialog" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            <button
              className="close"
              onClick={() => S(null)}
              aria-label={t("Fechar")}
            >
              <X />
            </button>
            <h2 id="dialog-title">
              {modal === "guest"
                ? t("Um novo amigo de quatro patas")
                : modal === "booking"
                  ? t(
                      savedBooking
                        ? "Editar reserva"
                        : "Planear uma boa estadia",
                    )
                  : modal === "profile"
                    ? t("Perfil do hotel")
                    : modal === "data"
                      ? t("Dados e cópias")
                      : modal === "help"
                        ? t("Bem-vindo ao PetStay")
                        : t("Novidades do seu hotel")}
            </h2>
            {modal === "notifications" ? (
              <>
                <BirthdayNotifications alerts={birthdayNotices} />
                <p>{t(bookings.filter(booking => !booking.paid).length === 1
                  ? "{count} reserva tem pagamentos pendentes. Aceda a Pagamentos para registar um pagamento."
                  : "{count} reservas têm pagamentos pendentes. Aceda a Pagamentos para registar um pagamento.", { count: bookings.filter(booking => !booking.paid).length })}</p>
              </>
            ) : modal === "data" ? (
              <DataTransfer />
            ) : modal === "profile" ? (
              <HotelProfileForm
                initial={hotel}
                onSubmit={(profile) => {
                  persist("hotel", profile);
                  S(null);
                }}
              />
            ) : modal === "booking" && guests.length === 0 ? (
              <EmptyState
                title={t("Vamos conhecer o primeiro hóspede")}
                action={t("Adicionar hóspede")}
                onAction={() => S("guest")}
              >
                {t(
                  "Adicione um hóspede e o respetivo tutor antes de criar a reserva.",
                )}
              </EmptyState>
            ) : ["guest", "booking"].includes(modal) ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fields = new FormData(e.currentTarget);
                  const field = (name: string): string => {
                    const value = fields.get(name);
                    return typeof value === "string" ? value : "";
                  };
                  if (readingPhoto) return;
                  if (modal === "guest") {
                    const birthDate = field("birthDate");
                    if (
                      birthDate &&
                      (!isBirthDate(birthDate) || ageInMonths(birthDate) < 0)
                    ) {
                      setFormError(
                        "Indique uma data de nascimento válida, até hoje.",
                      );
                      return;
                    }
                    const age = birthDate
                      ? ageGroupFromBirth(birthDate)
                      : field("age");
                    if (!isAgeGroup(age)) return;
                    if (
                      guests.some(
                        (g) =>
                          g.name === field("name") && g.name !== editingGuest,
                      )
                    ) {
                      setFormError("Já existe um hóspede com este nome.");
                      return;
                    }
                    persist("guests", [
                      ...guests.filter((g) => g.name !== editingGuest),
                      {
                        name: field("name"),
                        owner:
                          clients.find(
                            (client) =>
                              clientKey(client.name) ===
                              clientKey(field("owner")),
                          )?.name ?? field("owner").trim().replace(/\s+/g, " "),
                        breed: field("breed"),
                        age,
                        birthDate: birthDate || undefined,
                        photo: guestPhoto,
                        deceased: field("deceased") === "on",
                        neutered:
                          field("neutered") === ""
                            ? undefined
                            : field("neutered") === "yes",
                      },
                    ]);
                    if (editingGuest)
                      persist(
                        "bookings",
                        bookings.map((b) =>
                          b.dog === editingGuest
                            ? { ...b, dog: field("name") }
                            : b,
                        ),
                      );
                  } else {
                    const dog = field("dog"),
                      start = field("start"),
                      end = field("end"),
                      type = field("type");
                    if (!isStayType(type)) return;
                    const priceOptions = {
                      customTotal: field("customTotal") === "" ? undefined : Number(field("customTotal")),
                      customRate: field("customRate") === "" ? undefined : Number(field("customRate")),
                      discountPercent: field("discountPercent") === "" ? 0 : Number(field("discountPercent")),
                      intactSurcharge: field("intactSurcharge") === "on",
                    };
                    let total;
                    try {
                      total = bookingPrice(data, dog, start, end, type, priceOptions);
                    } catch (error) {
                      setFormError(asStorageError(error).message);
                      return;
                    }
                    const updatedBooking: Booking = {
                      dog,
                      start,
                      type,
                      end: type === "Daycare" ? start : end,
                      total,
                      ...priceOptions,
                      paid: savedBooking?.paid ?? false,
                    };
                    persist(
                      "bookings",
                      editingBooking === null
                        ? [...bookings, updatedBooking]
                        : bookings.map((booking, index) =>
                            index === editingBooking ? updatedBooking : booking,
                          ),
                    );
                  }
                  S(null);
                }}
              >
                {modal === "guest" ? (
                  <GuestProfileFields guest={guests.find(g => g.name === editingGuest)} clients={clients.map(client => client.name)} initialClient={selectedClient} photo={guestPhoto} reading={readingPhoto} onPhoto={setGuestPhoto} onReading={setReadingPhoto} onError={setFormError} />
                ) : (
                  <>
                    <label>
                      {t("Hóspede")}
                      <select
                        name="dog"
                        required
                        defaultValue={savedBooking?.dog}
                      >
                        {guests.map((g) => (
                          <option key={g.name}>{g.name}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="textbutton"
                      onClick={() => S("guest")}
                    >
                      {t("+ Adicionar primeiro um novo hóspede")}
                    </button>
                    <label>
                      {t("Tipo de estadia")}
                      <select name="type" defaultValue={savedBooking?.type}>
                        <option value="Boarding">{t("Hotel")}</option>
                        <option value="Daycare">{t("Creche")}</option>
                      </select>
                    </label>
                    <label>
                      {t("Data de entrada / dia de creche")}
                      <input
                        type="date"
                        name="start"
                        required
                        defaultValue={savedBooking?.start ?? localDate()}
                      />
                    </label>
                    <label>
                      {t("Data de saída (hotel)")}
                      <input
                        type="date"
                        name="end"
                        defaultValue={savedBooking?.end ?? localDate(1)}
                      />
                    </label>
                    <BookingPriceFields
                      initialTotal={savedBooking?.customTotal}
                      initialRate={savedBooking?.customRate}
                      initialDiscount={savedBooking?.discountPercent}
                    />
                    <label>
                      <input
                        type="checkbox"
                        name="intactSurcharge"
                        defaultChecked={savedBooking?.intactSurcharge}
                      />{" "}
                      {t("Aplicar +2 € por noite/dia se não for castrado")}
                    </label>
                    <p className="hint">
                      {t(
                        "O hotel é cobrado por noite, de acordo com a época e a faixa etária do cão. A creche tem um preço diário.",
                      )}
                    </p>
                  </>
                )}
                {formError && (
                  <div className="form-error" role="alert">
                    <p>{t(formError)}</p>
                    <button
                      type="button"
                      className="textbutton"
                      onClick={() => {
                        S(null);
                        P("Pricing & seasons");
                      }}
                    >
                      {t("Definir preços")}
                    </button>
                  </div>
                )}
                <button
                  className="primary"
                  type="submit"
                  disabled={readingPhoto}
                >
                  {modal === "guest"
                    ? t("Guardar hóspede")
                    : t(savedBooking ? "Guardar reserva" : "Criar reserva")}
                </button>
              </form>
            ) : (
              <p>
                {modal === "help"
                  ? `${t("Adicione os hóspedes, defina os preços por época e crie uma reserva. Acompanhe os saldos em Pagamentos e explore a receita potencial no simulador.")} ${t(isMobileApp ? "Os dados ficam guardados neste navegador, no telemóvel. Exporte cópias regularmente em Dados e cópias." : "Os dados ficam guardados num ficheiro neste dispositivo. Use Dados e cópias para transferir o hotel para o telemóvel.")}`
                  : t(
                      bookings.filter((b) => !b.paid).length === 1
                        ? "{count} reserva tem pagamentos pendentes. Aceda a Pagamentos para registar um pagamento."
                        : "{count} reservas têm pagamentos pendentes. Aceda a Pagamentos para registar um pagamento.",
                      { count: bookings.filter((b) => !b.paid).length },
                    )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
