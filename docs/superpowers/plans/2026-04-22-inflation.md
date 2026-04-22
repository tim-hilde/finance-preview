# Inflation Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global inflation rate (default 2 %) with a Nominal/Real toggle that discounts all EUR values to today's purchasing power.

**Architecture:** Display-layer-transform — `buildTimeline`/`projectAsset` stay nominal; a new `applyDisplayMode` function in `calc.js` discounts all timeline values per month index. `App.jsx` keeps two `useMemo` stages (nominal + display) and passes the display timeline downstream unchanged.

**Tech Stack:** Pure HTML/CSS/JS, React 18 (CDN), JSX via Babel Standalone — no build step.

---

## File Map

| File | Changes |
|------|---------|
| `src/calc.js` | Add `deflator`, `toReal`, `applyDisplayMode`; export via `window` |
| `src/App.jsx` | Add `inflation`/`displayMode` state + persist; two-stage useMemo; `InflationControls` component; update `buildInsights` signature |
| `index.html` | New CSS: `.horizon-bar` flex layout, `.inflation-block`, `.display-toggle` |

`Chart.jsx`, `AssetCard.jsx`, `LumpSumEditor.jsx`, `ColorPicker.jsx` — **no changes needed**.

---

## Task 1: Add `deflator`, `toReal`, `applyDisplayMode` to `calc.js`

**Files:**
- Modify: `src/calc.js`

- [ ] **Step 1: Add the three functions at the end of `src/calc.js`, before the `window.*` exports**

  Open `src/calc.js`. After line 66 (end of `buildTimeline`), before line 88 (`window.fmtEUR = ...`), insert:

  ```js
  function deflator(monthIdx, inflationPct) {
    return Math.pow(1 + inflationPct / 100, -monthIdx / 12);
  }

  function toReal(value, monthIdx, inflationPct) {
    return value * deflator(monthIdx, inflationPct);
  }

  function applyDisplayMode(timeline, { mode, inflationPct }) {
    if (mode === "nominal") return timeline;

    const { years, months, perAsset, totals, contribTotals } = timeline;

    const newPerAsset = {};
    for (const [id, points] of Object.entries(perAsset)) {
      newPerAsset[id] = points.map((pt, i) => {
        const d = deflator(i, inflationPct);
        return {
          value: pt.value * d,
          contributed: pt.contributed * d,
          interest: pt.interest * d,
        };
      });
    }

    const newTotals = totals.map((v, i) => v * deflator(i, inflationPct));
    const newContribTotals = contribTotals.map((v, i) => v * deflator(i, inflationPct));

    return { years, months, perAsset: newPerAsset, totals: newTotals, contribTotals: newContribTotals };
  }
  ```

- [ ] **Step 2: Export the new functions on `window`**

  In `src/calc.js`, the current last lines are:
  ```js
  window.fmtEUR = fmtEUR;
  window.fmtPct = fmtPct;
  window.projectAsset = projectAsset;
  window.buildTimeline = buildTimeline;
  ```

  Add three more lines after them:
  ```js
  window.deflator = deflator;
  window.toReal = toReal;
  window.applyDisplayMode = applyDisplayMode;
  ```

- [ ] **Step 3: Verify in browser console (manual)**

  Open `npx serve .` at `http://localhost:3000` and run in DevTools:
  ```js
  const tl = buildTimeline([{id:'x',rate:7,monthly:100,startCapital:1000,lumpSums:[]}], 20);
  const real = applyDisplayMode(tl, { mode: 'real', inflationPct: 2 });
  // real.totals[240] should be roughly tl.totals[240] * Math.pow(1.02, -20)
  // i.e. approx. tl.totals[240] * 0.6730
  const ratio = real.totals[240] / tl.totals[240];
  console.log(ratio.toFixed(4)); // expect ~0.6730
  ```
  Expected output: `0.6730` (±0.0002).

  Also verify nominal mode is unchanged:
  ```js
  const same = applyDisplayMode(tl, { mode: 'nominal', inflationPct: 2 });
  console.log(same === tl); // expect true
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/calc.js
  git commit -m "feat(calc): add deflator, toReal, applyDisplayMode for inflation"
  ```

