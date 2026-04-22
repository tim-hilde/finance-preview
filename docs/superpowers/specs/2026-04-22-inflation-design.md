# Inflation Feature — Design Spec
**Datum:** 2026-04-22  
**Status:** Genehmigt

---

## Übersicht

Der Sparplaner zeigt bisher nur nominale Werte. Nutzer:innen können nicht erkennen, welche reale Kaufkraft ihr Endvermögen haben wird. Diese Ergänzung fügt eine globale Inflationseinstellung hinzu und ermöglicht das Umschalten zwischen nominaler und realer Darstellung aller Eurowerte.

---

## User-Facing-Verhalten

Die `horizon-bar` bekommt einen zweiten, kompakten Bereich auf der rechten Seite (klein halten):

- **Inflations-Slider:** Label „Inflation" mit Prozentwert (z.B. „2,0 %"), Slider 0–8 %, Step 0,1 %, Orientierung analog zum Horizon-Slider
- **Nominal/Real-Toggle:** Segmented-Control mit zwei Buttons „Nominal" | „Real", `aria-pressed`-Semantik

Bei **Real** wird der Endwert auf heutige Kaufkraft diskontiert:

- Chart-Flächen und gestrichelte Contributions-Linie
- Endwert-KPI: wird auf reale Kaufkraft diskontiert
- Zinsgewinn-KPI: `realEnd - nominalContrib` (nominal eingezahlte Beträge minus realer Endwert)
- Faktor-KPI: bleibt `realEnd / nominalContrib` — zeigt echte Kaufkraft-Wachstum
- Endwert-Block in jeder AssetCard
- Beträge in den Insights

Der Horizon-Slider und alle %-Angaben (Zinssätze, Inflationsrate) bleiben immer nominal.

Bei **Nominal** (Default): kein Unterschied zum bisherigen Verhalten.

---

## Architektur

**Ansatz: Display-Layer-Transform**

`buildTimeline` und `projectAsset` in `calc.js` bleiben vollständig unverändert und nominal. Der gesamte Inflations-Effekt liegt in einem neuen Transform-Step.

### Neue Hilfsfunktionen in `calc.js`

```js
// Diskontierungsfaktor für Monat i bei gegebener Jahresinflation
function deflator(monthIdx, inflationPct) {
  return Math.pow(1 + inflationPct / 100, -monthIdx / 12);
}

// Einzelwert auf heutige Kaufkraft diskontieren
function toReal(value, monthIdx, inflationPct) {
  return value * deflator(monthIdx, inflationPct);
}

// Gesamte Timeline auf Real transformieren (gibt neue timeline-shape zurück)
// mode: "nominal" | "real"
function applyDisplayMode(timeline, { mode, inflationPct }) {
  if (mode === "nominal") return timeline;
  // Diskontiert nur totals (Endwert), NICHT contribTotals (Einzahlungen)
  // Returned dasselbe Shape wie buildTimeline
}
```

`applyDisplayMode` returniert **dasselbe Shape** wie `buildTimeline` — damit sind `Chart.jsx`, `AssetCard.jsx`, und `LumpSumEditor.jsx` **ohne Änderung** weiterhin kompatibel.

### State-Ergänzungen in `App.jsx`

```js
const INFLATION_KEY = "sparplaner.inflation";
const DISPLAY_MODE_KEY = "sparplaner.displayMode";

const [inflation, setInflation] = useS(loadInflation());    // default 2.0
const [displayMode, setDisplayMode] = useS(loadDisplayMode()); // default "nominal"
```

### Zwei useMemo-Stufen

```js
const timelineNominal = useMemo(
  () => buildTimeline(assets, horizon),
  [assets, horizon]
);

const timeline = useMemo(
  () => applyDisplayMode(timelineNominal, { mode: displayMode, inflationPct: inflation }),
  [timelineNominal, displayMode, inflation]
);
```

`timeline` wird wie bisher übergeben. Downstream ändert sich nichts.

