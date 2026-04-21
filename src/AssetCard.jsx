/* AssetCard — editable parameters per asset */
const { useState: useStateAC, useRef: useRefAC } = React;

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
          aria-haspopup="listbox"
          aria-expanded={pickerOpen ? "true" : "false"}
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
        <input
          className="input"
          style={{ flex: 1, border: "none", padding: "2px 4px", background: "transparent", fontWeight: 600 }}
          value={asset.name}
          onChange={(e) => setField("name", e.target.value)}
        />
        <span className="asset-kind">{asset.kindLabel}</span>
        <button className="icon-btn" title="Asset entfernen" onClick={onRemove} aria-label="Entfernen">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 4h10M6 4V2.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8V4M5 4v9.2a.8.8 0 0 0 .8.8h4.4a.8.8 0 0 0 .8-.8V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="field-grid">
        <div className="field">
          <label>Startkapital</label>
          <div className="input-group">
            <input
              className="input num"
              value={formatField(asset.startCapital)}
              onChange={(e) => setNum("startCapital", e.target.value)}
            />
            <span className="suffix">€</span>
          </div>
        </div>
        <div className="field">
          <label>Sparrate / Monat</label>
          <div className="input-group">
            <input
              className="input num"
              value={formatField(asset.monthly)}
              onChange={(e) => setNum("monthly", e.target.value)}
            />
            <span className="suffix">€</span>
          </div>
        </div>
      </div>

      <div className="field" style={{ marginTop: 12 }}>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{asset.kind === "etf" ? "Erwartete Rendite" : "Zinssatz"} (jährlich)</span>
          <span className="mono" style={{ color: "var(--ink)", fontSize: 13 }}>
            {asset.rate.toFixed(2).replace(".", ",")} %
          </span>
        </label>
        <input
          type="range"
          className="slider"
          min={asset.rateMin ?? 0}
          max={asset.rateMax ?? 12}
          step={0.05}
          value={asset.rate}
          onChange={(e) => setField("rate", parseFloat(e.target.value))}
          style={{
            "--p": ((asset.rate - (asset.rateMin ?? 0)) / ((asset.rateMax ?? 12) - (asset.rateMin ?? 0)) * 100) + "%"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-mute)", marginTop: 2 }}>
          <span>{(asset.rateMin ?? 0).toFixed(1).replace(".", ",")}%</span>
          {asset.kind === "cash" ? <span>EZB-Niveau ≈ 2,5–4%</span>
            : asset.kind === "bonds" ? <span>Staatsanl. ≈ 2–3%, Unternehmensanl. ≈ 3–5%</span>
            : asset.kind === "fixed" ? <span>Laufzeit 1–3 Jahre ≈ 2,5–3,5%</span>
            : <span>Welt-ETF langfristig ≈ 6–8%</span>
          }
          <span>{(asset.rateMax ?? 12).toFixed(1).replace(".", ",")}%</span>
        </div>
      </div>

      {final && (
        <div style={{
          marginTop: 14, padding: "10px 12px",
          background: "var(--bg-2)", borderRadius: 8,
          fontSize: 12, color: "var(--ink-soft)",
          display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline"
        }}>
          <span>nach {horizonYears} J</span>
          <span className="num" style={{ fontFamily: "Instrument Serif, serif", fontSize: 20, color: "var(--ink)" }}>
            {fmtEUR(final.value)}
          </span>
          <span style={{ fontSize: 11 }}>
            {fmtPct(interestShare * 100, 0)} Zinsen
          </span>
        </div>
      )}
    </div>
  );
}

function formatField(n) {
  if (n === 0 || n === "" || n == null) return "0";
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(n);
}

window.AssetCard = AssetCard;
window.formatField = formatField;
