# Savings Planner

A financial planning app to visualize and plan savings strategies over 15–40 years.

## Features

- **Instant account & ETF savings plan** pre-loaded, with more asset types (bonds, fixed-term deposits) available to add
- **Stacked area chart** over up to 40 years with hover tooltip
- **Planning horizon slider** (5–40 years) — prominent, inline
- **4 KPIs** — final value, total contributed, interest gained, growth factor
- **Coach insights** — dynamic callouts e.g. when compound interest overtakes your monthly savings rate
- **All settings persist** in `localStorage` and are restored on your next visit

## Technology

Pure HTML/CSS/JS — no build step, no dependencies. React via CDN, JSX via Babel Standalone.

## Run locally

```bash
npx serve .
```

Then open [http://localhost:3000](http://localhost:3000).
