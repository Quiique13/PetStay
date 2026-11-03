import React, { useState } from "react";
import { createRoot } from "react-dom/client";
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
  LogOut,
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
import "./style.css";
import {
  money,
  shortMoney,
  formatDate,
  monthName,
  pageLabels,
  ageLabels,
  stayLabels,
  breedLabel,
} from "./locale.js";
const names = [
  "Overview",
  "Bookings",
  "Guests & clients",
  "Payments",
  "Pricing & seasons",
];
const icons = [LayoutDashboard, CalendarDays, Heart, Wallet, SlidersHorizontal];
const pics = [
  "photo-1552053831-71594a27632d",
  "photo-1587300003388-59208cc962cb",
  "photo-1583511655857-d19b40a7a54e",
  "photo-1517849845537-4d257902454a",
];
const photo = (i) =>
  `https://images.unsplash.com/${pics[i % 4]}?w=160&h=160&fit=crop`;
function saved(k, d) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
}
function Brand() {
  const [hasLogo, setHasLogo] = useState(true);
  return (
    <a className="brand" href="/" aria-label="MOMO - Hotel & Creche — início">
      {hasLogo ? (
        <img
          className="brand-logo"
          src="/momo_logo.png"
          alt="Logótipo MOMO - Hotel & Creche"
          onError={() => setHasLogo(false)}
        />
      ) : (
        <span className="brand-symbol">
          <PawPrint size={30} />
        </span>
      )}
      <span className="brand-name">
        MOMO<small>Hotel &amp; Creche</small>
      </span>
    </a>
  );
}
function App() {
  const [page, P] = useState("Overview"),
    [month, M] = useState(10),
    [modal, S] = useState(null),
    [query, Q] = useState(""),
    [rates, R] = useState(() =>
      saved("rates", {
        Puppy: [28, 38],
        Adult: [24, 34],
        Senior: [26, 36],
        day: 18,
        high: [5, 6, 7, 11],
      }),
    ),
    [guests, G] = useState(() =>
      saved("guests", [
        {
          name: "Cooper",
          owner: "Emma Wilson",
          age: "Adult",
          breed: "Golden Retriever",
        },
        { name: "Luna", owner: "James Miller", age: "Puppy", breed: "Beagle" },
        {
          name: "Milo",
          owner: "Sofia Davis",
          age: "Adult",
          breed: "French Bulldog",
        },
        {
          name: "Daisy",
          owner: "Oliver Smith",
          age: "Senior",
          breed: "Cocker Spaniel",
        },
      ]),
    ),
    [bookings, B] = useState(() =>
      saved("bookings", [
        {
          dog: "Cooper",
          start: "2026-11-02",
          end: "2026-11-07",
          type: "Boarding",
          paid: true,
          total: 120,
        },
        {
          dog: "Luna",
          start: "2026-11-03",
          end: "2026-11-06",
          type: "Boarding",
          paid: false,
          total: 84,
        },
        {
          dog: "Milo",
          start: "2026-11-03",
          end: "2026-11-03",
          type: "Daycare",
          paid: true,
          total: 18,
        },
        {
          dog: "Daisy",
          start: "2026-11-05",
          end: "2026-11-09",
          type: "Boarding",
          paid: false,
          total: 104,
        },
      ]),
    ),
    [occupancy, O] = useState(65),
    [capacity, C] = useState(12);
  function persist(k, v, f) {
    f(v);
    localStorage.setItem(k, JSON.stringify(v));
  }
  const income = bookings
    .filter((b) => +b.start.slice(5, 7) === month + 1)
    .reduce((a, b) => a + b.total, 0);
  const chart = Array.from({ length: 12 }, (_, i) => ({
    name: monthName(i, true),
    value: Math.round(
      ((new Date(2026, i + 1, 0).getDate() * capacity * occupancy) / 100) *
        rates.Adult[rates.high.includes(i) ? 1 : 0],
    ),
  }));
  const total = chart[month].value;
  function price(dog, start, end, type) {
    if (type === "Daycare") return rates.day;
    let sum = 0,
      d = new Date(start + "T12:00:00"),
      e = new Date(end + "T12:00:00");
    while (d < e) {
      sum +=
        rates[guests.find((g) => g.name === dog)?.age || "Adult"][
          rates.high.includes(d.getMonth()) ? 1 : 0
        ];
      d.setDate(d.getDate() + 1);
    }
    return sum;
  }
  const filtered = bookings.filter((b) =>
    b.dog.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="app">
      <aside>
        <Brand />
        <div className="hotel">
          <span>🏡</span>
          <div>
            MOMO - Hotel &amp; Creche
            <small>Um refúgio para o seu melhor amigo</small>
          </div>
        </div>
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
            <div className="avatar">LM</div>
            <div>
              Leonor Mónica<small>Proprietária do hotel</small>
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
            <div className="avatar">LM</div>
          </div>
        </header>
        <section className="content">
          <div className="heading">
            <div>
              <div className="eyebrow">
                MUITO CARINHO. MUITAS CAUDAS A ABANAR.
              </div>
              <h1>
                {page === "Overview" ? "Bem-vinda, Leonor" : pageLabels[page]}
                <span>{page === "Overview" ? " ☀️" : ""}</span>
              </h1>
              <p>
                {page === "Overview"
                  ? "Veja o que se passa hoje no MOMO - Hotel & Creche."
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
                    bookings.length,
                    "Cada hóspede, um novo amigo",
                    "🐶",
                  ],
                  [
                    "Estadias no hotel",
                    bookings.filter((b) => b.type === "Boarding").length,
                    "Noites tranquilas, manhãs felizes",
                    "🌙",
                  ],
                  [
                    "Visitas à creche",
                    bookings.filter((b) => b.type === "Daycare").length,
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
                    onClick={() => M((month + 11) % 12)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {monthName(month)} 2026
                  <button
                    aria-label="Mês seguinte"
                    onClick={() => M((month + 1) % 12)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="calendar">
                <div className="calhead">
                  <span>HÓSPEDE</span>
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className={i === 1 ? "today" : ""}>
                      <small>
                        {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"][i]}
                      </small>
                      {i + 2}
                    </div>
                  ))}
                </div>
                {guests.slice(0, 4).map((g, i) => (
                  <div className="calrow" key={g.name}>
                    <div className="guestcell">
                      <img src={photo(i)} alt={`Fotografia de ${g.name}`} />
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
                            +b.start.slice(5, 7) === month + 1,
                        )
                        .map((b, j) => (
                          <button
                            key={j}
                            className={"stay stay" + i}
                            style={{
                              left: `${(Math.max(0, +b.start.slice(8) - 2) * 100) / 7}%`,
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
          {page === "Guests & clients" && (
            <div className="guestgrid">
              {guests.map((g, i) => (
                <div className="panel guestcard">
                  <img src={photo(i)} alt={`Fotografia de ${g.name}`} />
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
          )}
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
                              B,
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
                            value={rates[a][i]}
                            onChange={(e) =>
                              persist(
                                "rates",
                                {
                                  ...rates,
                                  [a]: rates[a].map((v, j) =>
                                    i === j ? Math.max(0, +e.target.value) : v,
                                  ),
                                },
                                R,
                              )
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
                    value={rates.day}
                    onChange={(e) =>
                      persist(
                        "rates",
                        { ...rates, day: Math.max(0, +e.target.value) },
                        R,
                      )
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
                        persist(
                          "rates",
                          {
                            ...rates,
                            high: rates.high.includes(i)
                              ? rates.high.filter((m) => m !== i)
                              : [...rates.high, i],
                          },
                          R,
                        )
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
                  <span className="softtag">Projeção para 2026</span>
                </div>
                <div className="simcontrols">
                  <label>
                    Vagas{" "}
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={capacity}
                      onChange={(e) => C(Math.max(1, +e.target.value))}
                    />
                  </label>
                  <label>
                    Ocupação <strong>{occupancy}%</strong>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={occupancy}
                      onChange={(e) => O(+e.target.value)}
                    />
                  </label>
                  <div>
                    <strong>{money(total)}</strong>
                    <small>
                      {chart[month].name} · estimativa de hotel para adultos
                    </small>
                  </div>
                </div>
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
            <span>MOMO - Hotel &amp; Creche</span>
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
                  : modal === "help"
                    ? "Bem-vinda ao MOMO - Hotel & Creche"
                    : "Novidades do seu hotel"}
            </h2>
            {["guest", "booking"].includes(modal) ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  let f = Object.fromEntries(new FormData(e.target));
                  if (modal === "guest") {
                    persist("guests", [...guests, f], G);
                  } else {
                    if (f.type === "Boarding" && f.end <= f.start) {
                      alert(
                        "A data de saída deve ser posterior à data de entrada.",
                      );
                      return;
                    }
                    persist(
                      "bookings",
                      [
                        ...bookings,
                        {
                          ...f,
                          end: f.type === "Daycare" ? f.start : f.end,
                          total: price(f.dog, f.start, f.end, f.type),
                          paid: false,
                        },
                      ],
                      B,
                    );
                  }
                  S(null);
                }}
              >
                {modal === "guest" ? (
                  <>
                    <label>
                      Nome do cão
                      <input name="name" required />
                    </label>
                    <label>
                      Nome do tutor
                      <input name="owner" required />
                    </label>
                    <label>
                      Raça
                      <input name="breed" required />
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
                          <option>{g.name}</option>
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
                        defaultValue="2026-11-03"
                      />
                    </label>
                    <label>
                      Data de saída (hotel)
                      <input type="date" name="end" defaultValue="2026-11-04" />
                    </label>
                    <p className="hint">
                      O hotel é cobrado por noite, de acordo com a época e a
                      faixa etária do cão. A creche tem um preço diário.
                    </p>
                  </>
                )}
                <button className="primary" type="submit">
                  {modal === "guest" ? "Guardar hóspede" : "Criar reserva"}
                </button>
              </form>
            ) : (
              <p>
                {modal === "help"
                  ? "Adicione os hóspedes, defina os preços por época e crie uma reserva. Acompanhe os saldos em Pagamentos e explore a receita potencial no simulador. As alterações ficam guardadas neste navegador."
                  : `${bookings.filter((b) => !b.paid).length} ${bookings.filter((b) => !b.paid).length === 1 ? "reserva tem pagamentos pendentes" : "reservas têm pagamentos pendentes"}. Aceda a Pagamentos para registar um pagamento.`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
