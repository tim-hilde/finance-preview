/* LumpSumEditor — collapsible per-asset list of one-time deposits */
const { useState: useStateLSE } = React;

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

function LumpSumEditor({ lumpSums, horizonYears, onChange }) {
  const [expanded, setExpanded] = useStateLSE(false);

  function addRow() {
    const next = [...lumpSums, { id: window.uid(), month: 12, amount: 0 }];
    onChange(next);
    setExpanded(true);
  }

  function setRow(id, patch) {
    onChange(lumpSums.map(ls => ls.id === id ? { ...ls, ...patch } : ls));
  }

  function removeRow(id) {
    onChange(lumpSums.filter(ls => ls.id !== id));
  }

  function setAmount(id, raw) {
    const cleaned = String(raw).replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
    const n = cleaned === "" ? 0 : parseFloat(cleaned);
    setRow(id, { amount: isNaN(n) ? 0 : n });
  }

  function clampAmount(id, val) {
    const n = Number(val) || 0;
    if (n < 0) setRow(id, { amount: 0 });
  }

  function setMonth(id, year, monthIdx) {
    setRow(id, { month: (year - 1) * 12 + monthIdx + 1 });
  }

  function getYearMonth(month) {
    const total = Math.max(1, Number(month) || 12);
    const year = Math.ceil(total / 12);
    const monthIdx = (total - 1) % 12;
    return { year, monthIdx };
  }

  const count = lumpSums.length;

  return (
    <div className="lump-editor" style={{ marginTop: 14 }}>
      <div
        className="lump-toggle"
        onClick={() => setExpanded(e => !e)}
        role="button"
        aria-expanded={expanded}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", userSelect: "none",
          fontSize: 12, color: "var(--ink-mute)",
          textTransform: "uppercase", letterSpacing: "0.04em",
          padding: "4px 0",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg
            width="10" height="10" viewBox="0 0 10 10"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s", flexShrink: 0 }}
          >
            <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Einmalzahlungen{count > 0 ? ` (${count})` : ""}
        </span>
        <button
          className="lump-add-inline"
          onClick={(e) => { e.stopPropagation(); addRow(); }}
          style={{
            background: "transparent", border: "none", padding: "0 2px",
            font: "500 12px Inter, sans-serif", color: "var(--ink-mute)",
            cursor: "pointer", letterSpacing: 0, textTransform: "none",
          }}
        >
          + hinzufügen
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          {lumpSums.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--ink-mute)", padding: "6px 0" }}>
              Noch keine Einmalzahlungen. Klicke „+ hinzufügen".
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lumpSums.map(ls => {
                const { year, monthIdx } = getYearMonth(ls.month);
                return (
                  <div key={ls.id} className="lump-row" style={{
                    display: "grid",
                    gridTemplateColumns: "68px 1fr 1fr 28px",
                    gap: 6,
                    alignItems: "center",
                  }}>
                    <select
                      className="input"
                      style={{ padding: "6px 6px", fontSize: 12 }}
                      value={year}
                      onChange={(e) => setMonth(ls.id, parseInt(e.target.value), monthIdx)}
                    >
                      {Array.from({ length: horizonYears }, (_, i) => i + 1).map(y => (
                        <option key={y} value={y}>Jahr {y}</option>
                      ))}
                    </select>

                    <select
                      className="input"
                      style={{ padding: "6px 6px", fontSize: 12 }}
                      value={monthIdx}
                      onChange={(e) => setMonth(ls.id, year, parseInt(e.target.value))}
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <option key={i} value={i}>{name}</option>
                      ))}
                    </select>

                    <div className="input-group">
                      <input
                        className="input num"
                        style={{ fontSize: 12, padding: "6px 28px 6px 8px" }}
                        value={formatField(ls.amount)}
                        onChange={(e) => setAmount(ls.id, e.target.value)}
                        onBlur={(e) => clampAmount(ls.id, ls.amount)}
                      />
                      <span className="suffix" style={{ fontSize: 11 }}>€</span>
                    </div>

                    <button
                      className="icon-btn"
                      title="Entfernen"
                      onClick={() => removeRow(ls.id)}
                      style={{ width: 26, height: 26, flexShrink: 0 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 4h10M6 4V2.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8V4M5 4v9.2a.8.8 0 0 0 .8.8h4.4a.8.8 0 0 0 .8-.8V4"
                          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="btn"
            style={{ marginTop: 10, padding: "8px", fontSize: 12 }}
            onClick={addRow}
          >
            + Einmalzahlung hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}

window.LumpSumEditor = LumpSumEditor;
