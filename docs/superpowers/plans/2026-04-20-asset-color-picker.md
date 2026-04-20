# Asset Color Picker & Auto-Shading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each asset an auto-assigned shade within its category-colored palette, and let the user change that shade via a popover picker on the swatch.

**Architecture:** Each asset stores a `shadeIndex` (0–5) instead of a concrete color string. CSS variables `--c-<kind>-<0..5>` are defined per theme; `assetColor(asset)` resolves to `var(--c-<kind>-<shadeIndex>)` at render time. New assets receive the lowest free index within their category. A `ColorPicker` popover on the asset-card swatch lets the user override the shade.

**Tech Stack:** React 18 via CDN, JSX via Babel Standalone, plain CSS (no build step). Spec: `docs/superpowers/specs/2026-04-20-asset-color-picker-design.md`.

**Testing strategy:** The project has no automated test harness. Each task ends with manual verification steps performed in a browser via `npx serve .` on `http://localhost:3000`. When a task says "Verify", open the app, reproduce the scenario, and confirm the stated outcome before committing.

---

## File Structure

- **Modify** `index.html` — replace old category CSS variables with new `--c-<kind>-<0..5>` palette (light theme, OS-dark media query, explicit `[data-theme="dark"]`); add script tag for `ColorPicker.jsx`; add CSS rules for `.color-picker` popover.
- **Modify** `src/App.jsx` — remove `color` fields from `ASSET_TYPES`, add `SHADES_PER_CAT`, `nextShadeIndex`, `assetColor` helpers (exposed on `window`), update `newAsset`, `loadState`, `addAsset`, the Add-Menu swatch, and the chart legend swatch.
- **Modify** `src/AssetCard.jsx` — use `assetColor()` for the swatch; make the swatch a button that toggles the `ColorPicker`.
- **Modify** `src/Chart.jsx` — replace every `a.color` / `s.asset.color` with `assetColor(a)` (gradients, strokes, crosshair dots, tooltip swatches).
- **Create** `src/ColorPicker.jsx` — stateless popover component: six circles, the active one ringed.

---

## Task 1: Define new palette CSS variables

**Files:**
- Modify: `index.html` — three locations (light `:root` at ~L25–30, `@media (prefers-color-scheme: dark)` at ~L75–80, explicit `[data-theme="dark"]` at ~L121–126).

- [ ] **Step 1: Replace old color variables in light `:root` block**

In `index.html`, find this block around line 25:

```css
    --c-cash:    oklch(0.70 0.13 45);
    --c-cash-2:  oklch(0.92 0.05 55);
    --c-etf:     oklch(0.60 0.09 155);
    --c-etf-2:   oklch(0.90 0.045 150);
    --c-extra-1: oklch(0.62 0.10 250);
    --c-extra-2: oklch(0.70 0.10 80);
```

Replace with:

```css
    /* Asset category palettes — 6 shades per kind. Same hue family,
       varied lightness (±0.1) and hue (±10°) for distinguishability. */
    --c-cash-0:  oklch(0.70 0.13 45);
    --c-cash-1:  oklch(0.65 0.14 40);
    --c-cash-2:  oklch(0.75 0.12 50);
    --c-cash-3:  oklch(0.60 0.15 35);
    --c-cash-4:  oklch(0.80 0.11 55);
    --c-cash-5:  oklch(0.55 0.16 30);

    --c-etf-0:   oklch(0.60 0.09 155);
    --c-etf-1:   oklch(0.55 0.11 150);
    --c-etf-2:   oklch(0.65 0.08 160);
    --c-etf-3:   oklch(0.50 0.12 145);
    --c-etf-4:   oklch(0.70 0.07 165);
    --c-etf-5:   oklch(0.45 0.13 140);

    --c-bonds-0: oklch(0.62 0.10 250);
    --c-bonds-1: oklch(0.57 0.11 245);
    --c-bonds-2: oklch(0.67 0.09 255);
    --c-bonds-3: oklch(0.52 0.12 240);
    --c-bonds-4: oklch(0.72 0.08 260);
    --c-bonds-5: oklch(0.47 0.13 235);

    --c-fixed-0: oklch(0.70 0.10 80);
    --c-fixed-1: oklch(0.65 0.11 75);
    --c-fixed-2: oklch(0.75 0.09 85);
    --c-fixed-3: oklch(0.60 0.12 70);
    --c-fixed-4: oklch(0.80 0.08 90);
    --c-fixed-5: oklch(0.55 0.13 65);
```

