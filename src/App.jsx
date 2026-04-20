/* Main App */
const { useState: useS, useMemo: useM, useEffect: useE, useRef: useR } = React;

const STORAGE_KEY = "sparplaner.v1";
const HORIZON_KEY = "sparplaner.horizon";

const ASSET_TYPES = {
  cash: {
    label: "Tagesgeld",
    color: "oklch(0.70 0.13 45)",
    rate: 2.5, rateMin: 0, rateMax: 6,
    monthly: 200, startCapital: 5000,
    description: "Sicheres Cash-Konto, jederzeit verfügbar"
  },
  etf: {
    label: "ETF-Sparplan",
    color: "oklch(0.55 0.09 155)",
    rate: 7.0, rateMin: 0, rateMax: 12,
    monthly: 300, startCapital: 5000,
    description: "Breit gestreuter Aktien-ETF (z.B. MSCI World)"
  },
  bonds: {
    label: "Anleihen",
    color: "oklch(0.62 0.10 250)",
    rate: 3.5, rateMin: 0, rateMax: 7,
    monthly: 100, startCapital: 0,
    description: "Regelmäßige Zinsen, geringeres Risiko als Aktien"
  },
  fixed: {
    label: "Festgeld",
    color: "oklch(0.70 0.10 80)",
    rate: 3.0, rateMin: 0, rateMax: 5,
    monthly: 0, startCapital: 10000,
    description: "Garantierter Zinssatz, kein Kursrisiko"
  }
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function newAsset(kind) {
  const t = ASSET_TYPES[kind];
  return {
    id: uid(),
    kind,
    kindLabel: t.label,
    name: t.label,
    color: t.color,
    rate: t.rate,
    rateMin: t.rateMin,
    rateMax: t.rateMax,
    monthly: t.monthly,
    startCapital: t.startCapital,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
function loadHorizon() {
  try {
    const v = parseInt(localStorage.getItem(HORIZON_KEY));
    if (!isNaN(v) && v >= 5 && v <= 40) return v;
  } catch (e) {}
  return 20;
}

function App() {
  const initial = loadState();
  const [assets, setAssets] = useS(initial?.assets || [
    { ...newAsset("cash"), name: "Tagesgeld", startCapital: 8000, monthly: 200, rate: 3.0 },
    { ...newAsset("etf"), name: "MSCI World ETF", startCapital: 2000, monthly: 400, rate: 7.0 }
  ]);
  const [showAddMenu, setShowAddMenu] = useS(false);
  const [horizon, setHorizon] = useS(loadHorizon());
  const addBtnRef = useR(null);
  const addMenuRef = useR(null);

  useE(() => { saveState({ assets }); }, [assets]);
  useE(() => { try { localStorage.setItem(HORIZON_KEY, String(horizon)); } catch (e) {} }, [horizon]);

  useE(() => {
    if (!showAddMenu) return;
    function onDown(e) {
      if (!addBtnRef.current?.contains(e.target) && !addMenuRef.current?.contains(e.target))
        setShowAddMenu(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showAddMenu]);

  const timeline = useM(() => buildTimeline(assets, horizon), [assets, horizon]);

  const finalIdx = horizon * 12;
  const totalEnd = timeline.totals[finalIdx];
  const totalContrib = timeline.contribTotals[finalIdx];
  const totalInterest = totalEnd - totalContrib;
  const interestShare = totalEnd > 0 ? totalInterest / totalEnd : 0;
  const monthlySum = assets.reduce((s, a) => s + (Number(a.monthly) || 0), 0);
  const startSum = assets.reduce((s, a) => s + (Number(a.startCapital) || 0), 0);

  const insights = buildInsights({ assets, timeline, horizon, totalEnd, totalContrib, monthlySum, startSum });

  function updateAsset(idx, next) {
    setAssets((a) => a.map((x, i) => i === idx ? next : x));
  }
  function removeAsset(idx) {
    setAssets((a) => a.filter((_, i) => i !== idx));
  }
  function addAsset(kind) {
    setAssets((a) => [...a, newAsset(kind)]);
    setShowAddMenu(false);
  }

  return (
    <div className="app">
      <h1 className="greet">
        Wenn du <em>{horizon} Jahre</em> dranbleibst, könntest du{" "}
        <em>{fmtEUR(totalEnd, { compact: true })}</em> auf dem Konto haben.
      </h1>
      <p className="greet-sub">
        Probier verschiedene Sparraten, Zinssätze und Asset-Mixe aus, um zu sehen,
        wie sich deine Entscheidungen langfristig auswirken. Alle Werte werden monatlich verzinst.
      </p>

      <div className="horizon-bar">
        <div className="horizon-label">
          <span className="horizon-caption">Planungshorizont</span>
          <span className="horizon-value">
            <span className="serif" style={{ fontSize: 32, lineHeight: 1 }}>{horizon}</span>
            <span style={{ fontSize: 14, color: "var(--ink-soft)", marginLeft: 6 }}>Jahre</span>
          </span>
        </div>
        <input
          type="range"
          className="slider horizon-slider"
          min={5} max={40} step={1}
          value={horizon}
          onChange={(e) => setHorizon(parseInt(e.target.value))}
          style={{ "--p": (horizon - 5) / 35 * 100 + "%" }}
        />
        <div className="horizon-ticks">
          <span>5 J</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
          <span>25</span>
          <span>30</span>
          <span>35</span>
          <span>40 J</span>
        </div>
      </div>

      <div className="grid">
        <div className="card" style={{ position: "relative" }}>
          <div className="card-head">
            <div className="card-title">Deine Assets</div>
            <div className="card-hint">{assets.length} aktiv</div>
          </div>

          {assets.map((a, i) =>
            <AssetCard
              key={a.id}
              asset={a}
              projection={timeline.perAsset[a.id]}
              horizonYears={horizon}
              onChange={(next) => updateAsset(i, next)}
              onRemove={() => removeAsset(i)}
            />
          )}

          <div className="add-row" style={{ position: "relative" }}>
            <button ref={addBtnRef} className="btn" onClick={() => setShowAddMenu((s) => !s)}>
              + Asset hinzufügen
            </button>
            {showAddMenu &&
              <div ref={addMenuRef} className="menu" style={{ left: 20, right: 20, bottom: 60 }}>
                {Object.entries(ASSET_TYPES).map(([key, t]) =>
                  <button key={key} onClick={() => addAsset(key)}>
                    <span className="swatch" style={{ background: t.color, width: 12, height: 12, borderRadius: 3, display: "inline-block" }} />
                    <span style={{ flex: 1 }}>
                      <div>{t.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-mute)", fontWeight: 400 }}>{t.description}</div>
                    </span>
                  </button>
                )}
              </div>
            }
          </div>
        </div>

        <div>
          <div className="kpis">
            <Kpi label="Endwert" value={fmtEUR(totalEnd, { compact: totalEnd >= 1e6 })}
              sub={`in ${horizon} Jahren`} />
            <Kpi label="Eingezahlt" value={fmtEUR(totalContrib, { compact: totalContrib >= 1e6 })}
              sub={`Start ${fmtEUR(startSum, { compact: true })} + ${fmtEUR(monthlySum)}/Monat`} />
            <Kpi label="Zinsgewinn" value={fmtEUR(totalInterest, { compact: totalInterest >= 1e6 })}
              sub={fmtPct(interestShare * 100, 0) + " des Endwerts"}
              accent="kpi-accent-cash" />
            <Kpi label="Faktor" value={(totalContrib > 0 ? totalEnd / totalContrib : 0).toFixed(2).replace(".", ",") + "×"}
              sub="Endwert / Eingezahlt"
              accent="kpi-accent-etf" />
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-head">
              <div>
                <div className="card-title">Vermögensverlauf</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4 }}>
                  Gestapelt nach Asset · gestrichelte Linie = eingezahltes Kapital
                </div>
              </div>
              <div className="card-hint">Hovern für Details</div>
            </div>
            <div className="legend">
              {assets.map((a) =>
                <div key={a.id} className="legend-item">
                  <span className="swatch" style={{ background: a.color }} />
                  <span>{a.name}</span>
                  <span className="mono" style={{ color: "var(--ink-mute)", fontSize: 12 }}>
                    {fmtPct(a.rate, 1)} p.a.
                  </span>
                </div>
              )}
              <div className="legend-item">
                <span style={{ width: 18, height: 0, borderTop: "1.4px dashed oklch(0.35 0.02 60)" }} />
                <span>Eingezahltes Kapital</span>
              </div>
            </div>
            <div className="chart-wrap">
              <StackedAreaChart
                assets={assets}
                timeline={timeline}
                width={920} height={400}
                showContributionLine={true}
                style="stacked"
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Was du daraus lernst</div>
            </div>
            <div>
              {insights.map((ins, i) =>
                <div key={i} className="insight">
                  <div className="insight-icon">{ins.glyph}</div>
                  <div className="insight-body">
                    <h4>{ins.title}</h4>
                    <p>{ins.body}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className={"kpi-val " + (accent || "")}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

function buildInsights({ assets, timeline, horizon, totalEnd, totalContrib, monthlySum, startSum }) {
  const out = [];
  const interest = totalEnd - totalContrib;

  if (monthlySum > 0) {
    const months = timeline.months;
    let cross = null;
    for (let i = 12; i <= months; i++) {
      const monthlyInterest = timeline.totals[i] - timeline.totals[i - 1] - monthlySum;
      if (monthlyInterest >= monthlySum) { cross = i; break; }
    }
    if (cross) {
      const yrs = (cross / 12).toFixed(1).replace(".", ",");
      out.push({
        glyph: "↗",
        title: `Ab Jahr ${yrs} arbeitet dein Geld härter als du`,
        body: `Dann übersteigt der monatliche Zinsertrag deine Sparrate von ${fmtEUR(monthlySum)}. Ab da wächst dein Vermögen primär durch Zinseszins, nicht mehr durch Einzahlungen.`
      });
    } else {
      out.push({
        glyph: "→",
        title: "Dein Sparplan trägt sich noch nicht selbst",
        body: `Innerhalb von ${horizon} Jahren übersteigen deine Zinsen noch nicht deine Sparrate. Erhöhe Rendite oder Horizont, um den Hebel zu sehen.`
      });
    }
  }

  const share = totalEnd > 0 ? interest / totalEnd : 0;
  out.push({
    glyph: "%",
    title: `${fmtPct(share * 100, 0)} deines Endvermögens sind „geschenkt"`,
    body: `Von ${fmtEUR(totalEnd)} Endwert hast du ${fmtEUR(totalContrib)} selbst eingezahlt — ${fmtEUR(interest)} kommen aus Zinsen und Kursgewinnen.`
  });

  const etf = assets.find((a) => a.kind === "etf");
  const cash = assets.find((a) => a.kind === "cash");
  if (etf && cash) {
    const etfEnd = timeline.perAsset[etf.id][timeline.months].value;
    const cashEnd = timeline.perAsset[cash.id][timeline.months].value;
    const etfContrib = timeline.perAsset[etf.id][timeline.months].contributed;
    const cashContrib = timeline.perAsset[cash.id][timeline.months].contributed;
    const etfReturn = etfContrib > 0 ? etfEnd / etfContrib : 0;
    const cashReturn = cashContrib > 0 ? cashEnd / cashContrib : 0;
    if (etfReturn > 0 && cashReturn > 0) {
      const diff = (etfReturn / cashReturn - 1) * 100;
      out.push({
        glyph: "⇄",
        title: `Aus jedem Euro im ETF wird ${etfReturn.toFixed(2).replace(".", ",")}× — im Tagesgeld ${cashReturn.toFixed(2).replace(".", ",")}×`,
        body: `Bei deinen aktuellen Annahmen wächst jeder investierte Euro im ETF um rund ${Math.round(diff)}% stärker als im Tagesgeld. Dafür schwankt er kurzfristig stärker — Tagesgeld ist deine Liquiditätsreserve.`
      });
    }
  }

  if (monthlySum > 0) {
    const annual = monthlySum * 12;
    out.push({
      glyph: "€",
      title: `Du sparst ${fmtEUR(annual)} pro Jahr`,
      body: `Über ${horizon} Jahre macht das ${fmtEUR(annual * horizon)} an reinen Einzahlungen. Schon ${fmtEUR(50)} mehr im Monat würden deinen Endwert spürbar verschieben — probier es im Slider aus.`
    });
  }

  return out;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
