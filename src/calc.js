/* Calculation engine — monthly compounding */

function fmtEUR(v, opts = {}) {
  const { decimals = 0, compact = false } = opts;
  if (compact && Math.abs(v) >= 1000) {
    const units = [
      { v: 1e9, s: " Mrd." },
      { v: 1e6, s: " Mio." },
      { v: 1e3, s: " Tsd." },
    ];
    for (const u of units) {
      if (Math.abs(v) >= u.v) {
        const n = v / u.v;
        return new Intl.NumberFormat("de-DE", {
          minimumFractionDigits: 0,
          maximumFractionDigits: n < 10 ? 2 : 1,
        }).format(n) + u.s + " €";
      }
    }
  }
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
}

function fmtPct(v, decimals = 1) {
  return new Intl.NumberFormat("de-DE", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v / 100);
}

function projectAsset(asset, months) {
  const r = (Number(asset.rate) || 0) / 100 / 12;
  const m = Number(asset.monthly) || 0;
  let value = Number(asset.startCapital) || 0;
  let contributed = value;
  let interestAcc = 0;

  const lumpsByMonth = {};
  for (const ls of asset.lumpSums || []) {
    const mo = Number(ls.month) | 0;
    const amt = Number(ls.amount) || 0;
    if (mo >= 1 && mo <= months && amt > 0) {
      lumpsByMonth[mo] = (lumpsByMonth[mo] || 0) + amt;
    }
  }

  const points = [{ value, contributed, interest: 0 }];

  for (let i = 1; i <= months; i++) {
    value += m;
    contributed += m;
    const lump = lumpsByMonth[i] || 0;
    if (lump) { value += lump; contributed += lump; }
    const gain = value * r;
    value += gain;
    interestAcc += gain;
    points.push({ value, contributed, interest: interestAcc });
  }
  return points;
}

function buildTimeline(assets, years) {
  const months = years * 12;
  const perAsset = {};
  for (const a of assets) {
    perAsset[a.id] = projectAsset(a, months);
  }
  const totals = [];
  const contribTotals = [];
  for (let i = 0; i <= months; i++) {
    let v = 0, c = 0;
    for (const a of assets) {
      v += perAsset[a.id][i].value;
      c += perAsset[a.id][i].contributed;
    }
    totals.push(v);
    contribTotals.push(c);
  }
  return { years, months, perAsset, totals, contribTotals };
}

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
        contributed: pt.contributed,
        interest: pt.interest * d,
      };
    });
  }

  const newTotals = totals.map((v, i) => v * deflator(i, inflationPct));
  const newContribTotals = contribTotals;

  return { years, months, perAsset: newPerAsset, totals: newTotals, contribTotals: newContribTotals };
}

window.fmtEUR = fmtEUR;
window.fmtPct = fmtPct;
window.projectAsset = projectAsset;
window.buildTimeline = buildTimeline;
window.deflator = deflator;
window.toReal = toReal;
window.applyDisplayMode = applyDisplayMode;