- [ ] **Step 2: Replace old color variables in `@media (prefers-color-scheme: dark)` block**

Find the block around line 75:

```css
      --c-cash:    oklch(0.78 0.12 45);
      --c-cash-2:  oklch(0.45 0.06 55);
      --c-etf:     oklch(0.72 0.10 155);
      --c-etf-2:   oklch(0.40 0.05 150);
      --c-extra-1: oklch(0.72 0.11 250);
      --c-extra-2: oklch(0.80 0.10 80);
```

Replace with (note the 6-space indent to match surrounding rules):

```css
      --c-cash-0:  oklch(0.78 0.12 45);
      --c-cash-1:  oklch(0.73 0.13 40);
      --c-cash-2:  oklch(0.83 0.11 50);
      --c-cash-3:  oklch(0.68 0.14 35);
      --c-cash-4:  oklch(0.88 0.10 55);
      --c-cash-5:  oklch(0.63 0.15 30);

      --c-etf-0:   oklch(0.72 0.10 155);
      --c-etf-1:   oklch(0.67 0.11 150);
      --c-etf-2:   oklch(0.77 0.09 160);
      --c-etf-3:   oklch(0.62 0.12 145);
      --c-etf-4:   oklch(0.82 0.08 165);
      --c-etf-5:   oklch(0.57 0.13 140);

      --c-bonds-0: oklch(0.72 0.11 250);
      --c-bonds-1: oklch(0.67 0.12 245);
      --c-bonds-2: oklch(0.77 0.10 255);
      --c-bonds-3: oklch(0.62 0.13 240);
      --c-bonds-4: oklch(0.82 0.09 260);
      --c-bonds-5: oklch(0.57 0.14 235);

      --c-fixed-0: oklch(0.80 0.10 80);
      --c-fixed-1: oklch(0.75 0.11 75);
      --c-fixed-2: oklch(0.85 0.09 85);
      --c-fixed-3: oklch(0.70 0.12 70);
      --c-fixed-4: oklch(0.90 0.08 90);
      --c-fixed-5: oklch(0.65 0.13 65);
```

- [ ] **Step 3: Replace old color variables in explicit `[data-theme="dark"]` block**

Find the block around line 121:

```css
    --c-cash:    oklch(0.78 0.12 45);
    --c-cash-2:  oklch(0.45 0.06 55);
    --c-etf:     oklch(0.72 0.10 155);
    --c-etf-2:   oklch(0.40 0.05 150);
    --c-extra-1: oklch(0.72 0.11 250);
    --c-extra-2: oklch(0.80 0.10 80);
```

Replace with the same 4-kind × 6-shade block as in Step 2, but with a 4-space indent to match the surrounding rules:

