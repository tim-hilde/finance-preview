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

  const points = [{ value, contributed, interest: 0 }];

  for (let i = 1; i <= months; i++) {
    value += m;
    contributed += m;
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

window.fmtEUR = fmtEUR;
window.fmtPct = fmtPct;
window.projectAsset = projectAsset;
window.buildTimeline = buildTimeline;