---

## Task 2: Add CSS for `InflationControls` in `index.html`

**Files:**
- Modify: `index.html` (CSS section, lines 475–493)

- [ ] **Step 1: Replace the `.horizon-bar` block to support two-column layout**

  Find the existing block (lines 476–493):
  ```css
  /* Horizon bar */
  .horizon-bar {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    padding: 18px 22px 14px;
    margin-bottom: 22px;
    box-shadow: var(--shadow-1);
  }
  .horizon-label {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 12px;
  }
  .horizon-caption {
    font-size: 12px; color: var(--ink-mute);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .horizon-value { display: flex; align-items: baseline; }
  .horizon-slider { margin: 4px 0 8px; }
  ```

  Replace with:
  ```css
  /* Horizon bar */
  .horizon-bar {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    padding: 18px 22px 14px;
    margin-bottom: 22px;
    box-shadow: var(--shadow-1);
    display: flex;
    gap: 24px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .horizon-main {
    flex: 1 1 260px;
    min-width: 220px;
  }
  .horizon-label {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 12px;
  }
  .horizon-caption {
    font-size: 12px; color: var(--ink-mute);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .horizon-value { display: flex; align-items: baseline; }
  .horizon-slider { margin: 4px 0 8px; }

  /* Inflation controls — compact, secondary */
  .inflation-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 140px;
    padding-top: 2px;
  }
  .inflation-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .inflation-caption {
    font-size: 11px; color: var(--ink-mute);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .inflation-value {
    font-size: 12px; color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }
  .inflation-slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 3px; border-radius: 999px;
    background: linear-gradient(to right, var(--chart-contrib) var(--p, 25%), var(--line) var(--p, 25%));
    outline: none;
    margin: 0;
  }
  .inflation-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--paper); border: 2px solid var(--chart-contrib);
    box-shadow: 0 1px 4px oklch(0 0 0 / 0.2);
    cursor: grab;
  }
  .inflation-slider::-moz-range-thumb {
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--paper); border: 2px solid var(--chart-contrib); cursor: grab;
  }
  .display-toggle {
    display: flex;
    border: 1px solid var(--line);
    border-radius: 6px;
    overflow: hidden;
    width: fit-content;
    margin-top: 2px;
  }
  .display-toggle button {
    padding: 3px 10px;
    font: 500 11px Inter, sans-serif;
    background: transparent;
    border: none;
    color: var(--ink-mute);
    cursor: pointer;
    transition: background .12s, color .12s;
    letter-spacing: 0.02em;
  }
  .display-toggle button:first-child { border-right: 1px solid var(--line); }
  .display-toggle button[aria-pressed="true"] {
    background: var(--bg-2);
    color: var(--ink);
  }
  .display-toggle button:hover:not([aria-pressed="true"]) {
    background: var(--bg);
    color: var(--ink-soft);
  }
  ```

- [ ] **Step 2: Verify CSS loads without error**

  Open browser, confirm no console errors from CSS parsing. The page should look unchanged at this point (no React changes yet).

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat(css): add inflation-block and display-toggle styles"
  ```

---

## Task 3: Add inflation/displayMode state, persistence, and two-stage useMemo in `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add storage key constants**

  In `src/App.jsx`, after line 6 (`const THEME_KEY = "sparplaner.theme";`), add:
  ```js
  const INFLATION_KEY = "sparplaner.inflation";
  const DISPLAY_MODE_KEY = "sparplaner.displayMode";
  ```

- [ ] **Step 2: Add load functions**

  In `src/App.jsx`, after the `loadTheme()` function (after line 100), add:
  ```js
  function loadInflation() {
    try {
      const v = parseFloat(localStorage.getItem(INFLATION_KEY));
      if (!isNaN(v) && v >= 0 && v <= 8) return v;
    } catch (e) {}
    return 2.0;
  }

  function loadDisplayMode() {
    try {
      const v = localStorage.getItem(DISPLAY_MODE_KEY);
      if (v === "nominal" || v === "real") return v;
    } catch (e) {}
    return "nominal";
  }
  ```