```css
    --c-cash-0:  oklch(0.78 0.12 45);
    --c-cash-1:  oklch(0.73 0.13 40);
    --c-cash-2:  oklch(0.83 0.11 50);
    --c-cash-3:  oklch(0.68 0.14 35);
    --c-cash-4:  oklch(0.88 0.10 55);
    --c-cash-5:  oklch(0.63 0.15 30);

    --c-etf-0:   oklch(0.72 0.10 155);
    --c-etf-1:   oklch(0.67 0.11 150);
    --c-etf-2:   oklch(0.77 0.09 160);
    --c-etf-3:   oklch(0.62 0.12 145);
    --c-etf-4:   oklch(0.82 0.08 165);
    --c-etf-5:   oklch(0.57 0.13 140);

    --c-bonds-0: oklch(0.72 0.11 250);
    --c-bonds-1: oklch(0.67 0.12 245);
    --c-bonds-2: oklch(0.77 0.10 255);
    --c-bonds-3: oklch(0.62 0.13 240);
    --c-bonds-4: oklch(0.82 0.09 260);
    --c-bonds-5: oklch(0.57 0.14 235);

    --c-fixed-0: oklch(0.80 0.10 80);
    --c-fixed-1: oklch(0.75 0.11 75);
    --c-fixed-2: oklch(0.85 0.09 85);
    --c-fixed-3: oklch(0.70 0.12 70);
    --c-fixed-4: oklch(0.90 0.08 90);
    --c-fixed-5: oklch(0.65 0.13 65);
```

- [ ] **Step 4: Verify the app still renders (intermediate broken state is expected)**

Run `npx serve .` in the project root and open `http://localhost:3000`. The app will render, but asset colors will appear as the browser's fallback (black or unset) because `ASSET_TYPES` in `App.jsx` still references the now-removed `--c-cash` etc. This is the expected intermediate state — we fix it in Task 2.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(theme): replace category vars with 6-shade palettes per kind"
```

---

## Task 2: Add palette helpers and shadeIndex to the asset model

**Files:**
- Modify: `src/App.jsx` — `ASSET_TYPES` (L8–37), `newAsset` (L41–55), `loadState` (L57–71), `addAsset` (L180–183), initial defaults (L114–117), Add-Menu rendering (L262–269), Legend rendering (L300–308); add helpers near the top.

- [ ] **Step 1: Add `SHADES_PER_CAT`, `assetColor`, `nextShadeIndex` near the storage-key constants**

In `src/App.jsx`, find:

```jsx
const STORAGE_KEY = "sparplaner.v1";
const HORIZON_KEY = "sparplaner.horizon";
const THEME_KEY = "sparplaner.theme";
```

Add directly below it:

```jsx
const SHADES_PER_CAT = 6;

function assetColor(asset) {
  return `var(--c-${asset.kind}-${asset.shadeIndex ?? 0})`;
}

function nextShadeIndex(assets, kind) {
  const used = new Set(
    assets.filter((a) => a.kind === kind).map((a) => a.shadeIndex)
  );
  for (let i = 0; i < SHADES_PER_CAT; i++) {
    if (!used.has(i)) return i;
  }
  return assets.filter((a) => a.kind === kind).length % SHADES_PER_CAT;
}

window.assetColor = assetColor;
```

The `window.assetColor` assignment is required so `AssetCard.jsx` and `Chart.jsx` (which are separate `<script>` tags) can call the helper.

- [ ] **Step 2: Remove `color` field from every entry in `ASSET_TYPES`**

Find the `ASSET_TYPES` object (L8–37) and delete the `color: "var(--c-...)"` line from each of `cash`, `etf`, `bonds`, `fixed`. After the edit, `ASSET_TYPES.cash` should read:

```jsx
  cash: {
    label: "Tagesgeld",
    rate: 2.5, rateMin: 0, rateMax: 6,
    monthly: 200, startCapital: 5000,
    description: "Sicheres Cash-Konto, jederzeit verfügbar"
  },
