# ChartForge

Clean-room Supercharts-style charting app.  
Real market data for **crypto** (Binance), **stocks / forex / indices** (Yahoo Finance).

## Features

- Interactive charts (Candles, Hollow, Heikin Ashi, Line, Area, Renko)
- Indicators: SMA, EMA, RSI, Bollinger Bands, MACD
- Drawing tools: trend line, horizontal, rectangle, Fibonacci, measure, text
- Bar Replay
- Price alerts + evaluation toasts
- Watchlist
- Multi-chart layouts (1 / 2 / 2x2)
- Save / load layouts (localStorage)
- Command palette (Cmd+K / Ctrl+K)
- Live data: Binance crypto + Yahoo stocks/forex/indices

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Import this repo at https://vercel.com/new
2. Framework: Next.js (auto)
3. Deploy

Node.js 20+ required.

## Data sources

| Assets | Source | API route |
|--------|--------|-----------|
| Crypto | Binance public | /api/klines |
| Stocks, forex, indices | Yahoo Finance | /api/yahoo |

No API keys required.

## Stack

Next.js 15 + TypeScript + Lightweight Charts + Tailwind CSS v4

## License

MIT — build your own product. Do not copy TradingView branding, assets, or code.
