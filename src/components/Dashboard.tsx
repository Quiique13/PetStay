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
import type { HotelData } from "../types.ts";
import { Brand } from "./Brand.tsx";
import { HotelAvatar } from "./HotelAvatar.tsx";
import { HotelProfileForm } from "./HotelProfileForm.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { DataTransfer } from "./DataTransfer.tsx";
import { InstallMobile } from "./InstallMobile.tsx";
import { isMobileApp } from "../services/storage-mode.ts";
import hotelDog from "../assets/hotel-dog.jpg";
import {
  money,
  initials,
  localDate,
  shortMoney,
  formatDate,
  monthName,
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
] as const;
type Page = typeof names[number];
type Modal = "profile" | "help" | "notifications" | "guest" | "booking" | "data";
const ages = ["Puppy", "Adult", "Senior"] as const;
const icons = [LayoutDashboard, CalendarDays, Heart, Wallet, SlidersHorizontal];
export default function Dashboard() {
  const storage = useHotel();
  const [page, P] = useState<Page>("Overview"),
    [calendarDate, setCalendarDate] = useState(() => new Date()),
    [modal, S] = useState<Modal | null>(null),
    [query, Q] = useState(""),
    [formError, setFormError] = useState("");
  const data = storage.data;
  if (!data?.hotel) throw new Error("Dashboard requires a registered hotel.");
  const { hotel, rates, guests, bookings, occupancy, capacity } = data;
  const month = calendarDate.getMonth(),
    year = calendarDate.getFullYear();
  const ownerInitials = initials(hotel.owner).toUpperCase();
  useEffect(() => {
    setFormError("");
    if (!modal) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>(".dialog");
    dialog?.querySelector<HTMLElement>("button, input, select, a[href]")?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") S(null);
      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], summary'))
        .filter(element => element.getClientRects().length > 0);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyboard);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [modal]);
  function moveMonth(delta: number) {
    setCalendarDate(new Date(year, month + delta, 1));
  }
  function persist<Key extends keyof HotelData>(key: Key, value: HotelData[Key]) {
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
    const rate = rates.Adult[rates.high.includes(i) ? 1 : 0];
    return {
      name: monthName(i, true),
      value:
        rate === null
          ? null
          : Math.round(
              ((new Date(year, i + 1, 0).getDate() * capacity * occupancy) /
                100) *
                rate,
            ),
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
          className="hotel"
          onClick={() => S("profile")}
          aria-label="Editar perfil do hotel"
        >
          <HotelAvatar hotel={hotel} />
          <div>
            {hotel.name}
            <small>Editar perfil do hotel</small>
          </div>
        </button>
        <small className="navlabel">ÁREA DE GESTÃO</small>
        <nav aria-label="Navegação principal">
          {names.map((n, i) => {
            let Icon = icons[i];
            return (
              <button
                className={page === n ? "active" : ""}
                aria-current={page === n ? "page" : undefined}
                aria-label={pageLabels[n]}
                onClick={() => P(n)}
                key={n}
              >
                <Icon size={19} />
                <span className="nav-desktop">{pageLabels[n]}</span>
                <span className="nav-mobile">{["Início", "Reservas", "Hóspedes", "Pagamentos", "Preços"][i]}</span>
                {n === "Bookings" && <em>{bookings.length}</em>}
              </button>
            );
          })}
        </nav>
        <div className="asidebottom">
          <div className="help">
            <span>🐾</span>
            <h4>Uma ajuda, muito carinho.</h4>
            <p>Tudo o que precisa para gerir o seu hotel, num só lugar.</p>
            <button onClick={() => S("help")}>
              Conheça a sua área de gestão <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">{ownerInitials}</div>
            <div>
              {hotel.owner}
              <small>Gestão do hotel</small>
            </div>
            <Check size={16} />
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <span className="crumb">Área de gestão</span>
            <span className="slash">/</span>
            {pageLabels[page]}
          </div>
          <div className="headerRight">
            <button className="data-trigger" onClick={() => S("data")} aria-label="Dados e cópias"><DatabaseBackup size={20} /><span>Dados e cópias</span></button>
            <span>
              <i /> Hotel aberto
            </span>
            <button
              onClick={() => S("notifications")}
              aria-label="Notificações"
            >
              <Bell size={19} />
              <b />
            </button>
            <button
              className="profile-trigger"
              onClick={() => S("profile")}
              aria-label="Editar perfil do hotel"
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
                ? storage.error.message
                : storage.status === "saving"
                  ? "A guardar neste dispositivo…"
                  : "Dados guardados neste dispositivo."}
            </span>
            {storage.error &&
              (storage.error.status === 409 ? (
                <button onClick={() => window.location.reload()}>
                  Recarregar dados
                </button>
              ) : (
                <button onClick={storage.retry}>
                  Tentar guardar novamente
                </button>
              ))}
          </div>
          <div className="heading">
            <div>
              <div className="eyebrow">
                MUITO CARINHO. MUITAS CAUDAS A ABANAR.
              </div>
              <h1>
                {page === "Overview"
                  ? `Olá, ${hotel.owner.split(/\s+/)[0]}`
                  : pageLabels[page]}
                <span>{page === "Overview" ? " ☀️" : ""}</span>
              </h1>
              <p>
                {page === "Overview"
                  ? `Veja o que se passa hoje no ${hotel.name}.`
                  : "Mais tempo para eles. Menos tempo com a papelada."}
              </p>
            </div>
            <button
              className="primary"
              onClick={() =>
                S(page === "Guests & clients" ? "guest" : "booking")
              }
            >
              <Plus size={18} />
              {page === "Guests & clients"
                ? "Adicionar hóspede"
                : "Nova reserva"}
            </button>
          </div>
          {page === "Overview" && (
            <>
              {(guests.length === 0 ||
                rates.day === null ||
                ages.some((age) => rates[age].includes(null))) && (
                <div className="setup-checklist">
                  <div>
                    <h3>Prepare o seu hotel</h3>
                    <p>Comece com os seus dados, ao seu ritmo.</p>
                  </div>
                  <button onClick={() => S("guest")}>
                    <Plus size={16} /> Adicionar hóspedes
                  </button>
                  <button onClick={() => P("Pricing & seasons")}>
                    <SlidersHorizontal size={16} /> Definir preços
                  </button>
                </div>
              )}
              <div className="welcome">
                <div>
                  <span className="tag">ESTADIAS CHEIAS DE ALEGRIA</span>
                  <h2>
                    Corações cheios.
                    <br />
                    Caudas a abanar.
                  </h2>
                  <p>Conforto para eles. Tranquilidade para si.</p>
                  <button onClick={() => P("Bookings")}>
                    Veja quem está hospedado <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="dogscene">
                  <span className="spark">✧</span>
                  <img
                    src={hotelDog}
                    alt="Cão de raça Golden Retriever"
                  />
                  <div className="dogbadge">
                    <Heart size={16} fill="#df997b" /> Uma segunda casa
                  </div>
                </div>
              </div>
              <div className="stats">
                {[
                  [
                    "Hóspedes este mês",
                    monthlyBookings.length,
                    "Cada hóspede, um novo amigo",
                    "🐶",
                  ],
                  [
                    "Estadias no hotel",
                    monthlyBookings.filter((b) => b.type === "Boarding").length,
                    "Noites tranquilas, manhãs felizes",
                    "🌙",
                  ],
                  [
                    "Visitas à creche",
                    monthlyBookings.filter((b) => b.type === "Daycare").length,
                    "Um dia inteiro de brincadeira",
                    "☀️",
                  ],
                  [
                    "Receita das reservas",
                    money(income),
                    "Das reservas deste mês",
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
                      ? "Calendário de estadias"
                      : "Calendário de reservas"}{" "}
                    <span className="count">
                      {bookings.length}{" "}
                      {bookings.length === 1 ? "estadia" : "estadias"}
                    </span>
                  </h3>
                  <p>Pequenas aventuras, tudo planeado.</p>
                </div>
                <div className="month">
                  <button
                    aria-label="Mês anterior"
                    onClick={() => moveMonth(-1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {monthName(month)} {year}
                  <button
                    aria-label="Mês seguinte"
                    onClick={() => moveMonth(1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              {bookings.length === 0 ? (
                <EmptyState
                  title="Ainda não há reservas"
                  action={
                    guests.length
                      ? "Criar primeira reserva"
                      : "Adicionar primeiro hóspede"
                  }
                  onAction={() => S(guests.length ? "booking" : "guest")}
                >
                  As estadias dos seus hóspedes vão aparecer aqui.
                </EmptyState>
              ) : (
                <div className="calendar">
                  <div className="calhead">
                    <span>HÓSPEDE</span>
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i}>
                        <small>
                          {new Date(year, month, i + 1)
                            .toLocaleDateString("pt-PT", { weekday: "short" })
                            .toUpperCase()}
                        </small>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {guests.slice(0, 4).map((g, i) => (
                    <div className="calrow" key={g.name}>
                      <div className="guestcell">
                        <span className="guest-avatar">
                          <PawPrint size={18} />
                        </span>
                        <div>
                          {g.name}
                          <small>{breedLabel(g.breed)}</small>
                        </div>
                      </div>
                      <div className="track">
                        {bookings
                          .filter(
                            (b) =>
                              b.dog === g.name &&
                              +b.start.slice(0, 4) === year &&
                              +b.start.slice(5, 7) === month + 1 &&
                              +b.start.slice(8) <= 7,
                          )
                          .map((b, j) => (
                            <button
                              key={j}
                              className={"stay stay" + i}
                              style={{
                                left: `${(Math.max(0, +b.start.slice(8) - 1) * 100) / 7}%`,
                                width: `${(Math.min(7, Math.max(1, (new Date(b.end).getTime() - new Date(b.start).getTime()) / 86400000)) * 100) / 7}%`,
                              }}
                              onClick={() => P("Payments")}
                            >
                              {b.type === "Daycare" ? "☀" : "☾"}{" "}
                              {stayLabels[b.type] ?? b.type}
                              <span>{b.paid ? "Pago" : "Pendente"}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="legend">
                <span>
                  <i /> Hotel
                </span>
                <span>
                  <i /> Creche
                </span>
                <button onClick={() => P("Bookings")}>
                  Ver todas as reservas <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          )}
          {page === "Guests & clients" &&
            (guests.length === 0 ? (
              <div className="panel">
                <EmptyState
                  title="O primeiro amigo está por chegar"
                  action="Adicionar primeiro hóspede"
                  onAction={() => S("guest")}
                >
                  Adicione o nome, o tutor e os dados do seu primeiro hóspede.
                </EmptyState>
              </div>
            ) : (
              <div className="guestgrid">
                {guests.map((g) => (
                  <div className="panel guestcard" key={g.name}>
                    <span className="guest-avatar guest-avatar-large">
                      <PawPrint size={32} />
                    </span>
                    <h3>{g.name}</h3>
                    <p>
                      {breedLabel(g.breed)} · {ageLabels[g.age] ?? g.age}
                    </p>
                    <hr />
                    <small>TUTOR</small>
                    <h4>{g.owner}</h4>
                  </div>
                ))}
              </div>
            ))}
          {(page === "Payments" || page === "Bookings") && (
            <div className="panel">
              <div className="panelheading">
                <h3>
                  {page === "Payments"
                    ? "Pagamentos e saldos"
                    : "Todas as reservas"}
                </h3>
                <label className="search">
                  <Search size={16} />
                  <input
                    aria-label="Procurar hóspede"
                    placeholder="Procurar hóspede…"
                    value={query}
                    onChange={(e) => Q(e.target.value)}
                  />
                </label>
              </div>
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Hóspede</th>
                    <th>Estadia</th>
                    <th>Datas</th>
                    <th>Total</th>
                    <th>Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState
                          title={
                            bookings.length
                              ? "Nenhum resultado"
                              : page === "Payments"
                                ? "Ainda não há pagamentos"
                                : "Ainda não há reservas"
                          }
                          action={
                            bookings.length
                              ? "Limpar pesquisa"
                              : "Criar reserva"
                          }
                          onAction={() =>
                            bookings.length ? Q("") : S("booking")
                          }
                        >
                          {bookings.length
                            ? "Experimente procurar outro hóspede."
                            : "Os registos aparecem aqui depois de criar a primeira reserva."}
                        </EmptyState>
                      </td>
                    </tr>
                  )}
                  {filtered.map((b, i) => (
                    <tr key={i}>
                      <td data-label="Hóspede">
                        <strong>{b.dog}</strong>
                      </td>
                      <td data-label="Estadia">{stayLabels[b.type] ?? b.type}</td>
                      <td data-label="Datas" className="record-dates">
                        {formatDate(b.start)} → {formatDate(b.end)}
                      </td>
                      <td data-label="Total">{money(b.total)}</td>
                      <td data-label="Pagamento">
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
                          {b.paid ? "✓ Pago" : "Marcar como pago"}
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
                  <h3>Um preço justo para cada hóspede</h3>
                  <p>
                    Preços do hotel por noite. Cachorro: menos de 1 ano ·
                    Adulto: 1–7 anos · Sénior: 8 ou mais anos.
                  </p>
                </div>
              </div>
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Faixa etária</th>
                    <th>Época baixa (€)</th>
                    <th>Época alta (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {ages.map((a) => (
                    <tr key={a}>
                      <td>{ageLabels[a]}</td>
                      {([0, 1] as const).map((i) => (
                        <td key={i}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rates[a][i] ?? ""}
                            placeholder="Por definir"
                            aria-label={`Preço de ${ageLabels[a]} — época ${i ? "alta" : "baixa"}`}
                            onChange={(e) => {
                              const prices = [...rates[a]];
                              prices[i] = e.target.value === "" ? null : Math.max(0, +e.target.value);
                              persist("rates", {
                                ...rates,
                                [a]: [prices[0], prices[1]],
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
                  Preço diário da creche{" "}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rates.day ?? ""}
                    placeholder="Por definir"
                    aria-label="Preço diário da creche"
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
                <h4>Escolha os meses de época alta</h4>
                <p>
                  Os restantes meses usam os preços de época baixa. As
                  alterações são guardadas automaticamente.
                </p>
                <div className="months">
                  {chart.map((c, i) => (
                    <button
                      key={i}
                      className={rates.high.includes(i) ? "selected" : ""}
                      onClick={() =>
                        persist("rates", {
                          ...rates,
                          high: rates.high.includes(i)
                            ? rates.high.filter((m) => m !== i)
                            : [...rates.high, i],
                        })
                      }
                    >
                      {c.name} {rates.high.includes(i) && "☀"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {(page === "Overview" || page === "Pricing & seasons") && (
            <div className="bottomgrid">
              <div className="panel earnings">
                <div className="panelheading">
                  <div>
                    <h3>
                      Um olhar sobre o potencial <span>↗</span>
                    </h3>
                    <p>Simulador de receita mensal</p>
                  </div>
                  <span className="softtag">Projeção para {year}</span>
                </div>
                <div className="simcontrols">
                  <label>
                    Vagas{" "}
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
                    Ocupação <strong>{occupancy}%</strong>
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
                      {total === null ? "Por definir" : money(total)}
                    </strong>
                    <small>
                      {chart[month].name} · estimativa de hotel para adultos
                    </small>
                  </div>
                </div>
                {total === null ? (
                  <EmptyState
                    title="O seu simulador começa com os seus preços"
                    action="Definir preços"
                    onAction={() => P("Pricing & seasons")}
                  >
                    Defina o preço de hotel para adultos para calcular uma
                    estimativa.
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
                            stopColor="#8ca98c"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="#8ca98c"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#eeeee7" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#959b91" }}
                      />
                      <YAxis
                        tickFormatter={shortMoney}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#959b91" }}
                      />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Receita estimada"
                        stroke="#628268"
                        strokeWidth={2.5}
                        fill="url(#green)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="seasoncard">
                <Sun size={28} />
                <span>PLANEIE COM TRANQUILIDADE</span>
                <h3>
                  Cada época
                  <br />
                  tem o seu encanto.
                </h3>
                <p>
                  Defina os preços para os verões mais concorridos e os dias
                  tranquilos. Nós fazemos as contas.
                </p>
                <button onClick={() => P("Pricing & seasons")}>
                  Gerir preços por época <ArrowUpRight size={17} />
                </button>
              </div>
            </div>
          )}
          <footer>
            Feito com carinho, para os nossos patudos. <PawPrint size={13} />{" "}
            <span>{hotel.name} · PetStay</span>
          </footer>
        </section>
      </main>
      {modal && (
        <div className="overlay">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button
              className="close"
              onClick={() => S(null)}
              aria-label="Fechar"
            >
              <X />
            </button>
            <h2 id="dialog-title">
              {modal === "guest"
                ? "Um novo amigo de quatro patas"
                : modal === "booking"
                  ? "Planear uma boa estadia"
                  : modal === "profile"
                    ? "Perfil do hotel"
                    : modal === "data"
                      ? "Dados e cópias"
                    : modal === "help"
                      ? "Bem-vindo ao PetStay"
                      : "Novidades do seu hotel"}
            </h2>
            {modal === "data" ? <DataTransfer /> : modal === "profile" ? (
              <HotelProfileForm
                initial={hotel}
                onSubmit={(profile) => {
                  persist("hotel", profile);
                  S(null);
                }}
              />
            ) : modal === "booking" && guests.length === 0 ? (
              <EmptyState
                title="Vamos conhecer o primeiro hóspede"
                action="Adicionar hóspede"
                onAction={() => S("guest")}
              >
                Adicione um hóspede e o respetivo tutor antes de criar a
                reserva.
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
                  if (modal === "guest") {
                    const age = field("age");
                    if (!isAgeGroup(age)) return;
                    persist("guests", [...guests, {
                      name: field("name"), owner: field("owner"), breed: field("breed"), age,
                    }]);
                  } else {
                    const dog = field("dog"), start = field("start"), end = field("end"), type = field("type");
                    if (!isStayType(type)) return;
                    let total;
                    try {
                      total = bookingPrice(
                        data,
                        dog,
                        start,
                        end,
                        type,
                      );
                    } catch (error) {
                      setFormError(asStorageError(error).message);
                      return;
                    }
                    persist("bookings", [
                      ...bookings,
                      {
                        dog, start, type,
                        end: type === "Daycare" ? start : end,
                        total,
                        paid: false,
                      },
                    ]);
                  }
                  S(null);
                }}
              >
                {modal === "guest" ? (
                  <>
                    <label>
                      Nome do cão
                      <input name="name" required maxLength={100} />
                    </label>
                    <label>
                      Nome do tutor
                      <input name="owner" required maxLength={100} />
                    </label>
                    <label>
                      Raça
                      <input name="breed" required maxLength={100} />
                    </label>
                    <label>
                      Faixa etária
                      <select name="age">
                        <option value="Puppy">Cachorro</option>
                        <option value="Adult">Adulto</option>
                        <option value="Senior">Sénior</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Hóspede
                      <select name="dog" required>
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
                      + Adicionar primeiro um novo hóspede
                    </button>
                    <label>
                      Tipo de estadia
                      <select name="type">
                        <option value="Boarding">Hotel</option>
                        <option value="Daycare">Creche</option>
                      </select>
                    </label>
                    <label>
                      Data de entrada / dia de creche
                      <input
                        type="date"
                        name="start"
                        required
                        defaultValue={localDate()}
                      />
                    </label>
                    <label>
                      Data de saída (hotel)
                      <input
                        type="date"
                        name="end"
                        defaultValue={localDate(1)}
                      />
                    </label>
                    <p className="hint">
                      O hotel é cobrado por noite, de acordo com a época e a
                      faixa etária do cão. A creche tem um preço diário.
                    </p>
                  </>
                )}
                {formError && (
                  <div className="form-error" role="alert">
                    <p>{formError}</p>
                    <button
                      type="button"
                      className="textbutton"
                      onClick={() => {
                        S(null);
                        P("Pricing & seasons");
                      }}
                    >
                      Definir preços
                    </button>
                  </div>
                )}
                <button className="primary" type="submit">
                  {modal === "guest" ? "Guardar hóspede" : "Criar reserva"}
                </button>
              </form>
            ) : (
              <p>
                {modal === "help"
                  ? `Adicione os hóspedes, defina os preços por época e crie uma reserva. Acompanhe os saldos em Pagamentos e explore a receita potencial no simulador. ${isMobileApp ? "Os dados ficam guardados neste navegador, no telemóvel. Exporte cópias regularmente em Dados e cópias." : "Os dados ficam guardados num ficheiro neste dispositivo. Use Dados e cópias para transferir o hotel para o telemóvel."}`
                  : `${bookings.filter((b) => !b.paid).length} ${bookings.filter((b) => !b.paid).length === 1 ? "reserva tem pagamentos pendentes" : "reservas têm pagamentos pendentes"}. Aceda a Pagamentos para registar um pagamento.`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