```

Do the same for `etf`, `bonds`, `fixed`.

- [ ] **Step 3: Update `newAsset` to take a shadeIndex and drop `color`**

Replace the existing `newAsset` function:

```jsx
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
```

with:

```jsx
function newAsset(kind, shadeIndex = 0) {
  const t = ASSET_TYPES[kind];
  return {
    id: uid(),
    kind,
    kindLabel: t.label,
    name: t.label,
    shadeIndex,
    rate: t.rate,
    rateMin: t.rateMin,
    rateMax: t.rateMax,
    monthly: t.monthly,
    startCapital: t.startCapital,
  };
}
```

- [ ] **Step 4: Update `loadState` to migrate stored assets**

Replace `loadState` with:

```jsx
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.assets)) {
      const migrated = [];
      for (const a of parsed.assets) {
        const { color, ...rest } = a;
        const shadeIndex =
          typeof rest.shadeIndex === "number"
            ? rest.shadeIndex
            : nextShadeIndex(migrated, rest.kind);
        migrated.push({ ...rest, shadeIndex });
      }
      parsed.assets = migrated;
    }
    return parsed;
  } catch (e) {}
  return null;
}
```

This drops any legacy `color` string and computes a fresh shade for assets that don't already have one — assigning indices sequentially so earlier assets in the list stay at lower indices.

- [ ] **Step 5: Update the two initial default assets**

Find (around L114–117):

```jsx
  const [assets, setAssets] = useS(initial?.assets || [
    { ...newAsset("cash"), name: "Tagesgeld", startCapital: 8000, monthly: 200, rate: 3.0 },
    { ...newAsset("etf"), name: "MSCI World ETF", startCapital: 2000, monthly: 400, rate: 7.0 }
  ]);
```

Replace with:

```jsx
  const [assets, setAssets] = useS(initial?.assets || [
    { ...newAsset("cash", 0), name: "Tagesgeld", startCapital: 8000, monthly: 200, rate: 3.0 },
    { ...newAsset("etf", 0), name: "MSCI World ETF", startCapital: 2000, monthly: 400, rate: 7.0 }
  ]);
```

- [ ] **Step 6: Update `addAsset` to compute the next free shade**

Replace:

```jsx
  function addAsset(kind) {
    setAssets((a) => [...a, newAsset(kind)]);
    setShowAddMenu(false);
  }
```

with:

```jsx
  function addAsset(kind) {
    setAssets((a) => [...a, newAsset(kind, nextShadeIndex(a, kind))]);
    setShowAddMenu(false);
  }
