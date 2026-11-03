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
import { useHotel } from "../context/HotelContext.jsx";
import { bookingPrice } from "../utils/hotel-data.js";
import { Brand } from "./Brand.jsx";
import { HotelAvatar } from "./HotelAvatar.jsx";
import { HotelProfileForm } from "./HotelProfileForm.jsx";
import { EmptyState } from "./EmptyState.jsx";
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
} from "../utils/format.js";
const names = [
  "Overview",
  "Bookings",
  "Guests & clients",
  "Payments",
  "Pricing & seasons",
];
const icons = [LayoutDashboard, CalendarDays, Heart, Wallet, SlidersHorizontal];
export default function Dashboard() {
  const storage = useHotel();
  const [page, P] = useState("Overview"),
    [calendarDate, setCalendarDate] = useState(() => new Date()),
    [modal, S] = useState(null),
    [query, Q] = useState(""),
    [formError, setFormError] = useState("");
  const { hotel, rates, guests, bookings, occupancy, capacity } = storage.data;
  const month = calendarDate.getMonth(),
    year = calendarDate.getFullYear();
  const ownerInitials = initials(hotel.owner).toUpperCase();
  useEffect(() => {
    setFormError("");
  }, [modal]);
  function moveMonth(delta) {
    setCalendarDate(new Date(year, month + delta, 1));
  }
  function persist(key, value) {
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
        <nav>
          {names.map((n, i) => {
            let Icon = icons[i];
            return (
              <button
                className={page === n ? "active" : ""}
                onClick={() => P(n)}
                key={n}
              >
                <Icon size={19} />
                {pageLabels[n]}
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
                Object.values(rates).some(
                  (value) => Array.isArray(value) && value.includes(null),
                )) && (
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
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=700&h=450&fit=crop"
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
                                width: `${(Math.min(7, Math.max(1, (new Date(b.end) - new Date(b.start)) / 86400000)) * 100) / 7}%`,
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
              <table>
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
                      <td>
                        <strong>{b.dog}</strong>
                      </td>
                      <td>{stayLabels[b.type] ?? b.type}</td>
                      <td>
                        {formatDate(b.start)} → {formatDate(b.end)}
                      </td>
                      <td>{money(b.total)}</td>
                      <td>
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
              <table>
                <thead>
                  <tr>
                    <th>Faixa etária</th>
                    <th>Época baixa (€)</th>
                    <th>Época alta (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {["Puppy", "Adult", "Senior"].map((a) => (
                    <tr>
                      <td>{ageLabels[a]}</td>
                      {[0, 1].map((i) => (
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rates[a][i] ?? ""}
                            placeholder="Por definir"
                            aria-label={`Preço de ${ageLabels[a]} — época ${i ? "alta" : "baixa"}`}
                            onChange={(e) =>
                              persist("rates", {
                                ...rates,
                                [a]: rates[a].map((v, j) =>
                                  i === j
                                    ? e.target.value === ""
                                      ? null
                                      : Math.max(0, +e.target.value)
                                    : v,
                                ),
                              })
                            }
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
                      <Tooltip formatter={money} />
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
          <div className="dialog">
            <button
              className="close"
              onClick={() => S(null)}
              aria-label="Fechar"
            >
              <X />
            </button>
            <h2>
              {modal === "guest"
                ? "Um novo amigo de quatro patas"
                : modal === "booking"
                  ? "Planear uma boa estadia"
                  : modal === "profile"
                    ? "Perfil do hotel"
                    : modal === "help"
                      ? "Bem-vindo ao PetStay"
                      : "Novidades do seu hotel"}
            </h2>
            {modal === "profile" ? (
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
                  let f = Object.fromEntries(new FormData(e.target));
                  if (modal === "guest") {
                    persist("guests", [...guests, f]);
                  } else {
                    let total;
                    try {
                      total = bookingPrice(
                        storage.data,
                        f.dog,
                        f.start,
                        f.end,
                        f.type,
                      );
                    } catch (error) {
                      setFormError(error.message);
                      return;
                    }
                    persist("bookings", [
                      ...bookings,
                      {
                        ...f,
                        end: f.type === "Daycare" ? f.start : f.end,
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
                  ? "Adicione os hóspedes, defina os preços por época e crie uma reserva. Acompanhe os saldos em Pagamentos e explore a receita potencial no simulador. Os dados ficam guardados num ficheiro neste dispositivo, fora do navegador."
                  : `${bookings.filter((b) => !b.paid).length} ${bookings.filter((b) => !b.paid).length === 1 ? "reserva tem pagamentos pendentes" : "reservas têm pagamentos pendentes"}. Aceda a Pagamentos para registar um pagamento.`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
