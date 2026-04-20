# Asset Color Picker & Auto-Shading

**Date:** 2026-04-20
**Status:** Design approved, pending implementation plan

## Problem

Jedes Asset derselben Kategorie bekommt aktuell dieselbe Farbe (`var(--c-etf)` für alle ETFs usw.). Im Stacked Chart und in der Legende sind Assets derselben Kategorie dadurch nicht unterscheidbar. Der User möchte außerdem die Farbe eines Assets per Klick ändern können — aber innerhalb einer kategorie-konsistenten Palette, damit ETFs immer grünlich, Tagesgeld immer orange bleibt.

## Goals

1. Neue Assets derselben Kategorie bekommen automatisch unterschiedliche Shades derselben Farbfamilie.
2. User kann den Shade eines Assets per Klick auf den Swatch ändern — beschränkt auf die Palette der jeweiligen Kategorie.
3. Light- und Dark-Theme bleiben weiterhin harmonisch unterstützt.
4. Bestehende im `localStorage` gespeicherte Assets werden automatisch migriert.

## Non-Goals

- Kein freier Color-Picker (HSL-Wheel, Hex-Eingabe). Der User soll nicht aus Versehen ETF-Assets orange färben können.
- Keine Änderungen an den KPI-Akzent-Farben (`--kpi-cash`, `--kpi-etf`) — die bleiben kategorie-weit einheitlich.
- Kein Drag-Reorder oder andere UX-Erweiterungen.

## Design

### Datenmodell

Pro Asset wird statt einer konkreten `color` ein `shadeIndex: number` (0–5) gespeichert.

```js
// vorher
{ id, kind: "etf", color: "var(--c-etf)", ... }
// nachher
{ id, kind: "etf", shadeIndex: 2, ... }
```

Die tatsächliche CSS-Farbe wird zur Render-Zeit aufgelöst via Helper:

```js
function assetColor(asset) {
  return `var(--c-${asset.kind}-${asset.shadeIndex})`;
}
```

### Palette

Pro Kategorie 6 Shades, definiert als CSS-Variablen im `:root` (Light-Theme) und im Dark-Theme-Block in `index.html`:

```css
--c-etf-0: oklch(0.60 0.09 155);  /* Basis-Hue, mittlere Lightness */
--c-etf-1: oklch(0.55 0.10 150);
--c-etf-2: oklch(0.65 0.08 160);
--c-etf-3: oklch(0.50 0.11 145);
--c-etf-4: oklch(0.70 0.07 165);
--c-etf-5: oklch(0.45 0.12 140);
```

Gleicher Hue-Kern pro Kategorie, variiert in **Lightness** (±0.1) und **Hue** (±10°). Dark-Theme-Werte haben höhere Lightness (wie bisher) — je sechs Shades pro Theme, konkrete Werte werden in der Implementation festgelegt.

**Kategorien:** `cash`, `etf`, `bonds`, `fixed` → je 6 Shades. Die neuen Variablennamen verwenden den `kind`-Namen direkt (`--c-bonds-0..5`, `--c-fixed-0..5`), sodass `var(--c-${kind}-${i})` ohne Mapping funktioniert. Die alten Namen `extra-1`/`extra-2` entfallen.

**Entfernung alter Variablen:** Die bisherigen Variablen `--c-cash`, `--c-etf`, `--c-extra-1`, `--c-extra-2` werden im Zuge der Implementation entfernt — ihre einzigen Consumer sind die `color`-Felder in `ASSET_TYPES` in `App.jsx`, die durch das neue `shadeIndex`-System ersetzt werden. Ebenfalls entfernt werden die ungenutzten `--c-cash-2` und `--c-etf-2` (würden mit dem neuen Namensschema `--c-<kind>-2` kollidieren). Die KPI-Akzent-Variablen `--kpi-cash` und `--kpi-etf` bleiben unberührt.

### Shade-Zuweisung (Strategie: nächster freier Index)

Beim Hinzufügen eines neuen Assets wird der niedrigste Shade-Index gewählt, der innerhalb der Kategorie aktuell nicht belegt ist:

```js
const SHADES_PER_CAT = 6;

function nextShadeIndex(assets, kind) {
  const used = new Set(
    assets.filter(a => a.kind === kind).map(a => a.shadeIndex)
  );
  for (let i = 0; i < SHADES_PER_CAT; i++) {
    if (!used.has(i)) return i;
  }
  // Fallback: mehr Assets als Shades → cyclen
  return assets.filter(a => a.kind === kind).length % SHADES_PER_CAT;
}
```

Löschen gibt den Shade wieder frei — das nächste neue Asset kann ihn nachnutzen.

### User-Override via Picker

- Swatch in `AssetCard` wird klickbar.
- Klick öffnet ein kleines Popover direkt am Swatch mit 6 Kreisen — den Shades der aktuellen Kategorie.
- Aktiver Shade ist mit Ring/Border markiert.
- Klick auf einen Kreis setzt `asset.shadeIndex` und schließt das Popover.
- Klick außerhalb schließt das Popover (analog zu `showAddMenu` in `App.jsx`).
- Mehrere Assets derselben Kategorie dürfen denselben Shade manuell zugewiesen bekommen (keine Kollisions-Prävention bei manuellem Override) — nur die Auto-Zuweisung vermeidet Duplikate.
- Picker ist nur am AssetCard-Swatch, **nicht** am Legend-Swatch im Chart (single source of truth für die Aktion).

### Migration

`loadState` in `App.jsx` wandelt gespeicherte Assets ohne `shadeIndex` um:
- Vorhandenes `color`-Feld wird verworfen (egal ob alte CSS-Variable oder Hex).
- Jedes Asset bekommt in der Reihenfolge des Arrays den nächsten freien Index seiner Kategorie (über `nextShadeIndex`, angewandt auf die bereits migrierten Assets).

## Komponenten & Dateien

- **`index.html`** — neue CSS-Variablen `--c-<kind>-<0..5>` pro Theme.
- **`src/App.jsx`** — `ASSET_TYPES`-Einträge verlieren das `color`-Feld. `newAsset` nimmt einen `shadeIndex`-Parameter. `loadState` migriert. `addAsset` bestimmt via `nextShadeIndex`. Swatch im Add-Menu zeigt immer Shade #0 als Kategorie-Vorschau.
- **`src/AssetCard.jsx`** — Swatch wird Button, öffnet `<ColorPicker>`. `asset.color` ersetzt durch `assetColor(asset)`.
- **`src/Chart.jsx`** — jede Referenz auf `a.color` ersetzt durch `assetColor(a)`.
- **`src/ColorPicker.jsx`** (neu) — Component `ColorPicker({ kind, shadeIndex, onChange, onClose })`.

## Testing

Das Projekt nutzt React via CDN ohne Build-Step und ohne Test-Harness. Verifikation manuell im Browser:
- Neues ETF hinzufügen während ein ETF existiert → unterschiedlicher Shade.
- Asset löschen und neues derselben Kategorie anlegen → freigewordener Shade wird genutzt.
- Klick auf Swatch → Picker öffnet mit 6 Shades der Kategorie.
- Klick auf Shade → Farbe ändert sich in Card, Legende und Chart.
- Theme-Toggle (Sonne/Mond) → Shades bleiben konsistent, passen sich an.
- Reload → Shades persistieren via localStorage.
- Alte `localStorage`-Daten (vor Migration) → werden korrekt auf `shadeIndex` migriert.

## Open Questions

Keine. Design vollständig.