- [ ] **Step 3: Add state in the `App` function**

  In `src/App.jsx`, inside the `App` function, after line 143 (`const [, forceTick] = useS(0);`), add:
  ```js
  const [inflation, setInflation] = useS(loadInflation());
  const [displayMode, setDisplayMode] = useS(loadDisplayMode());
  ```

- [ ] **Step 4: Add persistence effects**

  In `src/App.jsx`, after the existing persistence effects (after line 148, the horizon save effect), add:
  ```js
  useE(() => { try { localStorage.setItem(INFLATION_KEY, String(inflation)); } catch (e) {} }, [inflation]);
  useE(() => { try { localStorage.setItem(DISPLAY_MODE_KEY, displayMode); } catch (e) {} }, [displayMode]);
  ```

- [ ] **Step 5: Replace the single `timeline` useMemo with two-stage**

  Find (line 184):
  ```js
  const timeline = useM(() => buildTimeline(assets, horizon), [assets, horizon]);
  ```

  Replace with:
  ```js
  const timelineNominal = useM(() => buildTimeline(assets, horizon), [assets, horizon]);
  const timeline = useM(
    () => applyDisplayMode(timelineNominal, { mode: displayMode, inflationPct: inflation }),
    [timelineNominal, displayMode, inflation]
  );
  ```

- [ ] **Step 6: Verify in browser (manual)**

  Open DevTools, confirm no React errors. App should work exactly as before (displayMode starts as "nominal").

- [ ] **Step 7: Commit**

  ```bash
  git add src/App.jsx
  git commit -m "feat(app): add inflation/displayMode state, persistence, two-stage timeline"
  ```

---

