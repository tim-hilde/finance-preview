/* Stacked area chart — pure SVG, with hover crosshair + tooltip */
const { useState, useMemo, useRef, useEffect } = React;

function StackedAreaChart({ assets, timeline, width = 900, height = 380, showContributionLine = true, style = "stacked" }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const pad = { top: 18, right: 18, bottom: 36, left: 64 };
  const W = width;
  const H = height;
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const months = timeline.months;
  const yMax = useMemo(() => {
    let m = 0;
    for (let i = 0; i <= months; i++) m = Math.max(m, timeline.totals[i]);
    if (m === 0) return 1000;
    const mag = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / (mag / 2)) * (mag / 2);
  }, [timeline]);

  const xScale = (i) => (i / months) * innerW;
  const yScale = (v) => innerH - (v / yMax) * innerH;

  const visibleAssets = assets.filter(a => a.enabled !== false);

  const stacks = useMemo(() => {
    const arr = [];
    const cum = new Array(months + 1).fill(0);
    for (const a of visibleAssets) {
      const pts = timeline.perAsset[a.id];
      const top = pts.map((p, i) => cum[i] + p.value);
      const bottomBefore = [...cum];
      for (let i = 0; i <= months; i++) cum[i] = top[i];
      arr.push({ asset: a, top, bottom: bottomBefore });
    }
    return arr;
  }, [visibleAssets, timeline, months]);

  function pathFor(stack) {
    let d = "";
    for (let i = 0; i <= months; i++) {
      const x = xScale(i);
      const y = yScale(stack.top[i]);
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    for (let i = months; i >= 0; i--) {
      const x = xScale(i);
      const y = yScale(stack.bottom[i]);
      d += "L" + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    d += "Z";
    return d;
  }

  function linePathFor(values) {
    let d = "";
    for (let i = 0; i <= months; i++) {
      const x = xScale(i);
      const y = yScale(values[i]);
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    return d;
  }

  const yTicks = useMemo(() => {
    const n = 5;
    return Array.from({ length: n + 1 }, (_, i) => (yMax * i) / n);
  }, [yMax]);

  const years = timeline.years;
  const yearStep = years <= 10 ? 1 : years <= 20 ? 2 : 5;
  const xTicks = useMemo(() => {
    const t = [];
    for (let y = 0; y <= years; y += yearStep) t.push(y);
    if (t[t.length - 1] !== years) t.push(years);
    return t;
  }, [years, yearStep]);

  function onMove(e) {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const xRel = ((xPx / rect.width) * W - pad.left);
    const i = Math.max(0, Math.min(months, Math.round((xRel / innerW) * months)));
    setHover({ month: i, clientX: e.clientX, clientY: e.clientY });
  }
  function onLeave() { setHover(null); }

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <defs>
          {visibleAssets.map(a => (
            <linearGradient key={a.id} id={`grad-${a.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={a.color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={a.color} stopOpacity="0.55" />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${pad.left},${pad.top})`}>
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)}
                stroke="oklch(0.92 0.012 70)" strokeWidth="1" />
              <text
                x={-10} y={yScale(t)} dy="0.32em"
                textAnchor="end"
                fontSize="11" fill="oklch(0.55 0.015 60)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtEUR(t, { compact: true, decimals: 0 })}
              </text>
            </g>
          ))}

          {style === "stacked" && stacks.map(s => (
            <path key={s.asset.id}
              d={pathFor(s)}
              fill={`url(#grad-${s.asset.id})`}
              stroke={s.asset.color}
              strokeWidth="1"
            />
          ))}
          {style === "lines" && visibleAssets.map(a => {
            const pts = timeline.perAsset[a.id].map(p => p.value);
            return (
              <path key={a.id} d={linePathFor(pts)}
                fill="none" stroke={a.color} strokeWidth="2.25" />
            );
          })}

          {showContributionLine && (
            <path d={linePathFor(timeline.contribTotals)}
              fill="none"
              stroke="oklch(0.35 0.02 60)"
              strokeWidth="1.4"
              strokeDasharray="3 4"
            />
          )}

          <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="oklch(0.85 0.015 70)" strokeWidth="1" />
          {xTicks.map(y => (
            <g key={y}>
              <line x1={xScale(y * 12)} x2={xScale(y * 12)}
                y1={innerH} y2={innerH + 4}
                stroke="oklch(0.75 0.015 70)" />
              <text x={xScale(y * 12)} y={innerH + 18}
                textAnchor="middle"
                fontSize="11" fill="oklch(0.50 0.015 60)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {y === 0 ? "heute" : `+${y}J`}
              </text>
            </g>
          ))}

          {hover && (
            <g>
              <line x1={xScale(hover.month)} x2={xScale(hover.month)}
                y1={0} y2={innerH}
                stroke="oklch(0.40 0.05 60)" strokeWidth="1" strokeDasharray="2 3" />
              {visibleAssets.map((a, idx) => {
                const cum = stacks[idx];
                const yTop = yScale(cum.top[hover.month]);
                return (
                  <circle key={a.id}
                    cx={xScale(hover.month)} cy={style === "stacked" ? yTop : yScale(timeline.perAsset[a.id][hover.month].value)}
                    r="3.5" fill="white" stroke={a.color} strokeWidth="2" />
                );
              })}
            </g>
          )}
        </g>
      </svg>

      {hover && <ChartTooltip
        month={hover.month}
        clientX={hover.clientX}
        clientY={hover.clientY}
        assets={visibleAssets}
        timeline={timeline}
      />}
    </div>
  );
}

function ChartTooltip({ month, clientX, clientY, assets, timeline }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: clientX, y: clientY });
  useEffect(() => {
    setPos({ x: clientX, y: clientY });
  }, [clientX, clientY]);

  const yrs = Math.floor(month / 12);
  const mos = month % 12;
  const total = assets.reduce((s, a) => s + timeline.perAsset[a.id][month].value, 0);
  const contributed = assets.reduce((s, a) => s + timeline.perAsset[a.id][month].contributed, 0);
  const interest = total - contributed;

  return ReactDOM.createPortal(
    <div ref={ref} className="tt" style={{ left: pos.x, top: pos.y }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {month === 0 ? "Heute" : `Nach ${yrs}J ${mos > 0 ? mos + "M" : ""}`}
      </div>
      {assets.map(a => (
        <div key={a.id} className="tt-row">
          <span className="swatch" style={{ background: a.color }} />
          <span style={{ flex: 1 }}>{a.name}</span>
          &nbsp;<b>{fmtEUR(timeline.perAsset[a.id][month].value)}</b>
        </div>
      ))}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", margin: "6px 0", paddingTop: 6 }}>
        <div className="tt-row"><span style={{ flex: 1 }}>Gesamt</span>&nbsp;<b>{fmtEUR(total)}</b></div>
        <div className="tt-row" style={{ opacity: 0.75 }}>
          <span style={{ flex: 1 }}>davon Zinsen</span>&nbsp;{fmtEUR(interest)}
        </div>
      </div>
    </div>,
    document.body
  );
}

window.StackedAreaChart = StackedAreaChart;