```

- [ ] **Step 7: Update the Add-Menu swatch (uses `ASSET_TYPES` directly)**

Find (around L260–269):

```jsx
                {Object.entries(ASSET_TYPES).map(([key, t]) =>
                  <button key={key} onClick={() => addAsset(key)}>
                    <span className="swatch" style={{ background: t.color, width: 12, height: 12, borderRadius: 3, display: "inline-block" }} />
```

Replace the `background: t.color` with the kind-shade-0 CSS var:

```jsx
                {Object.entries(ASSET_TYPES).map(([key, t]) =>
                  <button key={key} onClick={() => addAsset(key)}>
                    <span className="swatch" style={{ background: `var(--c-${key}-0)`, width: 12, height: 12, borderRadius: 3, display: "inline-block" }} />
```

- [ ] **Step 8: Update the chart legend swatch in `App.jsx`**

Find (around L300–308):

```jsx
              {assets.map((a) =>
                <div key={a.id} className="legend-item">
                  <span className="swatch" style={{ background: a.color }} />
```

Replace `background: a.color` with `background: assetColor(a)`:

```jsx
              {assets.map((a) =>
                <div key={a.id} className="legend-item">
                  <span className="swatch" style={{ background: assetColor(a) }} />
```

- [ ] **Step 9: Verify — default assets now render with category colors again**

Reload `http://localhost:3000`. The two default assets (Tagesgeld in orange, ETF in green) render with their correct category colors. The Add-Menu also shows correct category colors. **Note:** AssetCard swatches and chart fills are still broken because `AssetCard.jsx` and `Chart.jsx` still reference `asset.color`, which is now undefined — this is the expected intermediate state, fixed in Task 3.

- [ ] **Step 10: Commit**

```bash
git add src/App.jsx
git commit -m "feat(assets): model shadeIndex instead of color string"
```

---

## Task 3: Switch AssetCard and Chart to `assetColor()`

**Files:**
- Modify: `src/AssetCard.jsx` (swatch on L18).
- Modify: `src/Chart.jsx` (gradients L103–104, stroke L129 and L137, tooltip circles L177, tooltip row swatch L210).

- [ ] **Step 1: Update the AssetCard swatch**

In `src/AssetCard.jsx`, find (around L18):

```jsx
        <span className="swatch" style={{ background: asset.color }} />
```

Replace with:

```jsx
        <span className="swatch" style={{ background: assetColor(asset) }} />
```

- [ ] **Step 2: Update the Chart linear gradients**

In `src/Chart.jsx`, find (around L101–106):

```jsx
          {visibleAssets.map(a => (
            <linearGradient key={a.id} id={`grad-${a.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={a.color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={a.color} stopOpacity="0.55" />
            </linearGradient>
          ))}
```

Replace with:

```jsx
          {visibleAssets.map(a => (
            <linearGradient key={a.id} id={`grad-${a.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={assetColor(a)} stopOpacity="0.85" />
              <stop offset="100%" stopColor={assetColor(a)} stopOpacity="0.55" />
            </linearGradient>
          ))}
```

- [ ] **Step 3: Update the stacked-area stroke**

Find (around L125–132):

```jsx
          {style === "stacked" && stacks.map(s => (
            <path key={s.asset.id}
              d={pathFor(s)}
              fill={`url(#grad-${s.asset.id})`}
              stroke={s.asset.color}
              strokeWidth="1"
            />
          ))}
```

Replace `stroke={s.asset.color}` with `stroke={assetColor(s.asset)}`.

- [ ] **Step 4: Update the line-style stroke**

Find (around L133–139):

```jsx
          {style === "lines" && visibleAssets.map(a => {
            const pts = timeline.perAsset[a.id].map(p => p.value);
            return (
              <path key={a.id} d={linePathFor(pts)}
                fill="none" stroke={a.color} strokeWidth="2.25" />
            );
          })}
```

Replace `stroke={a.color}` with `stroke={assetColor(a)}`.

- [ ] **Step 5: Update the crosshair circles**

Find (around L171–179):

```jsx
              {visibleAssets.map((a, idx) => {
                const cum = stacks[idx];
                const yTop = yScale(cum.top[hover.month]);
                return (
                  <circle key={a.id}
                    cx={xScale(hover.month)} cy={style === "stacked" ? yTop : yScale(timeline.perAsset[a.id][hover.month].value)}
                    r="3.5" fill="var(--chart-dot)" stroke={a.color} strokeWidth="2" />
                );
              })}
```

Replace `stroke={a.color}` with `stroke={assetColor(a)}`.

- [ ] **Step 6: Update the tooltip row swatches**

Find (around L208–213):

```jsx
      {assets.map(a => (
        <div key={a.id} className="tt-row">
          <span className="swatch" style={{ background: a.color }} />
          <span style={{ flex: 1 }}>{a.name}</span>
          &nbsp;<b>{fmtEUR(timeline.perAsset[a.id][month].value)}</b>
        </div>
      ))}
```

Replace `background: a.color` with `background: assetColor(a)`.

- [ ] **Step 7: Verify — colors render correctly everywhere**

Reload `http://localhost:3000`. Expected:
- Both default assets (Tagesgeld, ETF) show their category colors on the AssetCard swatch, in the chart fill, in the chart legend, and in the tooltip on hover.
- Click `+ Asset hinzufügen` → click `ETF-Sparplan` to add a second ETF. The new ETF's swatch and chart area must be a **visibly different shade of green** from the first ETF (shade 1 vs shade 0).
- Add a third ETF → shade 2 (another different green).
- Delete the middle ETF → the remaining two keep their shades (0 and 2).
- Add another ETF → it should take shade 1 (the freed slot).

- [ ] **Step 8: Commit**

```bash
git add src/AssetCard.jsx src/Chart.jsx
git commit -m "refactor(colors): resolve asset color via assetColor() helper"
```

---

## Task 4: Create the ColorPicker component

**Files:**
- Create: `src/ColorPicker.jsx`.
- Modify: `index.html` — add `.color-picker` CSS rules and a new `<script>` tag for `ColorPicker.jsx`.

- [ ] **Step 1: Create the component file**

Create `src/ColorPicker.jsx` with this content:

```jsx
/* ColorPicker — popover with 6 shades of the asset's category */
const { useRef: useRCP, useEffect: useECP } = React;

function ColorPicker({ kind, shadeIndex, onChange, onClose, anchorRef }) {
  const ref = useRCP(null);

  useECP(() => {
    function onDown(e) {
      if (ref.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose, anchorRef]);

  return (
    <div ref={ref} className="color-picker" role="listbox" aria-label="Farbschattierung wählen">
      {Array.from({ length: 6 }, (_, i) => (
        <button
          key={i}
          type="button"
          role="option"
          aria-selected={i === shadeIndex}
          className={"color-swatch" + (i === shadeIndex ? " is-active" : "")}
          style={{ background: `var(--c-${kind}-${i})` }}
          onClick={() => { onChange(i); onClose(); }}
          title={`Shade ${i + 1}`}
        />
      ))}
    </div>
  );
}

window.ColorPicker = ColorPicker;
```

Notes:
- `useRef` and `useEffect` are aliased as `useRCP` / `useECP` to avoid clashing with the aliases already declared in `App.jsx` and `Chart.jsx` (React globals are shared across all `<script>` tags).
- `anchorRef` lets the parent pass the swatch-button ref so a click on it doesn't trigger the outside-click close.

- [ ] **Step 2: Add CSS for the picker popover and swatch button**

In `index.html`, find the `.icon-btn:hover` rule (around L322):

```css
  .icon-btn:hover { background: var(--bg-2); color: var(--ink); }
```

Add directly below it:

```css
  .swatch-btn {
    padding: 0; border: 1px solid oklch(0 0 0 / 0.05);
    background: transparent; border-radius: 4px;
    width: 14px; height: 14px; cursor: pointer;
    display: inline-block;
  }
  .swatch-btn:focus-visible { outline: 2px solid var(--accent-focus); outline-offset: 2px; }

  .color-picker {
    position: absolute; z-index: 20;
    top: 22px; left: 0;
    display: flex; gap: 6px;
    background: var(--paper); border: 1px solid var(--line); border-radius: var(--r-md);
    box-shadow: var(--shadow-2);
    padding: 8px;
  }
  .color-swatch {
    width: 20px; height: 20px; border-radius: 50%;
    border: 1px solid oklch(0 0 0 / 0.08);
    padding: 0; cursor: pointer;
    transition: transform .1s;
  }
  .color-swatch:hover { transform: scale(1.1); }
  .color-swatch.is-active {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
```

- [ ] **Step 3: Add the script tag**

In `index.html`, find the script-loading block near the bottom (around L416–419):

```html
  <script type="text/babel" src="src/calc.js"></script>
  <script type="text/babel" src="src/Chart.jsx"></script>
  <script type="text/babel" src="src/AssetCard.jsx"></script>
  <script type="text/babel" src="src/App.jsx"></script>
```

Insert the ColorPicker script **before** `AssetCard.jsx` (which will consume it):

```html
  <script type="text/babel" src="src/calc.js"></script>
  <script type="text/babel" src="src/Chart.jsx"></script>
  <script type="text/babel" src="src/ColorPicker.jsx"></script>
  <script type="text/babel" src="src/AssetCard.jsx"></script>
  <script type="text/babel" src="src/App.jsx"></script>
```

- [ ] **Step 4: Verify — ColorPicker loads without errors**

Reload `http://localhost:3000`. The app still renders unchanged (picker is not yet wired up). Open DevTools Console and confirm no errors related to `ColorPicker` (e.g. syntax error, missing identifier).

- [ ] **Step 5: Commit**

```bash
git add src/ColorPicker.jsx index.html
git commit -m "feat(colors): add ColorPicker popover component and styles"
```

---

## Task 5: Wire the ColorPicker into AssetCard

**Files:**
- Modify: `src/AssetCard.jsx` — make swatch clickable, render popover, wire `onChange` to update `shadeIndex`.

- [ ] **Step 1: Replace the top of AssetCard to import state, ref hooks**

In `src/AssetCard.jsx`, find line 2:

```jsx
const { useState: useStateAC } = React;
```

Replace with:

```jsx
const { useState: useStateAC, useRef: useRefAC } = React;
```

- [ ] **Step 2: Add picker state, swatch ref, and picker markup**

Find the start of the `AssetCard` function body (around L4–18):

```jsx
function AssetCard({ asset, onChange, onRemove, projection, horizonYears }) {
  function setField(key, val) { onChange({ ...asset, [key]: val }); }
  function setNum(key, val) {
    const cleaned = String(val).replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
    const n = cleaned === "" || cleaned === "-" ? 0 : parseFloat(cleaned);
    onChange({ ...asset, [key]: isNaN(n) ? 0 : n });
  }

  const final = projection ? projection[projection.length - 1] : null;
  const interestShare = final && final.value > 0 ? (final.value - final.contributed) / final.value : 0;

  return (
    <div className="asset">
      <div className="asset-head">
        <span className="swatch" style={{ background: assetColor(asset) }} />
```

Replace with:

```jsx
function AssetCard({ asset, onChange, onRemove, projection, horizonYears }) {
  const [pickerOpen, setPickerOpen] = useStateAC(false);
  const swatchRef = useRefAC(null);

  function setField(key, val) { onChange({ ...asset, [key]: val }); }
  function setNum(key, val) {
    const cleaned = String(val).replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
    const n = cleaned === "" || cleaned === "-" ? 0 : parseFloat(cleaned);
    onChange({ ...asset, [key]: isNaN(n) ? 0 : n });
  }

  const final = projection ? projection[projection.length - 1] : null;
  const interestShare = final && final.value > 0 ? (final.value - final.contributed) / final.value : 0;

  return (
    <div className="asset">
      <div className="asset-head" style={{ position: "relative" }}>
        <button
          ref={swatchRef}
          type="button"
          className="swatch-btn"
          style={{ background: assetColor(asset) }}
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Farbe ändern"
          aria-expanded={pickerOpen}
        />
        {pickerOpen && (
          <ColorPicker
            kind={asset.kind}
            shadeIndex={asset.shadeIndex ?? 0}
            anchorRef={swatchRef}
            onChange={(idx) => setField("shadeIndex", idx)}
            onClose={() => setPickerOpen(false)}
          />
        )}
```

Notes:
- `position: "relative"` on `.asset-head` makes the `.color-picker` (which is `position: absolute` via its CSS class from Task 4 Step 2) anchor to the row, directly below the swatch at `top: 22px; left: 0`.

- [ ] **Step 3: Verify — picker opens, selects, closes**

Reload `http://localhost:3000`. Expected flow:
1. Click the color swatch on the left of the Tagesgeld card → a popover appears with 6 orange circles; the first has a ring indicating it is active.
2. Click the third orange circle → the swatch color, the chart fill, the legend dot, and the tooltip swatch all change to the new shade; the popover closes.
3. Click the swatch again → popover reopens, the third circle is now ringed.
4. Click anywhere outside the popover → it closes.
5. Click the ETF card's swatch → the popover shows **green** circles (category-scoped), not orange.

- [ ] **Step 4: Commit**

```bash
git add src/AssetCard.jsx
git commit -m "feat(asset-card): click swatch to open color picker"
```

---

## Task 6: Full manual verification and persistence check

**Files:** None (verification only; bug fixes may touch any file).

- [ ] **Step 1: Walk through every spec scenario**

With `npx serve .` running, confirm each of the following:

1. **Auto-shading on add:** Fresh page load (after clearing localStorage in DevTools → Application → Local Storage → delete `sparplaner.v1`). Default two assets: Tagesgeld (shade 0, orange-base) and MSCI World ETF (shade 0, green-base). Add another ETF via the menu — it appears with **shade 1** (different green).
2. **Free-slot reuse:** With three ETFs (shades 0, 1, 2) present, delete the middle one. Add a new ETF — it must take **shade 1** (not 3), because 1 is the lowest free index.
3. **Picker scope:** Click the swatch of the MSCI World ETF → the popover shows six green shades, no orange or blue.
4. **Picker override:** Click an arbitrary green shade → the AssetCard swatch, the chart fill, the legend dot, and the hover-tooltip swatch all update simultaneously.
5. **Theme toggle:** Click the theme toggle (top-right sun/moon icon). All asset colors adapt to the dark palette; shades remain visually distinct within each category.
6. **Reload persistence:** With some assets added and a non-default shade selected, hard-reload the page. All assets come back with their shadeIndex preserved and correct colors.
7. **Migration from old storage:** Open DevTools → Application → Local Storage. Manually set `sparplaner.v1` to:

```json
{"assets":[{"id":"legacy1","kind":"etf","kindLabel":"ETF-Sparplan","name":"Alt-ETF","color":"var(--c-etf)","rate":7,"rateMin":0,"rateMax":12,"monthly":100,"startCapital":0},{"id":"legacy2","kind":"etf","kindLabel":"ETF-Sparplan","name":"Alt-ETF 2","color":"var(--c-etf)","rate":7,"rateMin":0,"rateMax":12,"monthly":100,"startCapital":0}]}
```

Reload. Both legacy ETFs should render with **different shades** (0 and 1 respectively) — the migration in `loadState` assigns unique indices even though the stored `color` strings were identical.

8. **Click-outside:** Open the picker, then click elsewhere (empty card space, the `+ Asset hinzufügen` button, body). The picker closes cleanly without side effects.
9. **Rapid toggle:** Click the swatch repeatedly — the popover toggles open/closed each time without stuck states or duplicate listeners.

- [ ] **Step 2: Fix any issue found**

If a scenario fails, diagnose and fix inline; recommit under the appropriate existing task's commit style (e.g. `fix(colors): …`). Re-run the scenario afterward.

- [ ] **Step 3: Cross-browser sanity check (optional but recommended)**

Open the app in at least one other browser (Safari in addition to Chrome, or vice versa). Verify that `oklch()` colors, the popover layout, and the outside-click handler work identically. If there are issues on a given browser, document them as follow-up — do not block completion.

- [ ] **Step 4: Final commit (if fixes were applied)**

```bash
git status
# If any changes were made during verification:
git add -A
git commit -m "fix(colors): <specific fix>"
```

If no fixes were needed, this step is a no-op.

---

## Self-Review Checklist (already performed by plan author)

1. **Spec coverage:**
   - Datenmodell (`shadeIndex`) → Task 2 steps 3–5.
   - Palette CSS → Task 1.
   - Shade-Zuweisung → Task 2 step 1 (helper) + step 6 (usage).
   - User-Override via Picker → Tasks 4–5.
   - Migration → Task 2 step 4.
   - Entfernung alter Variablen → Task 1 (replacing, not just adding).
   - Scope limit (no free picker, KPI vars untouched) → respected; `--kpi-cash`/`--kpi-etf` are never modified in any task.

2. **Placeholder scan:** None found. Every step has the concrete code or command.

3. **Type consistency:** `assetColor(asset)` takes the whole asset; `nextShadeIndex(assets, kind)` takes the array and the kind string. `newAsset(kind, shadeIndex)` and `ColorPicker({ kind, shadeIndex, onChange, onClose, anchorRef })` — names match across all tasks.