Für den neuen Insight wird `timelineNominal` (immer nominal) **zusätzlich** zu `timeline` an `buildInsights` übergeben, damit der Insight immer die Kaufkraft-Differenz berechnen kann — unabhängig vom Toggle.

---

## Komponenten

### `InflationControls` (inline in `App.jsx`)

Kleine Komponente, innerhalb der `.horizon-bar` rechts platziert. Kein eigenes File (analog zu `Kpi`).

Enthält:
- Label mit Inflationswert
- Slider (0–8 %, Step 0,1, `--p`-Technik wie alle anderen Slider)
- Segmented Toggle „Nominal · Real"

Die `horizon-bar` wird zu einem Flex-Row mit `gap` zwischen linker (Horizon) und rechter (Inflation) Spalte. `flex-wrap: wrap` für schmale Viewports.

**Explizite UI-Anforderung:** Die InflationControls müssen klein und kompakt ausfallen — analog zur vorhandenen Tick-Skala unter dem Horizon-Slider, nicht als gleichwertige große UI-Einheit.

### CSS-Ergänzungen (`index.html`)

Neue Klassen: `.inflation-block`, `.display-toggle`, `.display-toggle button`. Keine bestehenden Klassen umschreiben.

Slider-Farbe: neutrale Akzentfarbe, z.B. `--chart-contrib` oder eine neue `--accent-neutral` — nicht eine asset-spezifische Farbe.

---

## Neuer Insight

In `buildInsights` (ergänzter Parameter `inflationPct`, zusätzlich `timelineNominal`):

```js
if (inflationPct > 0) {
  const nominalEnd = timelineNominal.totals[finalIdx];
  const realEnd    = applyDisplayMode(timelineNominal, { mode: "real", inflationPct })
                       .totals[finalIdx];
  const lostShare  = (nominalEnd - realEnd) / nominalEnd;
  out.push({
    glyph: "↓",
    title: `Inflation frisst ${fmtPct(lostShare * 100, 0)} deines Endwerts`,
    body: `Nominal erreichst du ${fmtEUR(nominalEnd, { compact: nominalEnd >= 1e6 })}. Bei ${fmtPct(inflationPct, 1)} Inflation
           bleibt real eine Kaufkraft von ${fmtEUR(realEnd, { compact: realEnd >= 1e6 })} — gemessen in heutigen Euro.`
  });
}
```

Dieser Insight erscheint **immer** (unabhängig vom Toggle), damit der Kaufkraftverlust sichtbar ist.

---

## Persistenz

| Key | Default | Validierung |
|-----|---------|-------------|
| `sparplaner.inflation` | `2.0` | `clamp(0, 8, parseFloat)` |
| `sparplaner.displayMode` | `"nominal"` | muss `"nominal"` oder `"real"` sein |

Lade-Funktionen analog zu `loadHorizon` / `loadTheme`. Keine Änderung am `sparplaner.v1`-Schema.

---

## Bewusste Nicht-Ziele (YAGNI)

- Keine asset-spezifische Inflation
- Keine gestaffelten Inflations-Szenarien (z.B. 4 % erste 5 Jahre)
- Kein Steuermodell
- Keine automatische Inflation aus Marktdaten
- Kein zweiter Inflations-Insight (z.B. real-Rendite pro Asset)
- Keine Umrechnung der Zinssätze selbst (Inflation beeinflusst nur Darstellung, nicht Kalkulation)

---

## Manuelle Verifikations-Checkliste

- Inflation = 0 % → Nominal und Real sind identisch
- Inflation = 2 %, Horizon = 20 J → Real-Endwert ≈ Nominal × 0,6730 (= 1,02⁻²⁰)
- Toggle schalten → Chart, alle 4 KPIs, AssetCard-Endwerte, Insights reagieren konsistent
- Inflations-Slider ändern → Insight-Text aktualisiert sofort
- Reload → Inflationsrate und Toggle-Zustand persistiert
- Schmaler Viewport → InflationControls wrappt sauber unter Horizon-Bereich