## Task 4: Add `InflationControls` component and wire it into the horizon bar

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the `InflationControls` component**

  In `src/App.jsx`, after the `Kpi` component (after line 377, the closing `}`), add:

  ```js
  function InflationControls({ inflation, setInflation, displayMode, setDisplayMode }) {
    const p = (inflation / 8 * 100).toFixed(1) + "%";
    return (
      <div className="inflation-block">
        <div className="inflation-header">
          <span className="inflation-caption">Inflation</span>
          <span className="inflation-value">{inflation.toFixed(1).replace(".", ",")} %</span>
        </div>
        <input
          type="range"
          className="inflation-slider"
          min={0} max={8} step={0.1}
          value={inflation}
          onChange={(e) => setInflation(parseFloat(e.target.value))}
          style={{ "--p": p }}
          aria-label="Inflationsrate"
        />
        <div className="display-toggle">
          <button
            aria-pressed={displayMode === "nominal" ? "true" : "false"}
            onClick={() => setDisplayMode("nominal")}
          >
            Nominal
          </button>
          <button
            aria-pressed={displayMode === "real" ? "true" : "false"}
            onClick={() => setDisplayMode("real")}
          >
            Real
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Wrap the existing horizon-bar content in `.horizon-main` and add `InflationControls`**

  Find the `.horizon-bar` div in the `App` render (around line 226–258):
  ```jsx
  <div className="horizon-bar">
    <div className="horizon-label">
  ```

  Replace the entire `.horizon-bar` block with:
  ```jsx
  <div className="horizon-bar">
    <div className="horizon-main">
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
      <div style={{ position: "relative", height: 16, fontSize: 10, color: "var(--ink-mute)", fontVariantNumeric: "tabular-nums" }}>
        {[5, 10, 15, 20, 25, 30, 35, 40].map(v => {
          const f = (v - 5) / 35;
          return (
            <span key={v} style={{
              position: "absolute",
              left: `calc(${f * 100}% + ${9 - f * 18}px)`,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap"
            }}>
              {v === 5 ? "5 J" : v === 40 ? "40 J" : v}
            </span>
          );
        })}
      </div>
    </div>
    <InflationControls
      inflation={inflation}
      setInflation={setInflation}
      displayMode={displayMode}
      setDisplayMode={setDisplayMode}
    />
  </div>
  ```

- [ ] **Step 3: Verify in browser (manual)**

  - Inflation controls appear compact to the right of the horizon slider
  - Slider moves 0–8 %, value updates live
  - Toggle switches between Nominal/Real — KPIs, chart and AssetCard endvalues change immediately (timeline was wired in Task 3)
  - On narrow viewport (< ~500 px), inflation block wraps below horizon block

- [ ] **Step 4: Commit**

  ```bash
  git add src/App.jsx
  git commit -m "feat(app): add InflationControls component in horizon bar"
  ```

---

## Task 5: Update `buildInsights` to include the inflation insight

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update the `buildInsights` call site**

  Find (line 194):
  ```js
  const insights = buildInsights({ assets, timeline, horizon, totalEnd, totalContrib, monthlySum, startSum });
  ```

  Replace with:
  ```js
  const insights = buildInsights({ assets, timeline, timelineNominal, horizon, totalEnd, totalContrib, monthlySum, startSum, inflation });
  ```

- [ ] **Step 2: Update the `buildInsights` function signature and add the inflation insight**

  Find the `buildInsights` function declaration (line 379):
  ```js
  function buildInsights({ assets, timeline, horizon, totalEnd, totalContrib, monthlySum, startSum }) {
  ```

  Replace with:
  ```js
  function buildInsights({ assets, timeline, timelineNominal, horizon, totalEnd, totalContrib, monthlySum, startSum, inflation }) {
  ```

  Then, at the very end of `buildInsights`, before `return out;` (currently the last line before the closing `}`), add:

  ```js
  if (inflation > 0) {
    const finalIdx = horizon * 12;
    const nominalEnd = timelineNominal.totals[finalIdx];
    const realEnd = applyDisplayMode(timelineNominal, { mode: "real", inflationPct: inflation }).totals[finalIdx];
    const lostShare = nominalEnd > 0 ? (nominalEnd - realEnd) / nominalEnd : 0;
    out.push({
      glyph: "↓",
      title: `Inflation frisst ${fmtPct(lostShare * 100, 0)} deines Endwerts`,
      body: `Nominal erreichst du ${fmtEUR(nominalEnd, { compact: nominalEnd >= 1e6 })}. Bei ${fmtPct(inflation, 1)} Inflation bleibt real eine Kaufkraft von ${fmtEUR(realEnd, { compact: realEnd >= 1e6 })} — gemessen in heutigen Euro.`
    });
  }
  ```

- [ ] **Step 3: Verify in browser (manual)**

  - New insight „Inflation frisst X % deines Endwerts" appears at bottom of insights
  - At inflation = 2 %, horizon = 20 J: lostShare ≈ 32.7 % → insight says „33 %"
  - At inflation = 0 %: insight does not appear
  - Changing inflation slider updates insight text immediately

- [ ] **Step 4: Commit**

  ```bash
  git add src/App.jsx
  git commit -m "feat(app): add inflation purchasing-power insight"
  ```

---

## Task 6: End-to-end verification

- [ ] **Sanity: inflation = 0 %**

  Set inflation slider to 0. Switch to Real. All KPIs, chart, AssetCard endvalues must be **identical** to Nominal. Insight „Inflation frisst..." must not appear.

- [ ] **Math check: inflation = 2 %, horizon = 20 J**

  Switch to Real. The „Endwert"-KPI must be approximately `0.6730 × Nominal-Endwert` (= 1.02⁻²⁰). Verify with calculator or DevTools:
  ```js
  Math.pow(1.02, -20).toFixed(4) // "0.6730"
  ```

- [ ] **Toggle consistency**

  Switch between Nominal and Real several times. All four KPIs, the chart, every AssetCard bottom row, and insight amounts must all change together — no partial updates.

- [ ] **Slider live update**

  With Real active: drag inflation slider. Insight text updates on each drag event. Chart updates.

- [ ] **Persistence**

  Set inflation to 3.5 %, switch to Real. Reload page. Inflation slider must show 3,5 %, toggle must show Real active.

- [ ] **Narrow viewport**

  Resize browser to ~400 px wide. InflationControls must wrap below the Horizon block without overlapping.

- [ ] **Final commit (if any cleanup needed)**

  ```bash
  git add -A
  git commit -m "chore: post-review cleanup"
  ```
